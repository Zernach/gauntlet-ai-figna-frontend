import { useCallback, useRef, useEffect } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_SHAPE_SIZE, SHAPE_COLOR } from '../types/canvas'

interface UseShapeManagementProps {
    wsRef: React.MutableRefObject<WebSocket | null>
    canvasId: string | null
    currentUserId: string | null
    stagePos: { x: number; y: number }
    stageScale: number
    viewportWidth: number
    viewportHeight: number
    sendMessage: (msg: any) => void
    showToast: (message: string, type?: 'info' | 'warning' | 'error' | 'success', duration?: number) => void
    pushHistory: (entry: any) => void
    shapesRef: React.MutableRefObject<any[]>
    currentUserIdRef: React.MutableRefObject<string | null>
    canvasIdRef: React.MutableRefObject<string | null>
}

export function useShapeManagement({
    wsRef,
    canvasId: _canvasId,
    currentUserId: _currentUserId,
    stagePos,
    stageScale,
    viewportWidth,
    viewportHeight,
    sendMessage,
    showToast,
    pushHistory,
    shapesRef,
    currentUserIdRef,
    canvasIdRef
}: UseShapeManagementProps) {

    // Refs to keep stable function references for external use
    const createShapesRef = useRef<((shapesData: any[]) => void) | null>(null)
    const unlockShapeRef = useRef<((shapeId: string) => void) | null>(null)
    const handleDeleteShapeRef = useRef<((shapeIds?: string[]) => void) | null>(null)

    // Handle shape creation (generic version for voice and UI) - now supports arrays
    const createShapes = useCallback((shapesData: any[]) => {
        console.log('🎨 [Canvas] createShapes called with:', shapesData.length, 'shape(s)')

        if (!wsRef.current || !canvasIdRef.current || !currentUserIdRef.current) {
            console.error('❌ [Canvas] Cannot create shapes - missing requirements:', {
                hasWs: !!wsRef.current,
                canvasId: canvasIdRef.current,
                currentUserId: currentUserIdRef.current
            })
            return
        }

        console.log('✅ [Canvas] Prerequisites met, processing shapes data')

        // Process each shape in the array
        shapesData.forEach((shapeData, index) => {
            console.log(`🎨 [Canvas] Processing shape ${index + 1}/${shapesData.length}:`, shapeData)

            // Ensure coordinates are within canvas boundaries
            let x = shapeData.x !== undefined ? shapeData.x : -stagePos.x / stageScale + (viewportWidth / 2) / stageScale
            let y = shapeData.y !== undefined ? shapeData.y : -stagePos.y / stageScale + (viewportHeight / 2) / stageScale

            console.log('📍 [Canvas] Coordinates for shape', index + 1, ':', { x, y })

            // Set default values based on shape type
            const defaults: any = {}

            if (shapeData.type === 'circle') {
                const radius = shapeData.radius || DEFAULT_SHAPE_SIZE / 2
                defaults.radius = radius
                defaults.color = shapeData.color || '#72fa41'
                x = Math.max(radius, Math.min(x, CANVAS_WIDTH - radius))
                y = Math.max(radius, Math.min(y, CANVAS_HEIGHT - radius))
            } else if (shapeData.type === 'text') {
                defaults.textContent = shapeData.textContent || 'Text'
                defaults.fontSize = shapeData.fontSize || 24
                defaults.fontFamily = shapeData.fontFamily || 'Inter'
                defaults.fontWeight = shapeData.fontWeight || 'normal'
                defaults.textAlign = shapeData.textAlign || 'left'
                defaults.color = shapeData.color || '#ffffff'
                x = Math.max(0, Math.min(x, CANVAS_WIDTH))
                y = Math.max(0, Math.min(y, CANVAS_HEIGHT))
            } else if (shapeData.type === 'rectangle') {
                const width = shapeData.width || DEFAULT_SHAPE_SIZE
                const height = shapeData.height || DEFAULT_SHAPE_SIZE
                defaults.width = width
                defaults.height = height
                defaults.color = shapeData.color || '#72fa41'
                x = Math.max(0, Math.min(x, CANVAS_WIDTH - width))
                y = Math.max(0, Math.min(y, CANVAS_HEIGHT - height))
            }

            // Set common defaults
            if (shapeData.opacity === undefined) defaults.opacity = 1
            if (shapeData.rotation === undefined) defaults.rotation = 0

            console.log(`📍 [Canvas] Clamped coordinates for shape ${index + 1}:`, { x, y })
            console.log(`🎨 [Canvas] Applied defaults for shape ${index + 1}:`, defaults)

            const finalShapeData = {
                type: shapeData.type,
                ...defaults,
                ...shapeData,
                x,
                y,
            }

            console.log(`📦 [Canvas] Final shape data for shape ${index + 1}:`, finalShapeData)

            sendMessage({
                type: 'SHAPE_CREATE',
                payload: finalShapeData,
            })
        })

        showToast(`${shapesData.length} shape(s) created!`, 'success', 2000)
        console.log(`✅ [Canvas] All ${shapesData.length} shape creation message(s) sent`)
    }, [stagePos, stageScale, showToast, viewportWidth, viewportHeight, sendMessage, wsRef, canvasIdRef, currentUserIdRef])

    // Handle shape creation from UI (rectangle button)
    const handleAddShape = useCallback(() => {
        const centerX = -stagePos.x / stageScale + (viewportWidth / 2) / stageScale
        const centerY = -stagePos.y / stageScale + (viewportHeight / 2) / stageScale

        createShapes([{
            type: 'rectangle',
            x: centerX - DEFAULT_SHAPE_SIZE / 2,
            y: centerY - DEFAULT_SHAPE_SIZE / 2,
            width: DEFAULT_SHAPE_SIZE,
            height: DEFAULT_SHAPE_SIZE,
            color: SHAPE_COLOR,
        }])
    }, [stagePos, stageScale, createShapes, viewportWidth, viewportHeight])

    // Handle circle creation from UI
    const handleAddCircle = useCallback(() => {
        const centerX = -stagePos.x / stageScale + (viewportWidth / 2) / stageScale
        const centerY = -stagePos.y / stageScale + (viewportHeight / 2) / stageScale

        createShapes([{
            type: 'circle',
            x: centerX,
            y: centerY,
            radius: DEFAULT_SHAPE_SIZE / 2,
            color: SHAPE_COLOR,
        }])
    }, [stagePos, stageScale, createShapes, viewportWidth, viewportHeight])

    // Handle text creation from UI
    const handleAddText = useCallback(() => {
        const centerX = -stagePos.x / stageScale + (viewportWidth / 2) / stageScale
        const centerY = -stagePos.y / stageScale + (viewportHeight / 2) / stageScale

        createShapes([{
            type: 'text',
            x: centerX,
            y: centerY,
            color: '#ffffff',
            textContent: 'Text',
            fontSize: 24,
            fontFamily: 'Inter',
            fontWeight: 'normal',
            textAlign: 'left',
        }])
    }, [stagePos, stageScale, createShapes, viewportWidth, viewportHeight])

    // Handle text edit on double click
    const handleTextDoubleClick = useCallback((id: string) => {
        const s = shapesRef.current.find(sh => sh.id === id)
        if (!s) return

        if (s.locked_at && s.locked_by && s.locked_by !== currentUserIdRef.current) {
            const lockTime = new Date(s.locked_at).getTime()
            const elapsed = (Date.now() - lockTime) / 1000
            if (elapsed < 10) return
        }

        const currentText = (s as any).textContent ?? (s as any).text_content ?? ''
        const newText = window.prompt('Edit text', String(currentText))
        if (newText == null) return

        if (wsRef.current) {
            if (newText !== currentText) {
                pushHistory({
                    undo: { type: 'SHAPE_UPDATE', payload: { shapeId: id, updates: { textContent: currentText } } },
                    redo: { type: 'SHAPE_UPDATE', payload: { shapeId: id, updates: { textContent: newText } } },
                    label: 'Edit text',
                })
            }
            sendMessage({
                type: 'SHAPE_UPDATE',
                payload: {
                    shapeId: id,
                    updates: { textContent: newText },
                },
            })
        }
    }, [pushHistory, sendMessage, shapesRef, currentUserIdRef, wsRef])

    // Helper function to unlock a shape
    const unlockShape = useCallback((shapeId: string) => {
        sendMessage({
            type: 'SHAPE_UPDATE',
            payload: {
                shapeId,
                updates: {
                    isLocked: false,
                },
            },
        })
    }, [sendMessage])

    // Handle shape deletion
    const handleDeleteShape = useCallback((shapeIds?: string[]) => {
        if (!wsRef.current) return

        const idsToDelete = shapeIds || []

        if (idsToDelete.length === 0) return

        // Send delete message for each shape
        idsToDelete.forEach(shapeId => {
            sendMessage({
                type: 'SHAPE_DELETE',
                payload: { shapeId }
            })
        })
    }, [sendMessage, wsRef])

    // Keep tool function refs in sync with latest function versions
    useEffect(() => {
        createShapesRef.current = createShapes
    }, [createShapes])

    useEffect(() => {
        unlockShapeRef.current = unlockShape
    }, [unlockShape])

    useEffect(() => {
        handleDeleteShapeRef.current = handleDeleteShape
    }, [handleDeleteShape])

    return {
        createShapes,
        handleAddShape,
        handleAddCircle,
        handleAddText,
        handleTextDoubleClick,
        unlockShape,
        handleDeleteShape,
        createShapesRef,
        unlockShapeRef,
        handleDeleteShapeRef
    }
}

