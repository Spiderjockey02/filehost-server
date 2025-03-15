export interface Notification {
  id: string
  text: string
  createdAt: Date
  title: string
  url?: string
}

export interface RecentlyViewed {
  id: string
  userId: string
  fileId: string
  viewedAt: Date
  file: fileItem
}

export interface Group {
  id: string
  name: string
  maxStorageSize: number
}

export type fileType = 'FILE' | 'DIRECTORY'
export type fileItem = {
  id: string
  userId: string
  path: string
  name: string
  children: fileItem[]
  createdAt: Date
  deletedAt: Date
  updatedAt: Date
  size: number
  type: fileType
  _count: {
    children: number
  }
}

export type LoginErrorTypes = {
  type: | 'email' | 'password' | 'misc'
  message: string
}

export type RegisterErrorTypes = {
  type: 'username' | 'email' | 'password' | 'age' | 'misc'
  message: string
}

export interface SettingErrorTypes {
	type: 'current' | 'pwd1' | 'pwd2' | 'misc' | 'av' | 'email'
	text: string
}