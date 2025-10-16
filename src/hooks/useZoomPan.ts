import { useState, useRef, useCallback, useEffect } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types/canvas'

interface UseZoomPanProps {
    viewportWidth: number
    viewportHeight: number
    initialScale?: number
    minScale?: number
    maxScale?: number
}

export function useZoomPan({
    viewportWidth,
    viewportHeight,
    initialScale = 1,
    minScale = 0.1,
    maxScale = 3
}: UseZoomPanProps) {
    const [stageScale, setStageScale] = useState(initialScale)
    const [stagePos, setStagePos] = useState({
        x: viewportWidth / 2 - CANVAS_WIDTH / 2,
        y: viewportHeight / 2 - CANVAS_HEIGHT / 2
    })

    // Animation refs
    const zoomAnimRafRef = useRef<number | null>(null)
    const zoomAnimStartRef = useRef<number>(0)
    const zoomFromScaleRef = useRef<number>(1)
    const zoomToScaleRef = useRef<number>(1)
    const zoomFromPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
    const zoomToPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

    // Continuous zoom (press-and-hold) refs
    const zoomHoldRafRef = useRef<number | null>(null)
    const zoomHoldActiveRef = useRef<boolean>(false)
    const zoomHoldDirectionRef = useRef<1 | -1>(1)
    const zoomHoldLastTsRef = useRef<number>(0)
    const stagePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

    // Keep stage position ref in sync
    useEffect(() => {
        stagePosRef.current = stagePos
    }, [stagePos])

    const easeInOutCubic = useCallback((t: number) => (
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    ), [])

    const clampStagePosition = useCallback((scale: number, desired: { x: number; y: number }) => {
        const scaledWidth = CANVAS_WIDTH * scale
        const scaledHeight = CANVAS_HEIGHT * scale

        // If content smaller than viewport, center it on that axis
        let x: number
        if (scaledWidth <= viewportWidth) {
            x = (viewportWidth - scaledWidth) / 2
        } else {
            const minX = viewportWidth - scaledWidth
            const maxX = 0
            x = Math.max(minX, Math.min(desired.x, maxX))
        }

        let y: number
        if (scaledHeight <= viewportHeight) {
            y = (viewportHeight - scaledHeight) / 2
        } else {
            const minY = viewportHeight - scaledHeight
            const maxY = 0
            y = Math.max(minY, Math.min(desired.y, maxY))
        }

        return { x, y }
    }, [viewportWidth, viewportHeight])

    const computeAnchoredPosition = useCallback((
        oldScale: number,
        newScale: number,
        currentPos: { x: number; y: number },
        anchorScreen: { x: number; y: number }
    ) => {
        // Convert anchor screen point to canvas coordinates using old scale/pos
        const canvasPointX = (anchorScreen.x - currentPos.x) / oldScale
        const canvasPointY = (anchorScreen.y - currentPos.y) / oldScale
        // Compute new stage position so that the same canvas point stays under anchorScreen
        const desiredX = anchorScreen.x - canvasPointX * newScale
        const desiredY = anchorScreen.y - canvasPointY * newScale
        return clampStagePosition(newScale, { x: desiredX, y: desiredY })
    }, [clampStagePosition])

    const cancelZoomAnimation = useCallback(() => {
        if (zoomAnimRafRef.current != null) {
            cancelAnimationFrame(zoomAnimRafRef.current)
            zoomAnimRafRef.current = null
        }
    }, [])

    const animateZoomTo = useCallback((
        targetScale: number,
        anchor: { x: number; y: number },
        durationMs: number = 200
    ) => {
        cancelZoomAnimation()
        const startScale = stageScale
        const startPos = stagePos
        const targetPos = computeAnchoredPosition(startScale, targetScale, startPos, anchor)

        zoomAnimStartRef.current = performance.now()
        zoomFromScaleRef.current = startScale
        zoomToScaleRef.current = targetScale
        zoomFromPosRef.current = startPos
        zoomToPosRef.current = targetPos

        const step = () => {
            const now = performance.now()
            const t = Math.min(1, (now - zoomAnimStartRef.current) / durationMs)
            const k = easeInOutCubic(t)

            const s = zoomFromScaleRef.current + (zoomToScaleRef.current - zoomFromScaleRef.current) * k
            const x = zoomFromPosRef.current.x + (zoomToPosRef.current.x - zoomFromPosRef.current.x) * k
            const y = zoomFromPosRef.current.y + (zoomToPosRef.current.y - zoomFromPosRef.current.y) * k

            setStageScale(s)
            setStagePos({ x, y })

            if (t < 1) {
                zoomAnimRafRef.current = requestAnimationFrame(step)
            } else {
                zoomAnimRafRef.current = null
            }
        }

        zoomAnimRafRef.current = requestAnimationFrame(step)
    }, [cancelZoomAnimation, computeAnchoredPosition, easeInOutCubic, stagePos, stageScale])

    const startZoomHold = useCallback((direction: 1 | -1) => {
        zoomHoldDirectionRef.current = direction
        zoomHoldActiveRef.current = true
        zoomHoldLastTsRef.current = 0
        cancelZoomAnimation()

        const step = (ts: number) => {
            if (!zoomHoldActiveRef.current) {
                zoomHoldRafRef.current = null
                return
            }

            if (zoomHoldLastTsRef.current === 0) {
                zoomHoldLastTsRef.current = ts
                zoomHoldRafRef.current = requestAnimationFrame(step)
                return
            }

            const dt = ts - zoomHoldLastTsRef.current
            zoomHoldLastTsRef.current = ts

            const oldScale = stageScale
            const speedPerMs = 0.0007
            const factor = 1 + speedPerMs * dt
            let newScale = zoomHoldDirectionRef.current > 0 ? oldScale * factor : oldScale / factor
            newScale = Math.max(minScale, Math.min(maxScale, newScale))

            const anchor = { x: viewportWidth / 2, y: viewportHeight / 2 }
            const newPos = computeAnchoredPosition(oldScale, newScale, stagePosRef.current, anchor)

            setStageScale(newScale)
            setStagePos(newPos)

            zoomHoldRafRef.current = requestAnimationFrame(step)
        }

        zoomHoldRafRef.current = requestAnimationFrame(step)
    }, [cancelZoomAnimation, computeAnchoredPosition, viewportWidth, viewportHeight, stageScale, minScale, maxScale])

    const stopZoomHold = useCallback(() => {
        zoomHoldActiveRef.current = false
        zoomHoldLastTsRef.current = 0
        if (zoomHoldRafRef.current != null) {
            cancelAnimationFrame(zoomHoldRafRef.current)
            zoomHoldRafRef.current = null
        }
    }, [])

    // Handle window resize to update viewport dimensions and recalculate position
    useEffect(() => {
        const newPos = clampStagePosition(stageScale, stagePos)
        setStagePos(newPos)
    }, [viewportWidth, viewportHeight]) // Only run when viewport size changes

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (zoomHoldRafRef.current != null) {
                cancelAnimationFrame(zoomHoldRafRef.current)
                zoomHoldRafRef.current = null
            }
            if (zoomAnimRafRef.current != null) {
                cancelAnimationFrame(zoomAnimRafRef.current)
                zoomAnimRafRef.current = null
            }
            zoomHoldActiveRef.current = false
        }
    }, [])

    return {
        stageScale,
        setStageScale,
        stagePos,
        setStagePos,
        animateZoomTo,
        startZoomHold,
        stopZoomHold,
        clampStagePosition,
        computeAnchoredPosition,
        cancelZoomAnimation
    }
}

