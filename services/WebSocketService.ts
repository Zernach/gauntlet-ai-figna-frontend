import type {
    WSMessage,
    WebSocketConfig,
    ConnectionStatus,
} from '@/types/websocket';

type MessageHandler = (message: WSMessage) => void;
type StatusChangeHandler = (status: ConnectionStatus) => void;

export class WebSocketService {
    private ws: WebSocket | null = null;
    private config: WebSocketConfig;
    private messageHandlers: Set<MessageHandler> = new Set();
    private statusChangeHandlers: Set<StatusChangeHandler> = new Set();
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private pingInterval: NodeJS.Timeout | null = null;
    private pongTimeout: NodeJS.Timeout | null = null;
    private reconnectAttempts = 0;
    private currentStatus: ConnectionStatus = 'disconnected';
    private userId: string = '';
    private canvasId: string = '';

    constructor(config: WebSocketConfig) {
        this.config = config;
    }

    public connect(userId: string, canvasId: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return;
        }

        this.userId = userId;
        this.canvasId = canvasId;
        this.updateStatus('connecting');

        try {
            const url = `${this.config.url}?userId=${userId}&canvasId=${canvasId}`;
            this.ws = new WebSocket(url);

            this.ws.onopen = this.handleOpen.bind(this);
            this.ws.onmessage = this.handleMessage.bind(this);
            this.ws.onerror = this.handleError.bind(this);
            this.ws.onclose = this.handleClose.bind(this);
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.updateStatus('error');
            this.scheduleReconnect();
        }
    }

    public disconnect(): void {
        this.clearReconnectTimeout();
        this.clearPingInterval();
        this.clearPongTimeout();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.updateStatus('disconnected');
    }

    public send(message: Partial<WSMessage>): void {
        if (this.ws?.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket is not connected. Message not sent:', message);
            return;
        }

        const fullMessage: WSMessage = {
            ...message,
            userId: this.userId,
            canvasId: this.canvasId,
            timestamp: Date.now(),
            messageId: this.generateMessageId(),
        } as WSMessage;

        try {
            this.ws.send(JSON.stringify(fullMessage));
        } catch (error) {
            console.error('Error sending WebSocket message:', error);
        }
    }

    public onMessage(handler: MessageHandler): () => void {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    public onStatusChange(handler: StatusChangeHandler): () => void {
        this.statusChangeHandlers.add(handler);
        return () => this.statusChangeHandlers.delete(handler);
    }

    public getStatus(): ConnectionStatus {
        return this.currentStatus;
    }

    public getLatency(): number {
        // This will be updated by ping/pong
        return 0;
    }

    private handleOpen(): void {
        console.log('WebSocket connected');
        this.updateStatus('connected');
        this.reconnectAttempts = 0;
        this.startPingInterval();

        // Send join message
        this.send({
            type: 'USER_JOIN',
            data: {
                userId: this.userId,
                userName: 'User', // This should come from user state
                userColor: '#3B82F6',
            },
        });
    }

    private handleMessage(event: MessageEvent): void {
        try {
            const message: WSMessage = JSON.parse(event.data);

            // Handle pong messages for latency calculation
            if (message.type === 'PONG') {
                this.clearPongTimeout();
                const latency = Date.now() - message.timestamp;
                // Notify handlers about latency update
            }

            // Notify all message handlers
            this.messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    private handleError(error: Event): void {
        console.error('WebSocket error:', error);
        this.updateStatus('error');
    }

    private handleClose(): void {
        console.log('WebSocket disconnected');
        this.clearPingInterval();
        this.clearPongTimeout();

        if (this.currentStatus !== 'disconnected') {
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            console.error('Max reconnect attempts reached');
            this.updateStatus('error');
            return;
        }

        this.updateStatus('reconnecting');
        this.reconnectAttempts++;

        this.clearReconnectTimeout();
        this.reconnectTimeout = setTimeout(() => {
            console.log(
                `Reconnecting... (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`,
            );
            this.connect(this.userId, this.canvasId);
        }, this.config.reconnectInterval * this.reconnectAttempts);
    }

    private startPingInterval(): void {
        this.clearPingInterval();
        this.pingInterval = setInterval(() => {
            this.sendPing();
        }, this.config.pingInterval);
    }

    private sendPing(): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.send({ type: 'PING' });

            // Set pong timeout
            this.clearPongTimeout();
            this.pongTimeout = setTimeout(() => {
                console.warn('Pong timeout - connection may be stale');
                this.ws?.close();
            }, this.config.pongTimeout);
        }
    }

    private clearReconnectTimeout(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    private clearPingInterval(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    private clearPongTimeout(): void {
        if (this.pongTimeout) {
            clearTimeout(this.pongTimeout);
            this.pongTimeout = null;
        }
    }

    private updateStatus(status: ConnectionStatus): void {
        if (this.currentStatus !== status) {
            this.currentStatus = status;
            this.statusChangeHandlers.forEach((handler) => handler(status));
        }
    }

    private generateMessageId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Singleton instance
let wsServiceInstance: WebSocketService | null = null;

export const getWebSocketService = (config?: WebSocketConfig): WebSocketService => {
    if (!wsServiceInstance && config) {
        wsServiceInstance = new WebSocketService(config);
    }
    if (!wsServiceInstance) {
        throw new Error('WebSocketService not initialized');
    }
    return wsServiceInstance;
};

export const initWebSocketService = (config: WebSocketConfig): WebSocketService => {
    wsServiceInstance = new WebSocketService(config);
    return wsServiceInstance;
};

