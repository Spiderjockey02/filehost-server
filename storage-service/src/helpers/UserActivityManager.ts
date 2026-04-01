import type { UserActivityInput } from '@/types/database/UserActivity';
import type { IpAddress, UserAgent } from '@/types/generated/client';
import client, { UserActivityAccessor } from '@/accessors';
import { parseIP, parseUserAgent } from '@/utils';
import { LRUCache } from 'lru-cache';

export default class UserActivityManager extends UserActivityAccessor {
	ipCache: LRUCache<string, IpAddress>;
	userAgentCache: LRUCache<string, UserAgent>;
	private queue: UserActivityInput[] = [];

	constructor() {
		super();
		this.ipCache = new LRUCache({
			max: 100,
			ttl: 1000 * 60 * 60,
		});

		this.userAgentCache = new LRUCache({
			max: 100,
			ttl: 1000 * 60 * 60,
		});

		setInterval(() => this.flush(), 5_000);
	}

	/**
	  * Add activity to the queue for chunked pushing to database
		* @param {UserActivityInput} activity
	*/
	add(activity: UserActivityInput) {
		this.queue.push(activity);
	}

	/**
	  * Flushes the entire queue for pushing to database
	*/
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

	/**
	  * Create the user activity
		* @param {UserActivityInput[]} dataList the list of user activity
	*/
	private async createUserActivity(dataList: UserActivityInput[]) {
		if (dataList.length === 0) return;

		// Ensure all IPs that were used in the user activity have been created on the database
		await this.createIpAddress(dataList.map(p => p.ipAddress).filter(s => s !== null));

		await this.createUserAgent(dataList.map(p => p.userAgent).filter(s => s !== null));

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

		await this.createMany(rows);
	}

	/**
	  * Push array of IPs to database
		* @param {string[]} ips This list of IPS
	*/
	private async createIpAddress(ips: string[]) {
		const ipDataMap = new Map<string, Omit<IpAddress, 'ip'>>();
		for (const ip of [...new Set(ips)]) {
			if (!ipDataMap.has(ip) && !this.ipCache.has(ip)) {
				ipDataMap.set(ip, parseIP(ip));
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

	/**
	  * Push array of user-agents to database
		* @param {string[]} agents This list of user-agents
	*/
	private async createUserAgent(agents: string[]) {
		const agentDataMap = new Map<string, Omit<UserAgent, 'agent'>>();
		for (const agent of [...new Set(agents)]) {
			if (!agentDataMap.has(agent) && !this.userAgentCache.has(agent)) {
				agentDataMap.set(agent, parseUserAgent(agent));
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
}