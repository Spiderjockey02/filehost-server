import type { CronJob, File, Plan, UserActivity } from '@/types/generated/browser';
import type { RefetchOptions, QueryObserverResult } from '@tanstack/react-query';
import type { FullAuditLogListener, StorageWithCounts } from '../database';
import type { DatabaseBackup } from '..';

export interface BaseModalProps {
  show: boolean;
  onClose: () => void;
}

export interface ControlledModalProps {
  show: boolean;
  setShow: (show: boolean) => void;
}

type RefetchFunction<T> = (
  options?: RefetchOptions
) => Promise<QueryObserverResult<T, Error>>;

// Modal props
export interface AdminActivityDetailsModalProps extends BaseModalProps {
  activity: UserActivity;
}

export interface FileModalProps extends BaseModalProps {
  file: File;
  closeContextMenu?: () => void;
}

export interface AdminBackupModalProps extends BaseModalProps {
  backup: DatabaseBackup;
  deleteBackup: () => void;
  downloadBackup: () => void;
}

export interface AdminCRONJobLogsModalProps extends BaseModalProps {
  CRONJob: CronJob;
  refetch: () => void;
}

export interface CreateFolderModalProps extends ControlledModalProps {
  parentId: string;
}

export interface AdminBanUserModalProps extends BaseModalProps {
  userId: string;
}

export interface AdminCreateMediumModalProps extends BaseModalProps {
  refreshTable: RefetchFunction<{ storages: StorageWithCounts[] }>;
}

export interface AdminCreatePlanModalProps extends BaseModalProps {
  refresh: RefetchFunction<{ plans: Plan[] }>;
}

export interface AdminEditListenerModalProps extends BaseModalProps {
  listener: FullAuditLogListener;
  refetch: () => void;
}

export interface AdminEditPlanModalProps extends BaseModalProps {
  plan: Plan;
  refresh: RefetchFunction<{ plans: Plan[] }>;
}

export interface AdminSendNotificationModalProps extends BaseModalProps {
  userId?: string;
}

export interface AdminEditStorageModalProps extends BaseModalProps {
  storage: StorageWithCounts;
  refreshTable: RefetchFunction<{ storages: StorageWithCounts[] }>;
}

export interface BillingPanelModalProps extends BaseModalProps {
  currentPlan: Plan;
}

export interface FileUploadActionModalProps {
	fileName: string;
	show: boolean;
	onAction: (action: 'replace' | 'keep' | 'cancel') => void;
}