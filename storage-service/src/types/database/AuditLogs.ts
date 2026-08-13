import type { AuditLogEventName, AuditLogResourceType, ListenerType } from '@/types/generated/client';
import { Prisma } from '@/types/generated/client';
import { Pagination } from '.';

export interface CreateAuditLogEntryParams {
  eventName: AuditLogEventName;
  message?: string;
  resourceType: AuditLogResourceType;
	resourceId?: string | undefined
  success: boolean;
  userId?: string | undefined;
  ip?: string;
  userAgent?: string | undefined;
}

export interface AddAuditLogListenerParams {
  userId: string;
  type: ListenerType
  eventNames: AuditLogEventName[];
  name: string
  targetUrl?: string | undefined
}

export type UpdateAuditLogListenerParams = {
  id: string
  enabled: boolean | undefined
} & AddAuditLogListenerParams

export interface FetchAuditLogsParams extends Pagination {
  userId?: string | undefined
  eventName?: AuditLogEventName | undefined
  sortOrder?: Prisma.SortOrder | undefined
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
