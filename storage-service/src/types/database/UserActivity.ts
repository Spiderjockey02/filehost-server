import { HTTPMethod } from '@prisma/client';

export type UserActivityInput = {
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

export interface fetchActivity {
	userId?: string
	statusCode?: number
	method?: HTTPMethod
}