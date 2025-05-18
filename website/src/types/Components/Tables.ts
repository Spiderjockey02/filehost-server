import { File } from '@prisma/client';
import { MouseEvent } from 'react';
import { FileWithChildren } from '../database';

export interface FileDetailCellProps {
  file: File
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

export type sortKeyTypes = 'Name' | 'Size' | 'Date_Mod';
export type SortOrder = 'ascn' | 'dscn';