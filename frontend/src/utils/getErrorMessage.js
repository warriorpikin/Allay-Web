export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Please check your connection and try again.'
  if (!error?.response) return 'Could not reach the server. Check your connection and try again.'
  return fallback
}
