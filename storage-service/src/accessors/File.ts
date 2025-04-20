import type { createFile, FullFile, updateFile, updateFilePath } from '../types/database/File';
import type { File, FileType } from '@prisma/client';
import { LRUCache } from 'lru-cache';
import client from './prisma';

export default class FileAccessor {
	cache: LRUCache<string, FullFile>;

	constructor() {
		this.cache = new LRUCache({
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
			},
			include: {
				children: data.type == 'DIRECTORY',
			},
		});

		this.cache.set(`${file.userId}_${file.path}`, file);
		return file;
	}

	/**
    * Updates a file
    * @param {updateFile} data The file data.
    * @returns {File} The updated file.
  */
	async update(data: updateFile): Promise<FullFile> {
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
	}

	/**
	 * Updates a file's path and all of it's children
	 * @param {updateFile} data The file data.
	 * @returns {number} The number of rows updated.
	*/
	async updateChildsPath({ userId, parentId, oldPath, newPath }: updateFilePath): Promise<number> {
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
	}

	/**
		* Gets a file by it's path
		* @param {string} userId The file's owners Id.
		* @param {string} filePath The file path.
		* @returns {FullFile | null} The file.
	*/
	async getByFilePath(userId: string, filePath: string, includeDeleted?: boolean): Promise<FullFile | null> {
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
		if (file !== null) this.cache.set(`${userId}_${file.path.startsWith('/') ? file.path : `/${file.path}`}`, file);
		return file;
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
	getChildrenByParentId(parentId: string): Promise<File[]> {
		return client.file.findMany({
			where: {
				parentId,
			},
		});
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
		* Gets all of the user's directories
		* @param {string} userId The user Id.
		* @returns {File[]} The files.
	*/
	async getAllUsersDirectories(userId: string): Promise<File[]> {
		return client.file.findMany({
			where: {
				userId,
				type: 'DIRECTORY',
			},
		});
	}

	/**
		* Get all user's (pending) deleted files
		* @param {string} userId The user Id.
		* @returns {File[]} The files.
	*/
	async getAllUsersDeletedFiles(userId?: string): Promise<File[]> {
		return client.file.findMany({
			where: {
				userId,
				deletedAt: {
					not: null,
				},
			},
		});
	}

	async fetchOrCreateFileMediaType(mimeType: string) {
		return client.mediaType.upsert({
			where: {
				name: mimeType,
			},
			create: {
				name: mimeType,
			},
			update: {},
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
		* @returns {number} The total count of files.
	*/
	async fetchTotal(): Promise<number> {
		return client.file.count();
	}
}