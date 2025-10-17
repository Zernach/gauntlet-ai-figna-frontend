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
    const zoomAnchorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
    const zoomPrevScaleRef = useRef<number>(1)
    const zoomPrevPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

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

    const clampStagePosition = useCallback((scale: number, desired: { x: number; y: number }, preserveAnchor: boolean = false) => {
        const scaledWidth = CANVAS_WIDTH * scale
        const scaledHeight = CANVAS_HEIGHT * scale

        let x: number
        if (scaledWidth <= viewportWidth) {
            // Canvas is smaller than viewport
            if (preserveAnchor) {
                // During zoom, use desired position to maintain anchor point
                x = desired.x
            } else {
                // During other operations (resize, etc), center it
                x = (viewportWidth - scaledWidth) / 2
            }
        } else {
            // Canvas is larger than viewport - clamp to keep it visible
            const minX = viewportWidth - scaledWidth  // Left edge of canvas at right edge of viewport
            const maxX = 0  // Left edge of canvas at left edge of viewport
            x = Math.max(minX, Math.min(desired.x, maxX))
        }

        let y: number
        if (scaledHeight <= viewportHeight) {
            // Canvas is smaller than viewport
            if (preserveAnchor) {
                // During zoom, use desired position to maintain anchor point
                y = desired.y
            } else {
                // During other operations (resize, etc), center it
                y = (viewportHeight - scaledHeight) / 2
            }
        } else {
            // Canvas is larger than viewport - clamp to keep it visible
            const minY = viewportHeight - scaledHeight  // Top edge of canvas at bottom edge of viewport
            const maxY = 0  // Top edge of canvas at top edge of viewport
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
        // Preserve anchor point during zoom by preventing forced centering
        return clampStagePosition(newScale, { x: desiredX, y: desiredY }, true)
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

        zoomAnimStartRef.current = performance.now()
        zoomFromScaleRef.current = startScale
        zoomToScaleRef.current = targetScale
        zoomAnchorRef.current = anchor

        // Initialize previous scale and position for first frame
        zoomPrevScaleRef.current = startScale
        zoomPrevPosRef.current = startPos

        const step = () => {
            const now = performance.now()
            const t = Math.min(1, (now - zoomAnimStartRef.current) / durationMs)
            const k = easeInOutCubic(t)

            // Interpolate scale
            const newScale = zoomFromScaleRef.current + (zoomToScaleRef.current - zoomFromScaleRef.current) * k

            // Compute position based on previous frame to maintain anchor point
            const newPos = computeAnchoredPosition(
                zoomPrevScaleRef.current,
                newScale,
                zoomPrevPosRef.current,
                zoomAnchorRef.current
            )

            // Update state
            setStageScale(newScale)
            setStagePos(newPos)

            // Store current values for next frame
            zoomPrevScaleRef.current = newScale
            zoomPrevPosRef.current = newPos

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

        // Track scale for continuous zoom
        let currentScale = stageScale

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

            const oldScale = currentScale
            const speedPerMs = 0.0007
            const factor = 1 + speedPerMs * dt
            let newScale = zoomHoldDirectionRef.current > 0 ? oldScale * factor : oldScale / factor
            newScale = Math.max(minScale, Math.min(maxScale, newScale))

            // Use the current screen position of the canvas center as the anchor
            const anchor = {
                x: stagePosRef.current.x + (CANVAS_WIDTH / 2) * oldScale,
                y: stagePosRef.current.y + (CANVAS_HEIGHT / 2) * oldScale
            }
            const newPos = computeAnchoredPosition(oldScale, newScale, stagePosRef.current, anchor)

            // Update current scale for next frame
            currentScale = newScale

            setStageScale(newScale)
            setStagePos(newPos)
            // Note: stagePosRef.current will be updated by useEffect, but for rapid updates
            // we should ensure it's updated before next frame
            stagePosRef.current = newPos

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

