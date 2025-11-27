import type { FileWithChildren, FileWithCount } from '../database';
import type { File } from '@/types/generated/browser';

export interface VideoPlayerProps {
  videoPath: string;
	thumbnailPath?: string;
}

export type HUDIndicator = 'seek_forward' | 'seek_backward' | 'volume' | 'speed' | null;

export interface TextViewerProps {
  path: string
}

export interface DirectoryProps {
  folder: {
    userId: string
    id: string
    children: FileWithChildren[]
    _count: {
      children: number
    }
  }
}

export interface GalleryProps {
  files: File[]
}

export interface FilePanelPopupProps {
  file: FileWithCount
  setShow: (fileName: string) => void
  show: boolean
}

export interface FileViewerProps {
  file: File
  userId: string
}
