/**
 * Centralized WebSocket connection manager
 * Handles connection, reconnection, message routing, and event handling
 */

import {
    WSMessage,
    WSConnectionOptions,
    WSEventHandlers,
    IWebSocketClient
} from '../types/websocket';
import { WS_MESSAGE_TYPES, ConnectionState } from './constants';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002';

export class WebSocketManager implements IWebSocketClient {
    private ws: WebSocket | null = null;
    private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
    private eventHandlers: WSEventHandlers = {};
    private reconnectAttempts = 0;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;

    private options: WSConnectionOptions | null = null;

    /**
     * Connect to WebSocket server
     */
    connect(options: WSConnectionOptions): void {
        this.options = options;
        this.doConnect();
    }

    /**
     * Internal connection method
     */
    private doConnect(): void {
        if (!this.options) return;

        // Close existing connection
        this.disconnect();

        // Update state
        this.setConnectionState(
            this.reconnectAttempts > 0
                ? ConnectionState.RECONNECTING
                : ConnectionState.CONNECTING
        );

        try {
            // Build WebSocket URL with auth params
            const wsUrl = `${WS_URL}?token=${this.options.accessToken}&canvasId=${this.options.canvasId}`;
            this.ws = new WebSocket(wsUrl);

            // Set up event handlers
            this.ws.onopen = this.handleOpen.bind(this);
            this.ws.onmessage = this.handleMessage.bind(this);
            this.ws.onerror = this.handleError.bind(this);
            this.ws.onclose = this.handleClose.bind(this);

        } catch (error) {
            this.setConnectionState(ConnectionState.ERROR);
            this.scheduleReconnect();
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect(): void {
        // Clear intervals and timeouts
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // Close WebSocket
        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onerror = null;
            this.ws.onclose = null;
            this.ws.close();
            this.ws = null;
        }

        this.setConnectionState(ConnectionState.DISCONNECTED);
        this.reconnectAttempts = 0;
    }

    /**
     * Send message to server
     */
    send(message: WSMessage): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            this.ws.send(JSON.stringify(message));
        } catch (error) {
            // Error sending message
        }
    }

    /**
     * Register event handler
     */
    on(event: string, handler: Function): void {
        (this.eventHandlers as any)[event] = handler;
    }

    /**
     * Unregister event handler
     */
    off(event: string): void {
        delete (this.eventHandlers as any)[event];
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.connectionState === ConnectionState.CONNECTED;
    }

    /**
     * Get connection state
     */
    getConnectionState(): string {
        return this.connectionState;
    }

    /**
     * Handle WebSocket open event
     */
    private handleOpen(): void {
        this.setConnectionState(ConnectionState.CONNECTED);
        this.reconnectAttempts = 0;

        // Start heartbeat
        this.startHeartbeat();

        // Notify handlers
        if (this.eventHandlers.onConnect) {
            this.eventHandlers.onConnect();
        }

        if (this.options?.onOpen) {
            this.options.onOpen();
        }

        // Request canvas sync
        this.send({ type: WS_MESSAGE_TYPES.CANVAS_SYNC_REQUEST });
    }

    /**
     * Handle WebSocket message event
     */
    private handleMessage(event: MessageEvent): void {
        try {
            const message: WSMessage = JSON.parse(event.data);
            this.routeMessage(message);
        } catch (error) {
            // Error parsing message
        }
    }

    /**
     * Route message to appropriate handler
     */
    private routeMessage(message: WSMessage): void {
        switch (message.type) {
            case WS_MESSAGE_TYPES.CANVAS_SYNC:
                this.eventHandlers.onCanvasSync?.(message.payload);
                break;

            case WS_MESSAGE_TYPES.SHAPE_CREATE:
                this.eventHandlers.onShapeCreate?.(message.payload);
                break;

            case WS_MESSAGE_TYPES.SHAPE_UPDATE:
                this.eventHandlers.onShapeUpdate?.(message.payload);
                break;

            case WS_MESSAGE_TYPES.SHAPE_DELETE:
                this.eventHandlers.onShapeDelete?.(message.payload);
                break;

            case WS_MESSAGE_TYPES.CURSOR_MOVE:
                this.eventHandlers.onCursorMove?.(message.payload);
                break;

            case WS_MESSAGE_TYPES.USER_JOIN:
                this.eventHandlers.onUserJoin?.(message.payload);
                break;

            case WS_MESSAGE_TYPES.USER_LEAVE:
                this.eventHandlers.onUserLeave?.(message.payload);
                break;

            case WS_MESSAGE_TYPES.ACTIVE_USERS:
                this.eventHandlers.onActiveUsers?.(message.payload);
                break;

            case WS_MESSAGE_TYPES.CANVAS_UPDATE:
                this.eventHandlers.onCanvasUpdate?.(message.payload);
                break;

            case WS_MESSAGE_TYPES.ERROR:
                this.eventHandlers.onError?.(message.payload);
                break;

            case WS_MESSAGE_TYPES.PONG:
                // Heartbeat response, no action needed
                break;

            default:
                // Unknown message type
                break;
        }
    }

    /**
     * Handle WebSocket error event
     */
    private handleError(event: Event): void {
        this.setConnectionState(ConnectionState.ERROR);

        if (this.options?.onError) {
            this.options.onError(event);
        }
    }

    /**
     * Handle WebSocket close event
     */
    private handleClose(): void {
        this.setConnectionState(ConnectionState.DISCONNECTED);

        // Stop heartbeat
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        // Notify handlers
        if (this.eventHandlers.onDisconnect) {
            this.eventHandlers.onDisconnect();
        }

        if (this.options?.onClose) {
            this.options.onClose();
        }

        // Schedule reconnect if enabled
        if (this.options?.autoReconnect !== false) {
            this.scheduleReconnect();
        }
    }

    /**
     * Schedule reconnection attempt
     */
    private scheduleReconnect(): void {
        const maxAttempts = this.options?.maxReconnectAttempts || 10;

        if (this.reconnectAttempts >= maxAttempts) {
            return;
        }

        const delay = this.options?.reconnectDelay || 3000;
        const backoffDelay = Math.min(delay * Math.pow(1.5, this.reconnectAttempts), 30000);

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.doConnect();
        }, backoffDelay);
    }

    /**
     * Start heartbeat interval
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected()) {
                this.send({ type: WS_MESSAGE_TYPES.PING });
            }
        }, 30000); // Send heartbeat every 30 seconds
    }

    /**
     * Update connection state and notify handlers
     */
    private setConnectionState(state: ConnectionState): void {
        this.connectionState = state;
    }
}

/**
 * Create a new WebSocket manager instance
 */
export function createWebSocketManager(): WebSocketManager {
    return new WebSocketManager();
}

