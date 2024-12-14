import { Request, Response } from 'express';
import { getSession } from '../middleware';
import { directoryTree, PATHS } from '../utils';

export const getTrash = () => {
	return async (req: Request, res: Response) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });

		const path = req.params.path as string;
		res.json({ files: await directoryTree(`${PATHS.TRASH}/${session.user.id}${path ? `/${path}` : ''}`) });
	};
};