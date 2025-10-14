import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002'

export function useWebSocket() {
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
      setConnected(false)
    }
  }, [])

  const connect = useCallback(async (canvasId: string) => {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      console.warn('No session token available')
      return
    }

    // Close existing connection
    disconnect()

    // Build WebSocket URL with auth token and canvasId
    const wsUrl = `${WS_URL}?token=${session.access_token}&canvasId=${canvasId}`

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('✅ WebSocket connected')
      setConnected(true)
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      console.log('📨 WebSocket message:', message.type)

      // Handle different message types
      switch (message.type) {
        case 'CANVAS_SYNC':
          console.log('Canvas synced:', message.payload)
          break
        case 'USER_JOIN':
          console.log('User joined:', message.payload)
          break
        case 'USER_LEAVE':
          console.log('User left:', message.payload)
          break
        case 'ERROR':
          console.error('WebSocket error:', message.payload)
          break
        default:
          console.log('Unhandled message:', message)
      }
    }

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected')
      setConnected(false)
    }

    wsRef.current = ws
  }, [disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return { connect, disconnect, connected }
}

