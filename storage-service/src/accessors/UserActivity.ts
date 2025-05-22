import { HTTPMethod } from '@prisma/client';
import client from './prisma';

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
	return client.userActivity.create({
		data: {
			methodType: {
				connectOrCreate: {
					where: {
						method: data.method,
					},
					create: {
						method: data.method,
					},
				},
			},
			responseCode: {
				connectOrCreate:{
					where: {
						code: data.statusCode,
					},
					create: {
						code: data.statusCode,
					},
				},
			},
			endpoint: data.endpoint,
			incomingBytes: data.incomingBytes,
			outgoingBytes: data.outgoingBytes,
			ipAddress: data.ipAddress,
			userAgent: data.userAgent,
			durationMs: data.durationMs,
			user: data.userId == undefined ? undefined : {
				connect: {
					id: data.userId,
				},
			},
		},
	});
}