// Accepts Nigerian and general international formats: an optional leading "+",
// digits, and common separators (spaces, hyphens, parentheses). Not restricted
// to a single Nigerian prefix so any country's numbers can pass.
const PHONE_FORMAT_REGEX = /^\+?[0-9\s\-()]{7,20}$/

export function isValidPhoneNumber(value) {
  const trimmed = String(value || '').trim()
  if (!PHONE_FORMAT_REGEX.test(trimmed)) return false
  const digits = trimmed.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}
