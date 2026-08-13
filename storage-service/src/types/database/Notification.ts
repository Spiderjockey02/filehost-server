import type { Pagination } from '.';

export interface CreateNotificationParams {
  text: string
  title: string
  url?: string
  userId: string
}

export interface FetchByUserIdParams extends Pagination {
  userId: string
}