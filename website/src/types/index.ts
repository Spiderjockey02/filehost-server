import { File, Plan } from '@prisma/client';
import type { Session, User } from 'better-auth';

export interface DatabaseBackup {
  createdAt: Date
  filename: string
  status: 'success' | 'failed'
  sizeBytes: number
  errorMessage: string | null
  db: string
}

export type AdminUser = {
  totalStorageSize: number
  plan: Plan | null
  sessions: Session[]
  files: File[]
  _count: {
    files: number
  }
} & User

export interface StringNumberObj {
  [key: string]: number
}

export type Config = {
  MAX_AVATAR_SIZE: number;
  MAX_CHARS_FILE_NAME: number;
  DISALLOWED_MIME_TYPES: string[];
  INVALID_CHARS_IN_FILE_NAME: string[];
  KEEP_ORIGINAL_METADATA: boolean;
  THUMBNAIL: {
    WIDTH: number;
    HEIGHT: number;
  };
  RETENTION_POLICY_IN_DAYS: {
    LOG_FILES: number;
    DATABASE_FILES: number;
    USER_ACTIVITY: number;
    AUDIT_LOGS: number;
  };
  FOLDER_SIZE: number;
  RATE_LIMIT: {
    CAPACITY: number
    REFILL_RATE: number
    ABUSE_THRESHOLD: number
    ABUSE_WINDOW: number
  }
};

export interface AccountProviders {
  id: string
  provider: string
}