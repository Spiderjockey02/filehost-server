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

export type NestedPaths<T, Prev extends string = ''> = {
  [K in keyof T & string]: T[K] extends object
    ? `${Prev}${K}` | NestedPaths<T[K], `${Prev}${K}.`>
    : `${Prev}${K}`;
}[keyof T & string];

export type NestedValue<T, Path extends string> =
  Path extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
      ? NestedValue<T[Key], Rest>
      : never
    : Path extends keyof T
      ? T[Path]
      : never;

export interface StorageProvider {
  isOnline: boolean

  /**
    * Download a single file
    * @param {Response} res The response to pipe the file to, for downloading
    * @param {File} file The file to find on the system to pipe back
  */
  downloadFile(res: Response, file: File): Promise<void>;

  /**
    * Download a list of files
    * @param {Response} res The response to pipe the file to, for downloading
    * @param {File[]} files The files to find on the system to pipe back
  */
  downloadFiles(res: Response, files: File[]): Promise<void>;

  /**
    * Copy a file
    * @param {string} oldPath The file path of the file being copied
    * @param {string} newPath The file path where the new file will be
  */
  copyFile(oldPath: string, newPath: string): Promise<void>;

  /**
    * Delete a file
    * @param {string} filePath The file path of the file being deleted
  */
  deleteFile(filePath: string): Promise<void>;

  /**
    * Upload a file
    * @param {string} filePath The file path where the file will be uploaded to
    * @returns {{ stream: Writable, done: Promise<void> }}
  */
  uploadFile(filePath: string): { stream: Writable, done: Promise<void> };

  /**
    * Write a file
    * @param {string} filePath The file path where the file will be written to
    * @param {Buffer | string} data The data of the file
  */
  writeFile(filePath: string, data: Buffer | string): Promise<void>;

	/**
	  * Read a file
	  * @param {File} file The file being read
		* @return {Buffer} The data read from the file.
	*/
  readFile(file: File): Promise<Buffer>;

	/**
	  * Read a file
	  * @param {File} file The file being read
    * @param {BufferEncoding?} encoding The type of encoding to read the file
		* @return {string} The data read from the file.
	*/
	readFile(file: File, encoding?: BufferEncoding): Promise<string>;

  /**
	  * Send a file to the user.
	  * @param {Response} res The response to pipe the file to, for downloading
		* @param {File} file The file to send.
		* @param {string} [range] The range of the file to send.
	*/
  sendFile(res: Response, file: File, range?: string): Promise<void>;

  /**
    * Check if a file exists on the storage medium
    * @param {string} path the file path
    * @returns {boolean} If it found a file or not
  */
  checkFileExists(path: string): Promise<boolean>

  /**
    * Verify the connection to a storage medium
    * @returns {boolean} If it connected successfully or not
  */
  verifyConnection(): Promise<boolean>
}