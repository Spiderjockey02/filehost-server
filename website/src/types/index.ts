import { File, Group } from '@prisma/client';
import type { Session, User } from 'better-auth';

export type LoginErrorTypes = {
  type: | 'email' | 'password' | 'misc'
  message: string
}

export type RegisterErrorTypes = {
  type: 'username' | 'email' | 'password' | 'age' | 'misc'
  message: string
}

export interface SettingErrorTypes {
	type: 'current' | 'pwd1' | 'pwd2' | 'misc' | 'av' | 'email'
	text: string
}

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
  group: Group | null
  sessions: Session[]
  files: File[]
  _count: {
    files: number
  }
} & User

export interface StringNumberObj {
  [key: string]: number
}