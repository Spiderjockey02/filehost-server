import { BaseSyntheticEvent, CSSProperties, ReactNode } from 'react';
import type { Notification } from '@prisma/client';

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