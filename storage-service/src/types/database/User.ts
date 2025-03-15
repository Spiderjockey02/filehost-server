import { Prisma } from '@prisma/client';

export interface GetUsers {
	group?: boolean
	recent?: boolean
	delete?: boolean
	analyse?: boolean
}

export type fetchUserbyParam = {
	email?: string
	id?: string
}

export interface updateUser {
	id: string
	email?: string
	totalStorageSize?: bigint
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
