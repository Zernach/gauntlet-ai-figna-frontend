import { useCallback } from 'react'
import type { Shape } from '../types/canvas'

interface UseLayerManagementProps {
    shapes: Shape[]
    selectedIds: string[]
    contextMenuShapeIdRef: React.MutableRefObject<string | null>
    wsRef: React.MutableRefObject<WebSocket | null>
    sendMessage: (msg: any) => void
}

export function useLayerManagement({
    shapes,
    selectedIds,
    contextMenuShapeIdRef,
    wsRef,
    sendMessage
}: UseLayerManagementProps) {

    // Send shape to front
    const handleSendToFront = useCallback(() => {
        const shapeId = contextMenuShapeIdRef.current
        if (!shapeId || !wsRef.current) return

        // Get max z-index
        const maxZ = Math.max(...shapes.map(s => s.zIndex || 0), 0)

        // Check if the shape is in the current selection
        const targetShapes = selectedIds.includes(shapeId) ? selectedIds : [shapeId]

        // Update all target shapes, maintaining their relative order
        targetShapes.forEach((id, index) => {
            sendMessage({
                type: 'SHAPE_UPDATE',
                payload: { shapeId: id, updates: { zIndex: maxZ + 1 + index } },
            })
        })

        contextMenuShapeIdRef.current = null
    }, [shapes, selectedIds, sendMessage, contextMenuShapeIdRef, wsRef])

    // Send shape to back
    const handleSendToBack = useCallback(() => {
        const shapeId = contextMenuShapeIdRef.current
        if (!shapeId || !wsRef.current) return

        // Get min z-index
        const minZ = Math.min(...shapes.map(s => s.zIndex || 0), 0)

        // Check if the shape is in the current selection
        const targetShapes = selectedIds.includes(shapeId) ? selectedIds : [shapeId]

        // Update all target shapes, maintaining their relative order
        targetShapes.forEach((id, index) => {
            sendMessage({
                type: 'SHAPE_UPDATE',
                payload: { shapeId: id, updates: { zIndex: minZ - targetShapes.length + index } },
            })
        })

        contextMenuShapeIdRef.current = null
    }, [shapes, selectedIds, sendMessage, contextMenuShapeIdRef, wsRef])

    // Move shape forward one layer
    const handleMoveForward = useCallback(() => {
        const shapeId = contextMenuShapeIdRef.current
        if (!shapeId || !wsRef.current) return

        // Check if the shape is in the current selection
        const targetShapes = selectedIds.includes(shapeId) ? selectedIds : [shapeId]

        // Update all target shapes
        targetShapes.forEach(id => {
            const shape = shapes.find(s => s.id === id)
            if (shape) {
                const currentZ = shape.zIndex || 0
                sendMessage({
                    type: 'SHAPE_UPDATE',
                    payload: { shapeId: id, updates: { zIndex: currentZ + 1 } },
                })
            }
        })

        contextMenuShapeIdRef.current = null
    }, [shapes, selectedIds, sendMessage, contextMenuShapeIdRef, wsRef])

    // Move shape backward one layer
    const handleMoveBackward = useCallback(() => {
        const shapeId = contextMenuShapeIdRef.current
        if (!shapeId || !wsRef.current) return

        // Check if the shape is in the current selection
        const targetShapes = selectedIds.includes(shapeId) ? selectedIds : [shapeId]

        // Update all target shapes
        targetShapes.forEach(id => {
            const shape = shapes.find(s => s.id === id)
            if (shape) {
                const currentZ = shape.zIndex || 0
                sendMessage({
                    type: 'SHAPE_UPDATE',
                    payload: { shapeId: id, updates: { zIndex: currentZ - 1 } },
                })
            }
        })

        contextMenuShapeIdRef.current = null
    }, [shapes, selectedIds, sendMessage, contextMenuShapeIdRef, wsRef])

    return {
        handleSendToFront,
        handleSendToBack,
        handleMoveForward,
        handleMoveBackward
    }
}

