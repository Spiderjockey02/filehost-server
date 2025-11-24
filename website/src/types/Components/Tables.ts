import type { File } from '@/types/generated/browser';
import type { FileWithChildren } from '../database';
import type { MouseEvent } from 'react';

export interface FileDetailCellProps {
  file: File
  disableClick?: boolean
}

export interface FileItemRowProps {
  file: FileWithChildren
  isChecked: boolean
  openContextMenu: (e: MouseEvent<HTMLTableRowElement>, file: File) => void
  handleCheckboxToggle: (e: MouseEvent, file: File) => void
  setShow: (fileId: string) => void
  showMoreDetail?: boolean
}

export interface FileViewProps {
  files: FileWithChildren[]
  setFilePanelToShow: (fileId: string) => void
  showMoreDetail?: boolean
}

export interface PaginationFooterProps {
	isLoading: boolean;
	total?: number;
	page: number;
	setPage: (page: number) => void;
}

export type sortKeyTypes = 'Name' | 'Size' | 'Date_Mod';
export type SortOrder = 'ascn' | 'dscn';