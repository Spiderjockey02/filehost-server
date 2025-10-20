import { AuditLogEventType, AuditLogResourceType } from '@prisma/client';

export interface CreateAuditLogEntryParams {
  eventType: AuditLogEventType;
  message?: string;
  resourceType: AuditLogResourceType;
	resourceId?: string
  success: boolean;
  userId?: string;
  ip?: string;
  userAgent?: string;
}