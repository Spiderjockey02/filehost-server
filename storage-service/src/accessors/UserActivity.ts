import { IpAddress, UserAgent } from '@prisma/client';
import client from './prisma';
import { Pagination } from 'src/types/database/File';
import fs from 'fs';
import { AsnResponse, CityResponse, Reader } from 'mmdb-lib';
import { UAParser } from 'ua-parser-js';
import { LRUCache } from 'lru-cache';
import { fetchActivity, UserActivityInput } from 'src/types/database/UserActivity';
const db = fs.readFileSync('./assets/GeoLite2-City.mmdb');
const db2 = fs.readFileSync('./assets/GeoLite2-ASN.mmdb');

const cityReader = new Reader<CityResponse>(db);
const asnReader = new Reader<AsnResponse>(db2);


export default class UserActivityManager {
	ipCache: LRUCache<string, IpAddress>;
	userAgentCache: LRUCache<string, UserAgent>;
	private queue: UserActivityInput[] = [];
	private flushInterval: NodeJS.Timeout;

	constructor() {
		this.ipCache = new LRUCache({
			max: 100,
			ttl: 1000 * 60 * 60,
		});

		this.userAgentCache = new LRUCache({
			max: 100,
			ttl: 1000 * 60 * 60,
		});

		this.flushInterval = setInterval(() => this.flush(), 5_000);
	}

	public add(activity: UserActivityInput) {
		this.queue.push(activity);
	}

	private async flush() {
		if (this.queue.length === 0) return;

		const batch = [...this.queue];
		this.queue.length = 0;

		try {
			await this.createUserActivity(batch);
		} catch (err) {
			console.error('Failed to flush user activity batch:', err);
			this.queue.push(...batch);
		}
	}

	public stop() {
		clearInterval(this.flushInterval);
	}

	private async createUserActivity(dataList: UserActivityInput[]) {
		if (dataList.length === 0) return;

		// Ensure all IPs that were used in the user activity have been created on the database
		await this.createIpAddress(dataList.map(p => p.ipAddress).filter(s => s !== undefined));

		await this.createUserAgent(dataList.map(p => p.userAgent).filter(s => s !== undefined));

		// Create final batch
		const rows = dataList.map(entry => ({
			method: entry.method,
			statusCode: entry.statusCode,
			endpoint: entry.endpoint,
			incomingBytes: entry.incomingBytes,
			outgoingBytes: entry.outgoingBytes,
			ipAddress: entry.ipAddress ?? null,
			userAgent: entry.userAgent ?? null,
			userId: entry.userId ?? null,
			durationMs: entry.durationMs,
			createdAt: entry.createdAt,
		}));

		await client.userActivity.createMany({
			data: rows,
		});
	}

	private async createIpAddress(ips: string[]) {
		const ipDataMap = new Map<string, Omit<IpAddress, 'ip'>>();
		for (const ip of [...new Set(ips)]) {
			if (!ipDataMap.has(ip) && !this.ipCache.has(ip)) {
				const city = cityReader.get(ip);
				const asn = asnReader.get(ip);

				ipDataMap.set(ip, {
					country: city?.country?.names.en || '',
					city: city?.city?.names.en || '',
					latitude: city?.location?.latitude || 0,
					longitude: city?.location?.longitude || 0,
					isp: asn?.autonomous_system_organization || '',
					isVPN: false,
					isCrawler: false,
				});
			}
		}

		// Fetch existing IPs and filter out the missing IPS
		if (ipDataMap.size > 0) {
			const existingIps = await client.ipAddress.findMany({ where: { ip: { in: [...ipDataMap.keys()] } } });
			const missingIps = [...ipDataMap.keys()].filter(s => !existingIps.map(d => d.ip).includes(s));

			if (missingIps.length > 0) {
				await client.ipAddress.createMany({
					data: missingIps.map(ip => ({
						ip,
						...ipDataMap.get(ip)!,
					})),
					skipDuplicates: true,
				});

			}

			// Add IPs to cache
			for (const ip of existingIps) this.ipCache.set(ip.ip, ip);
		}
	}

	private async createUserAgent(agents: string[]) {
		const agentDataMap = new Map<string, Omit<UserAgent, 'agent'>>();
		for (const agent of [...new Set(agents)]) {
			if (!agentDataMap.has(agent) && !this.userAgentCache.has(agent)) {
				const parsed = new UAParser(agent);
				agentDataMap.set(agent, {
					browserName: parsed.getBrowser().name || '',
					browserVersion: parsed.getBrowser().version || '',
					osName: parsed.getOS().name || '',
					osVersion: parsed.getOS().version || '',
					isBot: false,
				});
			}
		}

		// Insert missing UserAgents
		if (agentDataMap.size > 0) {
			const existingAgents = await client.userAgent.findMany({ where: { agent: { in: [...agentDataMap.keys()] } } });
			const missingAgents = [...agentDataMap.keys()].filter(s => !existingAgents.map(d => d.agent).includes(s));

			if (missingAgents.length > 0) {
				await client.userAgent.createMany({
					data: missingAgents.map(agent => ({
						agent,
						...agentDataMap.get(agent)!,
					})),
					skipDuplicates: true,
				});
			}

			// Add user-agents to cache
			for (const agent of existingAgents) this.userAgentCache.set(agent.agent, agent);
		}
	}

	async getInboundOutboundBytes() {
		const result = await client.userActivity.aggregate({
			_sum: {
				incomingBytes: true,
				outgoingBytes: true,
			},
		});
		return result._sum;
	}

	async getHTTPMethods() {
		const result = await client.userActivity.groupBy({
			by: ['method'],
			_count: { method: true },
		});

		return result.map(r => ({
			method: r.method,
			_count: { history: r._count.method },
		}));
	}

	async getHTTPStatus() {
		const result = await client.userActivity.groupBy({
			by: ['statusCode'],
			_count: { statusCode: true },
		});

		return result.map(r => ({
			code: r.statusCode,
			_count: { history: r._count.statusCode },
		}));
	}

	async averageDuration() {
		const result = await client.userActivity.aggregate({
			_avg: {
				durationMs: true,
			},
		});
		return result._avg.durationMs;
	}

	async totalRequests({ userId, statusCode, method }: fetchActivity) {
		const result = await client.userActivity.count({
			where: {
				userId,
				statusCode,
				method,
			},
		});
		return result;
	}

	async fetchActivityBetweenTwoDates(oldDate: Date, newDate: Date) {
		return client.userActivity.count({
			where: {
				createdAt: {
					gte: oldDate,
					lte: newDate,
				},
			},
		});
	}

	async calculateTransferBetweenTwoDates(oldDate: Date, newDate: Date) {
		const result = await client.userActivity.aggregate({
			_sum: {
				incomingBytes: true,
				outgoingBytes: true,
			},
			where: {
				createdAt: {
					gte: oldDate,
					lte: newDate,
				},
			},
		});
		return result._sum;
	}

	async fetchActivity({ userId, statusCode, method, page = 0 }: fetchActivity & Pagination) {
		return client.userActivity.findMany({
			where: {
				userId,
				statusCode,
				method,
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: 20,
			skip: page * 20,
		});
	}

	async fetchUsersWhoHadActivityBetweenTwoDates(oldDate: Date, newDate: Date): Promise<string[]> {
		const activity = await client.userActivity.findMany({
			where: {
				createdAt: {
					gte: oldDate,
					lte: newDate,
				},
			},
		});

		const users = [...new Set(activity.map(s => s.userId).filter(s => s !== null))];
		return users;
	}
}