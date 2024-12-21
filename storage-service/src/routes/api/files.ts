// For upload, delete, move etc endpoints
import { Router } from 'express';
import { copyFile, createFolder, deleteFile, downloadFile, getFiles, moveFile, postFileUpload, renameFile, searchFile } from '../../controllers/files';
import { Client } from 'src/helpers';
const router = Router();

export default function(client: Client) {
	// Fetch user's uploaded files
	router.get('/?:path(*)', getFiles(client));

	// Upload a new file
	router.post('/upload', postFileUpload(client));

	// Delete a file/folder
	router.post('/delete', deleteFile(client));

	// Move a file/folder to a new directory
	router.post('/move', moveFile(client));

	// Copy a file to a new directory
	router.post('/copy', copyFile(client));

	// Download folder
	router.get('/download', downloadFile(client));

	// Rename a file/folder
	router.post('/rename', renameFile(client));

	// Search for a file
	router.get('/search', searchFile());

	// Create a new folder
	router.post('/create-folder', createFolder(client));

	return router;
}

