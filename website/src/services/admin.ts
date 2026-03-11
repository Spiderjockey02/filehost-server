import type { AuditLog, UserActivity, File, CronJob, Plan, Account, Notification, CronJobLog, UserBans } from '@/types/generated/browser';
import type { FullAuditLogListener, StorageWithCounts, UserWithCount } from '@/types/database';
import type { AdminNetworkUserAgentsListResult } from '@/types/Services/api';
import type { AdminUser, Config, DatabaseBackup, StringNumberObj } from '@/types';
import type { GetAdminStatsResult, GetFileCategoriesResult, GetFileStatsResult, GetLogTypesResult, GetNetworkStatsResult, GetSubscriptionStatsResult, GetSystemStatsResult, GetUserStatsResult } from '@/types/Services/admin';
import type { cacheStats } from '@/types/Components/Card';
import API from './api';

export default class APIAdmin {

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
	  * Fetches network activities with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param {URLSearchParams} params - The URL search parameters for filtering and pagination.
	  * @returns {{ activity: UserActivity[]; total: number }}
	*/
	async fetchNetworkActivities(signal: AbortSignal, params: URLSearchParams): Promise<{ activity: UserActivity[]; total: number }> {
		try {
			return await API.fetch(`/api/admin/network/list?${params}`, { signal });
		} catch {
			throw new Error('Failed to fetch network activities');
		}
	}

	/**
	  * Fetches audit logs with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param {URLSearchParams} params - The URL search parameters for filtering and pagination.
	  * @returns {{ logs: AuditLog[]; total: number }}
	*/
	async fetchAuditLogs(signal: AbortSignal, params: URLSearchParams): Promise<{ logs: AuditLog[]; total: number }> {
		try {
			return await API.fetch(`/api/admin/logs?${params}`, { signal });
		} catch {
			throw new Error('Failed to fetch audit logs');
		}
	}

	/**
	  * Fetches log files with optional file name filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param {string} fileName - The name of the log file to filter by (optional).
	  * @returns {{ logs: string[] }}
	*/
	async fetchLogFiles(signal: AbortSignal, fileName: string | null): Promise<{ logs: string[] }> {
		try {
			return await API.fetch(`/api/admin/logs/files/${fileName == null ? '' : fileName}`, { signal });
		} catch {
			throw new Error('Failed to fetch log files');
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
	  * Fetches user agents with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param {URLSearchParams} params - The URL search parameters for filtering and pagination.
	  * @returns {AdminNetworkUserAgentsListResult}
	*/
	async fetchUserAgents(signal: AbortSignal, params: URLSearchParams): Promise<AdminNetworkUserAgentsListResult> {
		try {
			return await API.fetch(`/api/admin/network/user-agents?${params}`, { signal });
		} catch {
			throw new Error('Failed to fetch user agents');
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
	  * @returns
	*/
	async fetchCronJobs(signal: AbortSignal) {
		try {
			return await API.fetch<{ cronJobs: CronJob[] }>('/api/admin/cron-jobs', { signal });
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
	  * @returns
	*/
	async fetchDatabaseBackups(signal: AbortSignal) {
		try {
			return await API.fetch<{ backups: DatabaseBackup[] }>('/api/admin/database/backups', { signal });
		} catch {
			throw new Error('Failed to fetch database backups');
		}
	}

	/**
	  * Fetches audit log listeners with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns
	*/
	async fetchLogListeners(signal: AbortSignal) {
		try {
			return await API.fetch<{ listeners: FullAuditLogListener[] }>('/api/admin/logs/listeners', { signal });
		} catch {
			throw new Error('Failed to fetch audit log listeners');
		}
	}

	/**
	  * Fetches storage mediums with counts for admin users.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
		* @returns
	*/
	async fetchStorages(signal: AbortSignal) {
		try {
			return await API.fetch<{ storages: StorageWithCounts[], avgFileCount: number, avgStorageUsage: number }>('/api/admin/storage', { signal });
		} catch {
			throw new Error('Failed to fetch storage mediums');
		}
	}

	async fetchStorageTypes(signal: AbortSignal) {
		try {
			return await API.fetch<{ MediumCounts: { [key: string]: number } }>('/api/admin/storage/types', { signal });
		} catch (error) {
			throw new Error('Failed to fetch storage types');
		}
	}


	/**
	  * Fetches subscription plans available in the application.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns
	*/
	async fetchPlans(signal: AbortSignal) {
		try {
			return await API.fetch<{ plans: Plan[] }>('/api/plans', { signal });
		} catch {
			throw new Error('Failed to fetch plans');
		}
	}

	async fetchUserById(signal: AbortSignal, userId: string) {
		try {
			return await API.fetch<{ user: AdminUser, bannedStatus: UserBans | null }>(`/api/admin/users/${userId}`, { signal });
		} catch {
			throw new Error('Failed to fetch user details');
		}
	}


	/**
	  * Fetches accounts associated with a specific user by their ID.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param userId
	  * @returns
	*/
	async fetchUserAccounts(signal: AbortSignal, userId: string) {
		try {
			return await API.fetch<{ accounts: Account[] }>(`/api/admin/users/${userId}/accounts`, { signal });
		} catch {
			throw new Error('Failed to fetch user accounts');
		}
	}

	/**
	  * Fetches notifications for a specific user by their ID with pagination.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param param1
	  * @returns
	*/
	async fetchUserNotifications(signal: AbortSignal, { userId, page }: { userId: string; page: number }) {
		try {
			return await API.fetch<{ notifications: Notification[]; total: number }>(`/api/admin/users/${userId}/notifications?page=${page}`, { signal });
		} catch {
			throw new Error('Failed to fetch user notifications');
		}
	}

	/**
	  * Fetches all users with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param params
	  * @returns
	*/
	async fetchAllUsers(signal: AbortSignal, params: URLSearchParams) {
		try {
			return await API.fetch<{ users: UserWithCount[], total: number }>(`/api/admin/users?${params}`, { signal });
		} catch {
			throw new Error('Failed to fetch all users');
		}
	}

	/**
	  * Fetches all users with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param params
	  * @returns
	*/
	async fetchNetworkTraffic(signal: AbortSignal, params: URLSearchParams) {
		try {
			const d = await API.fetch<any>(`/api/admin/network/traffic?${params}`, { signal });
			const firstKey = Object.keys(d)[0];
			return d[firstKey]!;
		} catch {
			throw new Error('Failed to fetch network traffic');
		}
	}

	/**
	  * Fetches customer trends based on subscription plans with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param params
	  * @returns
	*/
	async fetchCustomerTrends(signal: AbortSignal, params: URLSearchParams) {
		try {
			const d = await API.fetch<any>(`/api/admin/plan/trends?${params}`, { signal });
			const firstKey = Object.keys(d)[0];
			return d[firstKey]!;
		} catch {
			throw new Error('Failed to fetch customer trends');
		}
	}

	async fetchSubscriptionStats(signal: AbortSignal): Promise<GetSubscriptionStatsResult> {
		try {
			return await API.fetch('/api/admin/plan/stats', { signal });
		} catch (error) {
			throw new Error('Failed to fetch subscription stats');
		}
	}


	/**
	  * Fetches audit log activity data with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param params
	  * @returns
	*/
	async fetchAuditLogActivity(signal: AbortSignal, params: URLSearchParams) {
		try {
			const d = await API.fetch<any>(`/api/admin/logs/history?${params}`, { signal });
			const firstKey = Object.keys(d)[0];
			return d[firstKey]!;
		} catch {
			throw new Error('Failed to fetch audit log activity data');
		}
	}

	/**
	  * Fetches file statistics.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns
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
	  * @param params
	  * @returns
	*/
	async fetchFileUploadGrowth(signal: AbortSignal, params: URLSearchParams) {
		try {
			const d = await API.fetch<any>(`/api/admin/files/growth?${params}`, { signal });
			const firstKey = Object.keys(d)[0];
			return d[firstKey] as StringNumberObj;
		} catch {
			throw new Error('Failed to fetch file upload growth data');
		}
	}

	/**
	  * Fetches file size categories with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns
	*/
	async fetchFileSizeCategories(signal: AbortSignal): Promise<GetFileCategoriesResult> {
		try {
			return await API.fetch('/api/admin/files/sized-categories', { signal });
		 } catch (error) {
			throw new Error('Failed to fetch file size categories');
		}
	}

	/**
	  * Fetches language distribution data for users with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns
	*/
	async fetchLanguageDistribution(signal: AbortSignal) {
		try {
			const d = await API.fetch<any>('/api/admin/users/language-codes', { signal });
			return d['languageCodes'] as StringNumberObj;
		} catch {
			throw new Error('Failed to fetch language distribution data');
		}
	}

	async fetchUserEmailDomains(signal: AbortSignal): Promise<{emails: StringNumberObj}> {
		try {
			return await API.fetch('/api/admin/users/emails', { signal });
		} catch (error) {
			throw new Error('Failed to fetch user email domains');
		}
	}

	async fetchUserSignupSources(signal: AbortSignal): Promise<{signupSource: StringNumberObj}> {
		try {
			return await API.fetch('/api/admin/users/signup-source', { signal });
		} catch (error) {
			throw new Error('Failed to fetch user signup sources');
		}
	}

	async fetchUserStats(signal: AbortSignal): Promise<GetUserStatsResult> {
		try {
			return await API.fetch('/api/admin/users/stats', { signal });
		} catch (error) {
			throw new Error('Failed to fetch user stats');
		}
	}

	/**
	  * Fetches network request growth data with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param params
	  * @returns
	*/
	async fetchNetworkRequestGrowth(signal: AbortSignal, params: URLSearchParams) {
		try {
			const d = await API.fetch<any>(`/api/admin/network/requests?${params}`, { signal });
			const firstKey = Object.keys(d)[0];
			return d[firstKey] as StringNumberObj;
		} catch {
			throw new Error('Failed to fetch network request growth data');
		}
	}

	/**
	  * Fetches network request growth data with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param params
	  * @returns
	*/
	async fetchUserGrowth(signal: AbortSignal, params: URLSearchParams) {
		try {
			const d = await API.fetch<any>(`/api/admin/users/growth?${params}`, { signal });
			const firstKey = Object.keys(d)[0];
			return d[firstKey] as StringNumberObj;
		} catch {
			throw new Error('Failed to fetch user growth data');
		}
	}

	/**
	  * Fetches user retention data with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns
	*/
	async fetchUserRetention(signal: AbortSignal) {
		try {
			const d = await API.fetch<any>('/api/admin/users/retention', { signal });
			const firstKey = Object.keys(d)[0];
			return d[firstKey];
		} catch {
			throw new Error('Failed to fetch user retention data');
		}
	}

	/**
	  * Deletes a specific cache by its name.
	  * @param name
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
	  * Fetches storage details by its ID.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
		* @param {string} id - The ID of the storage.
	  * @returns {{storage: StorageWithCounts}}
	*/
	async fetchStorageById(signal: AbortSignal, id: string): Promise<{storage: StorageWithCounts}> {
		try {
			return await API.fetch<{storage: StorageWithCounts}>(`/api/admin/storage/${id}`, { signal });
		} catch (err: unknown) {
			throw new Error(`Failed to fetch storage details: ${err instanceof Error ? err.message : 'Unknown error'}`);
		}
	}

	/**
	  * Fetches logs with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns
	*/
	async fetchLogs(signal: AbortSignal): Promise<{logs: AuditLog[]; total: number}> {
		try {
			return await API.fetch('/api/admin/logs', { signal });
		} catch (error) {
			throw new Error('Failed to fetch logs');
		}
	}

	/**
	  * Fetches log types with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns
  */
	async fetchLogTypes(signal: AbortSignal): Promise<GetLogTypesResult> {
		try {
			return await API.fetch('/api/admin/logs/types', { signal });
		} catch (error) {
			throw new Error('Failed to fetch log types');
		}
	}

	/**
	  * Fetches network statistics for admin users.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @returns {Promise<GetNetworkStatsResult>}
	*/
	async fetchNetworkStats(signal: AbortSignal): Promise<GetNetworkStatsResult> {
		try {
			return await API.fetch('/api/admin/network/stats', { signal });
		} catch (error) {
			throw new Error('Failed to fetch network stats');
		}
	}

	/**
	  * Fetches network status code distribution data with pagination and filtering.
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	  * @param params
	  * @returns
	*/
	async fetchNetworkStatusDistribution(signal: AbortSignal, params: URLSearchParams) {
		try {
			return await API.fetch(`/api/admin/network/requests?${params}`, { signal });
		} catch (error) {
			throw new Error('Failed to fetch network status distribution');
		}
	}

	/**
	  *
	  * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
	*/
	async fetchSystemStats(signal: AbortSignal): Promise<GetSystemStatsResult> {
		try {
			return await API.fetch('/api/admin/system/stats', { signal });
		} catch (error) {
			throw new Error('Failed to fetch system stats');
		}
	}
}