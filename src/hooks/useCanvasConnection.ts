import { useState, useRef, useCallback } from 'react'

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

export interface WSMessage {
    type: string
    payload?: any
}

interface UseCanvasConnectionProps {
    maxReconnectAttempts?: number
    baseReconnectDelay?: number
}

export function useCanvasConnection({
    maxReconnectAttempts = 10,
    baseReconnectDelay = 1000
}: UseCanvasConnectionProps = {}) {
    const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
    const [reconnectAttempts, setReconnectAttempts] = useState(0)

    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<number | null>(null)
    const operationQueueRef = useRef<WSMessage[]>([])

    const sendMessage = useCallback((msg: WSMessage) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            // Queue operation if disconnected
            console.warn('⚠️ [Canvas] WebSocket not open, queuing message:', msg)
            operationQueueRef.current.push(msg)
            return false
        }
        wsRef.current.send(JSON.stringify(msg))
        return true
    }, [])

    const flushOperationQueue = useCallback(() => {
        if (operationQueueRef.current.length === 0) return

        const queue = [...operationQueueRef.current]
        operationQueueRef.current = []

        // Send queued operations in order
        queue.forEach(msg => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify(msg))
            }
        })
    }, [])

    const clearReconnectTimeout = useCallback(() => {
        if (reconnectTimeoutRef.current !== null) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }
    }, [])

    return {
        connectionState,
        setConnectionState,
        reconnectAttempts,
        setReconnectAttempts,
        wsRef,
        reconnectTimeoutRef,
        operationQueueRef,
        sendMessage,
        flushOperationQueue,
        clearReconnectTimeout,
        maxReconnectAttempts,
        baseReconnectDelay
    }
}

