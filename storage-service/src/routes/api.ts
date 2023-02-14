// For upload, delete, move etc endpoints
import { Router } from 'express';
import RecogniseHandler from '../utils/RecogniseHandler';
const router = Router();

export default function() {
	const Recognise = new RecogniseHandler();

	router.post('/analyse', (req, res) => {
		const { path } = req.body;
		Recognise.addToQueue(path);
		res.json({ success: 'Successfully added to queue' });
	});

	return router;
}
