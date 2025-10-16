import { useCallback } from 'react'
import type { Shape } from '../types/canvas'
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_SHAPE_SIZE } from '../types/canvas'

interface HistoryEntry {
  undo: any
  redo: any
  label: string
}

interface UseShapeResizeProps {
  shapesRef: React.RefObject<Shape[]>
  selectedIdsRef: React.RefObject<string[]>
  wsRef: React.RefObject<WebSocket | null>
  isResizingShapeRef: React.RefObject<boolean>
  resizingShapeIdRef: React.RefObject<string | null>
  resizeThrottleRef: React.RefObject<number>
  resizeBaselineRef: React.RefObject<Map<string, any>>
  recentlyResizedRef: React.RefObject<Map<string, { x?: number; y?: number; width?: number; height?: number; radius?: number; fontSize?: number; timestamp: number }>>
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  unlockShape: (shapeId: string) => void
  pushHistory: (entry: HistoryEntry) => void
  sendMessage: (message: any) => void
}

export function useShapeResize({
  shapesRef,
  selectedIdsRef,
  wsRef,
  isResizingShapeRef,
  resizingShapeIdRef,
  resizeThrottleRef,
  resizeBaselineRef,
  recentlyResizedRef,
  setShapes,
  setSelectedIds,
  unlockShape,
  pushHistory,
  sendMessage,
}: UseShapeResizeProps) {
  
  const handleResizeStart = useCallback((id: string) => {
    if (!wsRef.current) return
    isResizingShapeRef.current = true
    resizingShapeIdRef.current = id
    // Select and lock immediately
    if (!selectedIdsRef.current.includes(id)) {
      selectedIdsRef.current.forEach(sid => unlockShape(sid))
      setSelectedIds([id])
    }
    const s = shapesRef.current.find(sh => sh.id === id)
    if (s) {
      if (s.type === 'circle') {
        resizeBaselineRef.current.set(id, { radius: s.radius })
      } else if (s.type === 'text') {
        const fs = (s as any).fontSize ?? (s as any).font_size ?? 24
        resizeBaselineRef.current.set(id, { fontSize: fs })
      } else {
        resizeBaselineRef.current.set(id, { x: s.x, y: s.y, width: s.width, height: s.height })
      }
    }
    sendMessage({
      type: 'SHAPE_UPDATE',
      payload: {
        shapeId: id,
        updates: { isLocked: true },
      },
    })
  }, [
    wsRef,
    isResizingShapeRef,
    resizingShapeIdRef,
    selectedIdsRef,
    shapesRef,
    resizeBaselineRef,
    unlockShape,
    setSelectedIds,
    sendMessage,
  ])

  const handleResizeMove = useCallback((id: string, updates: { x?: number; y?: number; width?: number; height?: number; radius?: number; fontSize?: number }) => {
    const shape = shapesRef.current.find(s => s.id === id)
    if (!shape) return

    const minRectSize = 10
    const minRadius = 5

    if (shape.type === 'circle') {
      const currentRadius = shape.radius || DEFAULT_SHAPE_SIZE / 2
      let newRadius = updates.radius !== undefined ? updates.radius : currentRadius
      newRadius = Math.max(minRadius, newRadius)
      // Constrain circle within canvas
      const maxRadius = Math.min(shape.x, shape.y, CANVAS_WIDTH - shape.x, CANVAS_HEIGHT - shape.y)
      newRadius = Math.min(newRadius, Math.max(minRadius, maxRadius))

      // Optimistic update
      setShapes(prev => prev.map(s => s.id === id ? { ...s, radius: newRadius } : s))

      const now = Date.now()
      if (now - resizeThrottleRef.current > 50) {
        resizeThrottleRef.current = now
        sendMessage({
          type: 'SHAPE_UPDATE',
          payload: { shapeId: id, updates: { radius: newRadius } },
        })
      }
      return
    }

    // Text proportional resize via fontSize
    if (shape.type === 'text' && updates.fontSize !== undefined) {
      const newFontSize = Math.max(8, Math.min(512, Math.round(updates.fontSize)))
      // Optimistic update
      setShapes(prev => prev.map(s => s.id === id ? { ...s, fontSize: newFontSize } : s))

      const now = Date.now()
      if (now - resizeThrottleRef.current > 50) {
        resizeThrottleRef.current = now
        sendMessage({
          type: 'SHAPE_UPDATE',
          payload: { shapeId: id, updates: { fontSize: newFontSize } },
        })
      }
      return
    }

    // Rectangle resize
    const currentW = shape.width || DEFAULT_SHAPE_SIZE
    const currentH = shape.height || DEFAULT_SHAPE_SIZE
    let newX = updates.x !== undefined ? updates.x : shape.x
    let newY = updates.y !== undefined ? updates.y : shape.y
    let newW = updates.width !== undefined ? updates.width : currentW
    let newH = updates.height !== undefined ? updates.height : currentH

    // Clamp position to canvas
    newX = Math.max(0, newX)
    newY = Math.max(0, newY)
    // Clamp size to min
    newW = Math.max(minRectSize, newW)
    newH = Math.max(minRectSize, newH)
    // Clamp size to stay within canvas bounds
    newW = Math.min(newW, CANVAS_WIDTH - newX)
    newH = Math.min(newH, CANVAS_HEIGHT - newY)

    // Optimistic update
    setShapes(prev => prev.map(s => s.id === id ? { ...s, x: newX, y: newY, width: newW, height: newH } : s))

    const now = Date.now()
    if (now - resizeThrottleRef.current > 50) {
      resizeThrottleRef.current = now
      sendMessage({
        type: 'SHAPE_UPDATE',
        payload: { shapeId: id, updates: { x: newX, y: newY, width: newW, height: newH } },
      })
    }
  }, [
    shapesRef,
    resizeThrottleRef,
    setShapes,
    sendMessage,
  ])

  const handleResizeEnd = useCallback((id: string) => {
    if (!wsRef.current) return
    // Send final geometry
    const s = shapesRef.current.find(sh => sh.id === id)
    if (s) {
      const updates: any = {}
      if (s.type === 'circle') {
        updates.radius = s.radius
      } else if (s.type === 'text') {
        const fs = (s as any).fontSize ?? (s as any).font_size ?? 24
        updates.fontSize = Math.max(8, Math.min(512, Math.round(fs)))
      } else {
        updates.x = s.x
        updates.y = s.y
        updates.width = s.width
        updates.height = s.height
      }
      // Record the final geometry BEFORE sending to prevent any race conditions
      recentlyResizedRef.current.set(id, {
        ...updates,
        timestamp: Date.now(),
      })

      sendMessage({ type: 'SHAPE_UPDATE', payload: { shapeId: id, updates } })

      const base = resizeBaselineRef.current.get(id)
      if (base) {
        let before: any = {}
        let after: any = {}
        if (s.type === 'circle') {
          before = { radius: base.radius }
          after = { radius: updates.radius }
        } else if (s.type === 'text') {
          before = { fontSize: base.fontSize }
          after = { fontSize: updates.fontSize }
        } else {
          before = { x: base.x, y: base.y, width: base.width, height: base.height }
          after = { x: updates.x, y: updates.y, width: updates.width, height: updates.height }
        }
        const changed = Object.keys(after).some(k => (before as any)[k] !== (after as any)[k])
        if (changed) {
          pushHistory({
            undo: { type: 'SHAPE_UPDATE', payload: { shapeId: id, updates: before } },
            redo: { type: 'SHAPE_UPDATE', payload: { shapeId: id, updates: after } },
            label: 'Resize shape',
          })
        }
      }
    }

    // Delay clearing the resizing flag to ensure all pending server updates are absorbed
    // Keep the flag active for a brief moment to prevent race conditions
    const clearedShapeId = id
    setTimeout(() => {
      // Only clear if we're still on the same shape (not already resizing a different one)
      if (resizingShapeIdRef.current === clearedShapeId) {
        isResizingShapeRef.current = false
        resizingShapeIdRef.current = null
        resizeThrottleRef.current = 0
      }
      resizeBaselineRef.current.delete(clearedShapeId)
    }, 100)

    // Unlock and deselect
    unlockShape(id)
    setSelectedIds([])
  }, [
    wsRef,
    shapesRef,
    recentlyResizedRef,
    resizeBaselineRef,
    isResizingShapeRef,
    resizingShapeIdRef,
    resizeThrottleRef,
    sendMessage,
    pushHistory,
    unlockShape,
    setSelectedIds,
  ])

  return {
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  }
}

