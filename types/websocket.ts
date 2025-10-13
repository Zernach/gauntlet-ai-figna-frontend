// WebSocket Type Definitions

import type { Shape } from './canvas';
import type { UserCursor, UserPresence } from './user';

export type WSMessageType =
    | 'SHAPE_CREATE'
    | 'SHAPE_UPDATE'
    | 'SHAPE_DELETE'
    | 'SHAPES_BATCH_UPDATE'
    | 'CURSOR_MOVE'
    | 'USER_JOIN'
    | 'USER_LEAVE'
    | 'PRESENCE_UPDATE'
    | 'CANVAS_SYNC'
    | 'AI_COMMAND'
    | 'PING'
    | 'PONG'
    | 'ERROR';

export interface BaseWSMessage {
    type: WSMessageType;
    userId: string;
    canvasId: string;
    timestamp: number;
    messageId: string;
}

export interface ShapeCreateMessage extends BaseWSMessage {
    type: 'SHAPE_CREATE';
    data: {
        shape: Shape;
    };
}

export interface ShapeUpdateMessage extends BaseWSMessage {
    type: 'SHAPE_UPDATE';
    data: {
        shapeId: string;
        updates: Partial<Shape>;
    };
}

export interface ShapeDeleteMessage extends BaseWSMessage {
    type: 'SHAPE_DELETE';
    data: {
        shapeId: string;
    };
}

export interface ShapesBatchUpdateMessage extends BaseWSMessage {
    type: 'SHAPES_BATCH_UPDATE';
    data: {
        operations: Array<{
            type: 'create' | 'update' | 'delete';
            shapeId: string;
            shape?: Shape;
            updates?: Partial<Shape>;
        }>;
    };
}

export interface CursorMoveMessage extends BaseWSMessage {
    type: 'CURSOR_MOVE';
    data: UserCursor;
}

export interface UserJoinMessage extends BaseWSMessage {
    type: 'USER_JOIN';
    data: {
        userId: string;
        userName: string;
        userColor: string;
    };
}

export interface UserLeaveMessage extends BaseWSMessage {
    type: 'USER_LEAVE';
    data: {
        userId: string;
    };
}

export interface PresenceUpdateMessage extends BaseWSMessage {
    type: 'PRESENCE_UPDATE';
    data: UserPresence;
}

export interface CanvasSyncMessage extends BaseWSMessage {
    type: 'CANVAS_SYNC';
    data: {
        shapes: Record<string, Shape>;
        users: UserPresence[];
        version: number;
    };
}

export interface AICommandMessage extends BaseWSMessage {
    type: 'AI_COMMAND';
    data: {
        command: string;
        result?: any;
        error?: string;
    };
}

export interface PingMessage extends BaseWSMessage {
    type: 'PING';
}

export interface PongMessage extends BaseWSMessage {
    type: 'PONG';
}

export interface ErrorMessage extends BaseWSMessage {
    type: 'ERROR';
    data: {
        code: string;
        message: string;
        details?: any;
    };
}

export type WSMessage =
    | ShapeCreateMessage
    | ShapeUpdateMessage
    | ShapeDeleteMessage
    | ShapesBatchUpdateMessage
    | CursorMoveMessage
    | UserJoinMessage
    | UserLeaveMessage
    | PresenceUpdateMessage
    | CanvasSyncMessage
    | AICommandMessage
    | PingMessage
    | PongMessage
    | ErrorMessage;

export type ConnectionStatus =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'error';

export interface WebSocketState {
    status: ConnectionStatus;
    canvasId: string | null;
    lastPingTime: number;
    latency: number;
    reconnectAttempts: number;
    error: string | null;
}

export interface WebSocketConfig {
    url: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    pingInterval: number;
    pongTimeout: number;
}

