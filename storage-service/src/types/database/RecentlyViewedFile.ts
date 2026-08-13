import { Prisma } from '@/types/generated/client';
import type { Pagination } from '.';

export interface UpsertRecentlyViewedParams {
  fileId: string;
  userId: string;
}

export interface FetchUserViewHistoryParams extends Pagination {
	userId: string
  sortOrder?: Prisma.SortOrder
  sortBy?: 'name' | 'viewedAt'
}

export type FullRecentlyViewedFile = Prisma.RecentlyViewedFileGetPayload<{
  include: {
		file: true
  }
}>