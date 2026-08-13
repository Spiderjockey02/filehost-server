import type { AddAuditLogListenerParams, CreateAuditLogEntryParams, FetchAuditLogsParams, FullAuditLogListener, UpdateAuditLogListenerParams } from '@/types/database/AuditLogs';
import { AuditLogResourceType, type AuditLog, type AuditLogListener, type AuditLogNames } from '@/types/generated/client';
import { parseIP, parseUserAgent, skipUndefined } from '../utils';
import { skip } from '@/types/generated/internal/prismaNamespace';
import type Client from '@/helpers/Client';
import client from '.';

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
					message: skipUndefined(params.message),
					success: params.success,
					resourceId: skipUndefined(params.resourceId),
					user: params.userId ? {
						connect: {
							id: params.userId,
						},
					} : skip,
					ipCon: params.ip ? {
						connectOrCreate: {
							where: {
								ip: params.ip,
							},
							create: {
								...ip, ip: params.ip,
							},
						},
					} : skip,
					userAgentCon: params.userAgent ? {
						connectOrCreate: {
							where: {
								agent: params.userAgent,
							},
							create: {
								...userAgent, agent: params.userAgent,
							},
						},
					} : skip,
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
	  * @param {FetchAuditLogsParams} data The filter data
		* @returns {{logs: AuditLog[], total: number}} The list of logs and a total
	*/
	async fetchAll(data: FetchAuditLogsParams): Promise<{logs: AuditLog[], total: number}> {
		try {
			const [logs, total] = await Promise.all([
				client.auditLog.findMany({
					where: {
						userId: skipUndefined(data.userId),
						eventId: skipUndefined(data.eventName),
					},
					orderBy: {
						createdAt: data.sortOrder ?? 'desc',
					},
					take: 20,
					skip: data.page ? data.page * 20 : 0,
				}),
				client.auditLog.count({
					where: {
						userId: skipUndefined(data.userId),
						eventId: skipUndefined(data.eventName),
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
	*/
	async fetchCountByResourceType() {
		const rows = await client.$queryRaw<{ resourceType: AuditLogResourceType; count: bigint }[]>`
			SELECT
					n.resourceType,
					COUNT(l.id) AS count
			FROM AuditLogNames n
			LEFT JOIN AuditLog l ON l.eventId = n.name
			GROUP BY n.resourceType
    `;

		return Object.fromEntries(rows.map(({ resourceType, count }) => [resourceType, Number(count)])) as Record<AuditLogResourceType, number>;
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
					targetUrl: skipUndefined(data.targetUrl),
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
					targetUrl: skipUndefined(data.targetUrl),
					enabled: skipUndefined(data.enabled),
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
		* @param {Date} oldDate The old date.
		* @param {Date} newDate The new date.
	*/
	async fetchActivityByResourceTypeBetweenTwoDates(oldDate: Date, newDate: Date) {
		const rows = await client.$queryRaw<{ resourceType: AuditLogResourceType; count: bigint }[]>`
			SELECT
				n.resourceType,
				COUNT(l.id) AS count
			FROM AuditLogNames n
			LEFT JOIN AuditLog l
				ON l.eventId = n.name
				AND l.createdAt >= ${oldDate}
				AND l.createdAt <= ${newDate}
			GROUP BY n.resourceType
    `;

		const counts = Object.fromEntries(Object.values(AuditLogResourceType).map((resourceType) => [resourceType, 0])) as Record<AuditLogResourceType, number>;
		for (const { resourceType, count } of rows) counts[resourceType] = Number(count);
		return counts;
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
