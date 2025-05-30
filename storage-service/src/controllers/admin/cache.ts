import Client from 'src/helpers/Client';
import fs from 'fs/promises';
import { Error, PATHS } from '../../utils';
import type { Request, Response } from 'express';
import { existsSync } from 'fs';

// Endpoint: GET /api/admin/cache/thumbnails
export const getCachedThumbnailSize = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			// Check if the thumbnail cache folder exists first (Might have been deleted)
			if (!existsSync(PATHS.THUMBNAIL)) await fs.mkdir(PATHS.THUMBNAIL);
			const folderSize = await buildFolderSizeRecursively(PATHS.THUMBNAIL, { sizeInBytes: 0, count: 0 });

			// Update database for thumbnail cache
			const storage = await client.FileManager.storageManager.fetchThumbnailMedium();
			if (storage) await client.FileManager.storageManager.update({ id: storage.id, usedSize: folderSize.sizeInBytes });

			res.json({ folderSize });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to get thumbnail cache size.');
		}
	};
};

// Endpoint: DELETE /api/admin/cache/thumbnails
export const deleteCacheByName = (client: Client) => {
	return async (req: Request, res: Response) => {
		const name = req.params.name;

		try {
			switch (name) {
				case 'users':
					client.userManager.cache.clear();
					break;
				case 'files':
					client.FileManager.cache.clear();
					break;
				case 'history':
					client.recentlyViewedFileManager.cache.clear();
					break;
				case 'thumbnails':
					// Complete delete thumbnail cache folder and then make empty folder
					// TODO: Add a proper filter so it doesn't delete the default missing-file-icon.png
					await fs.rm(PATHS.THUMBNAIL, { recursive: true });
					await fs.mkdir(PATHS.THUMBNAIL);
					break;
				case 'sessions':
					client.sessionManager.cache.clear();
					break;
				default:
					return Error.IncorrectQuery(res, 'endpoint must only be users, files, history, cache or thumbnails');
			}
			res.json({ success: `Successfully deleted cached ${name}.` });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, `Failed to delete cached ${name}.`);
		}
	};
};

// Endpoint: GET /api/admin/cache/stats
export const getCachedStats = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const fileStats = {
				size: client.FileManager.cache.size,
				max: client.FileManager.cache.max,
				ttl: client.FileManager.cache.ttl,
			};

			const userStats = {
				size: client.userManager.cache.size,
				max: client.userManager.cache.max,
				ttl: client.userManager.cache.ttl,
			};

			const userHistoryStats = {
				size: client.recentlyViewedFileManager.cache.size,
				max: client.recentlyViewedFileManager.cache.max,
				ttl: client.recentlyViewedFileManager.cache.ttl,
			};

			const sessionStats = {
				size: client.sessionManager.cache.size,
				max: client.sessionManager.cache.max,
				ttl: client.sessionManager.cache.ttl,
			};

			res.json({ files: fileStats, users: userStats, userHistory: userHistoryStats, sessions: sessionStats });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to get cached stats.');
		}
	};
};

interface folderStats {
	sizeInBytes: number
	count: number
}

// Get the total size of a folder recursively (look into sub-folders etc)
async function buildFolderSizeRecursively(folderPath: string, size: folderStats) {
	const children = await fs.readdir(folderPath);

	for (const child of children) {
		const stat = await fs.stat(`${folderPath}/${child}`);

		if (stat.isDirectory()) {
			await buildFolderSizeRecursively(`${folderPath}/${child}`, size);
		} else {
			size.count += 1;
			size.sizeInBytes += stat.size;
		}
	}
	return size;
}