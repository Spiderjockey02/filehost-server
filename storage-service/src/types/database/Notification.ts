export interface CreateNotification {
  text: string
  title: string
  url?: string
  userId: string
}

export interface GetByUserIdParams {
  userId: string
  page: number
}