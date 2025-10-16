import { useCallback, useRef } from 'react'

/**
 * Canvas operation types that can be called by the AI agent
 */
export interface CanvasTools {
    createShape: (params: CreateShapeParams) => void
    updateShape: (params: UpdateShapeParams) => void
    deleteShape: (params: DeleteShapeParams) => void
    selectShapes: (params: SelectShapesParams) => void
    clearSelection: () => void
    duplicateShapes: (params: DuplicateShapesParams) => void
    groupShapes: (params: GroupShapesParams) => void
}

export interface CreateShapeParams {
    type: 'rectangle' | 'circle' | 'text'
    x?: number
    y?: number
    width?: number
    height?: number
    radius?: number
    color?: string
    textContent?: string
    fontSize?: number
    fontFamily?: string
    opacity?: number
    rotation?: number
}

export interface UpdateShapeParams {
    shapeId: string
    x?: number
    y?: number
    width?: number
    height?: number
    radius?: number
    color?: string
    textContent?: string
    fontSize?: number
    opacity?: number
    rotation?: number
}

export interface DeleteShapeParams {
    shapeIds: string[]
}

export interface SelectShapesParams {
    shapeIds: string[]
}

export interface DuplicateShapesParams {
    shapeIds: string[]
    offsetX?: number
    offsetY?: number
}

export interface GroupShapesParams {
    shapeIds: string[]
}

/**
 * OpenAI tool definitions for canvas operations
 */
export const CANVAS_TOOLS = [
    {
        type: 'function' as const,
        name: 'createShape',
        description: 'Creates a new shape on the canvas. Use this when the user asks to create, add, draw, or make a shape.',
        parameters: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['rectangle', 'circle', 'text'],
                    description: 'The type of shape to create'
                },
                x: {
                    type: 'number',
                    description: 'X coordinate (0-3000). Default: 500'
                },
                y: {
                    type: 'number',
                    description: 'Y coordinate (0-3000). Default: 500'
                },
                width: {
                    type: 'number',
                    description: 'Width in pixels (for rectangles). Default: 200'
                },
                height: {
                    type: 'number',
                    description: 'Height in pixels (for rectangles). Default: 150'
                },
                radius: {
                    type: 'number',
                    description: 'Radius in pixels (for circles). Default: 50'
                },
                color: {
                    type: 'string',
                    description: 'Hex color code (e.g. #FF0000 for red, #00FF00 for green, #0000FF for blue). Default: #72fa41'
                },
                textContent: {
                    type: 'string',
                    description: 'Text content (for text shapes)'
                },
                fontSize: {
                    type: 'number',
                    description: 'Font size in pixels (for text shapes). Default: 24'
                },
                fontFamily: {
                    type: 'string',
                    description: 'Font family (for text shapes). Default: Inter'
                },
                opacity: {
                    type: 'number',
                    description: 'Opacity from 0 to 1. Default: 1'
                },
                rotation: {
                    type: 'number',
                    description: 'Rotation in degrees. Default: 0'
                }
            },
            required: ['type']
        }
    },
    {
        type: 'function' as const,
        name: 'updateShape',
        description: 'Updates an existing shape on the canvas. Use this to modify, change, move, resize, or recolor shapes.',
        parameters: {
            type: 'object',
            properties: {
                shapeId: {
                    type: 'string',
                    description: 'The ID of the shape to update'
                },
                x: {
                    type: 'number',
                    description: 'New X coordinate'
                },
                y: {
                    type: 'number',
                    description: 'New Y coordinate'
                },
                width: {
                    type: 'number',
                    description: 'New width (for rectangles)'
                },
                height: {
                    type: 'number',
                    description: 'New height (for rectangles)'
                },
                radius: {
                    type: 'number',
                    description: 'New radius (for circles)'
                },
                color: {
                    type: 'string',
                    description: 'New hex color code'
                },
                textContent: {
                    type: 'string',
                    description: 'New text content (for text shapes)'
                },
                fontSize: {
                    type: 'number',
                    description: 'New font size (for text shapes)'
                },
                opacity: {
                    type: 'number',
                    description: 'New opacity (0-1)'
                },
                rotation: {
                    type: 'number',
                    description: 'New rotation in degrees'
                }
            },
            required: ['shapeId']
        }
    },
    {
        type: 'function' as const,
        name: 'deleteShape',
        description: 'Deletes one or more shapes from the canvas. Use this when user asks to remove, delete, or clear shapes.',
        parameters: {
            type: 'object',
            properties: {
                shapeIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of shape IDs to delete'
                }
            },
            required: ['shapeIds']
        }
    },
    {
        type: 'function' as const,
        name: 'selectShapes',
        description: 'Selects one or more shapes on the canvas. Use this to highlight or focus on specific shapes.',
        parameters: {
            type: 'object',
            properties: {
                shapeIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of shape IDs to select'
                }
            },
            required: ['shapeIds']
        }
    },
    {
        type: 'function' as const,
        name: 'clearSelection',
        description: 'Clears the current selection. Use this to deselect all shapes.',
        parameters: {
            type: 'object',
            properties: {}
        }
    },
    {
        type: 'function' as const,
        name: 'duplicateShapes',
        description: 'Duplicates one or more shapes. Use this when user asks to copy, duplicate, or clone shapes.',
        parameters: {
            type: 'object',
            properties: {
                shapeIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of shape IDs to duplicate'
                },
                offsetX: {
                    type: 'number',
                    description: 'X offset for duplicated shapes. Default: 50'
                },
                offsetY: {
                    type: 'number',
                    description: 'Y offset for duplicated shapes. Default: 50'
                }
            },
            required: ['shapeIds']
        }
    }
]

/**
 * Hook for handling AI agent tool calls on the canvas
 */
export function useAgenticToolCalling() {
    const toolsRef = useRef<CanvasTools | null>(null)

    /**
     * Register canvas tool implementations
     */
    const registerTools = useCallback((tools: CanvasTools) => {
        toolsRef.current = tools
    }, [])

    /**
     * Execute a tool call from OpenAI
     */
    const executeTool = useCallback((toolName: string, args: any) => {
        if (!toolsRef.current) {
            const error = 'Canvas tools not registered'
            return { success: false, error }
        }

        try {
            let result: any

            switch (toolName) {
                case 'createShape':
                    toolsRef.current.createShape(args as CreateShapeParams)
                    result = {
                        success: true,
                        message: `Created ${args.type} at position (${args.x || 'default'}, ${args.y || 'default'})`
                    }
                    return result

                case 'updateShape':
                    toolsRef.current.updateShape(args as UpdateShapeParams)
                    result = { success: true, message: `Updated shape ${args.shapeId}` }
                    return result

                case 'deleteShape':
                    toolsRef.current.deleteShape(args as DeleteShapeParams)
                    result = { success: true, message: `Deleted ${args.shapeIds.length} shape(s)` }
                    return result

                case 'selectShapes':
                    toolsRef.current.selectShapes(args as SelectShapesParams)
                    result = { success: true, message: `Selected ${args.shapeIds.length} shape(s)` }
                    return result

                case 'clearSelection':
                    toolsRef.current.clearSelection()
                    result = { success: true, message: 'Cleared selection' }
                    return result

                case 'duplicateShapes':
                    toolsRef.current.duplicateShapes(args as DuplicateShapesParams)
                    result = { success: true, message: `Duplicated ${args.shapeIds.length} shape(s)` }
                    return result

                default:
                    const error = `Unknown tool: ${toolName}`
                    return { success: false, error }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            return { success: false, error: errorMessage }
        }
    }, [])

    return {
        tools: CANVAS_TOOLS,
        registerTools,
        executeTool
    }
}

