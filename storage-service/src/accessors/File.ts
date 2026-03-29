import type { addMetadata, createFile, fetchByOwner, fetchFileMediaTypesParams, FullFile, Pagination, updateFile, updateFilePath } from '@/types/database/File';
import type { File, FileMetadata, FileType, MediaType } from '@/types/generated/client';
import { LRUCache } from 'lru-cache';
import client from './prisma';

export default class FileAccessor {
	cache: LRUCache<string, FullFile>;
	mimeTypeCache: LRUCache<string, MediaType>;
	fileMetadata: LRUCache<string, FileMetadata>;

	constructor() {
		this.cache = new LRUCache({
			max: 10_000,
			ttl: 1000 * 60 * 60,
		});

		this.mimeTypeCache = new LRUCache({
			max: 100,
			ttl: 1000 * 60 * 60,
		});

		this.fileMetadata = new LRUCache({
			max: 10_000,
			ttl: 1000 * 60 * 60,
		});
	}

	/**
    * Creates a new file
    * @param {createFile} data The file data.
    * @returns {File} The created file.
  */
	async create(data: createFile): Promise<FullFile> {
		try {
			if (data.mimetype !== null) await this.fetchOrCreateFileMediaType(data.mimetype);

			const file = await client.file.create({
				data: {
					path: data.path,
					name: data.name,
					size: data.size,
					userId: data.userId,
					type: data.type,
					parentId: data.parentId,
					mimetype: data.mimetype,
					storageId: data.storageId,
				},
				include: {
					children: data.type == 'DIRECTORY',
				},
			});

			this.cache.set(`${file.userId}_${file.path}`, file);

			// Have to do 2 layers (to get show proper children count)
			if (file.parentId) {
				const parent = await this.fetchById(file.parentId);
				if (parent) {
					this.cache.delete(`${parent.userId}_${parent.path}`);
					if (parent.parentId) {
						const grandparent = await this.fetchById(parent.parentId);
						if (grandparent) this.cache.delete(`${grandparent.userId}_${grandparent.path}`);
					}
				}
			}

			return file;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Create a metadata entry for a file (width, height, duration etc)
	  * @param fileId The file Id
	  * @param data The metadata
	  * @returns {FileMetadata} The new metadata
	*/
	async addMetadata(fileId: string, data: addMetadata): Promise<FileMetadata> {
		return client.fileMetadata.create({
			data: {
				file: {
					connect: {
						id: fileId,
					},
				},
				...data,
			},
		});
	}


	/**
    * Updates a file
    * @param {updateFile} data The file data.
    * @returns {File} The updated file.
  */
	async update(data: updateFile): Promise<FullFile> {
		try {
			if (data.children !== undefined && data.children.mimetype !== null) await this.fetchOrCreateFileMediaType(data.children.mimetype);

			const file = await client.file.update({
				where: {
					id: data.id,
				},
				data: {
					path: data.path,
					name: data.name,
					size: data.size,
					parentId: data.parentId,
					deletedAt: data.deletedAt,
					storageId: data.storageId,
					children: {
						create: data.children,
					},
				},
				include: {
					children: {
						where: {
							deletedAt: null,
						},
						include: {
							_count: {
								select: {
									children: {
										where: {
											deletedAt: null,
										},
									},
								},
							},
						},
					},
				},
			});

			// Update it's own cached version
			this.cache.delete(`${file.userId}_${file.path}`);

			// Update their parent's cached version aswell
			const parentFile = await this.fetchById(file.parentId);
			if (parentFile) this.cache.delete(`${file.userId}_${parentFile.path}`);
			return file;
		} catch (err) {
			throw err;
		}
	}

	/**
	 * Updates a file's path and all of it's children
	 * @param {updateFile} data The file data.
	 * @returns {number} The number of rows updated.
	*/
	async updateChildsPath({ userId, parentId, oldPath, newPath }: updateFilePath): Promise<number> {
		try {
			const updatedRows = await client.$executeRawUnsafe(
				`UPDATE \`File\`
				SET path = REPLACE(path, ?, ?)
				WHERE path LIKE CONCAT(?, '%') 
				AND path != ?
				AND parentId = ?`,
				oldPath,
				newPath,
				oldPath,
				oldPath,
				parentId,
			);

			// Fetch the cached files that need replacing
			const keys = [...this.cache.keys()];
			const filteredKeys = keys.filter(key => key.startsWith(`${userId}_${oldPath}`));
			for (const key of filteredKeys) {
				const file = this.cache.get(key);
				if (!file || file.parentId !== parentId) continue;

				// Update the cache key
				const [keyUserId, keyPath] = key.split('_', 2);
				const newKey = `${keyUserId}_${keyPath.replace(oldPath, newPath)}`;
				this.cache.delete(key);
				this.cache.set(newKey, { ...file, path: file.path.replace(oldPath, newPath) });
			}
			return updatedRows;
		} catch (err) {
			throw err;
		}
	}

	/**
		* Fetch a file by it's path
		* @param {string} userId The file's owners Id.
		* @param {string} filePath The file path.
		* @param {?boolean} includeDeleted Whether or not to check deleted file
		* @returns {FullFile | null} The file.
	*/
	async fetchByFilePath(userId: string, filePath: string, includeDeleted?: boolean): Promise<FullFile | null> {
		try {
			const cleanedFilePath = filePath.startsWith('/') ? filePath : `/${filePath}`;
			let file = this.cache.get(`${userId}_${cleanedFilePath}`) ?? null;
			if (file !== null) return file;

			// Fetch from database
			file = await client.file.findFirst({
				where: {
					userId,
					deletedAt: includeDeleted ? undefined : null,
					path: {
						equals: cleanedFilePath,
					},
				},
				include: {
					children: {
						where: {
							deletedAt: includeDeleted ? undefined : null,
						},
						include: {
							_count: {
								select: {
									children: {
										where: {
											deletedAt: includeDeleted ? undefined : null,
										},
									},
								},
							},
						},
					},
				},
			});

			if (file !== null) {
				await this.fetchChildrenByParentId(file.id);
				this.cache.set(`${userId}_${file.path.startsWith('/') ? file.path : `/${file.path}`}`, file);
			}

			return file;
		} catch (err) {
			throw err;
		}
	}

	/**
		* Fetch a file by it's Id
		* @param {string} id The file id.
		* @returns {File | null} The file or null.
	*/
	async fetchById(id: string | null): Promise<File | null> {
		if (id == null) return null;

		let file = this.cache.find(f => f.id == id) ?? null;
		if (file == null) {
			file = await client.file.findUnique({
				where: { id },
				include: {
					children: true,
				},
			});
		}

		return file;
	}

	/**
		* Fetch files by it's parentId
		* @param {string} parentId The file's parent id.
		* @returns {File[]} The files.
	*/
	async fetchChildrenByParentId(parentId: string): Promise<File[]> {
		try {
			const files = await client.file.findMany({
				where: {
					parentId,
				},
				include: {
					children: {
						where: {
							deletedAt: null,
						},
						include: {
							_count: {
								select: {
									children: {
										where: {
											deletedAt: null,
										},
									},
								},
							},
						},
					},
				},
			});

			for (const file of files) this.cache.set(`${file.userId}_${file.path}`, file);
			return files;
		} catch (err) {
			throw err;
		}
	}

	/**
		* Search for files by name
		* @param {string} userId The user's file to look for
		* @param {string} name The file name.
		* @param {FileType | undefined} type The type of files to search
		* @returns {File[]} The files.
	*/
	async searchByName(userId: string, name: string, type: FileType | undefined): Promise<File[]> {
		return client.file.findMany({
			where: {
				userId,
				name: {
					startsWith: name,
				},
				type,
				deletedAt: null,
			},
			include: {
				_count: {
					select: {
						children: {
							where: {
								deletedAt: null,
							},
						},
					},
				},
			},
		});
	}

	/**
		* Fetch files by user ID, filter for deleted only, or file type
		* @param {fetchByOwner} filter Filter for fetching all files
		* @returns {File[]} The files.
	*/
	async fetchOwnedByUserId({ userId, type, isDeleted }: fetchByOwner): Promise<File[]> {
		return client.file.findMany({
			where: {
				userId,
				type,
				deletedAt: isDeleted ? {
					not: null,
				} : undefined,
			},
		});
	}

	/**
		* Delete a file from the system
		* @param {string} fileId The file Id.
		* @returns {File} The file.
	*/
	async deleteFromDB(fileId: string): Promise<File> {
		const fileFromCache = this.cache.find(f => f.id == fileId);
		if (fileFromCache) this.cache.delete(`${fileFromCache.userId}_${fileFromCache.path}`);
		return client.file.delete({
			where: {
				id: fileId,
			},
		});
	}

	/**
		* Fetch the total files, directories and new files within the last 7 days from a specific user
		* @param {?string} userId The user Id.
		* @returns Object of total files, directories and new file counts
	*/
	async fetchTotal(userId?: string) {
		const last7days = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);

		try {
			const [files, folders, newFiles] = await Promise.all([
				client.file.count({
					where: {
						userId,
						type: 'FILE',
					},
				}),
				client.file.count({
					where: {
						userId,
						type: 'DIRECTORY',
					},
				}),
				client.file.count({
					where: {
						userId,
						createdAt: {
							gte: last7days,
						},
					},
				}),
			]);

			return { files, folders, newFiles };
		} catch (err) {
			throw err;
		}
	}

	/**
		* Fetch the recently uploaded files
		* @param {Pagination & { userId?: string }} filters The filters for getting these files
		* @returns {File[]} The files.
	*/
	async fetchRecentlyUploaded({ page = 0, userId }: Pagination & { userId?: string }): Promise<File[]> {
		return client.file.findMany({
			where: {
				deletedAt: null,
				type: 'FILE',
				userId,
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: 20,
			skip: page * 20,
		});
	}

	/**
		* Fetch the average file size
		* @returns The average file size.
	*/
	async fetchAverageSize() {
		return client.file.aggregate({
			_avg: {
				size: true,
			},
			where: {
				deletedAt: null,
				type: 'FILE',
			},
		});
	}

	/**
		* Fetch the number of files uploaded between 2 dates
		* @param {Date} oldDate The old date.
		* @param {Date} newDate The new date.
		* @param {?string} storageId The storage Id to filter by.
		* @returns The number of files uploaded.
	*/
	async fetchUploadsBetweenTwoDates(oldDate: Date, newDate: Date, storageId?: string) {
		return client.file.count({
			where: {
				type: 'FILE',
				storageId,
				createdAt: {
					gte: oldDate,
					lte: newDate,
				},
			},
		});
	}

	/**
	  * Fetch the distribution of file sizes in bins.
	  * @returns The distribution of file sizes in bins.
	*/
	async fetchUploadSizeDistribution() {
		try {
			const files = await client.file.findMany({
				where: {
					deletedAt: null,
					type: 'FILE',
				},
				select: { size: true },
			});

			const category = {
				'Tiny (0-10 KB)': 0,
				'Small (10 KB - 1 MB)': 0,
				'Medium (1 MB - 50 MB)': 0,
				'Large (50 MB - 500 MB)': 0,
				'Very Large (500 MB - 1 GB)': 0,
				'Huge (> 1 GB)': 0,
			};

			for (const { size } of files) {
				if (size < 10 * 1024) category['Tiny (0-10 KB)']++;
				else if (size < 1 * 1024 * 1024) category['Small (10 KB - 1 MB)']++;
				else if (size < 50 * 1024 * 1024) category['Medium (1 MB - 50 MB)']++;
				else if (size < 500 * 1024 * 1024) category['Large (50 MB - 500 MB)']++;
				else if (size < 1024 * 1024 * 1024) category['Very Large (500 MB - 1 GB)']++;
				else category['Huge (> 1 GB)']++;
			}

			return category;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch the count of deleted files
	  * @returns The number of deleted files
	*/
	async fetchTotalDeleted() {
		return client.file.count({
			where: {
				deletedAt: {
					not: null,
				},
			},
		});
	}

	/**
	  * Fetch the total storage used globally.
	  * @returns The number of deleted files
	*/
	async fetchTotalStorageUsed(storageId?: string) {
		try {
			const storageUsed = await client.file.aggregate({
				where: {
					storageId,
				},
				_sum: {
					size: true,
				},
			});

			return storageUsed._sum.size;
		} catch (err) {
			throw err;
		}
	}

	/**
		* Fetches or creates a file media type in the database.
		* @param {string} mimeType The mime type to fetch or create.
		* @returns The media type object.
	*/
	async fetchOrCreateFileMediaType(mimeType: string) {
		try {
			let mediaType = this.mimeTypeCache.get(mimeType) ?? null;
			if (mediaType == null) {
				mediaType = await client.mediaType.upsert({
					where: {
						name: mimeType,
					},
					create: {
						name: mimeType,
					},
					update: {},
				});
				if (mediaType !== null) this.mimeTypeCache.set(mimeType, mediaType);
			}

			return mediaType;
		} catch (err) {
			throw err;
		}
	}

	/**
		* Fetches all media types from the database and the number of files associated with each type.
		* @param {fetchFileMediaTypesParams} filter The filter for fetching all file media types
		* @returns {{[key:string]: number}} File media type and their count
	*/
	async fetchFileMediaTypes({ mediaType, grouped = false }: fetchFileMediaTypesParams): Promise<{[key:string]: number}> {
		try {
			const res = await client.mediaType.findMany({
				where: {
					name: mediaType == undefined ? undefined : {
						startsWith: mediaType,
					},
				},
				include: {
					_count: {
						select: {
							files: true,
						},
					},
				},
			});

			const group: { [ key: string ]: number } = {};
			if (grouped) {
				for (const type of res) {
					const mimeName = `${type.name.split('/')[0]}/*`;

					if (group[mimeName] === undefined) group[mimeName] = 0;
					group[mimeName] += type._count.files;
				}
				return group;
			} else {
				for (const type of res) {
					if (group[type.name] === undefined) group[type.name] = 0;
					group[type.name] += type._count.files;
				}
				return group;
			}
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch a user's gallery file
	  * @param userId The user's Id
	  * @returns {File[]} The list of files served for gallery
	*/
	async fetchGalleryByUserId(userId: string): Promise<File[]> {
		try {
			const files = await client.file.findMany({
				where: {
					userId,
					deletedAt: null,
					OR: [
						{
							mimetype: {
								startsWith: 'image/',
							},
						},
						{
							mimetype: {
								startsWith: 'video/',
							},
						},
					],
				},
				include: {
					metadata: true,
				},
			});

			return files.sort((a, b) => {
				const dateA = a.metadata?.originalCreatedAt ?? a.createdAt;
				const dateB = b.metadata?.originalCreatedAt ?? b.createdAt;
				return dateB.getTime() - dateA.getTime();
			});
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Move all user's trashed files back to normal
	  * @param userId The user's id
	  * @returns {{count: number}}
	*/
	async updateAllFilesFromTrash(userId: string): Promise<{count: number}> {
		return client.file.updateMany({
			where: {
				userId,
				deletedAt: {
					not: null,
				},
			},
			data: {
				deletedAt: null,
			},
		});
	}

	/**
	  * Fetch all files globally in trash
	  * @returns {File[]} All trashed files
	*/
	async fetchAllDeleted(): Promise<File[]> {
		return client.file.findMany({
			where: {
				deletedAt: {
					not: null,
				},
			},
		});
	}

	/**
	  * Fetch file's metadata
	  * @param fileId The file id
	  * @returns {FileMetadata | null}
	*/
	async fetchFilesMetadata(fileId: string): Promise<FileMetadata | null> {
		const metadata = this.fileMetadata.get(fileId) ?? await client.fileMetadata.findUnique({
			where: {
				fileId,
			},
		});

		if (metadata) this.fileMetadata.set(fileId, metadata);
		return metadata;
	}
}