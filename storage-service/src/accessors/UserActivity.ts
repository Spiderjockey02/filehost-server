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


interface CreateUserActivity {
	method: HTTPMethod
  endpoint: string
  statusCode: number
  incomingBytes: number
  outgoingBytes: number
  ipAddress?: string
  userAgent?: string
  durationMs: number
  userId?: string
}

export async function createUserActivity(data: CreateUserActivity) {
	// Get metadata from the IP address and user agent
	const city = cityReader.get(`${data.ipAddress}`);
	const asn = asnReader.get(`${data.ipAddress}`);
	const parsedUserAgent = new UAParser(data.userAgent);

	return client.userActivity.create({
		data: {
			method: data.method,
			statusCode: data.statusCode,
			endpoint: data.endpoint,
			incomingBytes: data.incomingBytes,
			outgoingBytes: data.outgoingBytes,
			ipCon: data.ipAddress == undefined ? undefined : {
				connectOrCreate: {
					where: {
						ip: data.ipAddress,
					},
					create: {
						ip: data.ipAddress,
						country: city?.country?.names.en || '',
						city : city?.city?.names.en || '',
						latitude: city?.location?.latitude || 0,
						longitude: city?.location?.longitude || 0,
						isp: asn?.autonomous_system_organization,
						isVPN: false,
						isCrawler: false,
					},
				},
			},
			UserAgentCon: data.userAgent == undefined ? undefined : {
				connectOrCreate: {
					where: {
						agent: data.userAgent,
					},
					create: {
						agent: data.userAgent,
						browserName: parsedUserAgent.getBrowser().name || '',
						browserVersion: parsedUserAgent.getBrowser().version || '',
						osName: parsedUserAgent.getOS().name || '',
						osVersion: parsedUserAgent.getOS().version || '',
					},
				},
			},
			durationMs: data.durationMs,
			user: data.userId == undefined ? undefined : {
				connect: {
					id: data.userId,
				},
			},
		},
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