import { FileWithCount } from '../database';
import type { File } from '@prisma/client';

export interface VideoPlayerProps {
  userId: string
	path: string
}

export interface TextViewerProps {
  path: string
}

export interface DirectoryProps {
  folder: {
    id: string
    children: File[]
    userId: string
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
