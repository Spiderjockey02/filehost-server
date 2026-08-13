import { validateInterval, validateOptionalString, validatePage, validateSortOrder, validateString } from '.';
import z from 'zod';

export const validateCacheName = z.enum(['users', 'files', 'history', 'sessions', 'mimetype', 'ips', 'userAgents'], {
	error: 'name must be one of users, files, history, sessions, mimetype, ips or userAgents.',
});

export const validateBackup = z.object({
	timestamp: z
		.string()
		.regex(/^(\d+)\.dump\.sql$/, {
			message: 'Timestamp is an invalid format.',
		})
		.transform(val => val.match(/^(\d+)\.dump\.sql$/)![1]),
});

export const validateAdminRecentlyUploaded = z.object({
	page: validatePage,
	userId: validateOptionalString,
});

export const validateFileGrowth = z.object({
	storageId: z.string().optional(),
	interval: validateInterval,
});

export const validateGrouped = z.object({
	grouped: z
		.string()
		.refine((val) => ['true', 'false'].includes(val), {
			message: 'grouped must be either true or false.',
		})
		.transform((val) => val === 'true')
		.optional(),
	type: validateOptionalString,
});

export const validateUserAgents = z.object({
	page: validatePage,
	sortOrder: validateSortOrder,
	sortBy: z.enum(['name', 'activity', 'logs'], {
		error: 'sortBy must be one of name, activity or logs.',
	}),
});

export const validateUpdateStorage = z.object({
	name: validateOptionalString,
	maxSize: z
		.number({
			error: 'maxSize must be a non-negative integer.',
		})
		.int({
			message: 'maxSize must be a non-negative integer.',
		})
		.nonnegative({
			message: 'maxSize must be a non-negative integer.',
		})
		.optional(),
	isPrivate: z
		.boolean({
			error: 'isPrivate must be a boolean.',
		})
		.optional(),
});

export const validateMigrateUser = z.object({
	storageId: validateString,
	userId: validateString,
});