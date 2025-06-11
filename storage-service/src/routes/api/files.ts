import { postCopyFile, postCreateFolder, deleteFile, postDownloadFile, getFiles,
	postMoveFile, postFileUpload, postRenameFile, getSearchFile, getAllDirectories,
	getBulkDownload, deleteBulkFiles } from '../../controllers/files';
import type Client from '../../helpers/Client';
import { Router } from 'express';
const router = Router();

export default function(client: Client) {
	// Upload a new file
	router.post('/upload', postFileUpload(client));

	// Delete a file/folder
	router.delete('/delete', deleteFile(client));

	// Move a file/folder to a new directory
	router.post('/move', postMoveFile(client));

	// Copy a file to a new directory
	router.post('/copy', postCopyFile(client));

	// Download folder
	router.post('/download', postDownloadFile(client));

	// Download multiple items at once
	router.post('/bulk-download', getBulkDownload(client));

	// Delete multiple items at once
	router.delete('/bulk-delete', deleteBulkFiles(client));

	// Rename a file/folder
	router.post('/rename', postRenameFile(client));

	// Search for a file
	router.get('/search', getSearchFile(client));

	// Create a new folder
	router.post('/create-folder', postCreateFolder(client));

	// Get all user's directories
	router.get('/directories', getAllDirectories(client));

	// Fetch user's uploaded files
	router.get('/?:path(*)', getFiles(client));

	return router;
}

