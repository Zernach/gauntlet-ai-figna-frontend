import { useCallback, useEffect, useRef } from 'react'
import type { Shape, ActiveUser } from '../types/canvas'

interface UseCanvasWebSocketParams {
  wsRef: React.MutableRefObject<WebSocket | null>
  currentUserIdRef: React.MutableRefObject<string | null>
  reconnectTimeoutRef: React.MutableRefObject<number | null>
  maxReconnectAttempts: number
  baseReconnectDelay: number
  setConnectionState: (state: 'connected' | 'connecting' | 'reconnecting' | 'disconnected') => void
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
  maxReconnectAttempts,
  baseReconnectDelay,
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

    console.log(`🔌 [Canvas] ${isReconnect ? 'Reconnecting' : 'Connecting'} WebSocket...`)
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002'
    const ws = new WebSocket(`${WS_URL}?token=${token}&canvasId=${canvasId}`)

    ws.onopen = () => {
      console.log('🟢 [Canvas] WebSocket connected')
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
        console.error('❌ [Canvas] Error parsing WebSocket message:', error, event.data);
      }
    }

    ws.onerror = (error) => {
      console.error('🔴 [Canvas] WebSocket error:', error)
      setConnectionState('disconnected')
    }

    ws.onclose = (event) => {
      console.log('🔴 [Canvas] WebSocket closed. Code:', event.code, 'Reason:', event.reason, 'Clean:', event.wasClean)

      // Use functional state update to get current reconnect attempts
      setReconnectAttempts(currentAttempts => {
        console.log(`🔄 [Canvas] Current attempts: ${currentAttempts}, Max: ${maxReconnectAttempts}`)

        // Check if we should attempt to reconnect
        if (currentAttempts < maxReconnectAttempts) {
          const nextAttempt = currentAttempts + 1
          const delay = Math.min(baseReconnectDelay * Math.pow(2, currentAttempts), 30000) // Max 30 seconds
          console.log(`⏳ [Canvas] Setting state to reconnecting (attempt ${nextAttempt}/${maxReconnectAttempts}), will retry in ${delay}ms`)
          setConnectionState('reconnecting')

          reconnectTimeoutRef.current = window.setTimeout(() => {
            console.log(`🔄 [Canvas] Executing reconnection attempt ${nextAttempt}...`)
            connectWebSocketRef.current?.(canvasId, token, true)
          }, delay)

          return nextAttempt
        } else {
          console.log('❌ [Canvas] Max reconnection attempts reached, staying disconnected')
          setConnectionState('disconnected')
          return currentAttempts
        }
      })
    }

    wsRef.current = ws
    sessionRef.current = { canvasId, token }
  }, [maxReconnectAttempts, baseReconnectDelay, flushOperationQueue])

  // Stable wrapper for connectWebSocket
  const connectWebSocket = useCallback((canvasId: string, token: string, isReconnect?: boolean) => {
    connectWebSocketRef.current?.(canvasId, token, isReconnect)
  }, [])

  // Initialize canvas and fetch session
  const initializeCanvas = useCallback(async (onSuccess: (canvasId: string, token: string, userId: string, userEmail: string) => void) => {
    try {
      const { supabase } = await import('../lib/supabase')
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
      console.error('❌ [Canvas] Error initializing canvas:', error)
    }
  }, [])

  // Monitor browser online/offline events for immediate network state detection
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 [Canvas] Browser detected online, current WS state:', wsRef.current?.readyState)

      // If WebSocket is not connected, try to reconnect
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.log('🔄 [Canvas] Reconnecting due to browser online event...')
        setConnectionState('reconnecting')
        setReconnectAttempts(0) // Reset attempts when coming back online

        // Attempt immediate reconnection
        if (sessionRef.current) {
          connectWebSocketRef.current?.(sessionRef.current.canvasId, sessionRef.current.token, true)
        }
      }
    }

    const handleOffline = () => {
      console.log('🌐 [Canvas] Browser detected offline')
      setConnectionState('disconnected')

      // Close WebSocket immediately to trigger reconnection flow
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('🔌 [Canvas] Closing WebSocket due to offline event')
        wsRef.current.close()
      }
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial online status
    if (!navigator.onLine) {
      console.log('🌐 [Canvas] Initial state: Browser is offline')
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
        setConnectionState(current => {
          if (current !== 'connecting' && current !== 'reconnecting') {
            console.log('🔄 [Canvas] Health check: WebSocket is connecting')
            return 'connecting'
          }
          return current
        })
      } else if (readyState === WebSocket.OPEN) {
        setConnectionState(current => {
          if (current !== 'connected') {
            console.log('🟢 [Canvas] Health check: WebSocket is open')
            return 'connected'
          }
          return current
        })
      } else if (readyState === WebSocket.CLOSING || readyState === WebSocket.CLOSED) {
        setConnectionState(current => {
          if (current === 'connected' || current === 'connecting') {
            console.log('🔴 [Canvas] Health check: WebSocket is closed/closing')
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

