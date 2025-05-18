import { File } from '@prisma/client';

export interface FileModalProps {
  file: File
  closeContextMenu?: () => void
}