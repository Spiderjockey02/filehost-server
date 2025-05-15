import { Notification } from './index';

declare module 'better-auth' {
  export interface User {
		group: any;
		notifications: Notification[];
    id: string
    name: string
    email: string
    createdAt: Date
    updatedAt: Date
    totalStorageSize: number
    role: string
  }
}

declare module 'better-auth/client' {
  export interface Session {
    user: import('better-auth').User & User
  }
}