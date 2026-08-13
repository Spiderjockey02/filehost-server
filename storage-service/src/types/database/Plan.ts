export interface CreatePlanParams {
  name: string
  maxStorageSize?: number | undefined
  maxFileSize?: number | undefined
  deletedFileRetentionDays?: number | undefined
  price?: number | undefined
  priceId?: string | undefined
  isDefault?: boolean | undefined
}

export interface UpdatePlanParams {
  id: string
  name?: string | undefined
  maxStorageSize?: number | undefined
  maxFileSize?: number | undefined
  deletedFileRetentionDays?: number | undefined
  price?: number | undefined
  priceId?: string | undefined
  isDefault?: boolean | undefined
}