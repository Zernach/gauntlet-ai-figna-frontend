import { useCallback, useRef } from 'react'

/**
 * Canvas operation types that can be called by the AI agent
 */
export interface CanvasTools {
    createShapes: (params: CreateShapesParams) => void
    updateShape: (params: UpdateShapeParams) => void
    deleteShape: (params: DeleteShapeParams) => void
    deleteAllShapes: () => void
    selectShapes: (params: SelectShapesParams) => void
    clearSelection: () => void
    duplicateShapes: (params: DuplicateShapesParams) => void
    groupShapes: (params: GroupShapesParams) => void
    getCanvasState: () => CanvasState
    bringToFront: (params: LayerShapesParams) => void
    sendToBack: (params: LayerShapesParams) => void
    moveForward: (params: LayerShapesParams) => void
    moveBackward: (params: LayerShapesParams) => void
    arrangeInRow: (params: ArrangeParams) => void
    arrangeInColumn: (params: ArrangeParams) => void
    arrangeInGrid: (params: ArrangeGridParams) => void
    createPattern: (params: CreatePatternParams) => void
    alignShapes: (params: AlignShapesParams) => void
}

export interface CanvasState {
    shapes: Array<{
        id: string
        type: string
        x: number
        y: number
        width?: number
        height?: number
        radius?: number
        color: string
        textContent?: string
    }>
    selectedIds: string[]
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

export interface CreateShapesParams {
    shapes: CreateShapeParams[]
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

export interface LayerShapesParams {
    shapeIds: string[]
}

export interface ArrangeParams {
    shapeIds: string[]
    spacing?: number
    startX?: number
    startY?: number
}

export interface ArrangeGridParams {
    shapeIds: string[]
    columns?: number
    spacing?: number
    startX?: number
    startY?: number
}

export interface CreatePatternParams {
    patternType: 'login-form' | 'navigation-bar' | 'card' | 'button-group' | 'dashboard' | 'form-field'
    x?: number
    y?: number
    options?: any
}

export interface AlignShapesParams {
    shapeIds: string[]
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
}

/**
 * OpenAI tool definitions for canvas operations
 */
export const CANVAS_TOOLS = [
    {
        type: 'function' as const,
        name: 'createShapes',
        description: 'Creates one or more shapes on the canvas. Always pass an array of shapes, even for a single shape. Use this when the user asks to create, add, draw, or make shapes.',
        parameters: {
            type: 'object',
            properties: {
                shapes: {
                    type: 'array',
                    description: 'Array of shapes to create',
                    items: {
                        type: 'object',
                        properties: {
                            type: {
                                type: 'string',
                                enum: ['rectangle', 'circle', 'text'],
                                description: 'The type of shape to create'
                            },
                            x: {
                                type: 'number',
                                description: 'X coordinate (0-50000). If not specified, shape is created at the current viewport center'
                            },
                            y: {
                                type: 'number',
                                description: 'Y coordinate (0-50000). If not specified, shape is created at the current viewport center'
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
                                description: 'Radius in pixels (for circles). Default: 100'
                            },
                            color: {
                                type: 'string',
                                description: 'Hex color code (e.g. #FF0000 for red). Default: #72fa41'
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
                }
            },
            required: ['shapes']
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
        description: 'Deletes one or more shapes from the canvas. Use this when user asks to remove, delete, or clear shapes. To delete all shapes, first call getCanvasState to get all shape IDs, then pass them to this function.',
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
        name: 'deleteAllShapes',
        description: 'Deletes ALL shapes from the canvas. Use this when user asks to "delete all shapes", "clear the canvas", or "remove everything".',
        parameters: {
            type: 'object',
            properties: {}
        }
    },
    {
        type: 'function' as const,
        name: 'getCanvasState',
        description: 'Gets the current state of the canvas including all shapes and their properties. Use this to see what shapes exist before deleting, updating, or selecting them.',
        parameters: {
            type: 'object',
            properties: {}
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
    },
    {
        type: 'function' as const,
        name: 'bringToFront',
        description: 'Brings one or more shapes to the front (top layer). Use this when user asks to move shapes to front, bring shapes forward to the top, or make shapes appear on top.',
        parameters: {
            type: 'object',
            properties: {
                shapeIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of shape IDs to bring to front'
                }
            },
            required: ['shapeIds']
        }
    },
    {
        type: 'function' as const,
        name: 'sendToBack',
        description: 'Sends one or more shapes to the back (bottom layer). Use this when user asks to move shapes to back, send shapes behind, or make shapes appear behind others.',
        parameters: {
            type: 'object',
            properties: {
                shapeIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of shape IDs to send to back'
                }
            },
            required: ['shapeIds']
        }
    },
    {
        type: 'function' as const,
        name: 'moveForward',
        description: 'Moves one or more shapes forward one layer. Use this when user asks to move shapes forward, bring shapes up one layer, or nudge shapes toward the front.',
        parameters: {
            type: 'object',
            properties: {
                shapeIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of shape IDs to move forward'
                }
            },
            required: ['shapeIds']
        }
    },
    {
        type: 'function' as const,
        name: 'moveBackward',
        description: 'Moves one or more shapes backward one layer. Use this when user asks to move shapes backward, send shapes down one layer, or nudge shapes toward the back.',
        parameters: {
            type: 'object',
            properties: {
                shapeIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of shape IDs to move backward'
                }
            },
            required: ['shapeIds']
        }
    },
    {
        type: 'function' as const,
        name: 'arrangeInRow',
        description: 'Arranges selected shapes in a horizontal row with even spacing. Use this when user asks to arrange shapes horizontally, put shapes in a row, or line up shapes.',
        parameters: {
            type: 'object',
            properties: {
                shapeIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of shape IDs to arrange'
                },
                spacing: {
                    type: 'number',
                    description: 'Space between shapes in pixels. Default: 300'
                },
                startX: {
                    type: 'number',
                    description: 'Starting X coordinate. If not provided, uses current viewport center'
                },
                startY: {
                    type: 'number',
                    description: 'Y coordinate for the row. If not provided, uses current viewport center'
                }
            },
            required: ['shapeIds']
        }
    },
    {
        type: 'function' as const,
        name: 'arrangeInColumn',
        description: 'Arranges selected shapes in a vertical column with even spacing. Use this when user asks to arrange shapes vertically, put shapes in a column, or stack shapes.',
        parameters: {
            type: 'object',
            properties: {
                shapeIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of shape IDs to arrange'
                },
                spacing: {
                    type: 'number',
                    description: 'Space between shapes in pixels. Default: 300'
                },
                startX: {
                    type: 'number',
                    description: 'X coordinate for the column. If not provided, uses current viewport center'
                },
                startY: {
                    type: 'number',
                    description: 'Starting Y coordinate. If not provided, uses current viewport center'
                }
            },
            required: ['shapeIds']
        }
    },
    {
        type: 'function' as const,
        name: 'arrangeInGrid',
        description: 'Arranges selected shapes in a grid layout. Use this when user asks to create a grid, arrange in rows and columns, or organize shapes systematically.',
        parameters: {
            type: 'object',
            properties: {
                shapeIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of shape IDs to arrange'
                },
                columns: {
                    type: 'number',
                    description: 'Number of columns. If not specified, creates a square grid'
                },
                spacing: {
                    type: 'number',
                    description: 'Space between shapes in pixels. Default: 300'
                },
                startX: {
                    type: 'number',
                    description: 'Starting X coordinate. If not provided, uses current viewport center'
                },
                startY: {
                    type: 'number',
                    description: 'Starting Y coordinate. If not provided, uses current viewport center'
                }
            },
            required: ['shapeIds']
        }
    },
    {
        type: 'function' as const,
        name: 'createPattern',
        description: 'Creates complex UI patterns like login forms, navigation bars, cards, and dashboards. Use this for sophisticated multi-shape layouts.',
        parameters: {
            type: 'object',
            properties: {
                patternType: {
                    type: 'string',
                    enum: ['login-form', 'navigation-bar', 'card', 'button-group', 'dashboard', 'form-field'],
                    description: 'The type of UI pattern to create'
                },
                x: {
                    type: 'number',
                    description: 'X coordinate for the pattern. If not provided, uses current viewport center'
                },
                y: {
                    type: 'number',
                    description: 'Y coordinate for the pattern. If not provided, uses current viewport center'
                },
                options: {
                    type: 'object',
                    description: 'Optional customization parameters like colors, sizes, text content, etc.',
                    properties: {
                        width: { type: 'number' },
                        height: { type: 'number' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        itemCount: { type: 'number' },
                        items: { type: 'array', items: { type: 'string' } },
                        backgroundColor: { type: 'string' },
                        primaryColor: { type: 'string' },
                        accentColor: { type: 'string' },
                        textColor: { type: 'string' }
                    }
                }
            },
            required: ['patternType']
        }
    },
    {
        type: 'function' as const,
        name: 'alignShapes',
        description: 'Aligns selected shapes along a common edge or center. Use this when user asks to align shapes left, right, center, top, bottom, or middle.',
        parameters: {
            type: 'object',
            properties: {
                shapeIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of shape IDs to align'
                },
                alignment: {
                    type: 'string',
                    enum: ['left', 'center', 'right', 'top', 'middle', 'bottom'],
                    description: 'Alignment direction: left/center/right (horizontal) or top/middle/bottom (vertical)'
                }
            },
            required: ['shapeIds', 'alignment']
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
        console.log('🔨 [Tool Calling] Executing tool:', toolName, 'with args:', args);

        if (!toolsRef.current) {
            const error = 'Canvas tools not registered'
            console.error('❌ [Tool Calling] Error:', error);
            return { success: false, error }
        }

        try {
            let result: any

            switch (toolName) {
                case 'createShapes':
                    const shapeCount = args.shapes?.length || 0
                    console.log('🎨 [Tool Calling] Creating shapes:', shapeCount, 'shapes');
                    toolsRef.current.createShapes(args as CreateShapesParams)
                    result = {
                        success: true,
                        message: `Created ${shapeCount} shape(s)`
                    }
                    console.log('✅ [Tool Calling] Shapes created successfully');
                    return result

                case 'updateShape':
                    console.log('✏️ [Tool Calling] Updating shape:', args.shapeId);
                    toolsRef.current.updateShape(args as UpdateShapeParams)
                    result = { success: true, message: `Updated shape ${args.shapeId}` }
                    console.log('✅ [Tool Calling] Shape updated successfully');
                    return result

                case 'deleteShape':
                    console.log('🗑️ [Tool Calling] Deleting shapes:', args.shapeIds);
                    toolsRef.current.deleteShape(args as DeleteShapeParams)
                    result = { success: true, message: `Deleted ${args.shapeIds.length} shape(s)` }
                    console.log('✅ [Tool Calling] Shapes deleted successfully');
                    return result

                case 'selectShapes':
                    console.log('👆 [Tool Calling] Selecting shapes:', args.shapeIds);
                    toolsRef.current.selectShapes(args as SelectShapesParams)
                    result = { success: true, message: `Selected ${args.shapeIds.length} shape(s)` }
                    console.log('✅ [Tool Calling] Shapes selected successfully');
                    return result

                case 'clearSelection':
                    console.log('🧹 [Tool Calling] Clearing selection');
                    toolsRef.current.clearSelection()
                    result = { success: true, message: 'Cleared selection' }
                    console.log('✅ [Tool Calling] Selection cleared successfully');
                    return result

                case 'duplicateShapes':
                    console.log('📋 [Tool Calling] Duplicating shapes:', args.shapeIds);
                    toolsRef.current.duplicateShapes(args as DuplicateShapesParams)
                    result = { success: true, message: `Duplicated ${args.shapeIds.length} shape(s)` }
                    console.log('✅ [Tool Calling] Shapes duplicated successfully');
                    return result

                case 'deleteAllShapes':
                    console.log('🧹 [Tool Calling] Deleting all shapes');
                    toolsRef.current.deleteAllShapes()
                    result = { success: true, message: 'Deleted all shapes' }
                    console.log('✅ [Tool Calling] All shapes deleted successfully');
                    return result

                case 'getCanvasState':
                    console.log('🔍 [Tool Calling] Getting canvas state');
                    const state = toolsRef.current.getCanvasState()
                    console.log('✅ [Tool Calling] Canvas state retrieved:', {
                        shapeCount: state.shapes.length,
                        selectedCount: state.selectedIds.length
                    });
                    return { success: true, data: state }

                case 'bringToFront':
                    console.log('⬆️ [Tool Calling] Bringing shapes to front:', args.shapeIds);
                    toolsRef.current.bringToFront(args as LayerShapesParams)
                    result = { success: true, message: `Brought ${args.shapeIds.length} shape(s) to front` }
                    console.log('✅ [Tool Calling] Shapes brought to front successfully');
                    return result

                case 'sendToBack':
                    console.log('⬇️ [Tool Calling] Sending shapes to back:', args.shapeIds);
                    toolsRef.current.sendToBack(args as LayerShapesParams)
                    result = { success: true, message: `Sent ${args.shapeIds.length} shape(s) to back` }
                    console.log('✅ [Tool Calling] Shapes sent to back successfully');
                    return result

                case 'moveForward':
                    console.log('↑ [Tool Calling] Moving shapes forward:', args.shapeIds);
                    toolsRef.current.moveForward(args as LayerShapesParams)
                    result = { success: true, message: `Moved ${args.shapeIds.length} shape(s) forward` }
                    console.log('✅ [Tool Calling] Shapes moved forward successfully');
                    return result

                case 'moveBackward':
                    console.log('↓ [Tool Calling] Moving shapes backward:', args.shapeIds);
                    toolsRef.current.moveBackward(args as LayerShapesParams)
                    result = { success: true, message: `Moved ${args.shapeIds.length} shape(s) backward` }
                    console.log('✅ [Tool Calling] Shapes moved backward successfully');
                    return result

                case 'arrangeInRow':
                    console.log('➡️ [Tool Calling] Arranging shapes in row:', args.shapeIds);
                    toolsRef.current.arrangeInRow(args as ArrangeParams)
                    result = { success: true, message: `Arranged ${args.shapeIds.length} shape(s) in a row` }
                    console.log('✅ [Tool Calling] Shapes arranged in row successfully');
                    return result

                case 'arrangeInColumn':
                    console.log('⬇️ [Tool Calling] Arranging shapes in column:', args.shapeIds);
                    toolsRef.current.arrangeInColumn(args as ArrangeParams)
                    result = { success: true, message: `Arranged ${args.shapeIds.length} shape(s) in a column` }
                    console.log('✅ [Tool Calling] Shapes arranged in column successfully');
                    return result

                case 'arrangeInGrid':
                    console.log('🔲 [Tool Calling] Arranging shapes in grid:', args.shapeIds);
                    toolsRef.current.arrangeInGrid(args as ArrangeGridParams)
                    result = { success: true, message: `Arranged ${args.shapeIds.length} shape(s) in a grid` }
                    console.log('✅ [Tool Calling] Shapes arranged in grid successfully');
                    return result

                case 'createPattern':
                    console.log('🎨 [Tool Calling] Creating pattern:', args.patternType);
                    toolsRef.current.createPattern(args as CreatePatternParams)
                    result = { success: true, message: `Created ${args.patternType} pattern` }
                    console.log('✅ [Tool Calling] Pattern created successfully');
                    return result

                case 'alignShapes':
                    console.log('↔️ [Tool Calling] Aligning shapes:', args.alignment);
                    toolsRef.current.alignShapes(args as AlignShapesParams)
                    result = { success: true, message: `Aligned ${args.shapeIds.length} shape(s) ${args.alignment}` }
                    console.log('✅ [Tool Calling] Shapes aligned successfully');
                    return result

                default:
                    const error = `Unknown tool: ${toolName}`
                    console.error('❌ [Tool Calling] Error:', error);
                    return { success: false, error }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.error('❌ [Tool Calling] Exception during execution:', errorMessage);
            return { success: false, error: errorMessage }
        }
    }, [])

    return {
        tools: CANVAS_TOOLS,
        registerTools,
        executeTool
    }
}

