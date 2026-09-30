import { CHUNK_SIZE } from '@/middleware/parse-form';
import { FileType } from '@/types/generated/enums';
import { validatePage, validateString } from '.';
import { z } from 'zod';

export const validateFileId = z.object({
	fileId: validateString,
});

export const validateFileIds = z.object({
	fileIds: z
		.array(z.string(), {
			error: 'fileIds are missing from request',
		})
		.min(1, {
			error: 'fileIds are missing from request',
		}),
});

export const validateMoveFile = z.object({
	newDirId: validateString,
	fileId: validateString,
});

export const validateRenameFile = z.object({
	fileId: validateString,
	newName: validateString,
});

export const validateFileRenames = z.array(
	z.object({
		fileId: z.string(),
		newName: z.string(),
	}), {
		error: 'files are missing from request',
	},
).min(1, {
	error: 'files are missing from request',
});

export const validateCreateFolder = z.object({
	parentId: validateString,
	folderName: validateString,
});

export const validateSearchQuery = z.object({
	query: z
		.string()
		.trim()
		.min(1, 'Query is missing from request'),
	page: validatePage,
	fileType: z
		.preprocess((value) => {
			if (value === undefined) return undefined;

			const type = [undefined, FileType.FILE, FileType.DIRECTORY][Number(value)];
			return type;
		}, z.nativeEnum(FileType).optional()),
});

export const validateChunkMetadata = z.object({
	fingerprint: z.string().min(1).max(256),
	chunkIndex: z.number().int().nonnegative(),
	totalChunks: z.number().int().positive(),
	totalSize: z.number().int().positive(),
	chunkSize: z.literal(CHUNK_SIZE),
}).superRefine((metadata, ctx) => {
	if (metadata.chunkIndex >= metadata.totalChunks) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['chunkIndex'],
			message: 'Invalid chunk index',
		});
	}

	if (metadata.totalChunks !== Math.ceil(metadata.totalSize / metadata.chunkSize)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['totalChunks'],
			message: 'Invalid total chunk count',
		});
	}
});