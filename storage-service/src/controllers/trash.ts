import { Request, Response } from 'express';
import { getSession } from '../middleware';
import { directoryTree, Error, PATHS } from '../utils';

export const getTrash = () => {
	return async (req: Request, res: Response) => {
		try {
			const session = await getSession(req);
			if (!session?.user) return Error.MissingAccess(res, 'Session is invalid, please try logout and sign in again.');

			const path = req.params.path as string;
			res.json({ files: await directoryTree(`${PATHS.TRASH}/${session.user.id}${path ? `/${path}` : ''}`) });
		} catch (err) {
			console.log(err);
			Error.GenericError(res, 'Failed to retrieve files in trash.');
		}
	};
};