import { useRef, useState, useCallback, useEffect } from 'react'

interface Shape {
  id: string
  type: string
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  rotation?: number
  color: string
  opacity?: number
  shadowColor?: string
  shadowStrength?: number
  text_content?: string
  font_size?: number
  font_family?: string
  font_weight?: string
  text_align?: string
  textContent?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  textAlign?: string
  zIndex?: number
  z_index?: number
  locked_at?: string | null
  locked_by?: string | null
  created_by?: string
  last_modified_by?: string
  last_modified_at?: number
}

interface ActiveUser {
  userId: string
  username: string
  displayName: string
  email: string
  color: string
}

interface Cursor {
  userId: string
  username: string
  displayName: string
  email: string
  color: string
  x: number
  y: number
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
type WSMessage = { type: string; payload?: any; timestamp?: number }

interface UseWebSocketConnectionProps {
  currentUserIdRef: React.MutableRefObject<string | null>
  onCanvasSync?: (payload: any) => void
  onCanvasUpdate?: (payload: any) => void
  onShapeCreate?: (shape: Shape) => void
  onShapeUpdate?: (shape: Shape) => void
  onShapeDelete?: (shapeId: string) => void
  onCursorMove?: (cursor: Cursor) => void
  onUserJoin?: (user: ActiveUser) => void
  onUserLeave?: (userId: string) => void
  onActiveUsers?: (users: ActiveUser[]) => void
  onError?: (message: string) => void
}

export function useWebSocketConnection({
  currentUserIdRef,
  onCanvasSync,
  onCanvasUpdate,
  onShapeCreate,
  onShapeUpdate,
  onShapeDelete,
  onCursorMove,
  onUserJoin,
  onUserLeave,
  onActiveUsers,
  onError,
}: UseWebSocketConnectionProps) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const operationQueueRef = useRef<WSMessage[]>([])
  const maxReconnectAttempts = 10
  const baseReconnectDelay = 1000

  const sendMessage = useCallback((msg: WSMessage) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      operationQueueRef.current.push({ ...msg, timestamp: Date.now() })
      return
    }
    wsRef.current.send(JSON.stringify(msg))
  }, [])

  const flushOperationQueue = useCallback(() => {
    if (operationQueueRef.current.length === 0) return

    const queue = [...operationQueueRef.current]
    operationQueueRef.current = []

    queue.forEach(msg => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(msg))
      }
    })
  }, [])

  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'CANVAS_SYNC':
        if (onCanvasSync) onCanvasSync(message.payload)
        break

      case 'CANVAS_UPDATE':
        if (onCanvasUpdate) onCanvasUpdate(message.payload)
        break

      case 'SHAPE_CREATE':
        if (onShapeCreate && message.payload.shape) {
          onShapeCreate(message.payload.shape)
        }
        break

      case 'SHAPE_UPDATE':
        if (onShapeUpdate && message.payload.shape) {
          onShapeUpdate(message.payload.shape)
        }
        break

      case 'SHAPE_DELETE':
        if (onShapeDelete && message.payload.shapeId) {
          onShapeDelete(message.payload.shapeId)
        }
        break

      case 'CURSOR_MOVE':
        if (onCursorMove && message.payload.userId !== currentUserIdRef.current) {
          onCursorMove({
            userId: message.payload.userId,
            username: message.payload.username,
            displayName: message.payload.displayName,
            email: message.payload.email,
            color: message.payload.color,
            x: message.payload.x,
            y: message.payload.y,
          })
        }
        break

      case 'USER_JOIN':
        if (onUserJoin) {
          onUserJoin({
            userId: message.payload.userId,
            username: message.payload.username,
            displayName: message.payload.displayName,
            email: message.payload.email,
            color: message.payload.color,
          })
        }
        break

      case 'USER_LEAVE':
        if (onUserLeave) {
          onUserLeave(message.payload.userId)
        }
        break

      case 'ACTIVE_USERS':
        if (onActiveUsers && Array.isArray(message.payload.activeUsers)) {
          onActiveUsers(message.payload.activeUsers)
        }
        break

      case 'ERROR':
        if (onError) onError(message.payload.message)
        break
    }
  }, [
    currentUserIdRef,
    onCanvasSync,
    onCanvasUpdate,
    onShapeCreate,
    onShapeUpdate,
    onShapeDelete,
    onCursorMove,
    onUserJoin,
    onUserLeave,
    onActiveUsers,
    onError,
  ])

  const connectWebSocket = useCallback((canvasId: string, token: string, isReconnect: boolean = false) => {
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002'
    const ws = new WebSocket(`${WS_URL}?token=${token}&canvasId=${canvasId}`)

    ws.onopen = () => {
      setConnectionState('connected')
      setReconnectAttempts(0)

      if (isReconnect) {
        ws.send(JSON.stringify({ type: 'RECONNECT_REQUEST' }))

        setTimeout(() => {
          flushOperationQueue()
        }, 500)
      }
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      handleWebSocketMessage(message)
    }

    ws.onerror = (error) => {
      setConnectionState('disconnected')
    }

    ws.onclose = () => {
      setConnectionState('disconnected')

      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttempts), 30000)
        setConnectionState('reconnecting')
        setReconnectAttempts(prev => prev + 1)

        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectWebSocket(canvasId, token, true)
        }, delay)
      } else {
        setConnectionState('disconnected')
      }
    }

    wsRef.current = ws
  }, [reconnectAttempts, handleWebSocketMessage, flushOperationQueue])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  return {
    wsRef,
    connectionState,
    reconnectAttempts,
    queuedOperationsCount: operationQueueRef.current.length,
    sendMessage,
    connectWebSocket,
    flushOperationQueue,
  }
}

