import type { GetAdminStatsResult, GetFileCategoriesResult, GetFileStatsResult,
	 GetSubscriptionStatsResult, GetSystemStatsResult } from '@/types/Services/admin';
import type { File, CronJob, Plan, CronJobLog } from '@/types/generated/browser';
import type { Config, DatabaseBackup, StringNumberObj } from '@/types';
import type { cacheStats } from '@/types/Components/Card';
import APIAdminStorage from './admin/storage';
import APIAdminNetwork from './admin/network';
import APIAdminUsers from './admin/users';
import APIAdminLogs from './admin/logs';
import API from './api';

export default class APIAdmin {
	public USERS: APIAdminUsers = new APIAdminUsers();
	public LOGS: APIAdminLogs = new APIAdminLogs();
	public NETWORK: APIAdminNetwork = new APIAdminNetwork();
	public STORAGE: APIAdminStorage = new APIAdminStorage();

	/**
	  * Fetches admin dashboard statistics.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns {Promise<GetAdminStatsResult>}
	*/
	async fetchAdminStats(signal: AbortSignal): Promise<GetAdminStatsResult> {
		try {
			return await API.fetch('/api/admin/stats', { signal });
		} catch (error) {
			throw new Error('Failed to fetch admin stats');
		}
	}

	/**
	  * Fetches a file tree with deep children for admin users.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param {URLSearchParams} params - The URL search parameters for filtering and pagination.
	  * @returns {{files: File[]; total: number}}
	*/
	async fetchRecentlyUploadedFiles(signal: AbortSignal, params: URLSearchParams): Promise<{files: File[]; total: number}> {
		try {
			return await API.fetch(`/api/admin/files/recently-uploaded?${params}`, { signal });
		} catch {
			throw new Error('Failed to fetch recently uploaded files');
		}
	}

	/**
	  * Fetches the application configuration.
	  * @returns {Promise<Config>}
	*/
	async fetchConfig(): Promise<Config> {
		return API.fetch<Config>('/api/admin/config');
	}

	/**
	  * Searches for MIME types based on a query string.
	  * @param {string} mimeType - The MIME type query string to search for.
	  * @returns {Promise<{list: string[]}>}
	*/
	async searchMimeType(mimeType: string): Promise<{list: string[]}> {
		return API.fetch(`/api/admin/mime-types/search?query=${mimeType}`);
	}

	/**
	  * Updates the application configuration.
	  * @param {Config} config - The configuration object to be updated.
	  * @returns
	*/
	async postConfig(config: Config) {
		return API.fetch('/api/admin/config', {
			method: 'POST',
			body: JSON.stringify(config),
		});
	}

	/**
	  * Fetches CRON jobs with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns {Promise<{ cronJobs: CronJob[] }> }
	*/
	async fetchCronJobs(signal: AbortSignal): Promise<{ cronJobs: CronJob[] }> {
		try {
			return await API.fetch('/api/admin/cron-jobs', { signal });
		} catch {
			throw new Error('Failed to fetch CRON jobs');
		}
	}

	/**
	  * Fetches logs for a specific CRON job by its name with pagination.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param {string} name - The name of the CRON job to fetch logs for.
	  * @returns {Promise<{ logs: CronJobLog[], total: number }>}
	*/
	async fetchCRONJobByName(signal: AbortSignal, name: string): Promise<{ logs: CronJobLog[]; total: number; }> {
		try {
			return await API.fetch(`/api/admin/cron-jobs/${name}/logs`, { signal });
		} catch {
			throw new Error('Failed to fetch CRON job logs');
		}
	}

	/**
	  * Fetches database backups with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns {Promise<{ backups: DatabaseBackup[] }>}
	*/
	async fetchDatabaseBackups(signal: AbortSignal): Promise<{ backups: DatabaseBackup[] }> {
		try {
			return await API.fetch('/api/admin/database/backups', { signal });
		} catch {
			throw new Error('Failed to fetch database backups');
		}
	}

	/**
	  * Fetches subscription plans available in the application.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns {Promise<{ plans: Plan[] }>}
	*/
	async fetchPlans(signal: AbortSignal): Promise<{ plans: Plan[] }> {
		try {
			return await API.fetch('/api/plans', { signal });
		} catch {
			throw new Error('Failed to fetch plans');
		}
	}

	/**
	  * Fetches customer trends based on subscription plans with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param {URLSearchParams} params - The URL search parameters for filtering and pagination.
	  * @returns {Promise<StringNumberObj>}
	*/
	async fetchCustomerTrends(signal: AbortSignal, params: URLSearchParams): Promise<StringNumberObj> {
		try {
			const { data } = await API.fetch<{data: StringNumberObj}>(`/api/admin/plan/trends?${params}`, { signal });
			return data;
		} catch {
			throw new Error('Failed to fetch customer trends');
		}
	}

	/**
	  * Fetch statistics on active plans
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns {Promise<GetSubscriptionStatsResult>}
	*/
	async fetchSubscriptionStats(signal: AbortSignal): Promise<GetSubscriptionStatsResult> {
		try {
			return await API.fetch('/api/admin/plan/stats', { signal });
		} catch (error) {
			throw new Error('Failed to fetch subscription stats');
		}
	}

	/**
	  * Fetches file statistics.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns {Promise<GetFileStatsResult>}
	*/
	async fetchFileStats(signal: AbortSignal): Promise<GetFileStatsResult> {
		try {
			return await API.fetch('/api/admin/files', { signal });
		} catch (error) {
			throw new Error('Failed to fetch file stats');
		}
	}

	/**
	  * Fetches file upload growth data with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param {URLSearchParams} params - The URL search parameters for filtering and pagination.
	  * @returns {Promise<StringNumberObj>}
	*/
	async fetchFileUploadGrowth(signal: AbortSignal, params: URLSearchParams): Promise<StringNumberObj> {
		try {
			const { data } = await API.fetch<{data: StringNumberObj}>(`/api/admin/files/growth?${params}`, { signal });
			return data;
		} catch {
			throw new Error('Failed to fetch file upload growth data');
		}
	}

	/**
	  * Fetches file size categories with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns {Promise<GetFileCategoriesResult>}
	*/
	async fetchFileSizeCategories(signal: AbortSignal): Promise<GetFileCategoriesResult> {
		try {
			return await API.fetch('/api/admin/files/sized-categories', { signal });
		 } catch (error) {
			throw new Error('Failed to fetch file size categories');
		}
	}

	/**
	  * Deletes a specific cache by its name.
	  * @param {string} name cache name
	  * @returns
	*/
	async deleteCache(name: string) {
		try {
			return await API.fetch(`/api/admin/cache/delete/${name}`, { method: 'DELETE' });
		} catch {
			throw new Error('Failed to delete cache');
		}
	}

	/**
	  * Fetches cache statistics for admin users.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns {Promise<cacheStats>}
	*/
	async fetchCacheStats(signal: AbortSignal): Promise<cacheStats> {
		try {
			return await API.fetch('/api/admin/cache/stats', { signal });
		} catch {
			throw new Error('Failed to fetch cache stats');
		}
	}

	/**
	  * Fetch statistics for current system
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
		* @returns {Promise<GetSystemStatsResult>}
	*/
	async fetchSystemStats(signal: AbortSignal): Promise<GetSystemStatsResult> {
		try {
			return await API.fetch('/api/admin/system/stats', { signal });
		} catch (error) {
			throw new Error('Failed to fetch system stats');
		}
	}
}