import { ReactNode } from 'react';
import { FileWithChildren } from '../database';

export interface FileContextType {
  file: FileWithChildren | null;
  setFile: (file: FileWithChildren | null) => void;
}
export interface FileProviderProps {
  children: ReactNode;
}

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
  addToQueue: (file: FileList, parentId: string) => void;
  status: UploadStatus;
  cancelUpload: () => void;
};