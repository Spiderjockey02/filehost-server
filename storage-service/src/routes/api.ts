// For upload, delete, move etc endpoints
import { Router } from 'express';
import RecogniseHandler from '../utils/RecogniseHandler';
import directoryTree from '../utils/directory';
import { PATHS } from '../utils/CONSTANTS';
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

	router.get('/analyse', (req, res) => {
		let path = req.query.path as string;
		if (!path) {
			path = req.body.path as string;
		}
		Recognise.addToQueue(path);
		res.json({ success: 'Successfully added to queue' });
	});

	return router;
}
