import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

// Files
export type fileType = 'file' | 'directory'
export type fileItem = {
  path: string
  name: string
  size: number
  extension: string
  type: fileType
  modified: number
  children: fileItem[]
  url: string
}

export type dirCache = { [key: string]: fileItem | null }

// For logger
export type loggerTypes = 'log' | 'warn' | 'error' | 'debug' | 'ready'
export type customRequest = Request & { _startTime: number, _endTime: undefined | number }
export type customResponse = Response & { _startTime: number, _endTime: undefined | number }

// Prisma
export interface IdParam {
  id: string
}

const User = Prisma.validator<Prisma.UserDefaultArgs>()({
	include: { recentFiles: true, group: true, Notifications: true },
});

export type User = Prisma.UserGetPayload<typeof User>

export interface Session {
  user?: User
  expires?: Date
}
