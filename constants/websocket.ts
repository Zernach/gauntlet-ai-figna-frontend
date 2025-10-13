import { CONFIG } from './config';
import type { WebSocketConfig } from '@/types/websocket';

export const WEBSOCKET_CONFIG: WebSocketConfig = {
    url: CONFIG.CLOUD_BASE_URL.replace('http', 'ws').replace('/api/gauntlet', '/ws'),
    reconnectInterval: 1000,
    maxReconnectAttempts: 10,
    pingInterval: 30000,
    pongTimeout: 5000,
};

export const CANVAS_CONSTANTS = {
    DEFAULT_CANVAS_WIDTH: 1920,
    DEFAULT_CANVAS_HEIGHT: 1080,
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 10,
    DEFAULT_ZOOM: 1,
    GRID_SIZE: 20,
    CURSOR_UPDATE_THROTTLE: 50,
    MAX_HISTORY_SIZE: 50,
    PERFORMANCE_TARGET_FPS: 60,
    MAX_SHAPES: 500,
    MIN_SHAPE_SIZE: 10,
    DEFAULT_SHAPE_SIZE: 100,
} as const;

