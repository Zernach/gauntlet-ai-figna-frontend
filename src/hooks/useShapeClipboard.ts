import { useState, useCallback } from 'react'
import type { Shape } from '../types/canvas'

interface UseShapeClipboardProps {
    shapes: Shape[]
    contextMenuShapeIdRef: React.MutableRefObject<string | null>
    wsRef: React.MutableRefObject<WebSocket | null>
    sendMessage: (msg: any) => void
    pushHistory: (entry: any) => void
}

export function useShapeClipboard({
    shapes,
    contextMenuShapeIdRef,
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

        // Paste at cursor position with offset
        const offsetX = 50
        const offsetY = 50

        clipboard.forEach(shape => {
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
        })

        contextMenuShapeIdRef.current = null
    }, [clipboard, sendMessage, contextMenuShapeIdRef, wsRef])

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

