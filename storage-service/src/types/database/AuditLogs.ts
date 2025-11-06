import { Prisma } from '@prisma/client';
import { AuditLogEventName, AuditLogResourceType, ListenerType } from '@prisma/client';

export interface CreateAuditLogEntryParams {
  eventName: AuditLogEventName;
  message?: string;
  resourceType: AuditLogResourceType;
	resourceId?: string
  success: boolean;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export interface AddAuditLogListenerParams {
  userId: string;
  type: ListenerType
  eventNames: AuditLogEventName[];
  name: string
  targetUrl?: string
}

export type UpdateAuditLogListenerParams = {
  id: string
  enabled?: boolean
} & AddAuditLogListenerParams

export interface fetchAuditLogsParams {
  page?: number;
  userId?: string;
  eventName?: AuditLogEventName
  sortOrder?: Prisma.SortOrder
}

export type FullAuditLogListener = Prisma.AuditLogListenerGetPayload<{
  include: {
    events: true
  }
}>

export type FullAuditLog = Prisma.AuditLogGetPayload<{
  include: {
    user: true
    event: true
  }
}>
