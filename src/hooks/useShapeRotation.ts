import { useCallback } from 'react'
import type { Shape } from '../types/canvas'

interface HistoryEntry {
  undo: any
  redo: any
  label: string
}

interface UseShapeRotationProps {
  shapesRef: React.RefObject<Shape[]>
  selectedIdsRef: React.RefObject<string[]>
  wsRef: React.RefObject<WebSocket | null>
  isRotatingShapeRef: React.RefObject<boolean>
  rotatingShapeIdRef: React.RefObject<string | null>
  rotationThrottleRef: React.RefObject<number>
  rotationRafRef: React.RefObject<number | null>
  pendingRotationUpdatesRef: React.RefObject<Map<string, number>>
  rotationFrameScheduledRef: React.RefObject<boolean>
  rotateBaselineRef: React.RefObject<Map<string, number>>
  recentlyRotatedRef: React.RefObject<Map<string, { rotation: number; timestamp: number }>>
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  unlockShape: (shapeId: string) => void
  pushHistory: (entry: HistoryEntry) => void
  sendMessage: (message: any) => void
}

export function useShapeRotation({
  shapesRef,
  selectedIdsRef,
  wsRef,
  isRotatingShapeRef,
  rotatingShapeIdRef,
  rotationThrottleRef,
  rotationRafRef,
  pendingRotationUpdatesRef,
  rotationFrameScheduledRef,
  rotateBaselineRef,
  recentlyRotatedRef,
  setShapes,
  setSelectedIds,
  unlockShape,
  pushHistory,
  sendMessage,
}: UseShapeRotationProps) {
  
  const flushPendingRotationUpdates = useCallback(() => {
    rotationFrameScheduledRef.current = false
    const pending = pendingRotationUpdatesRef.current
    if (pending.size === 0) return

    // Only update the rotating shape to minimize re-renders
    const rotatingId = rotatingShapeIdRef.current
    if (!rotatingId) {
      pending.clear()
      return
    }

    const angle = pending.get(rotatingId)
    if (angle === undefined) {
      pending.clear()
      return
    }

    setShapes(prev => prev.map(s =>
      s.id === rotatingId ? { ...s, rotation: angle } : s
    ))
    pending.clear()
  }, [
    rotationFrameScheduledRef,
    pendingRotationUpdatesRef,
    rotatingShapeIdRef,
    setShapes,
  ])

  const handleRotateStart = useCallback((id: string) => {
    if (!wsRef.current) return
    // Select and lock immediately
    if (!selectedIdsRef.current.includes(id)) {
      selectedIdsRef.current.forEach(sid => unlockShape(sid))
      setSelectedIds([id])
    }
    isRotatingShapeRef.current = true
    rotatingShapeIdRef.current = id
    const s = shapesRef.current.find(sh => sh.id === id)
    if (s) {
      rotateBaselineRef.current.set(id, s.rotation ?? 0)
    }
    sendMessage({
      type: 'SHAPE_UPDATE',
      payload: { shapeId: id, updates: { isLocked: true } },
    })
  }, [
    wsRef,
    selectedIdsRef,
    shapesRef,
    isRotatingShapeRef,
    rotatingShapeIdRef,
    rotateBaselineRef,
    unlockShape,
    setSelectedIds,
    sendMessage,
  ])

  const handleRotateMove = useCallback((id: string, rotation: number) => {
    // Queue local rotation update; flush at most once per frame
    pendingRotationUpdatesRef.current.set(id, rotation)
    if (!rotationFrameScheduledRef.current) {
      rotationFrameScheduledRef.current = true
      rotationRafRef.current = requestAnimationFrame(flushPendingRotationUpdates)
    }

    // Throttle WebSocket rotation updates to 30fps (33ms) to reduce network overhead
    const now = Date.now()
    if (now - rotationThrottleRef.current < 33) return
    rotationThrottleRef.current = now

    sendMessage({
      type: 'SHAPE_UPDATE',
      payload: { shapeId: id, updates: { rotation } },
    })
  }, [
    pendingRotationUpdatesRef,
    rotationFrameScheduledRef,
    rotationRafRef,
    rotationThrottleRef,
    flushPendingRotationUpdates,
    sendMessage,
  ])

  const handleRotateEnd = useCallback((id: string) => {
    if (!wsRef.current) return
    // Send final rotation
    const s = shapesRef.current.find(sh => sh.id === id)
    if (s) {
      const finalRotation = s.rotation ?? 0

      // Record the final rotation BEFORE sending to prevent any race conditions
      recentlyRotatedRef.current.set(id, {
        rotation: finalRotation,
        timestamp: Date.now(),
      })

      sendMessage({
        type: 'SHAPE_UPDATE',
        payload: { shapeId: id, updates: { rotation: finalRotation } },
      })

      const base = rotateBaselineRef.current.get(id) ?? 0
      if (base !== finalRotation) {
        pushHistory({
          undo: { type: 'SHAPE_UPDATE', payload: { shapeId: id, updates: { rotation: base } } },
          redo: { type: 'SHAPE_UPDATE', payload: { shapeId: id, updates: { rotation: finalRotation } } },
          label: 'Rotate shape',
        })
      }
    }

    // Cleanup rotation batching
    if (rotationRafRef.current != null) {
      cancelAnimationFrame(rotationRafRef.current)
      rotationRafRef.current = null
    }
    pendingRotationUpdatesRef.current.clear()
    rotationFrameScheduledRef.current = false
    rotationThrottleRef.current = 0

    // Delay clearing the rotating flag to ensure all pending server updates are absorbed
    // Keep the flag active for a brief moment to prevent race conditions
    const clearedShapeId = id
    setTimeout(() => {
      // Only clear if we're still on the same shape (not already rotating a different one)
      if (rotatingShapeIdRef.current === clearedShapeId) {
        isRotatingShapeRef.current = false
        rotatingShapeIdRef.current = null
      }
      rotateBaselineRef.current.delete(clearedShapeId)
    }, 100)

    // Unlock and deselect
    unlockShape(id)
    setSelectedIds([])
  }, [
    wsRef,
    shapesRef,
    recentlyRotatedRef,
    rotationRafRef,
    pendingRotationUpdatesRef,
    rotationFrameScheduledRef,
    rotationThrottleRef,
    rotatingShapeIdRef,
    isRotatingShapeRef,
    rotateBaselineRef,
    unlockShape,
    setSelectedIds,
    sendMessage,
    pushHistory,
  ])

  return {
    handleRotateStart,
    handleRotateMove,
    handleRotateEnd,
    flushPendingRotationUpdates,
  }
}

