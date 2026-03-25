import type { GetNetworkTrafficResult, GetNetworkStatsResult } from '@/types/Services/admin';
import type { AdminNetworkUserAgentsListResult } from '@/types/Services/api';
import type { UserActivity } from '@/types/generated/browser';
import type { StringNumberObj } from '@/types';
import API from '../api';

export default class APIAdminNetwork {
	public static endpoint = '/api/admin/network';

	/**
    * Fetches network activities with pagination and filtering.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @param {URLSearchParams} params - The URL search parameters for filtering and pagination.
    * @returns {{ activity: UserActivity[]; total: number }}
  */
	async fetchNetworkActivities(signal: AbortSignal, params: URLSearchParams): Promise<{ activity: UserActivity[]; total: number }> {
		return API.fetch(`${APIAdminNetwork.endpoint}/list?${params}`, { signal });
	}

	/**
    * Fetches user agents with pagination and filtering.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @param {URLSearchParams} params - The URL search parameters for filtering and pagination.
    * @returns {AdminNetworkUserAgentsListResult}
  */
	async fetchUserAgents(signal: AbortSignal, params: URLSearchParams): Promise<AdminNetworkUserAgentsListResult> {
		return API.fetch(`${APIAdminNetwork.endpoint}/user-agents?${params}`, { signal });
	}


	/**
    * Fetches all users with pagination and filtering.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @param params
    * @returns {GetNetworkTrafficResult}
  */
	async fetchNetworkTraffic(signal: AbortSignal, params: URLSearchParams): Promise<GetNetworkTrafficResult> {
		const { data } = await API.fetch<{data: GetNetworkTrafficResult}>(`${APIAdminNetwork.endpoint}/traffic?${params}`, { signal });
		return data;

	}

	/**
    * Fetches network request growth data with pagination and filtering.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @param params
    * @returns
  */
	async fetchNetworkRequestGrowth(signal: AbortSignal, params: URLSearchParams) {
		const { data } = await API.fetch<{data: StringNumberObj}>(`${APIAdminNetwork.endpoint}/requests?${params}`, { signal });
		return data;
	}


	/**
	  * Fetches network statistics for admin users.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns {Promise<GetNetworkStatsResult>}
	*/
	async fetchNetworkStats(signal: AbortSignal): Promise<GetNetworkStatsResult> {
		return API.fetch(`${APIAdminNetwork.endpoint}/stats`, { signal });
	}

	/**
	  * Fetches network status code distribution data with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param params
	  * @returns
	*/
	async fetchNetworkStatusDistribution(signal: AbortSignal, params: URLSearchParams) {
		return API.fetch(`${APIAdminNetwork.endpoint}/requests?${params}`, { signal });
	}
}