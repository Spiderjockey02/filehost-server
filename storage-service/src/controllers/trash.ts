import { Error, sanitiseObject } from '../utils';
import type { Request, Response } from 'express';
import type Client from '../helpers/Client';
import { getSession } from '../middleware';

// Endpoint: GET /api/trash
export const getTrash = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);

			const files = await client.FileManager.getAllUsersDeletedFiles(session.user.id);
			res.json({ files: sanitiseObject(files) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to retrieve files in trash.');
		}
	};
};


// Endpoint: DELETE /api/trash/empty
export const deleteEmpty = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);

			await client.FileManager.TrashHandler.emptyTrash(session.user.id);
			res.json({ success: 'Successfully emptied trash.' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to empty trash.');
		}
	};
};

// Endpoint: PUT /api/trash/restore
export const putRestore = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.InvalidSession(res);

			// Get and validate the file paths for restoring
			const { paths } = req.body;
			if (paths == undefined || !Array.isArray(paths)) return Error.IncorrectQuery(res, 'Paths is either missing or is not an array');

			// Loop through each path and restore them (Could take some time if the multiple deep directories)
			for (const path of paths) {
				await client.FileManager.TrashHandler.restoreFile(session.user.id, path);
			}

			res.json({ success: 'Successfully restored file ' });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to empty trash.');
		}
	};
};