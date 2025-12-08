import type { AddAuditLogListenerParams, CreateAuditLogEntryParams, fetchAuditLogsParams, FullAuditLogListener, UpdateAuditLogListenerParams } from '@/types/database/AuditLogs';
import type { AuditLog, AuditLogListener, AuditLogNames, AuditLogResourceType } from '@/types/generated/client';
import { parseIP, parseUserAgent } from '../utils';
import type Client from '@/helpers/Client';
import client from './prisma';

export default class AuditLogAccessor {
	listeners: Map<string, FullAuditLogListener>;
	gclient: Client;

	constructor(gclient: Client) {
		this.listeners = new Map();
		this.gclient = gclient;

		// Fetch all listeners on load
		this.fetchAllListeners();
	}

	/**
	  * Create an audit log and send to listeners (if set up)
	  * @param {CreateAuditLogEntryParams} params The audit log data.
		* @returns {AuditLog} The audit log.
	*/
	async create(params: CreateAuditLogEntryParams): Promise<AuditLog> {
		const ip = params.ip ? parseIP(params.ip) : undefined;
		const userAgent = params.userAgent ? parseUserAgent(params.userAgent) : undefined;
		const displayName = params.eventName.split('_').join(' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

		try {
			const log = await client.auditLog.create({
				data: {
					event: {
						connectOrCreate: {
							where: {
								name: params.eventName,
							},
							create: {
								name: params.eventName,
								resourceType: params.resourceType,
								displayName: displayName,
							},
						},
					},
					message: params.message,
					success: params.success,
					resourceId: params.resourceId,
					user: params.userId ? {
						connect: {
							id: params.userId,
						},
					} : undefined,
					ipCon: params.ip ? {
						connectOrCreate: {
							where: {
								ip: params.ip,
							},
							create: {
								...ip, ip: params.ip,
							},
						},
					} : undefined,
					userAgentCon: params.userAgent ? {
						connectOrCreate: {
							where: {
								agent: params.userAgent,
							},
							create: {
								...userAgent, agent: params.userAgent,
							},
						},
					} : undefined,
				},
				include: {
					user: true,
					event: true,
				},
			});

			// Notify listeners
			const listeners = this.listeners.size == 0 ? this.listeners : await this.fetchAllListeners();
			const interestedListeners = [...listeners.values()].filter(l => l.events.some(e => e.eventId === params.eventName) && l.enabled);
			for (const listener of interestedListeners) {
				if (listener.type === 'WEBHOOK' && listener.targetUrl) this.gclient.sendWebhook(listener, log);
				if (listener.type == 'NOTIFICATION') this.gclient.sendNotification(this.gclient, listener, log);
			}

			return log;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch a list of audit logs
	  * @param {fetchAuditLogsParams} data The filter data
		* @returns {{logs: AuditLog[], total: number}} The list of logs and a total
	*/
	async fetchAll(data: fetchAuditLogsParams): Promise<{logs: AuditLog[], total: number}> {
		try {
			const [logs, total] = await Promise.all([
				client.auditLog.findMany({
					where: {
						userId: data.userId,
						eventId: data.eventName,
					},
					orderBy: {
						createdAt: data.sortOrder ?? 'desc',
					},
					take: 20,
					skip: data.page ? data.page * 20 : 0,
				}),
				client.auditLog.count({
					where: {
						userId: data.userId,
						eventId: data.eventName,
					},
				}),
			]);

			return { logs, total };
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch all event names
		* @returns {AuditLogNames[]} The list of event names
	*/
	async fetchAllEvents(): Promise<AuditLogNames[]> {
		return client.auditLogNames.findMany();
	}

	/**
	  * Fetch total audit logs
		* @returns {number} The total number of audit logs
	*/
	async fetchTotal(): Promise<number> {
		return client.auditLog.count();
	}

	/**
	  * Fetch total logs with a certain resource type
		* @param {AuditLogResourceType} resourceType The resource type
		* @returns {number} The total number of audit logs
	*/
	async fetchCountByResourceType(resourceType: AuditLogResourceType): Promise<number> {
		return client.auditLog.count({
			where: {
				event: {
					resourceType: resourceType,
				},
			},
		});
	}

	/**
	  * Add a new audit log listener
		* @param {AddAuditLogListenerParams} data The listener data
		* @returns {AuditLogListener} The new listener
	*/
	async addListener(data: AddAuditLogListenerParams): Promise<AuditLogListener> {
		try {
			const listener = await client.auditLogListener.create({
				data: {
					admin: {
						connect: {
							id: data.userId,
						},
					},
					name: data.name,
					type: data.type,
					targetUrl: data.targetUrl,
					enabled: true,
				},
			});

			await client.auditLogEventSubscription.createMany({
				data: data.eventNames.map(eventName => ({
					listenerId: listener.id,
					eventId: eventName,
				})),
				skipDuplicates: true,
			});

			// Fetch new listener with events
			const fullListener = await client.auditLogListener.findUnique({
				where: {
					id: listener.id,
				},
				include: {
					events: true,
				},
			});

			this.listeners.set(fullListener!.id, fullListener!);
			return listener;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Remove an audit log listener
		* @param {string} id The listener Id
		* @returns {AuditLogListener} The deleted listener
	*/
	async removeListener(id: string): Promise<AuditLogListener> {
		try {
			const listener = await client.auditLogListener.delete({
				where: {
					id: id,
				},
			});

			this.listeners.delete(listener.id);
			return listener;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Update an existing audit log listener
		* @param {AddAuditLogListenerParams} data The listener data
		* @returns {AuditLogListener} The new listener
	*/
	async updateListener(data: UpdateAuditLogListenerParams): Promise<AuditLogListener> {
		try {
			const listener = await client.auditLogListener.update({
				where: {
					id: data.id,
				},
				data: {
					name: data.name,
					type: data.type,
					targetUrl: data.targetUrl,
					enabled: data.enabled,
				},
			});

			const existingSubs = await client.auditLogEventSubscription.findMany({
				where: { listenerId: listener.id },
				select: { eventId: true },
			});

			const existingEventIds = existingSubs.map(e => e.eventId);
			const newEventIds = data.eventNames;

			const toAdd = newEventIds.filter(id => !existingEventIds.includes(id));
			const toRemove = existingEventIds.filter(id => !newEventIds.includes(id));

			await client.$transaction([
				client.auditLogEventSubscription.deleteMany({
					where: {
						listenerId: listener.id,
						eventId: { in: toRemove },
					},
				}),
				client.auditLogEventSubscription.createMany({
					data: toAdd.map(eventId => ({
						listenerId: listener.id,
						eventId,
					})),
					skipDuplicates: true,
				}),
			]);

			const fullListener = await client.auditLogListener.findUnique({
				where: { id: listener.id },
				include: { events: true },
			});

			this.listeners.set(fullListener!.id, fullListener!);
			return fullListener!;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch all audit log listeners
		* @returns {FullAuditLogListener[]} The list of listeners
	*/
	async fetchAllListeners(): Promise<FullAuditLogListener[]> {
		try {
			const listeners = await client.auditLogListener.findMany({
				include: {
					events: true,
				},
			});

			listeners.forEach(l => this.listeners.set(l.id, l));
			return listeners;
		} catch (err) {
			throw err;
		}
	}

	/**
		* Fetch the total logs by a resource type between 2 dates
		* @param {AuditLogResourceType} resourceType The resource type
		* @param {Date} oldDate The old date.
		* @param {Date} newDate The new date.
		* @returns {number} The number of logs filtered by the resource type
	*/
	async fetchActivityByResourceTypeBetweenTwoDates(resourceType: AuditLogResourceType, oldDate: Date, newDate: Date): Promise<number> {
		return client.auditLog.count({
			where: {
				event: {
					resourceType: resourceType,
				},
				createdAt: {
					gte: oldDate,
					lte: newDate,
				},
			},
		});
	}

	/**
	 * Fetch the success rate of audit logs
	 * @returns {{[key:string]: number}} The count of successful and failed audit logs
	*/
	async fetchSuccessRate(): Promise<{[key:string]: number}> {
		try {
			const res = await client.auditLog.groupBy({
				by: ['success'],
				_count: true,
			});

			const codesWithCount: { [key: string]: number } = {};
			for (const item of res) {
				codesWithCount[`${item.success}`] = item._count;
			}

			return codesWithCount;
		} catch (err) {
			throw err;
		}
	}
}
