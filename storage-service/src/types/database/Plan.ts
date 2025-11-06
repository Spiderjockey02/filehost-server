export interface createPlan {
  name: string
  maxStorageSize?: number
  maxFileSize?: number
  deletedFileRetentionDays?: number
  price?: number
  priceId?: string
  isDefault?: boolean
}

export interface updatePlan {
  id: string
  name?: string
  maxStorageSize?: number
  maxFileSize?: number
  deletedFileRetentionDays?: number
  price?: number
  priceId?: string
  isDefault?: boolean
}