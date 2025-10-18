import { useState, useCallback } from 'react'
import type { Shape } from '../types/canvas'

interface UseShapeClipboardProps {
    shapes: Shape[]
    selectedIds: string[]
    contextMenuShapeIdRef: React.MutableRefObject<string | null>
    contextMenuCanvasPositionRef: React.MutableRefObject<{ x: number; y: number } | null>
    wsRef: React.MutableRefObject<WebSocket | null>
    sendMessage: (msg: any) => void
    pushHistory: (entry: any) => void
}

export function useShapeClipboard({
    shapes,
    selectedIds,
    contextMenuShapeIdRef,
    contextMenuCanvasPositionRef,
    wsRef,
    sendMessage,
    pushHistory
}: UseShapeClipboardProps) {

    const [clipboard, setClipboard] = useState<Shape[]>([])

    // Handle copy - copy all selected shapes
    const handleCopy = useCallback(() => {
        // Use selected shapes if multiple are selected, otherwise use the context menu shape
        const shapesToCopy = selectedIds.length > 0
            ? shapes.filter(s => selectedIds.includes(s.id))
            : contextMenuShapeIdRef.current
                ? shapes.filter(s => s.id === contextMenuShapeIdRef.current)
                : []

        if (shapesToCopy.length === 0) return

        setClipboard(shapesToCopy)
        contextMenuShapeIdRef.current = null
    }, [shapes, selectedIds, contextMenuShapeIdRef])

    // Handle cut - cut all selected shapes
    const handleCut = useCallback(() => {
        if (!wsRef.current) return

        // Use selected shapes if multiple are selected, otherwise use the context menu shape
        const shapesToCut = selectedIds.length > 0
            ? shapes.filter(s => selectedIds.includes(s.id))
            : contextMenuShapeIdRef.current
                ? shapes.filter(s => s.id === contextMenuShapeIdRef.current)
                : []

        if (shapesToCut.length === 0) return

        setClipboard(shapesToCut)

        // Delete all the shapes in a single batch
        const shapeIds = shapesToCut.map(s => s.id)
        sendMessage({
            type: 'SHAPE_DELETE',
            payload: { shapeIds },
        })

        // Record undo/redo for each shape
        shapesToCut.forEach(shape => {
            pushHistory({
                undo: { type: 'SHAPE_CREATE', payload: shape },
                redo: { type: 'SHAPE_DELETE', payload: { shapeIds: [shape.id] } },
                label: `Cut ${shapesToCut.length > 1 ? shapesToCut.length + ' shapes' : 'shape'}`,
            })
        })

        contextMenuShapeIdRef.current = null
    }, [shapes, selectedIds, pushHistory, sendMessage, contextMenuShapeIdRef, wsRef])

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

    // Handle duplicate - duplicate all selected shapes
    const handleDuplicate = useCallback(() => {
        if (!wsRef.current) return

        // Use selected shapes if multiple are selected, otherwise use the context menu shape
        const shapesToDuplicate = selectedIds.length > 0
            ? shapes.filter(s => selectedIds.includes(s.id))
            : contextMenuShapeIdRef.current
                ? shapes.filter(s => s.id === contextMenuShapeIdRef.current)
                : []

        if (shapesToDuplicate.length === 0) return

        // Duplicate with offset
        const offsetX = 50
        const offsetY = 50

        shapesToDuplicate.forEach(shape => {
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
    }, [shapes, selectedIds, sendMessage, contextMenuShapeIdRef, wsRef])

    return {
        clipboard,
        setClipboard,
        handleCopy,
        handleCut,
        handlePaste,
        handleDuplicate
    }
}

