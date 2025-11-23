import type { HTMLInputTypeAttribute, ChangeEventHandler, HTMLInputAutoCompleteAttribute, ReactNode } from 'react';
import type { ActionMeta, GroupBase, MultiValue, PropsValue } from 'react-select';
import type { User } from 'better-auth';
export interface AvatarUploadFormProps {
	user: User | null
}

export interface InputFieldProps {
  title: string
  name: string
  type?: HTMLInputTypeAttribute
  placeholder?: string
	value?: string | number
	checked?: boolean
  onChange?: ChangeEventHandler<HTMLInputElement>
  errorMsg?: string
  autocomplete?: HTMLInputAutoCompleteAttribute
	step?: number
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

export interface MultiSelectFieldProps {
	errorMsg?: string
	title: string
	name: string
	onChange?: ((newValue: MultiValue<{ value: string; text: string; }>, actionMeta: ActionMeta<{ value: string; text: string; }>) => void) | undefined
	options: readonly ({ value: string; text: string; } | GroupBase<{ value: string; text: string; }>)[]
	defaultValue?: PropsValue<{ value: string; text: string; }> | undefined
}

export interface SelectFieldProps {
  errorMsg?: string
  title: string
  name: string
  onChange?: ChangeEventHandler<HTMLSelectElement>
  options: {value: string, label: string}[]
}