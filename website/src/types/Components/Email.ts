export interface EmailChangedProps {
	oldEmail: string
	newEmail: string
	verifyURL: string
}

export interface NewDeviceSigninProps {
  email: string
  details: {
    browser: string
    OS: string
    location: string
    ip: string
    time: Date
  }
}

export interface PasswordChangedProps {
  email: string
}

export interface VerifyEmailProps extends PasswordChangedProps {
  confirmURL: string
}

export interface PasswordResetProps extends PasswordChangedProps {
  resetPwdURL: string
}