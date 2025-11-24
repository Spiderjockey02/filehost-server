import type { BaseSyntheticEvent, CSSProperties, ReactNode, Ref } from 'react';
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import type { Notification } from '@/types/generated/browser';
import type { GridLayoutProps } from './Layout';

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

export interface CollapsibleIdProps extends GridLayoutProps {
  id: string
}