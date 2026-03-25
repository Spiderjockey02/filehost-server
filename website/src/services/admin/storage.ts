import type { GetStorageListResult, GetStorageTypesResult } from '@/types/Services/admin';
import type { StorageWithCounts } from '@/types/database';
import API from '../api';

export default class APIAdminStorage {
	public static endpoint = '/api/admin/storage';

	/**
    * Fetches storage details by its ID.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @param {string} id - The ID of the storage.
    * @returns {Promise<{storage: StorageWithCounts}>}
  */
	async fetchById(signal: AbortSignal, id: string): Promise<{storage: StorageWithCounts}> {
		try {
			return await API.fetch(`${APIAdminStorage.endpoint}/${id}`, { signal });
		} catch (err: unknown) {
			throw new Error(`Failed to fetch storage details: ${err instanceof Error ? err.message : 'Unknown error'}`);
		}
	}

	/**
    * Fetches storage mediums with counts for admin users.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @returns {Promise<GetStorageListResult>}
  */
	async fetchAll(signal: AbortSignal): Promise<GetStorageListResult> {
		try {
			return await API.fetch(APIAdminStorage.endpoint, { signal });
		} catch {
			throw new Error('Failed to fetch storage mediums');
		}
	}

	/**
    * Fetches storage medium types
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @returns {Promise<GetStorageTypesResult>}
  */
	async fetchTypes(signal: AbortSignal): Promise<GetStorageTypesResult> {
		try {
			return await API.fetch(`${APIAdminStorage.endpoint}/types`, { signal });
		} catch (error) {
			throw new Error('Failed to fetch storage types');
		}
	}
}