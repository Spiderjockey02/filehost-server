// For upload, delete, move etc endpoints
import { Router } from 'express';
import { copyFile, deleteFile, downloadFile, getFiles, moveFile, postFileUpload, renameFile, searchFile } from '../../controllers/files';
const router = Router();

export default function() {
	// Fetch user's uploaded files
	router.get('/?:path(*)', getFiles());

	// Upload a new file
	router.post('/upload', postFileUpload());

	// Delete a file/folder
	router.post('/delete', deleteFile());

	// Move a file/folder to a new directory
	router.post('/move', moveFile());

	// Copy a file to a new directory
	router.post('/copy', copyFile());

	// Download folder
	router.get('/download', downloadFile());

	// Rename a file/folder
	router.post('/rename', renameFile());

	// Search for a file
	router.get('/search', searchFile());

	return router;
}

