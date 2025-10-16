/**
 * Application-wide constants
 * Centralized configuration values
 */

export const APP_CONFIG = {
    // Canvas Configuration
    CANVAS_WIDTH: 50000,
    CANVAS_HEIGHT: 50000,
    DEFAULT_BACKGROUND_COLOR: '#1C1C1C',

    // Shape Defaults
    DEFAULT_SHAPE_COLOR: '#72fa41',
    DEFAULT_TEXT_COLOR: '#FFFFFF',
    DEFAULT_RECTANGLE_WIDTH: 200,
    DEFAULT_RECTANGLE_HEIGHT: 150,
    DEFAULT_CIRCLE_RADIUS: 100,
    DEFAULT_TEXT_SIZE: 24,
    DEFAULT_FONT_FAMILY: 'Inter',

    // Viewport Configuration
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 5,
    DEFAULT_ZOOM: 1,
    ZOOM_SPEED: 0.001,

    // Performance
    CURSOR_UPDATE_THROTTLE_MS: 50,
    SHAPE_UPDATE_THROTTLE_MS: 100,
    PRESENCE_HEARTBEAT_INTERVAL_MS: 5000,

    // Clipboard
    CLIPBOARD_OFFSET: 20,

    // Selection
    LASSO_STROKE_WIDTH: 2,
    LASSO_STROKE_COLOR: '#24ccff',
    SELECTION_BORDER_COLOR: '#24ccff',
    SELECTION_BORDER_WIDTH: 2,

    // Lock Timeout
    SHAPE_LOCK_TIMEOUT_MS: 5000,
} as const;

export const WS_MESSAGE_TYPES = {
    // Connection
    PING: 'PING',
    PONG: 'PONG',
    ERROR: 'ERROR',

    // Canvas Sync
    CANVAS_SYNC: 'CANVAS_SYNC',
    CANVAS_SYNC_REQUEST: 'CANVAS_SYNC_REQUEST',
    CANVAS_UPDATE: 'CANVAS_UPDATE',

    // Shapes
    SHAPE_CREATE: 'SHAPE_CREATE',
    SHAPE_UPDATE: 'SHAPE_UPDATE',
    SHAPE_DELETE: 'SHAPE_DELETE',
    SHAPES_BATCH_UPDATE: 'SHAPES_BATCH_UPDATE',

    // Cursor & Presence
    CURSOR_MOVE: 'CURSOR_MOVE',
    PRESENCE_UPDATE: 'PRESENCE_UPDATE',
    ACTIVE_USERS: 'ACTIVE_USERS',

    // User Events
    USER_JOIN: 'USER_JOIN',
    USER_LEAVE: 'USER_LEAVE',

    // Reconnection
    RECONNECT_REQUEST: 'RECONNECT_REQUEST',
} as const;

export type WSMessageType = typeof WS_MESSAGE_TYPES[keyof typeof WS_MESSAGE_TYPES];

export const NEON_COLORS = [
    '#24ccff',
    '#fbff00',
    '#ff69b4',
    '#00ffff',
    '#ff00ff',
    '#ff0080',
    '#80ff00',
    '#ff8000',
    '#0080ff',
    '#ff0040',
    '#40ff00',
    '#00ff80',
    '#8000ff'
] as const;

/**
 * WebSocket connection states
 */
export enum ConnectionState {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    RECONNECTING = 'reconnecting',
    ERROR = 'error',
}

/**
 * Shape types
 */
export enum ShapeType {
    RECTANGLE = 'rectangle',
    CIRCLE = 'circle',
    TEXT = 'text',
    LINE = 'line',
    POLYGON = 'polygon',
    IMAGE = 'image',
}

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
    DELETE: ['Delete', 'Backspace'],
    UNDO: ['z', 'Z'],
    REDO: ['y', 'Y'],
    COPY: ['c', 'C'],
    PASTE: ['v', 'V'],
    SELECT_ALL: ['a', 'A'],
    DESELECT: ['Escape'],
    DUPLICATE: ['d', 'D'],
} as const;

/**
 * Tool modes
 */
export enum ToolMode {
    SELECT = 'select',
    PAN = 'pan',
    DRAW_RECTANGLE = 'draw_rectangle',
    DRAW_CIRCLE = 'draw_circle',
    DRAW_TEXT = 'draw_text',
    LASSO = 'lasso',
}

