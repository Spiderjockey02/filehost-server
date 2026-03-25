import type { GetAuditLogActivityResult, GetAuditLogsResult, GetFileByNameResult, GetLogListResult, GetLogTypesResult } from '@/types/Services/admin';
import type { FullAuditLogListener } from '@/types/database';
import API from '../api';

export default class APIAdminLogs {
	public static endpoint = '/api/admin/logs';

	/**
    * Fetches audit log listeners.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @returns {Promise<{ listeners: FullAuditLogListener[] }>}
  */
	async fetchListeners(signal: AbortSignal): Promise<{ listeners: FullAuditLogListener[] }> {
		return API.fetch(`${APIAdminLogs.endpoint}/listeners`, { signal });
	}

	/**
    * Fetches audit log activity data.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @param {URLSearchParams} params - The search parameters for pagination and filtering.
    * @returns {Promise<GetAuditLogActivityResult>}
  */
	async fetchAuditLogActivity(signal: AbortSignal, params: URLSearchParams): Promise<GetAuditLogActivityResult> {
		const { data } = await API.fetch<{data: GetAuditLogActivityResult}>(`${APIAdminLogs.endpoint}/history?${params}`, { signal });
		return data;
	}

	/**
    * Fetches logs with pagination and filtering.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @returns {Promise<GetLogListResult>}
  */
	async fetchAll(signal: AbortSignal): Promise<GetLogListResult> {
		return API.fetch(`${APIAdminLogs.endpoint}`, { signal });
	}

	/**
    * Fetches log types with pagination and filtering.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @returns {Promise<GetLogTypesResult>}
  */
	async fetchTypes(signal: AbortSignal): Promise<GetLogTypesResult> {
		return API.fetch(`${APIAdminLogs.endpoint}/types`, { signal });
	}

	/**
    * Fetches audit logs with pagination and filtering.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @param {URLSearchParams} params - The search parameters for pagination and filtering.
    * @returns {Promise<GetAuditLogsResult>}
  */
	async fetchAuditLogs(signal: AbortSignal, params: URLSearchParams): Promise<GetAuditLogsResult> {
		return API.fetch(`${APIAdminLogs.endpoint}?${params}`, { signal });
	}

	/**
    * Fetches log files with optional file name filtering.
    * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
    * @param {string} fileName - The name of the log file to filter by (optional).
    * @returns {Promise<GetFileByNameResult>}
  */
	async fetchFileByName(signal: AbortSignal, fileName: string | null): Promise<GetFileByNameResult> {
		return API.fetch(`${APIAdminLogs.endpoint}/files/${fileName == null ? '' : fileName}`, { signal });
	}
}