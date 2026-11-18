import { useEffect, useRef, useState, useCallback } from 'react'
import type { SimulationFrame } from '../types'

// Always connect through Vite's proxy (port 5173) which forwards /ws/* to backend port 8000
const WS_URL = `ws://${window.location.host}/ws/simulation`
const MAX_HISTORY = 300

export function useSimulationWS() {
  const [frames, setFrames] = useState<SimulationFrame[]>([])
  const [latest, setLatest] = useState<SimulationFrame | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'heartbeat') return
      const frame = data as SimulationFrame
      setLatest(frame)
      setFrames(prev => {
        const next = [...prev, frame]
        return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next
      })
    }

    ws.onclose = () => {
      setConnected(false)
      reconnectRef.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => ws.close()
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const clearFrames = useCallback(() => {
    setFrames([])
    setLatest(null)
  }, [])

  return { frames, latest, connected, clearFrames }
}
