import type { GetUserStatsResult, GetUserRetentionResults, GetAdminUserIdResult, GetAccountsByUserIdResult,
	GetNotificationsByUserIdResult, GetNotificationsByUserIdParams, GetAllResult } from '@/types/Services/admin';
import type { StringNumberObj } from '@/types';
import API from '../api';

export default class APIAdminUsers {
	public static endpoint = '/api/admin/users';

	/**
	  * Fetches detailed information about a specific user.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param {string} userId - The user ID
	  * @returns {Promise<GetAdminUserIdResult>}
	*/
	async fetchById(signal: AbortSignal, userId: string): Promise<GetAdminUserIdResult> {
		return API.fetch(`${APIAdminUsers.endpoint}/${userId}`, { signal });
	}

	/**
    * Fetches accounts associated with a specific user by their ID.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param {string} userId - The user ID
    * @returns {Promise<GetAccountsByUserIdResult>}
  */
	async fetchAccountsByUserId(signal: AbortSignal, userId: string): Promise<GetAccountsByUserIdResult> {
		return API.fetch(`${APIAdminUsers.endpoint}/${userId}/accounts`, { signal });
	}

	/**
    * Fetches notifications for a specific user by their ID with pagination.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @param {GetNotificationsByUserIdParams} params - The search parameters for pagination and filtering.
    * @returns {Promise<GetNotificationsByUserIdResult>}
  */
	async fetchNotificationsByUserId(signal: AbortSignal, { userId, page }: GetNotificationsByUserIdParams): Promise<GetNotificationsByUserIdResult> {
		return API.fetch(`${APIAdminUsers.endpoint}/${userId}/notifications?page=${page}`, { signal });
	}

	/**
    * Fetches all users with pagination and filtering.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @param {URLSearchParams} params - The search parameters for pagination and filtering.
    * @returns {Promise<GetAllResult>}
  */
	async fetchAll(signal: AbortSignal, params: URLSearchParams): Promise<GetAllResult> {
		return API.fetch(`${APIAdminUsers.endpoint}?${params}`, { signal });
	}

	/**
    * Fetches language distribution data for users with pagination and filtering.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @returns {Promise<{languageCodes: StringNumberObj}>}
  */
	async fetchLanguageDistribution(signal: AbortSignal): Promise<{ languageCodes: StringNumberObj }> {
		return API.fetch(`${APIAdminUsers.endpoint}/language-codes`, { signal });
	}

	/**
		* Fetches user email domain distribution data with pagination and filtering.
		* @param {AbortSignal} signal - The abort signal to cancel the request if needed.
		* @returns {Promise<{emails: StringNumberObj}>}
	*/
	async fetchEmailDomains(signal: AbortSignal): Promise<{ emails: StringNumberObj }> {
		return API.fetch(`${APIAdminUsers.endpoint}/emails`, { signal });
	}

	/**
	  * Fetches user signup source distribution data with pagination and filtering.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns {Promise<{signupSource: StringNumberObj}>}
	*/
	async fetchSignupSources(signal: AbortSignal): Promise<{ signupSource: StringNumberObj }> {
		return API.fetch(`${APIAdminUsers.endpoint}/signup-source`, { signal });
	}

	/**
	  * Fetches user statistics.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns {Promise<GetUserStatsResult>}
	*/
	async fetchStats(signal: AbortSignal): Promise<GetUserStatsResult> {
		return API.fetch(`${APIAdminUsers.endpoint}/stats`, { signal });
	}

	/**
    * Fetches network request growth data.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @param {URLSearchParams} params - The search parameters for pagination and filtering.
    * @returns {Promise<StringNumberObj>}
  */
	async fetchGrowth(signal: AbortSignal, params: URLSearchParams): Promise<StringNumberObj> {
		const { data } = await API.fetch<{data: StringNumberObj}>(`${APIAdminUsers.endpoint}/growth?${params}`, { signal });
		return data;
	}

	/**
    * Fetches user retention data.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @returns {Promise<GetUserRetentionResults>}
  */
	async fetchRetention(signal: AbortSignal): Promise<GetUserRetentionResults> {
		return API.fetch(`${APIAdminUsers.endpoint}/retention`, { signal });
	}
}