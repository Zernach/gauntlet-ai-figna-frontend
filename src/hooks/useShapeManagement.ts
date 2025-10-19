import { useCallback, useRef, useEffect } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_SHAPE_SIZE, SHAPE_COLOR } from '../types/canvas'
import { getProxiedImageUrl } from '../utils/imageProxy'

// Default stock image for new image shapes
const DEFAULT_STOCK_IMAGE = 'https://raw.githubusercontent.com/landscapesupply/images/refs/heads/main/products/sod/TifBlaire_Centipede_Grass_Sod_Sale_Landscape_Supply_App.png'

// Helper function to load an image and get its dimensions
async function loadImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight })
        }
        img.onerror = () => {
            // If image fails to load, return default dimensions
            resolve({ width: DEFAULT_SHAPE_SIZE, height: DEFAULT_SHAPE_SIZE })
        }
        img.src = url
    })
}

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
    const createShapesRef = useRef<((shapesData: any[]) => Promise<void>) | null>(null)
    const unlockShapesRef = useRef<((shapeIds: string[]) => void) | null>(null)
    const handleDeleteShapesRef = useRef<((shapeIds: string[]) => void) | null>(null)

    // Handle shape creation (generic version for voice and UI) - now supports arrays
    const createShapes = useCallback(async (shapesData: any[]) => {
        // Check WebSocket connection
        if (!wsRef.current) {
            showToast('Cannot create shape: Not connected to server', 'error')
            return
        }

        // Check canvas ID
        if (!canvasIdRef.current) {
            showToast('Cannot create shape: No canvas selected', 'error')
            return
        }

        // Check user ID
        if (!currentUserIdRef.current) {
            showToast('Cannot create shape: Not authenticated', 'error')
            return
        }

        // Sort shapes by z-index (lowest first) to ensure proper rendering order
        // Shapes without z-index will be treated as z-index 0
        const sortedShapesData = [...shapesData].sort((a, b) => {
            const zIndexA = a.zIndex !== undefined ? a.zIndex : 0
            const zIndexB = b.zIndex !== undefined ? b.zIndex : 0
            return zIndexA - zIndexB
        })

        // Process each shape in the array (now sorted by z-index)
        for (let index = 0; index < sortedShapesData.length; index++) {
            const shapeData = sortedShapesData[index]
            // Ensure coordinates are within canvas boundaries
            let x = shapeData.x !== undefined ? shapeData.x : -stagePos.x / stageScale + (viewportWidth / 2) / stageScale
            let y = shapeData.y !== undefined ? shapeData.y : -stagePos.y / stageScale + (viewportHeight / 2) / stageScale

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
            } else if (shapeData.type === 'image') {
                // IMPORTANT: Store the original image URL, NOT the proxied URL
                // The proxy is only used for rendering (CORS), not for storage
                const imageUrl = shapeData.imageUrl || DEFAULT_STOCK_IMAGE
                let width = shapeData.width
                let height = shapeData.height

                // If dimensions are not provided, load the image to get actual dimensions
                if (!width || !height) {
                    // Use proxied URL only for loading dimensions (CORS workaround)
                    const proxiedUrl = getProxiedImageUrl(imageUrl)
                    const dimensions = await loadImageDimensions(proxiedUrl)
                    width = dimensions.width
                    height = dimensions.height

                    // Scale down if image is too large (max 800px on longest side)
                    const maxSize = 800
                    if (width > maxSize || height > maxSize) {
                        const scale = maxSize / Math.max(width, height)
                        width = Math.round(width * scale)
                        height = Math.round(height * scale)
                    }
                }

                defaults.width = width
                defaults.height = height
                defaults.imageUrl = imageUrl
                defaults.color = shapeData.color || '#ffffff'
                x = Math.max(0, Math.min(x, CANVAS_WIDTH - width))
                y = Math.max(0, Math.min(y, CANVAS_HEIGHT - height))
            } else if (shapeData.type === 'icon') {
                defaults.iconName = shapeData.iconName || 'star'
                defaults.fontSize = shapeData.fontSize || 64
                defaults.color = shapeData.color || '#72fa41'
                x = Math.max(0, Math.min(x, CANVAS_WIDTH))
                y = Math.max(0, Math.min(y, CANVAS_HEIGHT))
            }

            // Set common defaults
            if (shapeData.opacity === undefined) defaults.opacity = 1
            if (shapeData.rotation === undefined) defaults.rotation = 0

            const finalShapeData = {
                type: shapeData.type,
                ...defaults,
                ...shapeData,
                x,
                y,
            }

            try {
                sendMessage({
                    type: 'SHAPE_CREATE',
                    payload: finalShapeData,
                })
            } catch (error) {
                showToast(`Failed to create shape ${index + 1}`, 'error')
            }
        }

        showToast(`${sortedShapesData.length} shape(s) created!`, 'success', 2000)
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

    // Handle image creation from UI
    const handleAddImage = useCallback(() => {
        const centerX = -stagePos.x / stageScale + (viewportWidth / 2) / stageScale
        const centerY = -stagePos.y / stageScale + (viewportHeight / 2) / stageScale

        // Use default image dimensions (800x525)
        const width = 800
        const height = 525

        createShapes([{
            type: 'image',
            x: centerX - width / 2,
            y: centerY - height / 2,
            width,
            height,
            imageUrl: DEFAULT_STOCK_IMAGE,
            color: '#ffffff',
        }])
    }, [stagePos, stageScale, createShapes, viewportWidth, viewportHeight])

    // Handle icon creation from UI
    const handleAddIcon = useCallback(() => {
        const centerX = -stagePos.x / stageScale + (viewportWidth / 2) / stageScale
        const centerY = -stagePos.y / stageScale + (viewportHeight / 2) / stageScale

        createShapes([{
            type: 'icon',
            x: centerX,
            y: centerY,
            iconName: 'star',
            fontSize: 64,
            color: '#72fa41',
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

        const currentText = (s as any).textContent ?? ''
        const editStartTime = Date.now()  // Capture when user starts editing
        const newText = window.prompt('Edit text', String(currentText))
        if (newText == null) return

        if (wsRef.current) {
            if (newText !== currentText) {
                pushHistory({
                    undo: { type: 'SHAPE_UPDATE', payload: { shapeId: id, updates: { textContent: currentText } } },
                    redo: { type: 'SHAPE_UPDATE', payload: { shapeId: id, updates: { textContent: newText } } },
                    label: 'Edit text',
                    timestamp: editStartTime,
                    source: 'user'
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

    // Helper function to unlock shapes (plural, accepts array)
    const unlockShapes = useCallback((shapeIds: string[]) => {
        if (shapeIds.length === 0) return

        shapeIds.forEach(shapeId => {
            sendMessage({
                type: 'SHAPE_UPDATE',
                payload: {
                    shapeId,
                    updates: {
                        isLocked: false,
                    },
                },
            })
        })
    }, [sendMessage])

    // Handle shape deletion (plural, accepts array)
    const handleDeleteShapes = useCallback((shapeIds: string[]) => {
        if (!wsRef.current) return
        if (shapeIds.length === 0) return

        // Send single delete message with array of shape IDs
        sendMessage({
            type: 'SHAPE_DELETE',
            payload: { shapeIds }
        })
    }, [sendMessage, wsRef])

    // Keep tool function refs in sync with latest function versions
    useEffect(() => {
        createShapesRef.current = createShapes
    }, [createShapes])

    useEffect(() => {
        unlockShapesRef.current = unlockShapes
    }, [unlockShapes])

    useEffect(() => {
        handleDeleteShapesRef.current = handleDeleteShapes
    }, [handleDeleteShapes])

    return {
        createShapes,
        handleAddShape,
        handleAddCircle,
        handleAddText,
        handleAddImage,
        handleAddIcon,
        handleTextDoubleClick,
        unlockShapes,
        handleDeleteShapes,
        createShapesRef,
        unlockShapesRef,
        handleDeleteShapesRef
    }
}

