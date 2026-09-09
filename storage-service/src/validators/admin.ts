import { CronJobNames } from '@/types/generated/enums';
import z from 'zod';

export const validateCacheName = z.enum(['users', 'files', 'history', 'sessions', 'mimetype', 'ips', 'userAgents'], {
	error: 'name must be one of users, files, history, sessions, mimetype, ips or userAgents.',
});

export const validateCronJobName = z.object({
	name: z.enum(CronJobNames, {
		error: 'Invalid cron job name.',
	}),
});

export const validateCRONSchedule = z.object({
	schedule: z
		.string()
		.min(1, { message: 'Schedule is required.' })
		.regex(/^[0-9\-\*\/, ]+$/, { message: 'Schedule must be a valid CRON expression.' }),
});