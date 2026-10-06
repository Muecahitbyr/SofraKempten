import { useEffect, useState } from 'react'
import { getOpenStatus } from '../lib/hours'

export function useOpenStatus() {
  const [status, setStatus] = useState(getOpenStatus)

  useEffect(() => {
    const id = window.setInterval(() => setStatus(getOpenStatus()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return status
}
