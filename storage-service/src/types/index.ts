import type { Request, Response } from 'express';
import { User, File } from '@prisma/client';
import { Writable } from 'node:stream';

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

export interface StorageProvider {
  downloadFile(res: Response, file: File): Promise<void>;
  downloadFiles(res: Response, userId: string, files: File[]): Promise<void>;
  copyFileOnSystem(oldPath: string, newPath: string): Promise<void>;
  deleteFileOnSystem(filePath: string): Promise<void>;
  uploadFileToSystem(filePath: string): { stream: Writable, done: Promise<void> };
  writeFileToSystem(filePath: string, data: Buffer | string): Promise<void>;
  readFileFromSystem(file: File): Promise<Buffer>;
	readFileFromSystem(file: File, encoding?: BufferEncoding): Promise<string>;
  readFileFromSystem(file: File, encoding?: BufferEncoding): Promise<string | Buffer>;
  sendFile(res: Response, file: File, range?: string): Promise<void>;
  getFileSystemStatistics(): storageMediumSize;
  verifyConnection(): Promise<boolean>
  checkFileExists(path: string): Promise<boolean>
}

export interface storageMediumSize {
  free: number
  total: number
}
