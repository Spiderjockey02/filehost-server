import { Prisma } from '@prisma/client';

export interface GetUsers {
	group?: boolean
	recent?: boolean
	delete?: boolean
	analyse?: boolean
	name?: string
	sortOrder?: 'desc' | 'asc'
	sortBy?: 'createdAt' | 'lastActive' | 'uploadedFiles'
}

export type fetchUserbyParam = {
	email?: string
	id?: string
	force?: boolean
}

export interface updateUser {
	id: string
	email?: string
	totalStorageSize?: bigint
	updatedAt?: Date
}

export interface UserToGroupProps {
	userId: string
	groupId: string
}

export type FullUser = Prisma.UserGetPayload<{
  include: {
    group: true
		notifications: true
  }
}>

export type UserWithGroup = Prisma.UserGetPayload<{
  include: {
    group: true
  }
}>

export type storageDirection = 'DECRE' | 'INCRE' | 'SET'