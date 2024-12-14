// For upload, delete, move etc endpoints
import { Router } from 'express';
import { getTrash } from 'src/controllers/trash';
const router = Router();

export default function() {
	// Fetch user's trash
	router.get('/', getTrash());

	return router;
}

