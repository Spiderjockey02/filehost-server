import { HTTPMethod } from '@prisma/client';

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

export interface fetchActivity {
	userId?: string
	statusCode?: number
	method?: HTTPMethod
}