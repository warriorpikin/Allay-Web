export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Please check your connection and try again.'
  if (!error?.response) return 'Could not reach the server. Check your connection and try again.'
  return fallback
}

// Logs a structured diagnostic to the console (dev tools only — never shown
// in the UI) so a 404 from a stale deploy is immediately distinguishable
// from an auth failure or a genuine server error, without guessing from a
// generic toast message.
export function logFetchError(label, error) {
  console.error(label, {
    url: error?.config?.url,
    status: error?.response?.status,
    code: error?.response?.data?.code,
    message: error?.response?.data?.message || error?.message,
  })
}
