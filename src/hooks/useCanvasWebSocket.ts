import { useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface UseCanvasWebSocketParams {
  wsRef: React.MutableRefObject<WebSocket | null>
  currentUserIdRef: React.MutableRefObject<string | null>
  reconnectTimeoutRef: React.MutableRefObject<number | null>
  reconnectDelay: number
  setConnectionState: React.Dispatch<React.SetStateAction<'connected' | 'connecting' | 'reconnecting' | 'disconnected'>>
  setReconnectAttempts: React.Dispatch<React.SetStateAction<number>>
  flushOperationQueue: () => void
  onMessage: (message: any) => void
}

interface UseCanvasWebSocketReturn {
  connectWebSocket: (canvasId: string, token: string, isReconnect?: boolean) => void
  initializeCanvas: (onSuccess: (canvasId: string, token: string, userId: string, userEmail: string) => void) => Promise<void>
}

export function useCanvasWebSocket({
  wsRef,
  currentUserIdRef,
  reconnectTimeoutRef,
  reconnectDelay,
  setConnectionState,
  setReconnectAttempts,
  flushOperationQueue,
  onMessage,
}: UseCanvasWebSocketParams): UseCanvasWebSocketReturn {
  const connectWebSocketRef = useRef<(canvasId: string, token: string, isReconnect?: boolean) => void>()
  const sessionRef = useRef<{ canvasId: string; token: string } | null>(null)

  // Memoize connectWebSocket with stable reference
  connectWebSocketRef.current = useCallback((canvasId: string, token: string, isReconnect: boolean = false) => {
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002'
    const ws = new WebSocket(`${WS_URL}?token=${token}&canvasId=${canvasId}`)

    ws.onopen = () => {
      setConnectionState('connected')
      setReconnectAttempts(0)

      if (isReconnect) {
        // Request full state sync on reconnect
        ws.send(JSON.stringify({ type: 'RECONNECT_REQUEST' }))

        // Flush any queued operations after a short delay (to allow sync first)
        setTimeout(() => {
          flushOperationQueue()
        }, 500)
      }
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        onMessage(message)
      } catch (error) {
        // Error parsing message
      }
    }

    ws.onerror = (_error) => {
      setConnectionState('disconnected')
    }

    ws.onclose = (_event) => {
      // Use functional state update to track reconnect attempts
      setReconnectAttempts(currentAttempts => {
        const nextAttempt = currentAttempts + 1
        setConnectionState('reconnecting')

        // Continuously retry every 5 seconds without limit
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectWebSocketRef.current?.(canvasId, token, true)
        }, reconnectDelay)

        return nextAttempt
      })
    }

    wsRef.current = ws
    sessionRef.current = { canvasId, token }
  }, [reconnectDelay, flushOperationQueue])

  // Stable wrapper for connectWebSocket
  const connectWebSocket = useCallback((canvasId: string, token: string, isReconnect?: boolean) => {
    connectWebSocketRef.current?.(canvasId, token, isReconnect)
  }, [])

  // Initialize canvas and fetch session
  const initializeCanvas = useCallback(async (onSuccess: (canvasId: string, token: string, userId: string, userEmail: string) => void) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        return
      }

      currentUserIdRef.current = session.user.id

      // Get API URL (trim trailing slash to avoid double slashes)
      const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl

      // Get the global canvas (will be created automatically if it doesn't exist)
      const response = await fetch(`${API_URL}/canvas`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) throw new Error(`Failed to fetch global canvas: ${response.status} ${response.statusText}`)

      // Ensure we actually received JSON to avoid parsing HTML error pages
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(`Expected JSON but received '${contentType}'. Check VITE_API_URL. Body: ${text.slice(0, 200)}`)
      }

      const result = await response.json()
      const canvas = result.data

      onSuccess(canvas.id, session.access_token, session.user.id, session.user.email || '')
    } catch (error) {
      // Error initializing canvas
    }
  }, [])

  // Monitor browser online/offline events for immediate network state detection
  useEffect(() => {
    const handleOnline = () => {
      // If WebSocket is not connected, try to reconnect
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setConnectionState('reconnecting')
        setReconnectAttempts(0) // Reset attempts when coming back online

        // Attempt immediate reconnection
        if (sessionRef.current) {
          connectWebSocketRef.current?.(sessionRef.current.canvasId, sessionRef.current.token, true)
        }
      }
    }

    const handleOffline = () => {
      setConnectionState('disconnected')

      // Close WebSocket immediately to trigger reconnection flow
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial online status
    if (!navigator.onLine) {
      setConnectionState('disconnected')
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Periodic health check to ensure connection state accuracy
  useEffect(() => {
    const healthCheck = setInterval(() => {
      if (!wsRef.current) return

      const ws = wsRef.current
      const readyState = ws.readyState

      // Map WebSocket readyState to our connection state
      // 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
      if (readyState === WebSocket.CONNECTING) {
        setConnectionState((current) => {
          if (current !== 'connecting' && current !== 'reconnecting') {
            return 'connecting'
          }
          return current
        })
      } else if (readyState === WebSocket.OPEN) {
        setConnectionState((current) => {
          if (current !== 'connected') {
            return 'connected'
          }
          return current
        })
      } else if (readyState === WebSocket.CLOSING || readyState === WebSocket.CLOSED) {
        setConnectionState((current) => {
          if (current === 'connected' || current === 'connecting') {
            return 'disconnected'
          }
          return current
        })
      }
    }, 1000) // Check every second

    return () => clearInterval(healthCheck)
  }, [])

  return {
    connectWebSocket,
    initializeCanvas,
  }
}

