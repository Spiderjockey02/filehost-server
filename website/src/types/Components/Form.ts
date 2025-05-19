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