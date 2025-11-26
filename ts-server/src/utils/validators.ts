export const EMAIL_RULE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
export const EMAIL_RULE_MESSAGE = 'Email is invalid (example: thangdeptrai@example.com)'
export const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/
export const PASSWORD_RULE_MESSAGE = 'Password must include at least 1 letter, 1 letter uppercase, a number, a symbol, and at least 8 character'

export const LITMIT_COMMON_FILE_SIZE = 10485760 // byte = 10 MB
export const ALLOW_COMMON_TYPE_FILE = ['image/jpg', 'image/jpeg', 'image/png']
