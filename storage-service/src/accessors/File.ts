import type { addMetadata, createFile, fetchByOwner, fetchFileMediaTypesParams, FullFile, Pagination, updateFile, updateFilePath } from '@/types/database/File';
import type { File, FileType, MediaType } from '@/types/generated/client';
import { LRUCache } from 'lru-cache';
import client from './prisma';

export default class FileAccessor {
	cache: LRUCache<string, FullFile>;
	mimeTypeCache: LRUCache<string, MediaType>;

	constructor() {
		this.cache = new LRUCache({
			max: 10_000,
			ttl: 1000 * 60 * 60,
		});

		this.mimeTypeCache = new LRUCache({
			max: 100,
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
				const parent = await this.getById(file.parentId);
				if (parent) {
					this.cache.delete(`${parent.userId}_${parent.path}`);
					if (parent.parentId) {
						const grandparent = await this.getById(parent.parentId);
						if (grandparent) this.cache.delete(`${grandparent.userId}_${grandparent.path}`);
					}
				}
			}

			return file;
		} catch (error) {
			throw error;
		}
	}


	async addMetadata(fileId: string, data: addMetadata) {
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
			const parentFile = await this.getById(file.parentId);
			if (parentFile) this.cache.delete(`${file.userId}_${parentFile.path}`);
			return file;
		} catch (error) {
			throw error;
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

			// Get the cached files that need replacing
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
		} catch (error) {
			throw error;
		}
	}

	/**
		* Gets a file by it's path
		* @param {string} userId The file's owners Id.
		* @param {string} filePath The file path.
		* @returns {FullFile | null} The file.
	*/
	async getByFilePath(userId: string, filePath: string, includeDeleted?: boolean): Promise<FullFile | null> {
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
				await this.getChildrenByParentId(file.id);
				this.cache.set(`${userId}_${file.path.startsWith('/') ? file.path : `/${file.path}`}`, file);
			}

			return file;
		} catch (error) {
			throw error;
		}
	}

	/**
		* Gets files by it's Id
		* @param {string} id The file id.
		* @returns {File} The file.
	*/
	async getById(id: string | null): Promise<File | null> {
		if (id == null) return null;
		return client.file.findUnique({
			where: { id },
		});
	}

	/**
		* Gets files by it's parentId
		* @param {string} parentId The file id.
		* @returns {File[]} The files.
	*/
	async getChildrenByParentId(parentId: string): Promise<File[]> {
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
		} catch (error) {
			throw error;
		}
	}

	/**
		* Gets a file by name
		* @param {string} name The file name.
		* @returns {File[]} The file.
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
		* Gets all files
		* @returns The total count of files.
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
		} catch (error) {
			throw error;
		}
	}

	/**
		* Gets the 10 recently uploaded files
		* @returns The files.
	*/
	async fetchRecentlyUploaded({ page = 0, userId }: Pagination & { userId?: string }) {
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
		* Gets the average file size
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
		} catch (error) {
			throw error;
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

	async fetchTotalStorageUsed(storageId?: string) {
		return client.file.aggregate({
			where: {
				storageId,
			},
			_sum: {
				size: true,
			},
		});
	}

	/**
		* Fetches or creates a file media type in the database.
		* @param mimeType The mime type to fetch or create.
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
		} catch (error) {
			throw error;
		}
	}

	/**
		* Fetches all media types from the database and the number of files associated with each type.
		* @param [grouped=false]
	*/
	async fetchFileMediaTypes({ mediaType, grouped = false }: fetchFileMediaTypesParams) {
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
		} catch (error) {
			throw error;
		}
	}

	async fetchMostCommonFileTypes() {
		return client.mediaType.findMany({
			include: {
				_count: {
					select: {
						files: true,
					},
				},
			},
			orderBy: {
				files: {
					_count: 'desc',
				},
			},
			take: 10,
		});
	}

	async fetchAllByUserId(userId: string) {
		return client.file.findMany({
			where: {
				userId,
			},
		});
	}

	async fetchGalleryByUserId(userId: string) {
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

			files.sort((a, b) => {
				const dateA = a.metadata?.originalCreatedAt ?? a.createdAt;
				const dateB = b.metadata?.originalCreatedAt ?? b.createdAt;
				return dateB.getTime() - dateA.getTime();
			});

			return files;
		} catch (err) {
			throw err;
		}
	}
}