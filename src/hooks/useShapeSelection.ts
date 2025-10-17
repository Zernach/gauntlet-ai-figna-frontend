import { useState, useCallback, useRef, useEffect } from 'react'

interface UseShapeSelectionProps {
    shapes: any[]
    shapesRef: React.MutableRefObject<any[]>
    currentUserIdRef: React.MutableRefObject<string | null>
    activeUsers: any[]
    isDragMoveRef: React.MutableRefObject<boolean>
    lastCursorActivityRef: React.MutableRefObject<number>
    showToast: (message: string, type?: 'info' | 'warning' | 'error' | 'success', duration?: number) => void
    sendMessage: (message: any) => void
    unlockShape: (shapeId: string) => void
}

export function useShapeSelection({
    shapes,
    shapesRef,
    currentUserIdRef,
    activeUsers,
    isDragMoveRef,
    lastCursorActivityRef,
    showToast,
    sendMessage,
    unlockShape
}: UseShapeSelectionProps) {

    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const selectedIdsRef = useRef<string[]>([])

    // Lasso mode state
    const [lassoMode, setLassoMode] = useState<boolean>(false)
    const [isDrawingLasso, setIsDrawingLasso] = useState<boolean>(false)
    const [lassoStart, setLassoStart] = useState<{ x: number; y: number } | null>(null)
    const [lassoEnd, setLassoEnd] = useState<{ x: number; y: number } | null>(null)

    // Handle shape selection
    const handleShapeClick = useCallback((id: string, event?: any) => {
        // Don't select if we just finished a drag move
        if (isDragMoveRef.current) {
            return
        }

        const shape = shapesRef.current.find(s => s.id === id)
        if (shape && shape.locked_at && shape.locked_by !== currentUserIdRef.current) {
            // Check if lock is still valid (not expired)
            const lockTime = new Date(shape.locked_at).getTime()
            const elapsed = (Date.now() - lockTime) / 1000
            if (elapsed < 10) {
                // Shape is still locked by another user
                // Show red error toast notification with user info
                const lockedByUser = activeUsers.find(u => u.userId === shape.locked_by)
                const userName = lockedByUser?.email?.split('@')[0] || lockedByUser?.displayName || lockedByUser?.username || 'another user'
                showToast(`This shape is locked and being edited by ${userName}`, 'error', 2500)
                return
            }
        }

        // Check if this is a multi-select (ctrl/cmd/shift key)
        const isMultiSelect = event?.evt?.ctrlKey || event?.evt?.metaKey || event?.evt?.shiftKey

        if (isMultiSelect) {
            // Toggle selection
            if (selectedIdsRef.current.includes(id)) {
                // Deselect and unlock
                unlockShape(id)
                setSelectedIds(prev => prev.filter(sid => sid !== id))
            } else {
                // Add to selection and lock
                setSelectedIds(prev => [...prev, id])
                sendMessage({
                    type: 'SHAPE_UPDATE',
                    payload: {
                        shapeId: id,
                        updates: { isLocked: true },
                    },
                })
            }
        } else {
            // Single selection - unlock all previously selected shapes
            selectedIdsRef.current.forEach(sid => {
                if (sid !== id) {
                    unlockShape(sid)
                }
            })

            // Set selected locally
            setSelectedIds([id])

            // Send lock message to server to notify other users
            sendMessage({
                type: 'SHAPE_UPDATE',
                payload: {
                    shapeId: id,
                    updates: { isLocked: true },
                },
            })
        }
    }, [isDragMoveRef, shapesRef, currentUserIdRef, activeUsers, showToast, sendMessage, unlockShape, selectedIdsRef])

    // Deselect all shapes
    const handleDeselectAll = useCallback(() => {
        // Unlock all currently selected shapes
        selectedIdsRef.current.forEach(sid => {
            unlockShape(sid)
        })
        setSelectedIds([])
    }, [unlockShape, selectedIdsRef])

    // Start lasso selection
    const handleLassoStart = useCallback((x: number, y: number) => {
        setIsDrawingLasso(true)
        setLassoStart({ x, y })
        setLassoEnd({ x, y })
    }, [])

    // Update lasso selection
    const handleLassoMove = useCallback((x: number, y: number) => {
        if (isDrawingLasso) {
            setLassoEnd({ x, y })
        }
    }, [isDrawingLasso])

    // End lasso selection
    const handleLassoEnd = useCallback(() => {
        if (!isDrawingLasso || !lassoStart || !lassoEnd) {
            setIsDrawingLasso(false)
            return
        }

        // Calculate bounding box of lasso
        const minX = Math.min(lassoStart.x, lassoEnd.x)
        const maxX = Math.max(lassoStart.x, lassoEnd.x)
        const minY = Math.min(lassoStart.y, lassoEnd.y)
        const maxY = Math.max(lassoStart.y, lassoEnd.y)

        // Find shapes within lasso bounds
        const shapesInBounds = shapes.filter(shape => {
            if (shape.type === 'circle') {
                return shape.x >= minX && shape.x <= maxX && shape.y >= minY && shape.y <= maxY
            } else if (shape.type === 'rectangle') {
                const shapeMinX = shape.x
                const shapeMaxX = shape.x + (shape.width || 0)
                const shapeMinY = shape.y
                const shapeMaxY = shape.y + (shape.height || 0)
                return shapeMinX <= maxX && shapeMaxX >= minX && shapeMinY <= maxY && shapeMaxY >= minY
            } else if (shape.type === 'text') {
                return shape.x >= minX && shape.x <= maxX && shape.y >= minY && shape.y <= maxY
            }
            return false
        })

        // Filter out shapes that are locked by other users
        const selectableShapes = shapesInBounds.filter(shape => {
            if (shape.locked_at && shape.locked_by !== currentUserIdRef.current) {
                const lockTime = new Date(shape.locked_at).getTime()
                const elapsed = (Date.now() - lockTime) / 1000
                if (elapsed < 10) {
                    // Shape is still locked by another user
                    return false
                }
            }
            return true
        })

        // Show warning if some shapes were locked
        const lockedCount = shapesInBounds.length - selectableShapes.length
        if (lockedCount > 0) {
            showToast(`${lockedCount} shape(s) are locked by other users`, 'warning', 2000)
        }

        // Unlock previously selected shapes that are not in the new selection
        const newSelectedIds = selectableShapes.map(s => s.id)
        selectedIdsRef.current.forEach(sid => {
            if (!newSelectedIds.includes(sid)) {
                unlockShape(sid)
            }
        })

        // Lock newly selected shapes
        selectableShapes.forEach(shape => {
            if (!selectedIdsRef.current.includes(shape.id)) {
                sendMessage({
                    type: 'SHAPE_UPDATE',
                    payload: {
                        shapeId: shape.id,
                        updates: { isLocked: true },
                    },
                })
            }
        })

        setSelectedIds(newSelectedIds)
        setIsDrawingLasso(false)
        setLassoStart(null)
        setLassoEnd(null)
    }, [isDrawingLasso, lassoStart, lassoEnd, shapes, currentUserIdRef, showToast, unlockShape, sendMessage, selectedIdsRef])

    // Keep selectedIdsRef in sync
    selectedIdsRef.current = selectedIds

    // Automatically deselect shapes when their locks expire AND user is inactive
    useEffect(() => {
        if (selectedIds.length === 0) return

        // Check every 100ms if any selected shapes should be deselected
        const interval = setInterval(() => {
            const now = Date.now()
            const timeSinceLastCursorActivity = now - lastCursorActivityRef.current
            const expiredSelections: string[] = []

            selectedIds.forEach(selectedId => {
                const shape = shapesRef.current.find(s => s.id === selectedId)
                if (!shape) {
                    // Shape no longer exists, mark for deselection
                    expiredSelections.push(selectedId)
                    return
                }

                // Check if this is a shape locked by the current user
                if (shape.locked_at && shape.locked_by === currentUserIdRef.current) {
                    const lockTime = new Date(shape.locked_at).getTime()
                    const lockElapsed = (now - lockTime) / 1000

                    // Only deselect if:
                    // 1. Lock has expired (>= 10 seconds)
                    // 2. User has been inactive (no cursor movement) for >= 5 seconds
                    if (lockElapsed >= 10 && timeSinceLastCursorActivity >= 5000) {
                        expiredSelections.push(selectedId)
                    }
                }
            })

            // If any selections have expired, deselect them
            if (expiredSelections.length > 0) {
                expiredSelections.forEach(id => unlockShape(id))
                setSelectedIds(prev => prev.filter(id => !expiredSelections.includes(id)))
            }
        }, 100)

        return () => clearInterval(interval)
    }, [selectedIds, shapesRef, currentUserIdRef, lastCursorActivityRef, unlockShape, setSelectedIds])

    return {
        selectedIds,
        setSelectedIds,
        selectedIdsRef,
        lassoMode,
        setLassoMode,
        isDrawingLasso,
        setIsDrawingLasso,
        lassoStart,
        setLassoStart,
        lassoEnd,
        setLassoEnd,
        handleShapeClick,
        handleDeselectAll,
        handleLassoStart,
        handleLassoMove,
        handleLassoEnd
    }
}

