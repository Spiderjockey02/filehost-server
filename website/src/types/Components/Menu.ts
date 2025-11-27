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

export interface VideoPlayerContextMenuProps {
  contextMenu: {
    x: number;
    y: number;
  }
  setContextMenu: (menu: null) => void;
  setShowStats: (show: (prev: boolean) => boolean) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  currentTime: number
}