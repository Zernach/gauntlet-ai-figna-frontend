import { useCallback, useRef } from 'react'
import type { Shape, ActiveUser } from '../types/canvas'
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_SHAPE_SIZE } from '../types/canvas'

interface HistoryEntry {
  undo: any
  redo: any
  label: string
  timestamp?: number
  source?: 'user' | 'agent'
}

interface UseShapeDragProps {
  shapesRef: React.MutableRefObject<Shape[]>
  selectedIdsRef: React.MutableRefObject<string[]>
  currentUserIdRef: React.MutableRefObject<string | null>
  wsRef: React.MutableRefObject<WebSocket | null>
  isDraggingShapeRef: React.MutableRefObject<boolean>
  isShapeDragActiveRef: React.MutableRefObject<boolean>
  isDragMoveRef: React.MutableRefObject<boolean>
  justFinishedMultiDragRef: React.MutableRefObject<boolean>
  dragBaselineRef: React.MutableRefObject<Map<string, { x: number; y: number }>>
  multiDragOffsetsRef: React.MutableRefObject<Map<string, { dx: number; dy: number }>>
  dragPositionRef: React.MutableRefObject<{ shapeId: string; x: number; y: number } | null>
  dragThrottleRef: React.MutableRefObject<number>
  dragRafRef: React.MutableRefObject<number | null>
  pendingDragUpdatesRef: React.MutableRefObject<Map<string, { x: number; y: number }>>
  dragFrameScheduledRef: React.MutableRefObject<boolean>
  recentlyDraggedRef: React.MutableRefObject<Map<string, { x: number; y: number; timestamp: number }>>
  activeUsers: ActiveUser[]
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  unlockShapes: (shapeIds: string[]) => void
  pushHistory: (entry: HistoryEntry) => void
  showToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void
  sendMessage: (message: any) => void
}

export function useShapeDrag({
  shapesRef,
  selectedIdsRef,
  currentUserIdRef,
  wsRef,
  isDraggingShapeRef,
  isShapeDragActiveRef,
  isDragMoveRef,
  justFinishedMultiDragRef,
  dragBaselineRef,
  multiDragOffsetsRef,
  dragPositionRef,
  dragThrottleRef,
  dragRafRef,
  pendingDragUpdatesRef,
  dragFrameScheduledRef,
  recentlyDraggedRef,
  activeUsers,
  setShapes,
  setSelectedIds,
  unlockShapes,
  pushHistory,
  showToast,
  sendMessage,
}: UseShapeDragProps) {

  const flushPendingDragUpdates = useCallback(() => {
    dragFrameScheduledRef.current = false
    const pending = pendingDragUpdatesRef.current
    if (pending.size === 0) return
    setShapes(prev => prev.map(s => {
      const u = pending.get(s.id)
      return u ? { ...s, x: u.x, y: u.y } : s
    }))
    pending.clear()
  }, [dragFrameScheduledRef, pendingDragUpdatesRef, setShapes])

  // Track when drag actions start for accurate history timestamps
  const dragStartTimeRef = useRef<number>(0)

  const handleShapeDragStart = useCallback((id: string) => {
    if (!wsRef.current) return

    // Capture the timestamp when the drag actually starts
    dragStartTimeRef.current = Date.now()

    // Check if the shape is locked by another user
    const shape = shapesRef.current.find(s => s.id === id)
    if (shape && shape.locked_at && shape.locked_by !== currentUserIdRef.current) {
      // Check if lock is still valid (not expired)
      const lockTime = new Date(shape.locked_at).getTime()
      const elapsed = (Date.now() - lockTime) / 1000
      if (elapsed < 10) {
        // Shape is still locked by another user - prevent drag
        // Show red error toast notification with user info
        const lockedByUser = activeUsers.find(u => u.userId === shape.locked_by)
        const userName = lockedByUser?.email?.split('@')[0] || lockedByUser?.username || 'another user'
        showToast(`This shape is locked and being edited by ${userName}`, 'error', 2500)
        return
      }
    }

    // Set dragging flags to prevent stage click deselection and accidental selection
    isDraggingShapeRef.current = true
    isShapeDragActiveRef.current = true // Mark shape drag as active
    isDragMoveRef.current = false // Reset drag move flag
    justFinishedMultiDragRef.current = false // Reset multi-drag flag when starting new drag

    // Get all shapes in the same group as the dragged shape (if it has a group)
    const groupShapeIds: string[] = []
    if (shape && shape.group_id) {
      shapesRef.current.forEach(s => {
        if (s.group_id === shape.group_id) {
          groupShapeIds.push(s.id)
        }
      })
    }

    // Select the shape being dragged if not already selected
    // If shape is part of a group, select all group members
    if (!selectedIdsRef.current.includes(id)) {
      // Unlock previously selected shapes
      if (selectedIdsRef.current.length > 0) {
        unlockShapes(selectedIdsRef.current)
      }
      const shapesToSelect = groupShapeIds.length > 0 ? groupShapeIds : [id]
      setSelectedIds(shapesToSelect)
    }

    // Store baseline positions for all selected shapes
    const selectedShapes = shapesRef.current.filter(s => selectedIdsRef.current.includes(s.id))
    const primaryShape = shapesRef.current.find(sh => sh.id === id)

    if (primaryShape) {
      // Calculate offsets for multi-shape drag
      multiDragOffsetsRef.current.clear()
      selectedShapes.forEach(s => {
        dragBaselineRef.current.set(s.id, { x: s.x, y: s.y })
        if (s.id !== id) {
          // Store offset relative to primary dragged shape
          multiDragOffsetsRef.current.set(s.id, {
            dx: s.x - primaryShape.x,
            dy: s.y - primaryShape.y,
          })
        }
      })
    }

    // Send lock messages for all selected shapes
    selectedShapes.forEach(shape => {
      wsRef.current!.send(JSON.stringify({
        type: 'SHAPE_UPDATE',
        payload: {
          shapeId: shape.id,
          updates: {
            isLocked: true,
          },
        },
      }))
    })
  }, [
    wsRef,
    shapesRef,
    selectedIdsRef,
    currentUserIdRef,
    isDraggingShapeRef,
    isShapeDragActiveRef,
    isDragMoveRef,
    justFinishedMultiDragRef,
    dragBaselineRef,
    multiDragOffsetsRef,
    activeUsers,
    unlockShapes,
    setSelectedIds,
    showToast,
  ])

  const handleShapeDrag = useCallback((id: string, x: number, y: number) => {
    const shape = shapesRef.current.find(s => s.id === id)
    if (!shape) return

    // Mark that an actual drag move occurred
    isDragMoveRef.current = true

    let constrainedX: number
    let constrainedY: number

    // Constrain to canvas boundaries based on shape type
    if (shape.type === 'circle') {
      const radius = shape.radius || DEFAULT_SHAPE_SIZE / 2
      constrainedX = Math.max(radius, Math.min(x, CANVAS_WIDTH - radius))
      constrainedY = Math.max(radius, Math.min(y, CANVAS_HEIGHT - radius))
    } else {
      // Rectangle or other shapes
      const width = shape.width || DEFAULT_SHAPE_SIZE
      const height = shape.height || DEFAULT_SHAPE_SIZE
      constrainedX = Math.max(0, Math.min(x, CANVAS_WIDTH - width))
      constrainedY = Math.max(0, Math.min(y, CANVAS_HEIGHT - height))
    }

    // Check if multiple shapes are selected
    const selectedShapes = shapesRef.current.filter(s => selectedIdsRef.current.includes(s.id))

    if (selectedShapes.length > 1) {
      // Multi-shape drag: use stored offsets to maintain exact relative positioning
      const primaryNewX = constrainedX
      const primaryNewY = constrainedY

      // Calculate new positions for all shapes
      const newPositions = new Map<string, { x: number; y: number }>()

      selectedShapes.forEach(s => {
        let newX, newY

        if (s.id === id) {
          // Primary dragged shape
          newX = primaryNewX
          newY = primaryNewY
        } else {
          // Other shapes: use stored offset from primary shape
          const offset = multiDragOffsetsRef.current.get(s.id)
          if (offset) {
            newX = primaryNewX + offset.dx
            newY = primaryNewY + offset.dy
          } else {
            // Fallback (shouldn't happen)
            newX = s.x
            newY = s.y
          }
        }

        // Constrain each shape to canvas boundaries
        if (s.type === 'circle') {
          const radius = s.radius || DEFAULT_SHAPE_SIZE / 2
          newX = Math.max(radius, Math.min(newX, CANVAS_WIDTH - radius))
          newY = Math.max(radius, Math.min(newY, CANVAS_HEIGHT - radius))
        } else {
          const width = s.width || DEFAULT_SHAPE_SIZE
          const height = s.height || DEFAULT_SHAPE_SIZE
          newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - width))
          newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - height))
        }

        newPositions.set(s.id, { x: newX, y: newY })
      })

      // Immediately update only the non-primary shapes to keep them in sync with cursor
      // The primary shape is handled smoothly by Konva's drag system - don't interfere with it
      setShapes(prev => prev.map(s => {
        // Skip the primary shape - Konva handles it
        if (s.id === id) return s

        const pos = newPositions.get(s.id)
        return pos ? { ...s, x: pos.x, y: pos.y } : s
      }))

      // Store positions for WebSocket updates (including primary)
      newPositions.forEach((pos, shapeId) => {
        pendingDragUpdatesRef.current.set(shapeId, pos)
      })

      // Throttle WebSocket updates - send all shape updates in a single batch
      const now = Date.now()
      if (wsRef.current && now - dragThrottleRef.current > 33) {
        dragThrottleRef.current = now

        // Send batch update for all selected shapes
        selectedShapes.forEach(s => {
          const updates = pendingDragUpdatesRef.current.get(s.id)
          if (updates) {
            wsRef.current!.send(JSON.stringify({
              type: 'SHAPE_UPDATE',
              payload: {
                shapeId: s.id,
                updates: {
                  x: updates.x,
                  y: updates.y,
                },
              },
              timestamp: now,
            }))
          }
        })
      }

      // Store the primary drag position - use the actual position from newPositions
      // to ensure perfect sync with what we stored in pendingDragUpdatesRef
      const primaryFinalPos = newPositions.get(id)
      if (primaryFinalPos) {
        dragPositionRef.current = { shapeId: id, x: primaryFinalPos.x, y: primaryFinalPos.y }
      }
    } else {
      // Single shape drag (original behavior)
      pendingDragUpdatesRef.current.set(id, { x: constrainedX, y: constrainedY })
      if (!dragFrameScheduledRef.current) {
        dragFrameScheduledRef.current = true
        dragRafRef.current = requestAnimationFrame(flushPendingDragUpdates)
      }

      // Store the drag position
      dragPositionRef.current = { shapeId: id, x: constrainedX, y: constrainedY }

      // Throttle WebSocket updates to reduce network traffic (every 33ms for sub-100ms target)
      const now = Date.now()
      if (now - dragThrottleRef.current > 33) {
        dragThrottleRef.current = now

        sendMessage({
          type: 'SHAPE_UPDATE',
          payload: {
            shapeId: id,
            updates: {
              x: constrainedX,
              y: constrainedY,
            },
          },
        } as any)
      }
    }
  }, [
    shapesRef,
    selectedIdsRef,
    isDragMoveRef,
    multiDragOffsetsRef,
    pendingDragUpdatesRef,
    dragFrameScheduledRef,
    dragRafRef,
    dragPositionRef,
    dragThrottleRef,
    wsRef,
    setShapes,
    sendMessage,
    flushPendingDragUpdates,
  ])

  const handleShapeDragEnd = useCallback((id: string) => {
    if (!wsRef.current) return

    // Clear shape drag active flag immediately
    isShapeDragActiveRef.current = false

    // Clear dragging flag after a longer delay to prevent accidental clicks/deselections
    setTimeout(() => {
      isDraggingShapeRef.current = false
    }, 100)

    // Clear drag move flag after an even longer delay to prevent onClick from firing
    setTimeout(() => {
      isDragMoveRef.current = false
    }, 150)

    // Check if multiple shapes were dragged
    const selectedShapes = shapesRef.current.filter(s => selectedIdsRef.current.includes(s.id))

    if (selectedShapes.length > 1) {
      // Multi-shape drag end: Get actual final position from the dragged shape
      // and calculate final positions for all other shapes based on their offsets
      const primaryShape = shapesRef.current.find(s => s.id === id)

      if (!primaryShape) return

      // Get the actual final position - prefer dragPositionRef as it has the latest position
      const primaryFinalPos = dragPositionRef.current?.shapeId === id
        ? { x: dragPositionRef.current.x, y: dragPositionRef.current.y }
        : { x: primaryShape.x, y: primaryShape.y }

      // Calculate final positions for all shapes using the stored offsets
      const finalPositions = new Map<string, { x: number; y: number }>()
      finalPositions.set(id, primaryFinalPos)

      selectedShapes.forEach(shape => {
        if (shape.id !== id) {
          const offset = multiDragOffsetsRef.current.get(shape.id)
          if (offset) {
            const finalX = primaryFinalPos.x + offset.dx
            const finalY = primaryFinalPos.y + offset.dy
            finalPositions.set(shape.id, { x: finalX, y: finalY })
          }
        }
      })

      // Now process all shapes with their calculated final positions
      const undoMessages: any[] = []
      const redoMessages: any[] = []
      const timestamp = Date.now()

      selectedShapes.forEach(shape => {
        const finalPos = finalPositions.get(shape.id) || { x: shape.x, y: shape.y }
        const baseline = dragBaselineRef.current.get(shape.id)

        // Record the final position to prevent animation from server updates
        // Use a longer timestamp to ensure all updates are preserved
        recentlyDraggedRef.current.set(shape.id, {
          x: finalPos.x,
          y: finalPos.y,
          timestamp: timestamp,
        })

        // Send final position
        wsRef.current!.send(JSON.stringify({
          type: 'SHAPE_UPDATE',
          payload: {
            shapeId: shape.id,
            updates: {
              x: finalPos.x,
              y: finalPos.y,
            },
          },
        }))

        // Build undo/redo if position changed
        if (baseline && (baseline.x !== finalPos.x || baseline.y !== finalPos.y)) {
          undoMessages.push({
            type: 'SHAPE_UPDATE',
            payload: { shapeId: shape.id, updates: { x: baseline.x, y: baseline.y } },
          })
          redoMessages.push({
            type: 'SHAPE_UPDATE',
            payload: { shapeId: shape.id, updates: { x: finalPos.x, y: finalPos.y } },
          })
        }

        dragBaselineRef.current.delete(shape.id)
      })

      // Add multi-shape move to history with timestamp from when drag started
      if (undoMessages.length > 0) {
        pushHistory({
          undo: undoMessages,
          redo: redoMessages,
          label: `Move ${selectedShapes.length} shapes`,
          timestamp: dragStartTimeRef.current,
          source: 'user'
        })
      }

      // Update React state with final positions atomically for all shapes at once
      setShapes(prev => prev.map(s => {
        const finalPos = finalPositions.get(s.id)
        return finalPos ? { ...s, x: finalPos.x, y: finalPos.y } : s
      }))

      // Unlock all selected shapes
      unlockShapes(selectedShapes.map(shape => shape.id))

      // Mark that we just finished a multi-shape drag to prevent stage click from deselecting
      justFinishedMultiDragRef.current = true
      setTimeout(() => {
        justFinishedMultiDragRef.current = false
      }, 200)
    } else {
      // Single shape drag end (original behavior)
      const finalPos = dragPositionRef.current
      if (finalPos && finalPos.shapeId === id) {
        // Record the final position to prevent animation from server updates
        recentlyDraggedRef.current.set(id, {
          x: finalPos.x,
          y: finalPos.y,
          timestamp: Date.now(),
        })

        sendMessage({
          type: 'SHAPE_UPDATE',
          payload: {
            shapeId: id,
            updates: {
              x: finalPos.x,
              y: finalPos.y,
            },
          },
        })
        const base = dragBaselineRef.current.get(id)
        if (base && (base.x !== finalPos.x || base.y !== finalPos.y)) {
          pushHistory({
            undo: { type: 'SHAPE_UPDATE', payload: { shapeId: id, updates: { x: base.x, y: base.y } } },
            redo: { type: 'SHAPE_UPDATE', payload: { shapeId: id, updates: { x: finalPos.x, y: finalPos.y } } },
            label: 'Move shape',
            timestamp: dragStartTimeRef.current,
            source: 'user'
          })
        }
      }

      dragBaselineRef.current.delete(id)
      unlockShapes([id])
    }

    // Clear drag position
    dragPositionRef.current = null
    dragThrottleRef.current = 0
    multiDragOffsetsRef.current.clear()

    // Cancel any pending rAF and clear queued drag updates
    if (dragRafRef.current != null) {
      cancelAnimationFrame(dragRafRef.current)
      dragRafRef.current = null
    }
    pendingDragUpdatesRef.current.clear()
    dragFrameScheduledRef.current = false

    // Deselect shapes only if a single shape was selected
    // Multi-shape selections are maintained after drag
    if (selectedShapes.length === 1) {
      setSelectedIds([])
    }
  }, [
    wsRef,
    isShapeDragActiveRef,
    isDraggingShapeRef,
    isDragMoveRef,
    shapesRef,
    selectedIdsRef,
    pendingDragUpdatesRef,
    dragBaselineRef,
    recentlyDraggedRef,
    dragPositionRef,
    dragThrottleRef,
    multiDragOffsetsRef,
    dragRafRef,
    dragFrameScheduledRef,
    justFinishedMultiDragRef,
    pushHistory,
    setShapes,
    unlockShapes,
    setSelectedIds,
    sendMessage,
  ])

  return {
    handleShapeDragStart,
    handleShapeDrag,
    handleShapeDragEnd,
    flushPendingDragUpdates,
  }
}

