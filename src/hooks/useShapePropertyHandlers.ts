import { useCallback } from 'react'
import type { Shape } from '../types/canvas'

interface UseShapePropertyHandlersProps {
  wsRef: React.MutableRefObject<WebSocket | null>
  selectedIds: string[]
  colorThrottleRef: React.MutableRefObject<number>
  opacityThrottleRef: React.MutableRefObject<number>
  shadowThrottleRef: React.MutableRefObject<number>
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>
  recordPropChange: (shapeId: string, propName: string, newValue: any) => void
  sendMessage: (message: any) => void
}

export function useShapePropertyHandlers({
  wsRef,
  selectedIds,
  colorThrottleRef,
  opacityThrottleRef,
  shadowThrottleRef,
  setShapes,
  recordPropChange,
  sendMessage,
}: UseShapePropertyHandlersProps) {

  const handleChangeColor = useCallback((hex: string) => {
    const selectedId = selectedIds[0]
    if (!selectedId || !wsRef.current) return
    // Optimistic local update
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, color: hex } : s))
    // Debounced history
    recordPropChange(selectedId, 'color', hex)
    const now = Date.now()
    if (now - colorThrottleRef.current > 50) {
      colorThrottleRef.current = now
      sendMessage({
        type: 'SHAPE_UPDATE',
        payload: { shapeId: selectedId, updates: { color: hex } },
      })
    }
  }, [selectedIds, colorThrottleRef, recordPropChange, sendMessage, setShapes, wsRef])

  const handleChangeOpacity = useCallback((opacity01: number) => {
    const selectedId = selectedIds[0]
    if (!selectedId || !wsRef.current) return
    const clamped = Math.max(0, Math.min(1, opacity01))
    // Optimistic
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, opacity: clamped } : s))
    recordPropChange(selectedId, 'opacity', clamped)
    const now = Date.now()
    if (now - opacityThrottleRef.current > 50) {
      opacityThrottleRef.current = now
      sendMessage({
        type: 'SHAPE_UPDATE',
        payload: { shapeId: selectedId, updates: { opacity: clamped } },
      })
    }
  }, [selectedIds, opacityThrottleRef, recordPropChange, sendMessage, setShapes, wsRef])

  const handleCommitRotation = useCallback((rotationDeg: number) => {
    const selectedId = selectedIds[0]
    if (!selectedId || !wsRef.current) return
    const normalized = Math.round(rotationDeg)
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, rotation: normalized } : s))
    recordPropChange(selectedId, 'rotation', normalized)
    sendMessage({
      type: 'SHAPE_UPDATE',
      payload: { shapeId: selectedId, updates: { rotation: normalized } },
    })
  }, [selectedIds, recordPropChange, sendMessage, setShapes, wsRef])

  const handleChangeShadowColor = useCallback((hex: string) => {
    const selectedId = selectedIds[0]
    if (!selectedId || !wsRef.current) return
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, shadowColor: hex } : s))
    recordPropChange(selectedId, 'shadowColor', hex)
    sendMessage({
      type: 'SHAPE_UPDATE',
      payload: { shapeId: selectedId, updates: { shadowColor: hex } },
    })
  }, [selectedIds, recordPropChange, sendMessage, setShapes, wsRef])

  const handleChangeShadowStrength = useCallback((strength: number) => {
    const selectedId = selectedIds[0]
    if (!selectedId || !wsRef.current) return
    const v = Math.max(0, Math.min(50, Math.round(strength)))
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, shadowStrength: v } : s))
    recordPropChange(selectedId, 'shadowStrength', v)
    const now = Date.now()
    if (now - shadowThrottleRef.current > 50) {
      shadowThrottleRef.current = now
      sendMessage({
        type: 'SHAPE_UPDATE',
        payload: { shapeId: selectedId, updates: { shadowStrength: v } },
      })
    }
  }, [selectedIds, shadowThrottleRef, recordPropChange, sendMessage, setShapes, wsRef])

  const handleChangeFontFamily = useCallback((family: string) => {
    const selectedId = selectedIds[0]
    if (!selectedId || !wsRef.current) return
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, fontFamily: family } : s))
    recordPropChange(selectedId, 'fontFamily', family)
    sendMessage({
      type: 'SHAPE_UPDATE',
      payload: { shapeId: selectedId, updates: { fontFamily: family } },
    })
  }, [selectedIds, recordPropChange, sendMessage, setShapes, wsRef])

  const handleChangeFontWeight = useCallback((weight: string) => {
    const selectedId = selectedIds[0]
    if (!selectedId || !wsRef.current) return
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, fontWeight: weight } : s))
    recordPropChange(selectedId, 'fontWeight', weight)
    sendMessage({
      type: 'SHAPE_UPDATE',
      payload: { shapeId: selectedId, updates: { fontWeight: weight } },
    })
  }, [selectedIds, recordPropChange, sendMessage, setShapes, wsRef])

  const handleChangeBorderRadius = useCallback((borderRadius: number) => {
    const selectedId = selectedIds[0]
    if (!selectedId || !wsRef.current) return
    const v = Math.max(0, Math.min(100, Math.round(borderRadius)))
    console.log('🔴 Frontend sending border radius update:', { shapeId: selectedId, borderRadius: v })
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, borderRadius: v } : s))
    recordPropChange(selectedId, 'borderRadius', v)
    sendMessage({
      type: 'SHAPE_UPDATE',
      payload: { shapeId: selectedId, updates: { borderRadius: v } },
    })
  }, [selectedIds, recordPropChange, sendMessage, setShapes, wsRef])

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

