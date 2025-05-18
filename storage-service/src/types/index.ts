import type { Request, Response } from 'express';
import { User } from '@prisma/client';

// For logger
export type loggerTypes = 'log' | 'warn' | 'error' | 'debug' | 'ready'
export type customRequest = Request & { _startTime: number, _endTime: undefined | number }
export type customResponse = Response & { _startTime: number, _endTime: undefined | number }

// Prisma
export interface IdParam {
  id: string
}

export interface Session {
  user?: User
  expires?: Date
}


// Database backup metadata
export interface DatabaseMetadata {
  createdAt: string;
  filename: string;
  status: string
  sizeBytes: number | null;
  errorMessage: string | null;
  db: string;
}