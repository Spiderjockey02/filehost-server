import type { FileWithDeepChildren } from '../database';
import type { Socket } from 'socket.io-client';

export interface FileContextType {
	file: FileWithDeepChildren | null;
	isLoading: boolean;
	error: Error | null;
	refetch: () => void;
}

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
};

export interface UploadFile {
  file: File;
  parentId: string;
};

export type UploadStatus = {
  filename: string;
  progress: number;
  remaining: string;
  error?: string;
} | null;

export interface UploadQueueContextType {
  addToQueue: (file: FileList | File[], parentId: string) => void;
  status: UploadStatus;
  cancelUpload: () => void;
};

export type ToastType = 'success' | 'error';

export interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
  hideToast: () => void;
  toast: {
    type: ToastType;
    message: string;
    visible: boolean;
  };
}

export interface UploadQueueContextType {
  addToQueue: (files: FileList | File[], parentId: string) => void;
  cancelUpload: () => void;
  status: UploadStatus | null;
}