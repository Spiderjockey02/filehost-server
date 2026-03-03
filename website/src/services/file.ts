import type { FileWithCount, FileWithDeepChildren } from '@/types/database';
import type { FileMetadata } from '@/types/generated/client';
import API from './api';

export default class APIFile {
	/**
	  * Fetches a file tree with deep children.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param {string} path - The path to fetch files from.
	  * @returns {FileWithDeepChildren}
	*/
	async fetch(signal: AbortSignal, path: string): Promise<FileWithDeepChildren> {
		try {
			const { file } = await API.fetch<{ file: FileWithDeepChildren }>(`/api/files/${path}`, { signal });
			return file;
		} catch (error) {
			throw 'Failed to fetch user\'s files';
		}
	}

	/**
	  * Searches for files based on a query, file type, and date updated.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param {string} query - The search query.
	  * @param {string} fileType - The file type to filter by.
	  * @param {string} dateUpdated - The date updated to filter by.
	  * @returns {FileWithCount[]}
	*/
	async search(signal: AbortSignal, query: string, fileType: string, dateUpdated: string): Promise<{ files: FileWithCount[] }> {
		try {
			return await API.fetch(`/api/files/search?query=${query}&fileType=${fileType}&updatedSince=${dateUpdated}`, { signal });
		} catch (error) {
			throw 'Failed to search user\'s files';
		}
	}

	/**
    * Fetches metadata for a specific file.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @param {string} fileId - The ID of the file to fetch metadata for.
    * @returns {FileMetadata}
  */
	async fetchMetadata(signal: AbortSignal, fileId: string): Promise<FileMetadata> {
		try {
			const { metadata } = await API.fetch<{ metadata: FileMetadata }>(`/api/metadata/${fileId}`, { signal });
			return metadata;
		} catch (error) {
			throw 'Failed to fetch file\'s metadata';
		}
	}
}