import type { HTMLInputTypeAttribute, ChangeEventHandler, HTMLInputAutoCompleteAttribute, ReactNode } from 'react';

export interface InputFieldProps {
  title: string
  name: string
  type?: HTMLInputTypeAttribute
  placeholder?: string
  onChange?: ChangeEventHandler<HTMLInputElement>
  errorMsg?: string
  autocomplete?: HTMLInputAutoCompleteAttribute
}

export interface DragUploadFieldProps {
  children: ReactNode
	parentId: string
}

export interface FileSystemEntry {
	isFile: boolean;
	isDirectory: boolean;
	name: string;
	fullPath: string;
	file?: (successCallback: (file: File) => void) => void;
	createReader?: () => FileSystemDirectoryReader;
}

export interface FileSystemFileEntry extends FileSystemEntry {
	isFile: true;
	isDirectory: false;
	file: (successCallback: (file: File) => void) => void;
}

export interface FileSystemDirectoryEntry extends FileSystemEntry {
	isFile: false;
	isDirectory: true;
	createReader: () => FileSystemDirectoryReader;
}

interface FileSystemDirectoryReader {
	readEntries: (successCallback: (entries: FileSystemEntry[]) => void) => void;
}