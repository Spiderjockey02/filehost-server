import { HTTPMethod } from '@prisma/client';
import client from './prisma';
import { Pagination } from 'src/types/database/File';
import fs from 'fs';
import { AsnResponse, CityResponse, Reader } from 'mmdb-lib';
import { UAParser } from 'ua-parser-js';
const db = fs.readFileSync('./assets/GeoLite2-City.mmdb');
const db2 = fs.readFileSync('./assets/GeoLite2-ASN.mmdb');

const cityReader = new Reader<CityResponse>(db);
const asnReader = new Reader<AsnResponse>(db2);


type UserActivityInput = {
	userId?: string;
	method: HTTPMethod;
	endpoint: string;
	statusCode: number;
	incomingBytes: number;
	outgoingBytes: number;
	ipAddress?: string;
	userAgent?: string;
	durationMs: number;
	createdAt: Date;
};

export class UserActivityBatcher {
	private buffer: UserActivityInput[] = [];
	private flushInterval: NodeJS.Timeout;

	constructor() {
		this.flushInterval = setInterval(() => this.flush(), 5_000);
	}

	public add(activity: UserActivityInput) {
		this.buffer.push(activity);
	}

	private async flush() {
		if (this.buffer.length === 0) return;

		const batch = [...this.buffer];
		this.buffer.length = 0;

		try {
			await createUserActivity(batch);
		} catch (err) {
			console.error('Failed to flush user activity batch:', err);
			this.buffer.push(...batch);
		}
	}

	public stop() {
		clearInterval(this.flushInterval);
	}
}

export async function createUserActivity(dataList: UserActivityInput[]) {
	if (dataList.length === 0) return;

	const ipDataMap = new Map<string, {
		country: string;
		city: string;
		latitude: number;
		longitude: number;
		isp: string;
		isVPN: boolean;
		isCrawler: boolean;
	}>();

	const agentDataMap = new Map<string, {
		browserName: string;
		browserVersion: string;
		osName: string;
		osVersion: string;
	}>();

	for (const entry of dataList) {
		if (entry.ipAddress && !ipDataMap.has(entry.ipAddress)) {
			const city = cityReader.get(entry.ipAddress);
			const asn = asnReader.get(entry.ipAddress);

			ipDataMap.set(entry.ipAddress, {
				country: city?.country?.names.en || '',
				city: city?.city?.names.en || '',
				latitude: city?.location?.latitude || 0,
				longitude: city?.location?.longitude || 0,
				isp: asn?.autonomous_system_organization || '',
				isVPN: false,
				isCrawler: false,
			});
		}

		if (entry.userAgent && !agentDataMap.has(entry.userAgent)) {
			const parsed = new UAParser(entry.userAgent);
			agentDataMap.set(entry.userAgent, {
				browserName: parsed.getBrowser().name || '',
				browserVersion: parsed.getBrowser().version || '',
				osName: parsed.getOS().name || '',
				osVersion: parsed.getOS().version || '',
			});
		}
	}

	const uniqueIps = [...ipDataMap.keys()];
	const uniqueAgents = [...agentDataMap.keys()];

	// Insert missing IPs
	if (uniqueIps.length > 0) {
		const existingIps = await client.ipAddress.findMany({ where: { ip: { in: uniqueIps } } });
		const existingIpSet = new Set(existingIps.map(ip => ip.ip));

		const missingIps = uniqueIps.filter(ip => !existingIpSet.has(ip));
		if (missingIps.length > 0) {
			await client.ipAddress.createMany({
				data: missingIps.map(ip => ({
					ip,
					...ipDataMap.get(ip)!,
				})),
				skipDuplicates: true,
			});
		}
	}

	// Insert missing UserAgents
	if (uniqueAgents.length > 0) {
		const existingAgents = await client.userAgent.findMany({ where: { agent: { in: uniqueAgents } } });
		const existingAgentSet = new Set(existingAgents.map(agent => agent.agent));

		const missingAgents = uniqueAgents.filter(agent => !existingAgentSet.has(agent));
		if (missingAgents.length > 0) {
			await client.userAgent.createMany({
				data: missingAgents.map(agent => ({
					agent,
					...agentDataMap.get(agent)!,
				})),
				skipDuplicates: true,
			});
		}
	}

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

export async function getInboundOutboundBytes() {
	const result = await client.userActivity.aggregate({
		_sum: {
			incomingBytes: true,
			outgoingBytes: true,
		},
	});
	return result._sum;
}

export async function getHTTPMethods() {
	const result = await client.userActivity.groupBy({
		by: ['method'],
		_count: { method: true },
	});

	return result.map(r => ({
		method: r.method,
		_count: { history: r._count.method },
	}));
}

export async function getHTTPStatus() {
	const result = await client.userActivity.groupBy({
		by: ['statusCode'],
		_count: { statusCode: true },
	});

	return result.map(r => ({
		code: r.statusCode,
		_count: { history: r._count.statusCode },
	}));
}

export async function averageDuration() {
	const result = await client.userActivity.aggregate({
		_avg: {
			durationMs: true,
		},
	});
	return result._avg.durationMs;
}

export async function totalRequests(userId?: string) {
	const result = await client.userActivity.count({
		where: {
			userId,
		},
	});
	return result;
}

export async function fetchActivityBetweenTwoDates(oldDate: Date, newDate: Date) {
	return client.userActivity.count({
		where: {
			createdAt: {
				gte: oldDate,
				lte: newDate,
			},
		},
	});
}

export async function calculateTransferBetweenTwoDates(oldDate: Date, newDate: Date) {
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

export async function fetchActivity({ page = 0, userId }: Pagination & { userId?: string }) {
	return client.userActivity.findMany({
		where: {
			userId,
		},
		orderBy: {
			createdAt: 'desc',
		},
		take: 20,
		skip: page * 20,
	});
}

export async function fetchUsersWhoHadActivityBetweenTwoDates(oldDate: Date, newDate: Date): Promise<string[]> {
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