import { useEffect, useState, useCallback } from 'react'

export function usePolling<T>(
  fetcher: () => Promise<{ data: T }>,
  interval = 2000,
  enabled = true
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      const res = await fetcher()
      setData(res.data)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed')
    }
  }, [fetcher])

  useEffect(() => {
    if (!enabled) return
    fetch()
    const id = setInterval(fetch, interval)
    return () => clearInterval(id)
  }, [fetch, interval, enabled])

  return { data, error, refetch: fetch }
}
