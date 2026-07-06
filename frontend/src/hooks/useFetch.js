import { useCallback, useEffect, useState } from 'react'

export function useFetch(fetcher, options = {}) {
  const { immediate = true } = options
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(immediate)

  const execute = useCallback(async (...args) => {
    setLoading(true); setError(null)
    try {
      const result = await fetcher(...args)
      setData(result)
      return result
    } catch (requestError) {
      setError(requestError)
      throw requestError
    } finally { setLoading(false) }
  }, [fetcher])

  useEffect(() => { if (immediate) execute().catch(() => undefined) }, [execute, immediate])
  return { data, error, loading, execute, setData }
}
