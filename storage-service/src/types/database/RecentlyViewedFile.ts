import { Prisma } from '@prisma/client';

export interface CreateRecentlyViewedFile {
  fileId: string;
  userId: string;
}

export interface fetchUserLatestProps {
	userId: string
  sortOrder?: Prisma.SortOrder
  sortBy?: 'name' | 'viewedAt'
}

export type FullRecentlyViewedFile = Prisma.RecentlyViewedFileGetPayload<{
  include: {
		file: true
  }
}>