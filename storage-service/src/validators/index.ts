import MIMEList from '../../assets/MIME-list.json';
import { AuditLogEventName } from '@prisma/client';
import { z } from 'zod';

export const validatePage = z
	.string()
	.regex(/^\d+$/, { message: 'page must be a positive number.' })
	.transform(Number)
	.refine((n) => n >= 0, { message: 'page must be a positive number.' })
	.optional();

export const validateGrouped = z.object({
	grouped: z
		.string()
		.refine((val) => ['true', 'false'].includes(val), {
			message: 'grouped must be either true or false.',
		})
		.transform((val) => val === 'true')
		.optional(),
	type: z.string().optional(),
});


export const validateFrame = z.enum(['yearly', 'monthly', 'daily', 'hourly'], {
	message: 'frame must be one of the following: yearly, monthly, daily or hourly',
});

export const validateFileGrowth = z.object({
	storageId: z.string().optional(),
	frame: validateFrame,
});

export const validateAdminLogs = z.object({
	userId: z.string().optional(),
	page: validatePage,
	eventName: z
		.string()
		.refine((val) => Object.keys(AuditLogEventName).includes(val), {
			message: 'eventName is invalid',
		})
		.optional(),
	sortOrder: z
		.enum(['asc', 'desc'], {
			message: 'sortOrder is invalid',
		})
		.optional(),
});

export const validateLogListener = z
	.object({
		type: z.enum(['WEBHOOK', 'NOTIFICATION'], {
			message: 'Invalid listener type provided.',
		}),
		events: z
			.array(z.string(), {
				message: 'Invalid events provided.',
			})
			.nonempty({ message: 'Invalid events provided.' }),
		name: z.string().min(1, { message: 'Invalid name provided.' }),
		targetUrl: z
			.string()
			.optional(),
		enabled: z
			.boolean()
			.optional(),
	})
	.superRefine((data, ctx) => {
		if (data.type == 'WEBHOOK' && data.targetUrl?.trim() == '') {
			ctx.addIssue({
				path: ['targetUrl'],
				code: 'custom',
				message: 'Invalid targetUrl provided.',
			});
		}
	});

export const validateStorage = z
	.object({
		type: z.enum(['S3', 'FILE_SYSTEM', 'SFTP'], {
			message: 'type is required and must be one of: S3, FILE_SYSTEM, SFTP.',
		}),
		name: z
			.string()
			.min(1, { message: 'name is required and must be a non-empty string.' }),
		basePath: z
			.string()
			.min(1, { message: 'basePath is required and must be a non-empty string.' }),
		location: z.string().optional(),
		endpoint: z.string().optional(),
		maxSize: z
			.preprocess((val) => {
				if (val === undefined || val === null || val === '') return undefined;
				const num = Number(val);
				return isNaN(num) ? undefined : num;
			}, z.number().int().nonnegative().optional())
			.refine((val) => val === undefined || Number.isInteger(val), {
				message: 'maxSize must be a non-negative integer if provided.',
			}),
		isPrivate: z.boolean().optional(),
	})
	.refine(
		(data) => typeof data.name === 'string' && data.name.trim().length > 0,
		{ message: 'name is required and must be a non-empty string.', path: ['name'] },
	)
	.refine(
		(data) => typeof data.basePath === 'string' && data.basePath.trim().length > 0,
		{ message: 'basePath is required and must be a non-empty string.', path: ['basePath'] },
	);

export const validateCRONSchedule = z
	.string()
	.min(1, { message: 'Schedule is required.' })
	.regex(/^[0-9\-\*\/, ]+$/, { message: 'Schedule must be a valid CRON expression.' });

export const validateNotification = z.object({
	text: z
		.string()
		.min(1, { message: 'text must be a string with at least 1 character.' }),
	title: z
		.string()
		.min(1, { message: 'title must be a string with at least 1 character.' }),
	url: z
		.string()
		.startsWith('/', { message: 'url must start with /.' })
		.optional(),
	userId: z
		.string()
		.min(1, { message: 'userId must be a string with at least 1 character.' }),
});

export const validateConfig = z.object({
	MAX_AVATAR_SIZE: z
		.number()
		.min(1, { message: 'MAX_AVATAR_SIZE must be a valid number greater than or equal to 1.' }),
	MAX_CHARS_FILE_NAME: z
		.number()
		.min(1, { message: 'MAX_CHARS_FILE_NAME must be a valid number greater than or equal to 1.' }),
	DISALLOWED_MIME_TYPES: z
		.array(
			z.string().refine(m => MIMEList.includes(m), {
				message: 'Each value in DISALLOWED_MIME_TYPES must be a valid mime type.',
			}),
		)
		.refine(arr => Array.isArray(arr), {
			message: 'DISALLOWED_MIME_TYPES must be an array of strings.',
		}),
	INVALID_CHARS_IN_FILE_NAME: z.array(
		z.string({ message: 'INVALID_CHARS_IN_FILE_NAME must be an array of strings.' }),
	),
	KEEP_ORIGINAL_METADATA: z.boolean({
		message: 'KEEP_ORIGINAL_METADATA must be a boolean.',
	}),
	THUMBNAIL: z
		.object({
			WIDTH: z
				.number()
				.min(1, { message: 'THUMBNAIL.WIDTH must be a valid number greater than or equal to 1.' }),
			HEIGHT: z
				.number()
				.min(1, { message: 'THUMBNAIL.HEIGHT must be a valid number greater than or equal to 1.' }),
		})
		.strict()
		.refine(obj => typeof obj === 'object' && obj !== null, {
			message: 'THUMBNAIL must be an object.',
		}),
	RETENTION_POLICY_IN_DAYS: z
		.object({
			LOG_FILES: z.number().min(0, { message: 'RETENTION_POLICY_IN_DAYS.LOG_FILES must be >= 0.' }),
			DATABASE_FILES: z.number().min(0, { message: 'RETENTION_POLICY_IN_DAYS.DATABASE_FILES must be >= 0.' }),
			USER_ACTIVITY: z.number().min(0, { message: 'RETENTION_POLICY_IN_DAYS.USER_ACTIVITY must be >= 0.' }),
			AUDIT_LOGS: z.number().min(0, { message: 'RETENTION_POLICY_IN_DAYS.AUDIT_LOGS must be >= 0.' }),
		})
		.strict()
		.refine(obj => typeof obj === 'object' && obj !== null, {
			message: 'RETENTION_POLICY_IN_DAYS must be an object.',
		}),
	FOLDER_SIZE: z
		.number()
		.min(1, { message: 'FOLDER_SIZE must be a valid number greater than or equal to 1.' }),
	RATE_LIMIT: z
		.object({
			CAPACITY: z.number().min(1, { message: 'RATE_LIMIT.CAPACITY must be >= 1.' }),
			REFILL_RATE: z.number().min(1, { message: 'RATE_LIMIT.REFILL_RATE must be >= 1.' }),
			ABUSE_THRESHOLD: z.number().min(1, { message: 'RATE_LIMIT.ABUSE_THRESHOLD must be >= 1.' }),
			ABUSE_WINDOW: z.number().min(1, { message: 'RATE_LIMIT.ABUSE_WINDOW must be >= 1.' }),
		})
		.strict()
		.refine(obj => typeof obj === 'object' && obj !== null, {
			message: 'RATE_LIMIT must be an object.',
		}),
});

export const validateUser = z
	.object({
		page: validatePage,
		include: z
			.union([
				z.string(),
				z.array(z.string()),
			])
			.optional(),
		name: z.string().optional(),
		sortBy: z
			.enum(['createdAt', 'lastActive', 'uploadedFiles'])
			.optional(),
		sortOrder: z
			.enum(['asc', 'desc'])
			.optional(),
		storageId: z.string().optional(),
	});

export const validateBan = z.object({
	expiresAt: z
		.string()
		.transform((val, ctx) => {
			const date = new Date(val);
			if (isNaN(date.getTime())) {
				ctx.addIssue({
					code: 'custom',
					message: 'expiresAt must be a valid date.',
				});
				return z.NEVER;
			}
			if (date <= new Date()) {
				ctx.addIssue({
					code: 'custom',
					message: 'expiresAt must be a future date.',
				});
				return z.NEVER;
			}
			return date;
		}),
	reason: z
		.string()
		.trim()
		.min(1, { message: 'reason must be a non-empty string.' }),
});

export const validateBackup = z.object({
	timestamp: z
		.string()
		.regex(/^(\d+)\.dump\.sql$/, {
			message: 'Timestamp is an invalid format.',
		})
		.transform(val => val.match(/^(\d+)\.dump\.sql$/)![1]),
});

export const createPlanSchema = z.object({
	name: z
		.string({ message: 'Plan name is required.' })
		.min(1, { message: 'Plan name cannot be empty.' }),
	maxStorageSize: z
		.union([
			z.number(),
			z.string().regex(/^\d+$/, 'maxStorageSize must be a valid number').transform(Number),
		])
		.optional()
		.refine((val) => val === undefined || val >= 0, { message: 'maxStorageSize must be non-negative.' }),
	maxFileSize: z
		.union([
			z.number(),
			z.string().regex(/^\d+$/, 'maxFileSize must be a valid number').transform(Number),
		])
		.optional()
		.refine((val) => val === undefined || val >= 0, { message: 'maxFileSize must be non-negative.' }),
	deletedFileRetentionDays: z
		.union([
			z.number(),
			z.string().regex(/^\d+$/, 'deletedFileRetentionDays must be a valid number').transform(Number),
		])
		.optional()
		.refine((val) => val === undefined || val >= 0, { message: 'deletedFileRetentionDays must be non-negative.' }),
	price: z
		.union([
			z.number(),
			z.string().regex(/^\d+(\.\d+)?$/, 'price must be a valid number').transform(Number),
		])
		.optional()
		.refine((val) => val === undefined || val >= 0, { message: 'price must be non-negative.' }),
	priceId: z
		.string()
		.regex(/^price_.+$/, { message: 'priceId must start with "price_".' })
		.optional(),
	isDefault: z.boolean().optional(),
});
