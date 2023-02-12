// For upload, delete, move etc endpoints
import { Router } from 'express';
import directoryTree from '../utils/directory';
import { PATHS } from '../utils/types';
const router = Router();

export default function() {
	router.get('/fetch/:userId', (req, res) => {
		const userId = req.params.userId;
		res.json({ files: directoryTree(`${PATHS.TRASH}/${userId}`) });
	});

	return router;
}
