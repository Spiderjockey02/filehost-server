import type { DeletedFile, FileWithMetadata, UserHistoryWithFile } from '@/types/database';
import type { CurrentSessionResult, GetSessionAccountsResults, GetSessionResult } from '@/types/Services/session';
import type { Notification } from '@/types/generated/browser';
import API from './api';

export default class APISession {
	/**
	  * Fetches the user's notifications.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns {{ notifications: Notification[], total: number }}
	*/
	async fetchUsersNotifications(signal?: AbortSignal): Promise<{ notifications: Notification[], total: number }> {
		try {
			return await API.fetch('/api/session/notifications', { signal });
		} catch (error) {
			throw new Error('Failed to fetch user\'s notifications.');
		}
	}

	/**
	  * Fetches the user's gallery files.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns {{ files: FileWithMetadata[] }}
	*/
	async fetchGallery(signal: AbortSignal): Promise<{ files: FileWithMetadata[] }> {
		try {
			return await API.fetch('/api/session/gallery', { signal });
		} catch (error) {
			throw new Error(`Failed to fetch user's gallery: ${error}`);
		}
	}

	/**
	  * Fetches the user's recently viewed files.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
		* @param {URLSearchParams} params - Query parameters
	  * @returns {{ files: UserHistoryWithFile[] }}
	*/
	async fetchRecentlyViewed(signal: AbortSignal, params: URLSearchParams): Promise<{ files: UserHistoryWithFile[] }> {
		try {
			return await API.fetch(`/api/session/recently-viewed?${params.toString()}`, { signal });
		} catch(error) {
			throw new Error(`Failed to fetch recently viewed files: ${error}`);
		}
	}

	/**
	  * Fetches the user's trashed files.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
		* @return {{ files: DeletedFile[] }}
	*/
	async fetchTrash(signal: AbortSignal): Promise<{files: DeletedFile[]}> {
		try {
			return await API.fetch('/api/session/trash', { signal });
		} catch (error) {
			throw new Error('Failed to fetch user\'s trashed files.');
		}
	}

	async fetchAccounts(signal: AbortSignal): Promise<GetSessionAccountsResults> {
		try {
			return await API.fetch('/api/session/accounts', { signal });
		} catch (error) {
			throw new Error('Failed to fetch user\'s linked accounts.');
		}
	}

	/**
	  * Fetches the current session based on the provided cookie headers.
	  * @param {string} cookie - The cookie headers.
	  * @returns {CurrentSessionResult}
	*/
	async fetchCurrentSession(cookie: string): Promise<CurrentSessionResult> {
		try {
			const data = await API.fetch<GetSessionResult | null>(`${process.env.BETTER_AUTH_URL}/api/auth/get-session`, {
				headers: {
					cookie: cookie,
				},
			});

			if (!data) {
				return {
					isLoggedin: false,
					user: null,
					session: null,
					isAdmin: false,
				};
			} else {
				return {
					isLoggedin: true,
					user: data.user,
					session: data.session,
					isAdmin: data.user.role === 'admin',
				};
			}
		} catch (error) {
			throw `Failed to fetch current session: ${error}`;
		}
	}
}
