// For upload, delete, move etc endpoints
import { Router } from 'express';
import RecogniseHandler from '../utils/RecogniseHandler';
import directoryTree from '../utils/directory';
import { PATHS } from '../utils/CONSTANTS';
import { fetchAnalysed } from '../db/Analyse';
import { getSession } from '../utils/functions';
const router = Router();

export default function() {
	const Recognise = new RecogniseHandler();


	router.get('/fetch/files/?:path(*)', async (req, res) => {
		const session = await getSession(req);
		if (!session.user) return res.json({ error: 'Invalid session' });

		const path = req.params.path as string;
		res.json({ files: directoryTree(`${PATHS.CONTENT}/${session.user.id}${path ? `/${path}` : ''}`) });
	});

	router.get('/fetch/trash/:path(*)', async (req, res) => {
		const session = await getSession(req);
		if (!session.user) return res.json({ error: 'Invalid session' });

		const path = req.params.path as string;
		res.json({ files: directoryTree(`${PATHS.TRASH}/${session.user.id}${path ? `/${path}` : ''}`) });
	});

	router.get('/analyse', async (req, res) => {
		const session = await getSession(req);
		if (!session.user) return res.json({ error: 'Invalid session' });
		const path = req.query.path as string;

		// Check if it has already been analysed
		const isAlreadyAnalysed = await fetchAnalysed({ location: path, userId: session.user.id });
		if (isAlreadyAnalysed != null) return res.json({ error: 'This file has already been analysed' });

		Recognise.addToQueue(`${PATHS.CONTENT}/${session.user.id}/${path}`);
		res.json({ success: 'Successfully added to queue' });
	});

	router.get('/anaylse-fetch', async (req, res) => {
		const path = req.query.path as string;
		const userId = req.query.userId as string;
		try {
			const data = await fetchAnalysed({ location: path, userId: userId });
			res.json(data);
		} catch (err) {
			console.log(err);
			res.json({ error: err });
		}

	});
	return router;
}
