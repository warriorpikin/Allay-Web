// Mirrors backend/src/utils/phoneValidation.js: an optional leading "+", digits,
// and common separators (spaces, hyphens, parentheses), 7-15 digits once
// separators are stripped. Not restricted to a single Nigerian prefix so any
// country's numbers can pass.
const PHONE_FORMAT_REGEX = /^\+?[0-9\s\-()]{7,20}$/
const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidFullName(value) {
  return String(value || '').trim().length >= 2
}

export function isValidPhoneNumber(value) {
  const trimmed = String(value || '').trim()
  if (!PHONE_FORMAT_REGEX.test(trimmed)) return false
  const digits = trimmed.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

export function isValidEmailAddress(value) {
  return EMAIL_FORMAT_REGEX.test(String(value || '').trim())
}

export function validateWaitlistForm({ fullName, phone, email, selectedServices }) {
  const errors = {}
  if (!isValidFullName(fullName)) errors.fullName = 'Please enter your full name.'
  if (!isValidPhoneNumber(phone)) errors.phone = 'Please enter a valid phone number.'
  if (!isValidEmailAddress(email)) errors.email = 'Please enter your email address.'
  if (!selectedServices?.length) errors.services = 'Please select at least one service.'
  return errors
}
