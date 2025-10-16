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
    zIndex?: number
    z_index?: number
    locked_at?: string | null
    locked_by?: string | null
    created_by?: string
    last_modified_by?: string
    last_modified_at?: number
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

// User color palette - Bright NEON colors
// NOTE: #00ff00 (bright neon green) is reserved for FPS connectivity status and excluded from user colors
// NOTE: #72fa41 is also excluded from user colors
export const USER_COLORS = [
    '#24ccff', '#fbff00', '#ff69b4', '#00ffff',
    '#ff00ff', '#ff0080', '#80ff00', '#ff8000',
    '#0080ff', '#ff0040', '#40ff00', '#00ff80', '#8000ff'
]

