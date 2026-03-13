import { Session } from '@/auth/server';

export interface PageProps {
  user: Session['user']
}

export interface AdminStorageIdPageProps extends PageProps {
  storageId: string
}

export interface AdminUserIdPageProps extends PageProps {
  userId: string
}

export interface FilePageProps extends PageProps {
  path: string
}

export interface SearchPageProps extends PageProps {
  query: {
    query: string
    fileType: string
    dateUpdated: string
  }
}