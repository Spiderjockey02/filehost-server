import { Prisma } from '@prisma/client';
import { Pagination } from './File';

export interface GetUsers {
	name?: string
	sortOrder?: 'desc' | 'asc'
	sortBy?: 'createdAt' | 'lastActive' | 'uploadedFiles'
	storageId?: string
}

export type fetchUserbyParam = {
	email?: string
	id?: string
	force?: boolean
}

export interface updateUser {
	id: string
	email?: string
	name?: string
	languageCode?: string
	totalStorageSize?: bigint
	updatedAt?: Date
	isMigrating?: boolean
	image?: string | null
}

export type AddToPlanProps = {
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

export type storageDirection = 'DECRE' | 'INCRE' | 'SET'

export type setUserBan = {
	userId: string
	issuedByUserId: string
	expiresAt: Date
	reason: string
}

export type fetchByStorageIdParams = {
	storageId: string
} & Pagination