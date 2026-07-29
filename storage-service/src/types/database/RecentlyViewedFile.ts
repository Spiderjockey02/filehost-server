import { Prisma } from '@/types/generated/client';

export interface CreateRecentlyViewedFile {
  fileId: string;
  userId: string;
}

export interface fetchUserLatestProps {
	userId: string
  sortOrder?: Prisma.SortOrder
  sortBy?: 'name' | 'viewedAt'
  page?: number
}

export type FullRecentlyViewedFile = Prisma.RecentlyViewedFileGetPayload<{
  include: {
		file: true
  }
}>