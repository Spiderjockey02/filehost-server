import { fileItem } from '..';
import { MouseEvent } from 'react';

export interface FileDetailCellProps {
  file: fileItem
}

export interface FileItemRowProps {
  file: fileItem
  isChecked: boolean
  openContextMenu: (e: MouseEvent<HTMLTableRowElement>, file: fileItem) => void
  handleCheckboxToggle: (e: MouseEvent, file: fileItem) => void
  setShow: (fileId: string) => void
  showMoreDetail?: boolean
}

export interface FileViewProps {
  files: fileItem[]
  setFilePanelToShow: (fileId: string) => void
  showMoreDetail?: boolean
}

export type sortKeyTypes = 'Name' | 'Size' | 'Date_Mod';
export type SortOrder = 'ascn' | 'dscn';