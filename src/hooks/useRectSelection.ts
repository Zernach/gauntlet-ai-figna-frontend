import { useState, useCallback } from 'react'
import type Konva from 'konva'

export function useRectSelection() {
    const [rectMode, setRectMode] = useState<boolean>(false)
    const [isDrawingRect, setIsDrawingRect] = useState<boolean>(false)
    const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null)
    const [rectEnd, setRectEnd] = useState<{ x: number; y: number } | null>(null)

    const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!rectMode) return

        const stage = e.target.getStage()
        if (!stage || e.target !== stage) return

        const pos = stage.getPointerPosition()
        if (!pos) return

        // Get canvas coordinates
        const x = (pos.x - stage.x()) / stage.scaleX()
        const y = (pos.y - stage.y()) / stage.scaleY()

        setIsDrawingRect(true)
        setRectStart({ x, y })
        setRectEnd({ x, y })
    }, [rectMode])

    const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isDrawingRect || !rectStart) return

        const stage = e.target.getStage()
        if (!stage) return

        const pos = stage.getPointerPosition()
        if (!pos) return

        // Get canvas coordinates
        const x = (pos.x - stage.x()) / stage.scaleX()
        const y = (pos.y - stage.y()) / stage.scaleY()

        setRectEnd({ x, y })
    }, [isDrawingRect, rectStart])

    const handleStageMouseUp = useCallback(<T extends { id: string; x: number; y: number; width?: number; height?: number; radius?: number }>(
        shapes: T[],
        onSelect: (selectedIds: string[]) => void
    ) => {
        if (!isDrawingRect || !rectStart || !rectEnd) return

        // Calculate rectangle bounds
        const minX = Math.min(rectStart.x, rectEnd.x)
        const maxX = Math.max(rectStart.x, rectEnd.x)
        const minY = Math.min(rectStart.y, rectEnd.y)
        const maxY = Math.max(rectStart.y, rectEnd.y)

        // Find shapes within rectangle
        const selected = shapes.filter(shape => {
            let shapeX = shape.x
            let shapeY = shape.y

            // For rectangles, use center
            if (shape.width && shape.height) {
                shapeX += shape.width / 2
                shapeY += shape.height / 2
            }

            // Check if shape center is within rectangle
            return shapeX >= minX && shapeX <= maxX && shapeY >= minY && shapeY <= maxY
        })

        onSelect(selected.map(s => s.id))

        // Reset rectangle
        setIsDrawingRect(false)
        setRectStart(null)
        setRectEnd(null)
    }, [isDrawingRect, rectStart, rectEnd])

    const toggleRectMode = useCallback(() => {
        setRectMode(v => !v)
    }, [])

    return {
        rectMode,
        isDrawingRect,
        rectStart,
        rectEnd,
        setRectMode,
        setIsDrawingRect,
        setRectStart,
        setRectEnd,
        toggleRectMode,
        handleStageMouseDown,
        handleStageMouseMove,
        handleStageMouseUp,
    }
}

