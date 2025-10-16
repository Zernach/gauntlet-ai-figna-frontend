import { useState, useRef, useCallback, useEffect } from 'react'
import type Konva from 'konva'

const ZOOM_MIN = 0.1
const ZOOM_MAX = 10
const ZOOM_STEP = 0.05
const ZOOM_ANIMATION_DURATION = 150

interface UseZoomControlsProps {
  initialScale?: number
  viewportWidth: number
  viewportHeight: number
  canvasWidth: number
  canvasHeight: number
}

export function useZoomControls({
  initialScale = 1,
  viewportWidth,
  viewportHeight,
  canvasWidth,
  canvasHeight,
}: UseZoomControlsProps) {
  const [stageScale, setStageScale] = useState(initialScale)
  const [stagePos, setStagePos] = useState({
    x: viewportWidth / 2 - canvasWidth / 2,
    y: viewportHeight / 2 - canvasHeight / 2
  })
  const stagePosRef = useRef(stagePos)

  // Zoom animation refs
  const zoomAnimationRef = useRef<number | null>(null)
  const zoomStartScaleRef = useRef<number>(initialScale)
  const zoomTargetScaleRef = useRef<number>(initialScale)
  const zoomStartTimeRef = useRef<number>(0)
  const zoomCenterRef = useRef<{ x: number; y: number } | null>(null)

  // Continuous zoom (press-and-hold) refs
  const continuousZoomDirectionRef = useRef<number>(0)
  const continuousZoomIntervalRef = useRef<number | null>(null)
  const continuousZoomRafRef = useRef<number | null>(null)
  const continuousZoomAccumRef = useRef<number>(0)

  // Keep stage position ref in sync for continuous zoom calculations
  useEffect(() => {
    stagePosRef.current = stagePos
  }, [stagePos])

  // Easing function for smooth zoom
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3)
  }

  const animateZoom = useCallback((timestamp: number) => {
    const elapsed = timestamp - zoomStartTimeRef.current
    const progress = Math.min(elapsed / ZOOM_ANIMATION_DURATION, 1)
    const easedProgress = easeOutCubic(progress)

    const currentScale = zoomStartScaleRef.current + (zoomTargetScaleRef.current - zoomStartScaleRef.current) * easedProgress

    if (zoomCenterRef.current) {
      const center = zoomCenterRef.current
      const oldScale = zoomStartScaleRef.current
      const newScale = currentScale

      const mousePointTo = {
        x: (center.x - stagePosRef.current.x) / oldScale,
        y: (center.y - stagePosRef.current.y) / oldScale,
      }

      const newPos = {
        x: center.x - mousePointTo.x * newScale,
        y: center.y - mousePointTo.y * newScale,
      }

      setStagePos(newPos)
      stagePosRef.current = newPos
    }

    setStageScale(currentScale)

    if (progress < 1) {
      zoomAnimationRef.current = requestAnimationFrame(animateZoom)
    } else {
      zoomAnimationRef.current = null
      zoomCenterRef.current = null
    }
  }, [])

  const startZoomAnimation = useCallback((targetScale: number, center?: { x: number; y: number }) => {
    if (zoomAnimationRef.current) {
      cancelAnimationFrame(zoomAnimationRef.current)
    }

    const clampedTarget = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, targetScale))

    zoomStartScaleRef.current = stageScale
    zoomTargetScaleRef.current = clampedTarget
    zoomStartTimeRef.current = performance.now()
    zoomCenterRef.current = center || null

    zoomAnimationRef.current = requestAnimationFrame(animateZoom)
  }, [stageScale, animateZoom])

  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(ZOOM_MAX, stageScale + ZOOM_STEP * 3)
    startZoomAnimation(newScale, { x: viewportWidth / 2, y: viewportHeight / 2 })
  }, [stageScale, startZoomAnimation, viewportWidth, viewportHeight])

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(ZOOM_MIN, stageScale - ZOOM_STEP * 3)
    startZoomAnimation(newScale, { x: viewportWidth / 2, y: viewportHeight / 2 })
  }, [stageScale, startZoomAnimation, viewportWidth, viewportHeight])

  const handleResetView = useCallback(() => {
    startZoomAnimation(1, { x: viewportWidth / 2, y: viewportHeight / 2 })
    setStagePos({
      x: viewportWidth / 2 - canvasWidth / 2,
      y: viewportHeight / 2 - canvasHeight / 2
    })
  }, [startZoomAnimation, viewportWidth, viewportHeight, canvasWidth, canvasHeight])

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()

    const stage = e.target.getStage()
    if (!stage) return

    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, oldScale + direction * ZOOM_STEP))

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }

    setStageScale(newScale)
    setStagePos(newPos)
  }, [])

  const continuousZoomStep = useCallback(() => {
    if (continuousZoomDirectionRef.current === 0) return

    continuousZoomAccumRef.current += ZOOM_STEP * continuousZoomDirectionRef.current
    const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, stageScale + continuousZoomAccumRef.current))

    const center = { x: viewportWidth / 2, y: viewportHeight / 2 }
    const oldScale = stageScale
    const mousePointTo = {
      x: (center.x - stagePosRef.current.x) / oldScale,
      y: (center.y - stagePosRef.current.y) / oldScale,
    }

    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    }

    setStageScale(newScale)
    setStagePos(newPos)
    stagePosRef.current = newPos

    continuousZoomRafRef.current = requestAnimationFrame(continuousZoomStep)
  }, [stageScale, viewportWidth, viewportHeight])

  const startZoomHold = useCallback((direction: number) => {
    continuousZoomDirectionRef.current = direction
    continuousZoomAccumRef.current = 0
    
    if (continuousZoomIntervalRef.current) {
      clearInterval(continuousZoomIntervalRef.current)
    }
    if (continuousZoomRafRef.current) {
      cancelAnimationFrame(continuousZoomRafRef.current)
    }

    continuousZoomRafRef.current = requestAnimationFrame(continuousZoomStep)
  }, [continuousZoomStep])

  const stopZoomHold = useCallback(() => {
    continuousZoomDirectionRef.current = 0
    continuousZoomAccumRef.current = 0
    
    if (continuousZoomIntervalRef.current) {
      clearInterval(continuousZoomIntervalRef.current)
      continuousZoomIntervalRef.current = null
    }
    if (continuousZoomRafRef.current) {
      cancelAnimationFrame(continuousZoomRafRef.current)
      continuousZoomRafRef.current = null
    }
  }, [])

  // Clamp stage position to keep canvas visible
  const clampStagePosition = useCallback((scale: number, pos: { x: number; y: number }) => {
    // Allow some overflow to make panning feel natural
    const padding = 200
    
    const minX = -canvasWidth * scale + padding
    const maxX = viewportWidth - padding
    const minY = -canvasHeight * scale + padding
    const maxY = viewportHeight - padding
    
    return {
      x: Math.max(minX, Math.min(maxX, pos.x)),
      y: Math.max(minY, Math.min(maxY, pos.y))
    }
  }, [canvasWidth, canvasHeight, viewportWidth, viewportHeight])

  // Handle minimap navigation
  const handleMinimapNavigate = useCallback((canvasX: number, canvasY: number) => {
    // Calculate new stage position to center the viewport on the clicked canvas coordinates
    const newX = -(canvasX * stageScale) + (viewportWidth / 2)
    const newY = -(canvasY * stageScale) + (viewportHeight / 2)

    // Clamp to canvas boundaries
    const clampedPos = clampStagePosition(stageScale, { x: newX, y: newY })
    setStagePos(clampedPos)
  }, [stageScale, viewportWidth, viewportHeight, clampStagePosition])

  // Cleanup continuous zoom on unmount
  useEffect(() => {
    return () => {
      if (continuousZoomIntervalRef.current) {
        clearInterval(continuousZoomIntervalRef.current)
      }
      if (continuousZoomRafRef.current) {
        cancelAnimationFrame(continuousZoomRafRef.current)
      }
      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current)
      }
    }
  }, [])

  return {
    stageScale,
    stagePos,
    setStagePos,
    setStageScale,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    handleWheel,
    handleMinimapNavigate,
    startZoomHold,
    stopZoomHold,
    clampStagePosition,
  }
}

