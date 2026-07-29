import { type HTTPMethod, Prisma } from '@/types/generated/client';
import type { Pagination } from './File';

export type UserActivityInput = {
	userId: string | null;
	method: HTTPMethod;
	endpoint: string;
	statusCode: number;
	incomingBytes: number;
	outgoingBytes: number;
	ipAddress: string | null;
	userAgent: string | null;
	durationMs: number;
	createdAt: Date;
};

export interface fetchTotalParams {
	userId?: string
	statusCode?: number
	method?: HTTPMethod
}

export type fetchActivityParams = fetchTotalParams & Pagination

export interface NetworkFilter {
	userId?: string
	storageId?: string
}

export interface fetchUserAgentsParams {
	sortBy: 'name' | 'activity' | 'logs'
	sortOrder: Prisma.SortOrder
	page: number
}