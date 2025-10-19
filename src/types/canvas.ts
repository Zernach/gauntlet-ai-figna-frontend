export interface Shape {
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
    borderRadius?: number
    border_radius?: number
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
    imageUrl?: string
    iconName?: string
    zIndex?: number
    locked_at?: string | null
    locked_by?: string | null
    created_by?: string
    last_modified_by?: string
    last_modified_at?: number
    group_id?: string | null
    keepAspectRatio?: boolean
}

// Alias for compatibility with websocket types
export type CanvasObject = Shape

export interface Canvas {
    id: string
    name?: string
    width?: number
    height?: number
    background_color?: string
    created_by?: string
    created_at?: string
    updated_at?: string
}

export interface Cursor {
    userId: string
    username: string
    displayName: string
    email: string
    color: string
    x: number
    y: number
}

export interface ActiveUser {
    userId: string
    username: string
    displayName: string
    email: string
    color: string
}

export type WSMessage = { type: string; payload?: any; timestamp?: number }

// Canvas constants
export const CANVAS_WIDTH = 50000
export const CANVAS_HEIGHT = 50000
export const VIEWPORT_WIDTH = window.innerWidth
export const VIEWPORT_HEIGHT = window.innerHeight
export const DEFAULT_SHAPE_SIZE = 100
export const SHAPE_COLOR = '#c1c1c1'

export const USER_COLORS = [
    '#24ccff', '#fbff00', '#ff69b4', '#00ffff',
    '#ff00ff', '#ff0080', '#80ff00', '#ff8000',
    '#0080ff', '#ff0040', '#00ff80', '#8000ff'
]

