import type { Request, Response } from 'express';

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

// For logger
export type loggerTypes = 'log' | 'warn' | 'error' | 'debug' | 'ready'
export type customRequest = Request & { _startTime: number, _endTime: undefined | number }
export type customResponse = Response & { _startTime: number, _endTime: undefined | number }

// Prisma
export interface IdParam {
  id: string
}
