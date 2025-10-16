/**
 * WebSocket message types and interfaces
 */

import { CanvasObject, Canvas } from './canvas';
import { WSMessageType } from '../lib/constants';

/**
 * Base WebSocket message structure
 */
export interface WSMessage<T = any> {
    type: WSMessageType;
    payload?: T;
    userId?: string;
    canvasId?: string;
    timestamp?: number;
}

/**
 * Active user data
 */
export interface ActiveUser {
    userId: string;
    username: string;
    displayName: string;
    email: string;
    color: string;
    cursorX?: number;
    cursorY?: number;
    isActive?: boolean;
}

/**
 * Canvas sync payload
 */
export interface CanvasSyncPayload {
    canvas: Canvas;
    shapes: CanvasObject[];
    activeUsers: ActiveUser[];
}

/**
 * Shape create payload
 */
export interface ShapeCreatePayload {
    shape: CanvasObject;
}

/**
 * Shape update payload
 */
export interface ShapeUpdatePayload {
    shape: CanvasObject;
    lastModifiedBy?: string;
    lastModifiedAt?: number;
}

/**
 * Shape delete payload
 */
export interface ShapeDeletePayload {
    shapeId: string;
}

/**
 * Cursor move payload
 */
export interface CursorMovePayload {
    userId: string;
    username: string;
    displayName?: string;
    email?: string;
    color: string;
    x: number;
    y: number;
}

/**
 * User join payload
 */
export interface UserJoinPayload {
    userId: string;
    username: string;
    displayName?: string;
    email?: string;
    color: string;
}

/**
 * User leave payload
 */
export interface UserLeavePayload {
    userId: string;
    username: string;
}

/**
 * Active users payload
 */
export interface ActiveUsersPayload {
    activeUsers: ActiveUser[];
}

/**
 * Error payload
 */
export interface ErrorPayload {
    message: string;
    code?: string;
}

/**
 * WebSocket event handlers
 */
export interface WSEventHandlers {
    onCanvasSync?: (payload: CanvasSyncPayload) => void;
    onShapeCreate?: (payload: ShapeCreatePayload) => void;
    onShapeUpdate?: (payload: ShapeUpdatePayload) => void;
    onShapeDelete?: (payload: ShapeDeletePayload) => void;
    onCursorMove?: (payload: CursorMovePayload) => void;
    onUserJoin?: (payload: UserJoinPayload) => void;
    onUserLeave?: (payload: UserLeavePayload) => void;
    onActiveUsers?: (payload: ActiveUsersPayload) => void;
    onCanvasUpdate?: (payload: { canvas: Canvas }) => void;
    onError?: (payload: ErrorPayload) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
}

/**
 * WebSocket connection options
 */
export interface WSConnectionOptions {
    canvasId: string;
    accessToken: string;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (error: Event) => void;
    autoReconnect?: boolean;
    reconnectDelay?: number;
    maxReconnectAttempts?: number;
}

/**
 * WebSocket client interface
 */
export interface IWebSocketClient {
    connect(options: WSConnectionOptions): void;
    disconnect(): void;
    send(message: WSMessage): void;
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
    isConnected(): boolean;
    getConnectionState(): string;
}

