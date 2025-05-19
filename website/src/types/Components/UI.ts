import { BaseSyntheticEvent, CSSProperties, ReactNode, Ref } from 'react';
import type { Notification } from '@prisma/client';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

export interface ModalProps {
  id: string
  title: string
  description: string
  onSubmit: (event: BaseSyntheticEvent) => void
}

export interface NotificationProps {
  notifications: Notification[]
}

export interface TableProps {
  children: ReactNode
  id?: string
  className?: string
  style?: CSSProperties
	onClick?: () => void
}

export interface ContextMenuProps {
  x: number
  y: number
  ref: Ref<HTMLDivElement>
  children: ReactNode
}
export interface ButtonProps {
  onClick?: () => void
  children: ReactNode
	BSToggle?: string
	BSTarget?: string
}

export interface InfoPillProps {
  title: string
  text: string | number
  icon: IconDefinition
  colour?: string
}

export interface InfoPillProgressProps {
  title: string
  text: string
  icon: IconDefinition
  colour?: string
  max: number
  current: number
}