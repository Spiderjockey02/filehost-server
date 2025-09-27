import { AuditLogEventType, AuditLogResourceType } from '@prisma/client';
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
				connect: {
					ip: params.ip,
				},
			} : undefined,
			UserAgentCon: params.userAgent ? {
				connect: {
					agent: params.userAgent,
				},
			} : undefined,
		},
	});
}