import type { plansResponse, statResponse } from '@/types/Services/api';
import APISession from './session';
import APIAdmin from './admin';
import APIFile from './file';

export default class API {
	public static ADMIN: APIAdmin = new APIAdmin();
	public static SESSION: APISession = new APISession();
	public static FILE: APIFile = new APIFile();


	/**
	  * Fetches data from the API with error handling and JSON parsing.
	  * @param url The URL to fetch data from.
	  * @param options Optional fetch options, including cache settings.
	  * @returns {T}
	*/
	static async fetch<T>(url: string, options?: RequestInit & { cache?: RequestCache }): Promise<T> {
		const res = await fetch(url, {
			...options,
			credentials: 'include',
			next: { revalidate: 60 },
		});

		const text = await res.text();

		let data: any;
		try {
			data = text ? JSON.parse(text) : {};
		} catch {
			throw new Error('Invalid JSON response');
		}

		if (!res.ok) throw new Error(data?.error || 'Unknown error');
		return data as T;
	}

	/**
	  * Fetches statistics for total users, usage, and file count.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
		* @return {statResponse}
	*/
	static async fetchStatistics(signal: AbortSignal): Promise<statResponse> {
		try {
			return await API.fetch<statResponse>('/api/statistics', { signal });
		} catch (error) {
			throw 'Failed to fetch statistics';
		}
	}

	/**
	  * Fetches available plans.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns {Plan[]}
	*/
	static async fetchPlans(signal: AbortSignal): Promise<plansResponse> {
		try {
			return await API.fetch<plansResponse>('/api/plans', { signal });
		} catch (error) {
			throw 'Failed to fetch plans';
		}
	}
}