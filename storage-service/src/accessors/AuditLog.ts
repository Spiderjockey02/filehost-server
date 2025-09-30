import { AuditLogEventType, AuditLogResourceType } from '@prisma/client';
import { parseIP, parseUserAgent } from '../utils';
import client from './prisma';

interface CreateAuditLogEntryParams {
  eventType: AuditLogEventType;
  message?: string;
  resourceType: AuditLogResourceType;
	resourceId?: string
  success: boolean;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export async function createAuditLogEntry(params: CreateAuditLogEntryParams) {
	const ip = params.ip ? parseIP(params.ip) : undefined;
	const userAgent = params.userAgent ? parseUserAgent(params.userAgent) : undefined;

	return client.auditLog.create({
		data: {
			eventType: params.eventType,
			message: params.message,
			resourceType: params.resourceType,
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
			UserAgentCon: params.userAgent ? {
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
	});
}