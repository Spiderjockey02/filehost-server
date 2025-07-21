import { CronJob, File } from '@prisma/client';
import { DatabaseBackup } from '..';

export interface FileModalProps {
  file: File
  closeContextMenu?: () => void
}

export interface AdminBackupModalProps {
  backup: DatabaseBackup
	deleteBackup: () => void
	downloadBackup: () => void
}

export interface AdminCRONJobLogsModalProps {
  CRONJob: CronJob
  onClickRun: () => void
}

export interface CreateFolderModalProps {
  parentId: string
}