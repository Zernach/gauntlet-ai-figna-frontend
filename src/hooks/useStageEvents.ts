import { useCallback } from 'react'
import type { Shape } from '../types/canvas'

interface UseStageEventsProps {
  stageRef: React.MutableRefObject<any>
  wsRef: React.MutableRefObject<WebSocket | null>
  selectedIdsRef: React.MutableRefObject<string[]>
  isDraggingShapeRef: React.MutableRefObject<boolean>
  justFinishedMultiDragRef: React.MutableRefObject<boolean>
  cursorThrottleRef: React.MutableRefObject<number>
  lastCursorActivityRef: React.MutableRefObject<number>
  viewportWidth: number
  viewportHeight: number
  isDrawingLasso: boolean
  lassoMode: boolean
  lassoStart: { x: number; y: number } | null
  lassoEnd: { x: number; y: number } | null
  isDrawingRect: boolean
  rectMode: boolean
  rectStart: { x: number; y: number } | null
  rectEnd: { x: number; y: number } | null
  shapes: Shape[]
  setIsDrawingLasso: React.Dispatch<React.SetStateAction<boolean>>
  setLassoStart: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>
  setLassoEnd: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>
  setIsDrawingRect: React.Dispatch<React.SetStateAction<boolean>>
  setRectStart: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>
  setRectEnd: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  unlockShapes: (shapeIds: string[]) => void
  sendMessage: (message: any) => void
  setStageScale: React.Dispatch<React.SetStateAction<number>>
  setStagePos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
}

export function useStageEvents({
  stageRef,
  wsRef,
  selectedIdsRef,
  isDraggingShapeRef,
  justFinishedMultiDragRef,
  cursorThrottleRef,
  lastCursorActivityRef,
  viewportWidth,
  viewportHeight,
  isDrawingLasso,
  lassoMode,
  lassoStart,
  lassoEnd,
  isDrawingRect,
  rectMode,
  rectStart,
  rectEnd,
  shapes,
  setIsDrawingLasso,
  setLassoStart,
  setLassoEnd,
  setIsDrawingRect,
  setRectStart,
  setRectEnd,
  setSelectedIds,
  unlockShapes,
  sendMessage,
  setStageScale,
  setStagePos,
}: UseStageEventsProps) {

  const handleStageClick = useCallback((e: any) => {
    // Don't deselect if we just finished dragging a shape
    if (isDraggingShapeRef.current) {
      return
    }

    // Don't deselect if we just finished a multi-shape drag (preserve selection)
    if (justFinishedMultiDragRef.current) {
      return
    }

    // Don't deselect if we're in lasso or rect selection mode
    if (isDrawingLasso || isDrawingRect) {
      return
    }

    // If clicking on empty stage or canvas background, deselect
    const targetId = e.target.attrs?.id
    const isStageOrBackground = e.target === e.target.getStage() || targetId === 'canvas-background'

    if (isStageOrBackground) {
      // Unlock shapes before deselecting
      if (selectedIdsRef.current.length > 0) {
        unlockShapes(selectedIdsRef.current)
      }
      setSelectedIds([])
    }
  }, [isDraggingShapeRef, justFinishedMultiDragRef, isDrawingLasso, isDrawingRect, selectedIdsRef, unlockShapes, setSelectedIds])

  const handleMouseMove = useCallback((e: any) => {
    if (!wsRef.current) return

    const stage = e.target.getStage()
    const pointerPos = stage.getPointerPosition()

    if (!pointerPos) return

    // Convert screen coords to canvas coords
    const x = (pointerPos.x - stage.x()) / stage.scaleX()
    const y = (pointerPos.y - stage.y()) / stage.scaleY()

    // Track cursor activity timestamp
    lastCursorActivityRef.current = Date.now()

    // Throttle cursor updates to achieve sub-50ms target (25ms = 40 FPS)
    const now = Date.now()
    if (now - cursorThrottleRef.current > 25) {
      cursorThrottleRef.current = now

      sendMessage({
        type: 'CURSOR_MOVE',
        payload: { x, y },
      } as any)
    }
  }, [wsRef, cursorThrottleRef, lastCursorActivityRef, sendMessage])

  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault()

    const stage = stageRef.current
    if (!stage) return

    const oldScale = stage.scaleX()
    const oldPos = { x: stage.x(), y: stage.y() }

    // Use deltaY to determine zoom intensity for proportional zooming
    // Different browsers/devices report deltaY differently:
    // - Normal mouse wheel: typically ~100 per notch
    // - Trackpad pinch: can be 1-100+ depending on pinch speed/intensity
    const deltaY = e.evt.deltaY

    // Calculate zoom factor based on deltaY magnitude
    // Use exponential scaling that works well for both mouse and trackpad
    // Base zoom factor is 1.05, scaled by the deltaY magnitude
    const baseFactor = 1.05
    const scaleFactor = Math.pow(baseFactor, Math.abs(deltaY) / 40)

    // Apply zoom in the correct direction
    const direction = deltaY > 0 ? -1 : 1
    let newScale = direction > 0 ? oldScale * scaleFactor : oldScale / scaleFactor
    newScale = Math.max(0.1, Math.min(3, newScale))

    // Use the viewport center as the anchor point
    // This keeps whatever is at the center of the screen fixed during zoom
    const anchor = {
      x: viewportWidth / 2,
      y: viewportHeight / 2
    }

    // Calculate the canvas point under the anchor
    const canvasPointX = (anchor.x - oldPos.x) / oldScale
    const canvasPointY = (anchor.y - oldPos.y) / oldScale

    // Calculate new position to keep the same canvas point under the anchor
    const newPos = {
      x: anchor.x - canvasPointX * newScale,
      y: anchor.y - canvasPointY * newScale
    }

    // Apply directly to stage for immediate feedback
    stage.scale({ x: newScale, y: newScale })
    stage.position(newPos)
    stage.batchDraw()

    // Update React state so UI reflects the zoom level
    setStageScale(newScale)
    setStagePos(newPos)
  }, [stageRef, viewportWidth, viewportHeight, setStageScale, setStagePos])

  const handleStageMouseDown = useCallback((e: any) => {
    const targetId = e.target.attrs?.id
    const isStageOrBackground = e.target === e.target.getStage() || targetId === 'canvas-background'

    if (!isStageOrBackground) return

    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()
    if (!pos) return

    const canvasX = (pos.x - stage.x()) / stage.scaleX()
    const canvasY = (pos.y - stage.y()) / stage.scaleY()

    // Check if shift/cmd is pressed or lasso mode is active
    const isLassoKey = e.evt?.shiftKey || e.evt?.metaKey

    if ((lassoMode || isLassoKey) && !rectMode) {
      setIsDrawingLasso(true)
      setLassoStart({ x: canvasX, y: canvasY })
      setLassoEnd({ x: canvasX, y: canvasY })
    } else if (rectMode) {
      setIsDrawingRect(true)
      setRectStart({ x: canvasX, y: canvasY })
      setRectEnd({ x: canvasX, y: canvasY })
    }
  }, [lassoMode, rectMode, setIsDrawingLasso, setLassoStart, setLassoEnd, setIsDrawingRect, setRectStart, setRectEnd])

  const handleStageMouseMove = useCallback((e: any) => {
    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()
    if (!pos) return

    const canvasX = (pos.x - stage.x()) / stage.scaleX()
    const canvasY = (pos.y - stage.y()) / stage.scaleY()

    if (isDrawingLasso && lassoStart) {
      setLassoEnd({ x: canvasX, y: canvasY })
    } else if (isDrawingRect && rectStart) {
      setRectEnd({ x: canvasX, y: canvasY })
    }
  }, [isDrawingLasso, lassoStart, setLassoEnd, isDrawingRect, rectStart, setRectEnd])

  const handleStageMouseUp = useCallback(() => {
    if (isDrawingLasso && lassoStart && lassoEnd) {
      // Calculate circle radius
      const dx = lassoEnd.x - lassoStart.x
      const dy = lassoEnd.y - lassoStart.y
      const radius = Math.sqrt(dx * dx + dy * dy)

      // Find shapes within the lasso circle
      const selectedShapes = shapes.filter(shape => {
        // Get shape center point
        let centerX: number, centerY: number
        if (shape.type === 'circle') {
          centerX = shape.x
          centerY = shape.y
        } else if (shape.type === 'text') {
          centerX = shape.x
          centerY = shape.y
        } else {
          // Rectangle
          centerX = shape.x + (shape.width || 100) / 2
          centerY = shape.y + (shape.height || 100) / 2
        }

        // Check if center is within lasso circle
        const distX = centerX - lassoStart.x
        const distY = centerY - lassoStart.y
        const dist = Math.sqrt(distX * distX + distY * distY)

        return dist <= radius
      })

      // Unlock previously selected shapes
      if (selectedIdsRef.current.length > 0) {
        unlockShapes(selectedIdsRef.current)
      }

      // Set new selection and lock
      const newSelectedIds = selectedShapes.map(s => s.id)
      setSelectedIds(newSelectedIds)

      // Lock all newly selected shapes
      newSelectedIds.forEach(id => {
        sendMessage({
          type: 'SHAPE_UPDATE',
          payload: { shapeId: id, updates: { isLocked: true } },
        })
      })

      // Reset lasso state
      setIsDrawingLasso(false)
      setLassoStart(null)
      setLassoEnd(null)
    }

    if (isDrawingRect && rectStart && rectEnd) {
      // Calculate rectangle bounds
      const minX = Math.min(rectStart.x, rectEnd.x)
      const maxX = Math.max(rectStart.x, rectEnd.x)
      const minY = Math.min(rectStart.y, rectEnd.y)
      const maxY = Math.max(rectStart.y, rectEnd.y)

      // Find shapes within the rectangle
      const selectedShapes = shapes.filter(shape => {
        // Get shape center point
        let centerX: number, centerY: number
        if (shape.type === 'circle') {
          centerX = shape.x
          centerY = shape.y
        } else if (shape.type === 'text') {
          centerX = shape.x
          centerY = shape.y
        } else {
          // Rectangle
          centerX = shape.x + (shape.width || 100) / 2
          centerY = shape.y + (shape.height || 100) / 2
        }

        // Check if center is within rectangle bounds
        return centerX >= minX && centerX <= maxX && centerY >= minY && centerY <= maxY
      })

      // Unlock previously selected shapes
      if (selectedIdsRef.current.length > 0) {
        unlockShapes(selectedIdsRef.current)
      }

      // Set new selection and lock
      const newSelectedIds = selectedShapes.map(s => s.id)
      setSelectedIds(newSelectedIds)

      // Lock all newly selected shapes
      newSelectedIds.forEach(id => {
        sendMessage({
          type: 'SHAPE_UPDATE',
          payload: { shapeId: id, updates: { isLocked: true } },
        })
      })

      // Reset rect state
      setIsDrawingRect(false)
      setRectStart(null)
      setRectEnd(null)
    }
  }, [
    isDrawingLasso,
    lassoStart,
    lassoEnd,
    isDrawingRect,
    rectStart,
    rectEnd,
    shapes,
    selectedIdsRef,
    unlockShapes,
    setSelectedIds,
    sendMessage,
    setIsDrawingLasso,
    setLassoStart,
    setLassoEnd,
    setIsDrawingRect,
    setRectStart,
    setRectEnd,
  ])

  return {
    handleStageClick,
    handleMouseMove,
    handleWheel,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
  }
}

