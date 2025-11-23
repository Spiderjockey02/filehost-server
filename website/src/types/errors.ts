export interface LoginFormError {
  type: | 'email' | 'password'
  message: string
}

export type RegisterFormErrorTypes = 'username' | 'email' | 'password' | 'age'

export interface RegisterFormError {
  type: RegisterFormErrorTypes
  message: string
}

export interface ResetPasswordFormError {
  type: 'pwd1' | 'pwd2' | 'misc'
	message: string
}

export interface BanUserFormError {
  type: 'reason' | 'expiresAt'
  message: string
}

export interface AuditListenerFormError {
  type: 'name' | 'type' | 'targetUrl' | 'events'
  message: string
}

export interface MediumFormError {
  type: 'name' | 'basePath' | 'location' | 'maxSize' | 'endpoint'
  message: string
}

export interface PlanFormError {
  type: 'name' | 'price' | 'maxStorageSize' | 'maxFileSize' | 'retentionDays' | 'priceId'
  message: string
}

export interface NotificationFormError {
  type: 'title' | 'text' | 'url'
  text: string
}

export interface SettingsFormError {
	type: 'current' | 'pwd1' | 'pwd2' | 'misc' | 'av' | 'email' | 'name'
	text: string
}

