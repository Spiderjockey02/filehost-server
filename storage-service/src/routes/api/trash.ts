import { deleteEmpty, getTrash, putRestore } from '../../controllers/trash';
import type Client from '../../helpers/Client';
import { Router } from 'express';
const router = Router();

export default function(client: Client) {
	// Fetch user's trash
	router.get('/', getTrash(client));

	// Empty the bin (Delete everything in the trash)
	router.delete('/empty', deleteEmpty(client));

	// Restore a file from the trash
	router.put('/restore', putRestore(client));

	return router;
}

