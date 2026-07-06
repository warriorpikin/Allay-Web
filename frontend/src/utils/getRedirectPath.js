export function getRedirectPath(value, fallback = '/') {
  return value?.startsWith('/') && !value.startsWith('//') ? value : fallback
}

