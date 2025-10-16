import { supabase } from './supabase'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws'

/**
 * Secure WebSocket Connection
 * Handles authentication using secure headers instead of query parameters
 */

export interface SecureWebSocketOptions {
    canvasId: string
    onOpen?: () => void
    onMessage?: (message: any) => void
    onError?: (error: Event) => void
    onClose?: () => void
    autoReconnect?: boolean
}

export class SecureWebSocket {
    private ws: WebSocket | null = null
    private options: SecureWebSocketOptions
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5
    private reconnectDelay = 1000 // Start with 1 second
    private isIntentionallyClosed = false

    constructor(options: SecureWebSocketOptions) {
        this.options = options
    }

    /**
     * Connect to WebSocket server with secure authentication
     */
    async connect(): Promise<void> {
        try {
            // Get authentication token
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error || !session?.access_token) {
                throw new Error('Not authenticated')
            }

            const token = session.access_token
            const { canvasId } = this.options

            // Build WebSocket URL with canvasId as query param
            // Token is sent via Sec-WebSocket-Protocol header for security
            const wsUrl = `${WS_URL}?canvasId=${encodeURIComponent(canvasId)}`

            // Create WebSocket with token in sub-protocol
            // Format: "Bearer.{token}" (periods replace spaces for protocol compatibility)
            const protocols = [`Bearer.${token}`]
            this.ws = new WebSocket(wsUrl, protocols)

            this.ws.onopen = () => {
                console.log('✅ Secure WebSocket connected')
                this.reconnectAttempts = 0
                this.reconnectDelay = 1000
                this.isIntentionallyClosed = false
                this.options.onOpen?.()
            }

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data)
                    this.options.onMessage?.(message)
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error)
                }
            }

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error)
                this.options.onError?.(error)
            }

            this.ws.onclose = () => {
                console.log('WebSocket closed')
                this.options.onClose?.()

                // Auto-reconnect if enabled and not intentionally closed
                if (this.options.autoReconnect && !this.isIntentionallyClosed) {
                    this.handleReconnect()
                }
            }
        } catch (error) {
            console.error('Failed to connect to WebSocket:', error)
            throw error
        }
    }

    /**
     * Handle automatic reconnection
     */
    private handleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached')
            return
        }

        this.reconnectAttempts++
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff

        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

        setTimeout(() => {
            this.connect().catch((error) => {
                console.error('Reconnection failed:', error)
            })
        }, delay)
    }

    /**
     * Send a message
     */
    send(message: any): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected')
            return
        }

        try {
            this.ws.send(JSON.stringify(message))
        } catch (error) {
            console.error('Failed to send WebSocket message:', error)
        }
    }

    /**
     * Close the connection
     */
    disconnect(): void {
        this.isIntentionallyClosed = true
        if (this.ws) {
            this.ws.close()
            this.ws = null
        }
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN
    }

    /**
     * Get connection state
     */
    getState(): number {
        return this.ws?.readyState ?? WebSocket.CLOSED
    }
}

/**
 * Create a secure WebSocket connection
 */
export function createSecureWebSocket(options: SecureWebSocketOptions): SecureWebSocket {
    return new SecureWebSocket(options)
}

