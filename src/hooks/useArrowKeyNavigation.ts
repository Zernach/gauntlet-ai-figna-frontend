import { useEffect, useRef, useCallback } from 'react'
import type { Shape, WSMessage } from '../types/canvas'

interface UseArrowKeyNavigationProps {
    selectedIds: string[]
    shapes: Shape[]
    onMoveShapes: (shapeIds: string[], deltaX: number, deltaY: number) => void
    pushHistory: (entry: { undo: WSMessage; redo: WSMessage; label: string }) => void
    enabled?: boolean
}

const MOVE_SPEED = 5 // pixels per step
const MOVE_INTERVAL = 50 // milliseconds between continuous movements

export function useArrowKeyNavigation({
    selectedIds,
    shapes,
    onMoveShapes,
    pushHistory,
    enabled = true,
}: UseArrowKeyNavigationProps) {
    const keysPressed = useRef<Set<string>>(new Set())
    const moveIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const initialPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())
    const currentDeltaRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

    const getDelta = useCallback(() => {
        let deltaX = 0
        let deltaY = 0

        if (keysPressed.current.has('ArrowLeft')) deltaX -= MOVE_SPEED
        if (keysPressed.current.has('ArrowRight')) deltaX += MOVE_SPEED
        if (keysPressed.current.has('ArrowUp')) deltaY -= MOVE_SPEED
        if (keysPressed.current.has('ArrowDown')) deltaY += MOVE_SPEED

        return { deltaX, deltaY }
    }, [])

    const moveSelectedShapes = useCallback(() => {
        if (selectedIds.length === 0 || keysPressed.current.size === 0) return

        const { deltaX, deltaY } = getDelta()
        if (deltaX === 0 && deltaY === 0) return

        // Track cumulative delta for history
        currentDeltaRef.current.x += deltaX
        currentDeltaRef.current.y += deltaY

        onMoveShapes(selectedIds, deltaX, deltaY)
    }, [selectedIds, onMoveShapes, getDelta])

    const startMoving = useCallback(() => {
        // Clear any existing interval
        if (moveIntervalRef.current) {
            clearInterval(moveIntervalRef.current)
            moveIntervalRef.current = null
        }

        // Store initial positions for undo/redo
        if (initialPositionsRef.current.size === 0) {
            selectedIds.forEach(id => {
                const shape = shapes.find(s => s.id === id)
                if (shape) {
                    initialPositionsRef.current.set(id, { x: shape.x, y: shape.y })
                }
            })
        }

        // Immediate first move
        moveSelectedShapes()

        // Start continuous movement
        moveIntervalRef.current = setInterval(() => {
            moveSelectedShapes()
        }, MOVE_INTERVAL)
    }, [selectedIds, shapes, moveSelectedShapes])

    const stopMoving = useCallback(() => {
        if (moveIntervalRef.current) {
            clearInterval(moveIntervalRef.current)
            moveIntervalRef.current = null
        }

        // Create history entry if shapes were moved
        if (initialPositionsRef.current.size > 0 && (currentDeltaRef.current.x !== 0 || currentDeltaRef.current.y !== 0)) {
            const deltaX = currentDeltaRef.current.x
            const deltaY = currentDeltaRef.current.y

            // Create undo/redo messages for all moved shapes
            selectedIds.forEach(id => {
                const initialPos = initialPositionsRef.current.get(id)
                if (initialPos) {
                    const finalPos = {
                        x: initialPos.x + deltaX,
                        y: initialPos.y + deltaY,
                    }

                    pushHistory({
                        undo: {
                            type: 'SHAPE_UPDATE',
                            payload: { shapeId: id, updates: { x: initialPos.x, y: initialPos.y } }
                        },
                        redo: {
                            type: 'SHAPE_UPDATE',
                            payload: { shapeId: id, updates: { x: finalPos.x, y: finalPos.y } }
                        },
                        label: 'Move shape with arrow keys',
                    })
                }
            })

            // Reset tracking
            initialPositionsRef.current.clear()
            currentDeltaRef.current = { x: 0, y: 0 }
        }
    }, [selectedIds, pushHistory])

    useEffect(() => {
        if (!enabled) return

        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle arrow keys when shapes are selected
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
            if (selectedIds.length === 0) return

            // Prevent default scrolling behavior
            e.preventDefault()

            // Ignore if key is already pressed (avoid repeat events)
            if (keysPressed.current.has(e.key)) return

            keysPressed.current.add(e.key)
            startMoving()
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return

            keysPressed.current.delete(e.key)

            // If no arrow keys are pressed anymore, stop moving
            if (keysPressed.current.size === 0) {
                stopMoving()
            } else {
                // If other arrow keys are still pressed, update the interval with new direction
                if (moveIntervalRef.current) {
                    clearInterval(moveIntervalRef.current)
                    moveIntervalRef.current = setInterval(moveSelectedShapes, MOVE_INTERVAL)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
            if (moveIntervalRef.current) {
                clearInterval(moveIntervalRef.current)
            }
        }
    }, [enabled, selectedIds, startMoving, stopMoving, moveSelectedShapes])

    // Cleanup on unmount or when selection changes
    useEffect(() => {
        return () => {
            stopMoving()
        }
    }, [selectedIds, stopMoving])

    return null
}

