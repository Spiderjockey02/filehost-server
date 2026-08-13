import { type HTTPMethod, Prisma } from '@/types/generated/client';
import { Pagination } from '.';

export interface UserActivityInput {
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

export interface FetchTotalParams {
	userId?: string | undefined
	statusCode?: number | undefined
	method?: HTTPMethod | undefined
}

export type FetchActivityParams = FetchTotalParams & Pagination

export interface NetworkFilter {
	userId?: string
	storageId?: string
}

export interface FetchUserAgentsParams extends Pagination {
	sortBy: 'name' | 'activity' | 'logs'
	sortOrder?: Prisma.SortOrder | undefined
}