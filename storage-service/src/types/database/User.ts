import { Prisma } from '@/types/generated/client';
import { Pagination } from '.';

export interface FetchUsers {
	name?: string | undefined
	sortOrder?: 'desc' | 'asc' | undefined
	sortBy?: 'createdAt' | 'lastActive' | 'uploadedFiles' | undefined
	storageId?: string | undefined
}

export interface FetchUserbyParam {
	email?: string
	id?: string
	force?: boolean
}

export interface UpdateUserParams {
	id: string
	email?: string
	name?: string
	languageCode?: string
	totalStorageSize?: bigint
	updatedAt?: Date
	isMigrating?: boolean
	image?: string | null
}

export interface AddUserToPlanParams {
	userId: string
	planId: string
}

export type FullUser = Prisma.UserGetPayload<{
  include: {
		plan: true
		notifications: true
  }
}>

export type UserWithPlan = Prisma.UserGetPayload<{
  include: {
    plan: true
  }
}>

export type SetUserBanStatusParams = {
	userId: string
	issuedByUserId: string
	expiresAt: Date
	reason: string
}

export type FetchByStorageIdParams = {
	storageId: string
} & Pagination