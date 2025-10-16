import { useState, useCallback } from 'react'
import type Konva from 'konva'

export function useLassoSelection() {
  const [lassoMode, setLassoMode] = useState<boolean>(false)
  const [isDrawingLasso, setIsDrawingLasso] = useState<boolean>(false)
  const [lassoStart, setLassoStart] = useState<{ x: number; y: number } | null>(null)
  const [lassoEnd, setLassoEnd] = useState<{ x: number; y: number } | null>(null)

  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!lassoMode) return

    const stage = e.target.getStage()
    if (!stage || e.target !== stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    // Get canvas coordinates
    const x = (pos.x - stage.x()) / stage.scaleX()
    const y = (pos.y - stage.y()) / stage.scaleY()

    setIsDrawingLasso(true)
    setLassoStart({ x, y })
    setLassoEnd({ x, y })
  }, [lassoMode])

  const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawingLasso || !lassoStart) return

    const stage = e.target.getStage()
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    // Get canvas coordinates
    const x = (pos.x - stage.x()) / stage.scaleX()
    const y = (pos.y - stage.y()) / stage.scaleY()

    setLassoEnd({ x, y })
  }, [isDrawingLasso, lassoStart])

  const handleStageMouseUp = useCallback(<T extends { id: string; x: number; y: number; width?: number; height?: number; radius?: number }>(
    shapes: T[],
    onSelect: (selectedIds: string[]) => void
  ) => {
    if (!isDrawingLasso || !lassoStart || !lassoEnd) return

    // Calculate lasso circle
    const radius = Math.sqrt((lassoEnd.x - lassoStart.x) ** 2 + (lassoEnd.y - lassoStart.y) ** 2)

    // Find shapes within lasso
    const selected = shapes.filter(shape => {
      let shapeX = shape.x
      let shapeY = shape.y

      // For rectangles, use center
      if (shape.width && shape.height) {
        shapeX += shape.width / 2
        shapeY += shape.height / 2
      }

      // Check if shape center is within lasso circle
      const distance = Math.sqrt((shapeX - lassoStart.x) ** 2 + (shapeY - lassoStart.y) ** 2)
      return distance <= radius
    })

    onSelect(selected.map(s => s.id))

    // Reset lasso
    setIsDrawingLasso(false)
    setLassoStart(null)
    setLassoEnd(null)
  }, [isDrawingLasso, lassoStart, lassoEnd])

  const toggleLassoMode = useCallback(() => {
    setLassoMode(v => !v)
  }, [])

  return {
    lassoMode,
    isDrawingLasso,
    lassoStart,
    lassoEnd,
    setLassoMode,
    toggleLassoMode,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
  }
}

