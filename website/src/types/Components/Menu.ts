import type { File } from '@/types/generated/browser';

export interface FileContextMenuProps {
  x: number
  y: number
  selected: File[]
  closeContextMenu: () => void
  showFilePanel: (fileId: string) => void
}

export interface TrashContextMenuProps {
  x: number
  y: number
  selected: File[]
  closeContextMenu: () => void
}