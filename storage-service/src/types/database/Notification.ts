export interface CreateNotificationParams {
  text: string
  title: string
  url?: string
  userId: string
}

export interface FetchByUserIdParams {
  userId: string
  page: number
}