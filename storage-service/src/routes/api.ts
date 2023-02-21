// For upload, delete, move etc endpoints
import { Router } from 'express';
import RecogniseHandler from '../utils/RecogniseHandler';
import directoryTree from '../utils/directory';
import { PATHS } from '../utils/CONSTANTS';
import { fetchAnalysed } from '../db/Analyse';
const router = Router();

export default function() {
	const Recognise = new RecogniseHandler();


	router.get('/fetch/files/:userId/:path(*)', (req, res) => {
		const userid = req.params.userId;
		const path = req.params.path as string;

		res.json({ files: directoryTree(`${PATHS.CONTENT}/${userid}${path ? `/${path}` : ''}`) });
	});

	router.get('/fetch/trash/:userId/:path(*)', (req, res) => {
		const userid = req.params.userId;
		const path = req.params.path as string;

		res.json({ files: directoryTree(`${PATHS.TRASH}/${userid}${path ? `/${path}` : ''}`) });
	});

	router.get('/analyse', async (req, res) => {
		const path = req.query.path as string;
		const userId = req.query.userId as string;

		// Check if it has already been analysed
		const isAlreadyAnalysed = await fetchAnalysed({ location: path, userId: userId });
		if (isAlreadyAnalysed != null) return res.json({ error: 'This file has already been analysed' });

		Recognise.addToQueue(`${PATHS.CONTENT}/${userId}/${path}`);
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
