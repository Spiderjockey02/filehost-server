import type { Request, Response } from 'express';

export type loggerTypes = 'log' | 'warn' | 'error' | 'debug' | 'ready'

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

export type customRequest = Request & { _startTime: number, _endTime: undefined | number }
export type customResponse = Response & { _startTime: number, _endTime: undefined | number }
