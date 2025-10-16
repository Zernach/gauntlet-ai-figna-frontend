import { useState, useCallback } from 'react'
import type { Shape } from '../types/canvas'

interface UseShapeClipboardProps {
    shapes: Shape[]
    contextMenuShapeIdRef: React.MutableRefObject<string | null>
    contextMenuCanvasPositionRef: React.MutableRefObject<{ x: number; y: number } | null>
    wsRef: React.MutableRefObject<WebSocket | null>
    sendMessage: (msg: any) => void
    pushHistory: (entry: any) => void
}

export function useShapeClipboard({
    shapes,
    contextMenuShapeIdRef,
    contextMenuCanvasPositionRef,
    wsRef,
    sendMessage,
    pushHistory
}: UseShapeClipboardProps) {

    const [clipboard, setClipboard] = useState<Shape[]>([])

    // Handle copy
    const handleCopy = useCallback(() => {
        const shapeId = contextMenuShapeIdRef.current
        if (!shapeId) return

        const shape = shapes.find(s => s.id === shapeId)
        if (!shape) return

        setClipboard([shape])
        contextMenuShapeIdRef.current = null
    }, [shapes, contextMenuShapeIdRef])

    // Handle cut
    const handleCut = useCallback(() => {
        const shapeId = contextMenuShapeIdRef.current
        if (!shapeId || !wsRef.current) return

        const shape = shapes.find(s => s.id === shapeId)
        if (!shape) return

        setClipboard([shape])

        // Delete the shape
        sendMessage({
            type: 'SHAPE_DELETE',
            payload: { shapeId },
        })

        pushHistory({
            undo: { type: 'SHAPE_CREATE', payload: shape },
            redo: { type: 'SHAPE_DELETE', payload: { shapeId: shape.id } },
            label: 'Cut shape',
        })

        contextMenuShapeIdRef.current = null
    }, [shapes, pushHistory, sendMessage, contextMenuShapeIdRef, wsRef])

    // Handle paste
    const handlePaste = useCallback(() => {
        if (clipboard.length === 0 || !wsRef.current) return

        // If we have a context menu canvas position, paste there
        // Otherwise, use a fixed offset from the original position
        const pastePosition = contextMenuCanvasPositionRef.current

        clipboard.forEach(shape => {
            let newX: number
            let newY: number

            if (pastePosition) {
                // Paste at the right-click position
                // For shapes with different anchor points, adjust accordingly
                if (shape.type === 'circle') {
                    // Circle anchor is at center
                    newX = pastePosition.x
                    newY = pastePosition.y
                } else if (shape.type === 'text') {
                    // Text anchor is typically top-left
                    newX = pastePosition.x
                    newY = pastePosition.y
                } else {
                    // Rectangle anchor is top-left
                    newX = pastePosition.x
                    newY = pastePosition.y
                }
            } else {
                // Fallback: paste with offset from original position
                newX = shape.x + 50
                newY = shape.y + 50
            }

            const newShape = {
                ...shape,
                x: newX,
                y: newY,
            }
            delete (newShape as any).id
            delete (newShape as any).locked_at
            delete (newShape as any).locked_by
            delete (newShape as any).created_at
            delete (newShape as any).updated_at

            sendMessage({
                type: 'SHAPE_CREATE',
                payload: newShape,
            })
        })

        contextMenuShapeIdRef.current = null
        contextMenuCanvasPositionRef.current = null
    }, [clipboard, sendMessage, contextMenuShapeIdRef, contextMenuCanvasPositionRef, wsRef])

    // Handle duplicate
    const handleDuplicate = useCallback(() => {
        const shapeId = contextMenuShapeIdRef.current
        if (!shapeId || !wsRef.current) return

        const shape = shapes.find(s => s.id === shapeId)
        if (!shape) return

        // Duplicate with offset
        const offsetX = 50
        const offsetY = 50

        const newShape = {
            ...shape,
            x: shape.x + offsetX,
            y: shape.y + offsetY,
        }
        delete (newShape as any).id
        delete (newShape as any).locked_at
        delete (newShape as any).locked_by
        delete (newShape as any).created_at
        delete (newShape as any).updated_at

        sendMessage({
            type: 'SHAPE_CREATE',
            payload: newShape,
        })

        contextMenuShapeIdRef.current = null
    }, [shapes, sendMessage, contextMenuShapeIdRef, wsRef])

    return {
        clipboard,
        setClipboard,
        handleCopy,
        handleCut,
        handlePaste,
        handleDuplicate
    }
}

