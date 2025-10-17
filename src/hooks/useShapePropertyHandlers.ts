import { useCallback, useRef } from 'react'
import type { Shape } from '../types/canvas'

interface UseShapePropertyHandlersProps {
  wsRef: React.MutableRefObject<WebSocket | null>
  selectedIds: string[]
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>
  recordPropChange: (shapeId: string, propName: string, newValue: any) => void
  sendMessage: (message: any) => void
  recentlyModifiedPropsRef: React.MutableRefObject<Map<string, { props: Partial<Shape>; timestamp: number }>>
}

// Batching mechanism to coalesce rapid property updates
interface PendingUpdate {
  shapeId: string
  updates: Partial<Shape>
  timer: number
}

export function useShapePropertyHandlers({
  wsRef,
  selectedIds,
  setShapes,
  recordPropChange,
  sendMessage,
  recentlyModifiedPropsRef,
}: UseShapePropertyHandlersProps) {

  // Pending updates map - batches multiple property changes together
  const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map())

  // Helper to track recently modified properties with extended grace period
  const trackRecentlyModified = useCallback((shapeId: string, props: Partial<Shape>) => {
    const existing = recentlyModifiedPropsRef.current.get(shapeId)
    recentlyModifiedPropsRef.current.set(shapeId, {
      props: { ...existing?.props, ...props },
      timestamp: Date.now()
    })
  }, [recentlyModifiedPropsRef])

  // Debounced batch update sender - coalesces multiple property changes
  const scheduleBatchUpdate = useCallback((shapeId: string, updates: Partial<Shape>, debounceMs: number = 150) => {
    // Get existing pending update or create new one
    const existing = pendingUpdatesRef.current.get(shapeId)

    if (existing) {
      // Clear existing timer
      clearTimeout(existing.timer)
      // Merge new updates with existing pending updates
      existing.updates = { ...existing.updates, ...updates }
      // Schedule new timer
      existing.timer = window.setTimeout(() => {
        sendMessage({
          type: 'SHAPE_UPDATE',
          payload: { shapeId, updates: existing.updates },
        })
        pendingUpdatesRef.current.delete(shapeId)
      }, debounceMs)
    } else {
      // Create new pending update
      const timer = window.setTimeout(() => {
        sendMessage({
          type: 'SHAPE_UPDATE',
          payload: { shapeId, updates },
        })
        pendingUpdatesRef.current.delete(shapeId)
      }, debounceMs)

      pendingUpdatesRef.current.set(shapeId, {
        shapeId,
        updates,
        timer,
      })
    }
  }, [sendMessage])

  const handleChangeColor = useCallback((hex: string) => {
    const selectedId = selectedIds[0]
    if (!selectedId || !wsRef.current) return
    // Optimistic local update
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, color: hex } : s))
    // Track for extended grace period
    trackRecentlyModified(selectedId, { color: hex })
    // Debounced history
    recordPropChange(selectedId, 'color', hex)
    // Batch update with debouncing
    scheduleBatchUpdate(selectedId, { color: hex }, 150)
  }, [selectedIds, recordPropChange, setShapes, wsRef, trackRecentlyModified, scheduleBatchUpdate])

  const handleChangeOpacity = useCallback((opacity01: number) => {
    const selectedId = selectedIds[0]
    if (!selectedId || !wsRef.current) return
    const clamped = Math.max(0, Math.min(1, opacity01))
    // Optimistic
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, opacity: clamped } : s))
    // Track for extended grace period
    trackRecentlyModified(selectedId, { opacity: clamped })
    recordPropChange(selectedId, 'opacity', clamped)
    // Batch update with debouncing
    scheduleBatchUpdate(selectedId, { opacity: clamped }, 100)
  }, [selectedIds, recordPropChange, setShapes, wsRef, trackRecentlyModified, scheduleBatchUpdate])

  const handleCommitRotation = useCallback((rotationDeg: number) => {
    const selectedId = selectedIds[0]
    if (!selectedId || !wsRef.current) return
    const normalized = Math.round(rotationDeg)
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, rotation: normalized } : s))
    // Track for extended grace period
    trackRecentlyModified(selectedId, { rotation: normalized })
    recordPropChange(selectedId, 'rotation', normalized)
    // Batch update with debouncing for rotation changes
    scheduleBatchUpdate(selectedId, { rotation: normalized }, 150)
  }, [selectedIds, recordPropChange, setShapes, wsRef, trackRecentlyModified, scheduleBatchUpdate])

  const handleChangeShadowColor = useCallback((hex: string) => {
    const selectedId = selectedIds[0]
    if (!selectedId || !wsRef.current) return
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, shadowColor: hex } : s))
    // Track for extended grace period
    trackRecentlyModified(selectedId, { shadowColor: hex })
    recordPropChange(selectedId, 'shadowColor', hex)
    // Batch update with debouncing
    scheduleBatchUpdate(selectedId, { shadowColor: hex }, 150)
  }, [selectedIds, recordPropChange, setShapes, wsRef, trackRecentlyModified, scheduleBatchUpdate])

  const handleChangeShadowStrength = useCallback((strength: number) => {
    const selectedId = selectedIds[0]
    if (!selectedId || !wsRef.current) return
    const v = Math.max(0, Math.min(50, Math.round(strength)))
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, shadowStrength: v } : s))
    // Track for extended grace period
    trackRecentlyModified(selectedId, { shadowStrength: v })
    recordPropChange(selectedId, 'shadowStrength', v)
    // Batch update with debouncing
    scheduleBatchUpdate(selectedId, { shadowStrength: v }, 100)
  }, [selectedIds, recordPropChange, setShapes, wsRef, trackRecentlyModified, scheduleBatchUpdate])

  const handleChangeFontFamily = useCallback((family: string) => {
    const selectedId = selectedIds[0]
    if (!selectedId || !wsRef.current) return
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, fontFamily: family } : s))
    // Track for extended grace period
    trackRecentlyModified(selectedId, { fontFamily: family })
    recordPropChange(selectedId, 'fontFamily', family)
    // Batch update with debouncing
    scheduleBatchUpdate(selectedId, { fontFamily: family }, 150)
  }, [selectedIds, recordPropChange, setShapes, wsRef, trackRecentlyModified, scheduleBatchUpdate])

  const handleChangeFontWeight = useCallback((weight: string) => {
    const selectedId = selectedIds[0]
    if (!selectedId || !wsRef.current) return
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, fontWeight: weight } : s))
    // Track for extended grace period
    trackRecentlyModified(selectedId, { fontWeight: weight })
    recordPropChange(selectedId, 'fontWeight', weight)
    // Batch update with debouncing
    scheduleBatchUpdate(selectedId, { fontWeight: weight }, 150)
  }, [selectedIds, recordPropChange, setShapes, wsRef, trackRecentlyModified, scheduleBatchUpdate])

  const handleChangeBorderRadius = useCallback((borderRadius: number) => {
    const selectedId = selectedIds[0]
    if (!selectedId || !wsRef.current) return
    const v = Math.max(0, Math.min(100, Math.round(borderRadius)))
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, borderRadius: v } : s))
    // Track for extended grace period
    trackRecentlyModified(selectedId, { borderRadius: v })
    recordPropChange(selectedId, 'borderRadius', v)
    // Batch update with debouncing
    scheduleBatchUpdate(selectedId, { borderRadius: v }, 100)
  }, [selectedIds, recordPropChange, setShapes, wsRef, trackRecentlyModified, scheduleBatchUpdate])

  return {
    handleChangeColor,
    handleChangeOpacity,
    handleCommitRotation,
    handleChangeShadowColor,
    handleChangeShadowStrength,
    handleChangeBorderRadius,
    handleChangeFontFamily,
    handleChangeFontWeight,
  }
}

