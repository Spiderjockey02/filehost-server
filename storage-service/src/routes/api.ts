// For upload, delete, move etc endpoints
import { Router } from 'express';
import { RecogniseHandler } from '../libs';
import directoryTree from '../utils/directory';
import { PATHS } from '../utils/CONSTANTS';
import { fetchAnalysed } from '../db/Analyse';
import { getSession } from '../middleware';
import { updateUser } from '../db/User';
const router = Router();

export default function() {
	const Recognise = new RecogniseHandler();

	router.get('/fetch/files/?:path(*)', async (req, res) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });

		const path = req.params.path as string;

		// Fetch from cache
		const	files = await directoryTree(`${PATHS.CONTENT}/${session.user.id}${path ? `/${path}` : ''}`);

		// Update size
		if (path.length == 0 && (Number(files?.size) != Number(session.user.totalStorageSize))) {
			await updateUser({ id: session.user.id, totalStorageSize: `${Number(files?.size ?? 0)}` });
		}

		res.json({ files });
	});

	router.get('/fetch/trash/:path(*)', async (req, res) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });

		const path = req.params.path as string;
		res.json({ files: await directoryTree(`${PATHS.TRASH}/${session.user.id}${path ? `/${path}` : ''}`) });
	});

	router.get('/analyse', async (req, res) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });
		const path = req.query.path as string;

		// Check if it has already been analysed
		const isAlreadyAnalysed = await fetchAnalysed({ location: path, userId: session.user.id });
		if (isAlreadyAnalysed != null) return res.json({ error: 'This file has already been analysed' });

		Recognise.addToQueue(`${PATHS.CONTENT}/${session.user.id}/${path}`);
		res.json({ success: 'Successfully added to queue' });
	});

	router.get('/anaylse-fetch', async (req, res) => {
		const session = await getSession(req);
		if (!session?.user) return res.json({ error: 'Invalid session' });

		try {
			const path = req.query.path as string;
			const data = await fetchAnalysed({ location: path, userId: session.user.id });
			res.json(data);
		} catch (err) {
			console.log(err);
			res.json({ error: err });
		}
	});

	return router;
}
