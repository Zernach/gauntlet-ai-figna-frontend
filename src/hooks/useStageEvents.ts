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
  shapes: Shape[]
  setIsDrawingLasso: React.Dispatch<React.SetStateAction<boolean>>
  setLassoStart: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>
  setLassoEnd: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  unlockShape: (shapeId: string) => void
  sendMessage: (message: any) => void
  animateZoomTo: (targetScale: number, anchor: { x: number; y: number }, duration: number) => void
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
  shapes,
  setIsDrawingLasso,
  setLassoStart,
  setLassoEnd,
  setSelectedIds,
  unlockShape,
  sendMessage,
  animateZoomTo,
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

    // Don't deselect if we're in lasso mode
    if (isDrawingLasso) {
      return
    }

    // If clicking on empty stage or canvas background, deselect
    const targetId = e.target.attrs?.id
    const isStageOrBackground = e.target === e.target.getStage() || targetId === 'canvas-background'

    if (isStageOrBackground) {
      // Unlock shapes before deselecting
      selectedIdsRef.current.forEach(id => unlockShape(id))
      setSelectedIds([])
    }
  }, [isDraggingShapeRef, justFinishedMultiDragRef, isDrawingLasso, selectedIdsRef, unlockShape, setSelectedIds])

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
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const scaleBy = 1.05
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
    newScale = Math.max(0.1, Math.min(3, newScale))

    // Use the viewport center as the anchor point
    // This keeps whatever is at the center of the screen fixed during zoom
    const anchor = {
      x: viewportWidth / 2,
      y: viewportHeight / 2
    }
    animateZoomTo(newScale, anchor, 150)
  }, [stageRef, viewportWidth, viewportHeight, animateZoomTo])

  const handleStageMouseDown = useCallback((e: any) => {
    // Check if shift/cmd is pressed or lasso mode is active
    const isLassoKey = e.evt?.shiftKey || e.evt?.metaKey
    const targetId = e.target.attrs?.id
    const isStageOrBackground = e.target === e.target.getStage() || targetId === 'canvas-background'

    if ((lassoMode || isLassoKey) && isStageOrBackground) {
      const stage = e.target.getStage()
      const pos = stage.getPointerPosition()
      if (!pos) return

      const canvasX = (pos.x - stage.x()) / stage.scaleX()
      const canvasY = (pos.y - stage.y()) / stage.scaleY()

      setIsDrawingLasso(true)
      setLassoStart({ x: canvasX, y: canvasY })
      setLassoEnd({ x: canvasX, y: canvasY })
    }
  }, [lassoMode, setIsDrawingLasso, setLassoStart, setLassoEnd])

  const handleStageMouseMove = useCallback((e: any) => {
    if (isDrawingLasso && lassoStart) {
      const stage = e.target.getStage()
      const pos = stage.getPointerPosition()
      if (!pos) return

      const canvasX = (pos.x - stage.x()) / stage.scaleX()
      const canvasY = (pos.y - stage.y()) / stage.scaleY()

      setLassoEnd({ x: canvasX, y: canvasY })
    }
  }, [isDrawingLasso, lassoStart, setLassoEnd])

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
      selectedIdsRef.current.forEach(id => unlockShape(id))

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
    }

    // Reset lasso state
    setIsDrawingLasso(false)
    setLassoStart(null)
    setLassoEnd(null)
  }, [
    isDrawingLasso,
    lassoStart,
    lassoEnd,
    shapes,
    selectedIdsRef,
    unlockShape,
    setSelectedIds,
    sendMessage,
    setIsDrawingLasso,
    setLassoStart,
    setLassoEnd,
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

