import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Stage } from 'react-konva'
import Konva from 'konva'
import { supabase } from '../lib/supabase'
import ControlPanel from './ControlPanel'
import ShapeSelectionPanel from './ShapeSelectionPanel'
import UndoRedoPanel from './UndoRedoPanel'
import ContextMenu from './ContextMenu'
import { ToastContainer } from './Toast'
import LoadingScreen from './LoadingScreen'
import PresencePanel from './PresencePanel'
import CanvasBackgroundPanel from './CanvasBackgroundPanel'
import CanvasLayers from './CanvasLayers'
import Minimap from './Minimap'
import LayersSidebar from './LayersSidebar'

// Import types and constants
import type { Shape, Cursor, ActiveUser } from '../types/canvas'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  USER_COLORS
} from '../types/canvas'

// Import custom hooks
import { useArrowKeyNavigation } from '../hooks/useArrowKeyNavigation'
import { useToast } from '../hooks/useToast'
import { useCanvasConnection } from '../hooks/useCanvasConnection'
import { useZoomPan } from '../hooks/useZoomPan'
import { useContextMenu } from '../hooks/useContextMenu'
import { useShapePropertyTracking } from '../hooks/useShapePropertyTracking'
import { useCanvasBackground } from '../hooks/useCanvasBackground'
import { useShapeManagement } from '../hooks/useShapeManagement'
import { useShapeSelection } from '../hooks/useShapeSelection'
import { useShapeClipboard } from '../hooks/useShapeClipboard'
import { useLayerManagement } from '../hooks/useLayerManagement'
import { useShapeDrag } from '../hooks/useShapeDrag'
import { useShapeResize } from '../hooks/useShapeResize'
import { useShapeRotation } from '../hooks/useShapeRotation'
import { useStageEvents } from '../hooks/useStageEvents'
import { useCanvasUtils } from '../hooks/useCanvasUtils'
import { useShapePropertyHandlers } from '../hooks/useShapePropertyHandlers'
import { useCanvasWebSocket } from '../hooks/useCanvasWebSocket'
import { useWebSocketMessageHandler } from '../hooks/useWebSocketMessageHandler'
import { useCanvasHistory } from '../hooks/useCanvasHistory'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useAgenticTools } from '../hooks/useAgenticTools'
import { useCanvasManagement } from '../hooks/useCanvasManagement'

interface CanvasProps {
  onToolsReady?: (tools: any) => void
  onViewportCenterChange?: (center: { x: number; y: number }) => void
  onCanvasStateChange?: (shapes: Shape[]) => void
}

export default function Canvas({ onToolsReady, onViewportCenterChange, onCanvasStateChange }: CanvasProps = {}) {
  const stageRef = useRef<Konva.Stage>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map())
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])

  // Dynamic viewport dimensions - update on resize
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth)
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight)

  const [canvasId, setCanvasId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('')
  const [currentUserColor, setCurrentUserColor] = useState<string>('#3b82f6')
  const [currentTime, setCurrentTime] = useState(Date.now()) // For countdown timers

  // Custom hooks for extracted logic
  const { toasts, showToast, dismissToast } = useToast()

  // Canvas management hook - must be before other hooks that depend on canvasId
  const {
    canvases,
    currentCanvasId: managedCanvasId,
    isLoadingCanvases,
    isCreating,
    // isDeleting, // Not currently used
    isSwitching,
    // fetchCanvases, // Not currently used - auto-fetched on mount
    createCanvas: createCanvasAPI,
    deleteCanvas: deleteCanvasAPI,
    switchCanvas: switchCanvasAPI,
    // setCurrentCanvasId: setManagedCanvasId, // Not currently used - managed by switchCanvas
    canvasSwitchResolverRef,
  } = useCanvasManagement()

  const {
    connectionState,
    setConnectionState,
    reconnectAttempts,
    setReconnectAttempts,
    wsRef,
    reconnectTimeoutRef,
    operationQueueRef,
    sendMessage,
    flushOperationQueue,
    reconnectDelay
  } = useCanvasConnection()

  // Log connection state changes for debugging
  useEffect(() => {
    const stateEmoji = {
      'connected': '🟢',
      'connecting': '🔵',
      'reconnecting': '🟡',
      'disconnected': '🔴'
    }[connectionState] || '⚪'

    console.log(`${stateEmoji} [Canvas] Connection state changed to: ${connectionState.toUpperCase()}`)
    console.log(`   Navigator online: ${navigator.onLine}`)
    console.log(`   WebSocket readyState: ${wsRef.current?.readyState ?? 'null'} (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)`)
    console.log(`   Reconnect attempts: ${reconnectAttempts} (continuous every ${reconnectDelay}ms)`)
    console.log(`   Queued operations: ${operationQueueRef.current.length}`)
  }, [connectionState, reconnectAttempts, reconnectDelay])

  const {
    stageScale,
    setStageScale,
    stagePos,
    setStagePos,
    animateZoomTo,
    startZoomHold,
    stopZoomHold,
    clampStagePosition
  } = useZoomPan({
    viewportWidth,
    viewportHeight
  })

  const {
    contextMenu,
    contextMenuShapeIdRef,
    contextMenuCanvasPositionRef,
    closeContextMenu,
    handleShapeContextMenu,
    handleCanvasContextMenu,
  } = useContextMenu({ stageRef })
  const cursorThrottleRef = useRef<number>(0)
  const dragThrottleRef = useRef<number>(0)
  const dragPositionRef = useRef<{ shapeId: string; x: number; y: number } | null>(null)
  const isDraggingShapeRef = useRef<boolean>(false)
  const isResizingShapeRef = useRef<boolean>(false)
  const resizingShapeIdRef = useRef<string | null>(null)
  const resizeThrottleRef = useRef<number>(0)
  const shapesRef = useRef<Shape[]>([])
  const currentUserIdRef = useRef<string | null>(null)
  const canvasIdRef = useRef<string | null>(null)
  const selectedIdsRef = useRef<string[]>([])
  const isDragMoveRef = useRef<boolean>(false)
  const isShapeDragActiveRef = useRef<boolean>(false) // Track if we're actively dragging a shape
  const justFinishedMultiDragRef = useRef<boolean>(false) // Track if we just finished a multi-shape drag
  // Rotation refs
  const isRotatingShapeRef = useRef<boolean>(false)
  const rotatingShapeIdRef = useRef<string | null>(null)
  const rotationThrottleRef = useRef<number>(0)
  const rotationRafRef = useRef<number | null>(null)
  const pendingRotationUpdatesRef = useRef<Map<string, number>>(new Map())
  const rotationFrameScheduledRef = useRef<boolean>(false)
  // Slider dragging refs (to prevent WebSocket updates from causing jumpy behavior)
  const isDraggingOpacityRef = useRef<boolean>(false)
  const isDraggingShadowStrengthRef = useRef<boolean>(false)
  const isDraggingBorderRadiusRef = useRef<boolean>(false)
  // Track recently modified slider properties to prevent glitches after release
  const recentlyModifiedPropsRef = useRef<Map<string, { props: Partial<Shape>; timestamp: number }>>(new Map())
  // Drag batching refs
  const dragRafRef = useRef<number | null>(null)
  const pendingDragUpdatesRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  const dragFrameScheduledRef = useRef<boolean>(false)
  // Tool function refs - keep stable references for agentic tool calling
  const createShapesRef = useRef<((shapesData: any[]) => void) | null>(null)
  const handleDeleteShapeRef = useRef<((shapeIds?: string[]) => void) | null>(null)
  const unlockShapeRef = useRef<((shapeId: string) => void) | null>(null)
  // Track recently dragged shapes to prevent animation on position updates
  const recentlyDraggedRef = useRef<Map<string, { x: number; y: number; timestamp: number }>>(new Map())
  // Track recently resized shapes to prevent animation on geometry updates
  const recentlyResizedRef = useRef<Map<string, { x?: number; y?: number; width?: number; height?: number; radius?: number; fontSize?: number; timestamp: number }>>(new Map())
  // Track recently rotated shapes to prevent animation on rotation updates
  const recentlyRotatedRef = useRef<Map<string, { rotation: number; timestamp: number }>>(new Map())

  // Undo/Redo state (via useCanvasHistory hook)
  const undoRedoPanelCleanupRef = useRef<(() => void) | null>(null)
  const shapeSelectionPanelCleanupRef = useRef<(() => void) | null>(null)
  const {
    undoCount,
    redoCount,
    hasUserActed,
    pushHistory,
    performUndo,
    performRedo,
  } = useCanvasHistory({ sendMessage })

  // Baselines for compound interactions
  const dragBaselineRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  const resizeBaselineRef = useRef<Map<string, any>>(new Map())
  const rotateBaselineRef = useRef<Map<string, number>>(new Map())
  // Multi-shape drag: store initial offsets relative to the primary dragged shape
  const multiDragOffsetsRef = useRef<Map<string, { dx: number; dy: number }>>(new Map())

  // Custom hooks for property tracking and canvas background
  const { recordPropChange } = useShapePropertyTracking({
    shapes,
    pushHistory
  })

  const {
    canvasBgHex,
    setCanvasBgHex,
    isCanvasBgOpen,
    setIsCanvasBgOpen,
    canvasBgPanelPos,
    setCanvasBgPanelPos,
    recordCanvasBgChange
  } = useCanvasBackground({
    pushHistory
  })

  // Shape management hook (must be before useShapeSelection to provide unlockShape)
  const {
    handleAddShape,
    handleAddCircle,
    handleAddText,
    handleTextDoubleClick,
    unlockShape,
    handleDeleteShape,
    createShapesRef: createShapesRefFromHook,
    unlockShapeRef: unlockShapeRefFromHook,
    handleDeleteShapeRef: handleDeleteShapeRefFromHook
  } = useShapeManagement({
    wsRef,
    canvasId,
    currentUserId,
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
  })

  // Shape selection hook (needs unlockShape from useShapeManagement)
  const {
    selectedIds,
    setSelectedIds,
    lassoMode,
    setLassoMode,
    isDrawingLasso,
    setIsDrawingLasso,
    lassoStart,
    setLassoStart,
    lassoEnd,
    setLassoEnd,
    handleShapeClick
  } = useShapeSelection({
    shapes,
    shapesRef,
    currentUserIdRef,
    activeUsers,
    isDragMoveRef,
    showToast,
    sendMessage,
    unlockShape
  })

  // Sync the selectedIdsRef from the hook
  useEffect(() => {
    selectedIdsRef.current = selectedIds
  }, [selectedIds])

  // Sync the tool function refs
  useEffect(() => {
    createShapesRef.current = createShapesRefFromHook.current
  }, [createShapesRefFromHook])

  useEffect(() => {
    unlockShapeRef.current = unlockShapeRefFromHook.current
  }, [unlockShapeRefFromHook])

  useEffect(() => {
    handleDeleteShapeRef.current = handleDeleteShapeRefFromHook.current
  }, [handleDeleteShapeRefFromHook])

  // Clipboard operations hook
  const {
    clipboard,
    handleCopy: handleCopyFromHook,
    handleCut: handleCutFromHook,
    handlePaste: handlePasteFromHook,
    handleDuplicate: handleDuplicateFromHook
  } = useShapeClipboard({
    shapes,
    contextMenuShapeIdRef,
    contextMenuCanvasPositionRef,
    wsRef,
    sendMessage,
    pushHistory
  })

  // Layer management hook
  const {
    handleSendToFront: handleSendToFrontFromHook,
    handleSendToBack: handleSendToBackFromHook,
    handleMoveForward: handleMoveForwardFromHook,
    handleMoveBackward: handleMoveBackwardFromHook
  } = useLayerManagement({
    shapes,
    selectedIds,
    contextMenuShapeIdRef,
    wsRef,
    sendMessage
  })

  // Alias hooks' functions to original names for easy use throughout the component
  const handleCopy = handleCopyFromHook
  const handleCut = handleCutFromHook
  const handlePaste = handlePasteFromHook
  const handleDuplicate = handleDuplicateFromHook
  const handleSendToFront = handleSendToFrontFromHook
  const handleSendToBack = handleSendToBackFromHook
  const handleMoveForward = handleMoveForwardFromHook
  const handleMoveBackward = handleMoveBackwardFromHook

  // Context menu delete handler
  const handleContextMenuDelete = useCallback(() => {
    const shapeId = contextMenuShapeIdRef.current
    if (!shapeId) return

    handleDeleteShape([shapeId])
    contextMenuShapeIdRef.current = null
  }, [handleDeleteShape, contextMenuShapeIdRef])

  // Handle layer reordering from sidebar
  const handleReorderLayers = useCallback((reorderedShapeIds: string[]) => {
    if (!wsRef.current) return

    // Optimistically update local state first for immediate visual feedback
    setShapes(prevShapes => {
      const updatedShapes = [...prevShapes]
      const maxZ = reorderedShapeIds.length - 1

      updatedShapes.forEach(shape => {
        const index = reorderedShapeIds.indexOf(shape.id)
        if (index !== -1) {
          const newZIndex = maxZ - index
          shape.zIndex = newZIndex
          shape.z_index = newZIndex
        }
      })

      return updatedShapes
    })

    // Then send updates to server in a single batch
    const maxZ = reorderedShapeIds.length - 1
    reorderedShapeIds.forEach((shapeId, index) => {
      const newZIndex = maxZ - index
      sendMessage({
        type: 'SHAPE_UPDATE',
        payload: { shapeId, updates: { zIndex: newZIndex } }
      })
    })
  }, [sendMessage])

  // Handle moving shapes with arrow keys
  const handleMoveShapesWithKeys = useCallback((shapeIds: string[], deltaX: number, deltaY: number) => {
    if (!wsRef.current) return

    shapeIds.forEach(shapeId => {
      const shape = shapesRef.current.find(s => s.id === shapeId)
      if (!shape) return

      const newX = shape.x + deltaX
      const newY = shape.y + deltaY

      // Update local state optimistically
      setShapes(prev => prev.map(s =>
        s.id === shapeId ? { ...s, x: newX, y: newY } : s
      ))

      // Send update to server
      sendMessage({
        type: 'SHAPE_UPDATE',
        payload: {
          shapeId,
          updates: { x: newX, y: newY }
        }
      })
    })
  }, [sendMessage])

  // Arrow key navigation for selected shapes
  useArrowKeyNavigation({
    selectedIds,
    shapes,
    onMoveShapes: handleMoveShapesWithKeys,
    pushHistory,
    enabled: connectionState === 'connected',
  })

  // Handle window resize to update viewport dimensions
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight

      setViewportWidth(newWidth)
      setViewportHeight(newHeight)

      // Recalculate stage position to keep canvas centered
      const newPos = clampStagePosition(stageScale, stagePos)
      setStagePos(newPos)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [stageScale, stagePos, clampStagePosition])

  // Track viewport center changes and notify callback
  useEffect(() => {
    if (onViewportCenterChange) {
      const centerX = -stagePos.x / stageScale + (viewportWidth / 2) / stageScale
      const centerY = -stagePos.y / stageScale + (viewportHeight / 2) / stageScale
      onViewportCenterChange({ x: centerX, y: centerY })
    }
  }, [stagePos, stageScale, viewportWidth, viewportHeight, onViewportCenterChange])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup any pending drag animation frame
      if (dragRafRef.current != null) {
        cancelAnimationFrame(dragRafRef.current)
        dragRafRef.current = null
      }
      pendingDragUpdatesRef.current.clear()
      dragFrameScheduledRef.current = false
      // Cleanup undo/redo panel observers
      if (undoRedoPanelCleanupRef.current) {
        undoRedoPanelCleanupRef.current()
        undoRedoPanelCleanupRef.current = null
      }
    }
  }, [])

  // Keep refs in sync with state
  useEffect(() => {
    shapesRef.current = shapes
  }, [shapes])

  useEffect(() => {
    currentUserIdRef.current = currentUserId
  }, [currentUserId])

  useEffect(() => {
    canvasIdRef.current = canvasId
  }, [canvasId])

  useEffect(() => {
    selectedIdsRef.current = selectedIds
  }, [selectedIds])

  // Update current time every 100ms for countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // Debug: Log shape lock state changes (only when shapes change, not on every render)
  useEffect(() => {
    const lockedShapes = shapes.filter(s => s.locked_at && s.locked_by)
    if (lockedShapes.length > 0) {
    }
    // Note: getUserColor intentionally not in deps to avoid re-render loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, currentUserId])

  // Utility functions hook
  const {
    getRemainingLockSeconds,
    getUserColor,
    normalizeShape,
    computeCanvasBgPanelPosition,
  } = useCanvasUtils({
    containerRef,
    currentUserId,
    currentUserColor,
    currentTime,
    activeUsers,
    setCanvasBgPanelPos,
  })

  // Recompute canvas background panel position when opened or on resize
  useEffect(() => {
    if (!isCanvasBgOpen) return
    computeCanvasBgPanelPosition()
    const onResize = () => computeCanvasBgPanelPosition()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isCanvasBgOpen, computeCanvasBgPanelPosition])

  // Memoize filtered and deduplicated active users (by email address)
  // Also ensure current user is excluded by email
  const uniqueActiveUsers = useMemo(() => {
    return activeUsers
      .filter(user => user.email !== currentUserEmail) // Exclude current user by email
      .filter((user, index, self) =>
        index === self.findIndex(u => u.email === user.email) // Deduplicate by email
      )
  }, [activeUsers, currentUserEmail])

  // Memoize total online users count
  const onlineUsersCount = useMemo(() => {
    return uniqueActiveUsers.length + 1 // +1 for current user
  }, [uniqueActiveUsers])

  // Memoize cursors array for rendering
  const cursorsArray = useMemo(() => {
    return Array.from(cursors.values())
  }, [cursors])

  // WebSocket message handler
  const { handleWebSocketMessage } = useWebSocketMessageHandler({
    currentUserIdRef,
    isDraggingShapeRef,
    isResizingShapeRef,
    isRotatingShapeRef,
    resizingShapeIdRef,
    rotatingShapeIdRef,
    dragPositionRef,
    pendingDragUpdatesRef,
    recentlyDraggedRef,
    recentlyResizedRef,
    recentlyRotatedRef,
    isDraggingOpacityRef,
    isDraggingShadowStrengthRef,
    isDraggingBorderRadiusRef,
    recentlyModifiedPropsRef,
    normalizeShape,
    setShapes,
    setSelectedIds,
    setCanvasBgHex,
    setActiveUsers,
    setCursors,
    setCurrentUserColor,
    pushHistory,
    onCanvasSwitched: (payload) => {
      // When CANVAS_SWITCHED is received, call the resolver if it exists
      if (canvasSwitchResolverRef.current) {
        canvasSwitchResolverRef.current(payload.success)
      }
    },
  })

  // WebSocket connection and initialization
  const { connectWebSocket, initializeCanvas } = useCanvasWebSocket({
    wsRef,
    currentUserIdRef,
    reconnectTimeoutRef,
    reconnectDelay,
    setConnectionState,
    setReconnectAttempts,
    flushOperationQueue,
    onMessage: handleWebSocketMessage,
  })

  // Track if we've initialized to prevent re-initialization on canvas switches
  const hasInitializedRef = useRef(false)

  // Initialize canvas and WebSocket - runs only once when canvases are loaded
  useEffect(() => {
    // Wait for canvas management to load canvases
    if (isLoadingCanvases) {
      console.log('⏳ [Canvas] Waiting for canvases to load...')
      return
    }

    if (!managedCanvasId) {
      console.error('❌ [Canvas] No canvas ID available after loading. User may have no canvases.')
      return
    }

    // Only initialize once on mount
    if (hasInitializedRef.current) {
      return
    }

    console.log('🚀 [Canvas] Initial initialization with canvas ID:', managedCanvasId)
    hasInitializedRef.current = true

    initializeCanvas((_loadedCanvasId, token, userId, userEmail) => {
      setCurrentUserId(userId)
      setCurrentUserEmail(userEmail)

      // Use the canvas ID from canvas management instead of the default one
      setCanvasId(managedCanvasId)
      canvasIdRef.current = managedCanvasId

      // Color will be assigned by server and received via CANVAS_SYNC
      // Calculate local fallback color in case server doesn't send one
      const colorIndex = parseInt(userId.slice(0, 8), 16) % USER_COLORS.length
      setCurrentUserColor(USER_COLORS[colorIndex])

      // Fetch canvas data to hydrate background immediately from API response (before WS sync)
      const fetchCanvasData = async () => {
        try {
          const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
          const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl
          const response = await fetch(`${API_URL}/canvas/${managedCanvasId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          })
          if (response.ok) {
            const result = await response.json()
            const canvas = result.data
            const initialBg = canvas.background_color ?? canvas.backgroundColor
            if (initialBg) {
              setCanvasBgHex(initialBg)
            }
          }
        } catch (error) {
          console.error('Error fetching canvas data:', error)
        }
      }
      fetchCanvasData()

      // Connect WebSocket with the target canvas
      connectWebSocket(managedCanvasId, token)
    })
    // Note: No cleanup function here - WebSocket lifecycle is managed separately
    // The effect won't re-run after initialization thanks to hasInitializedRef
  }, [isLoadingCanvases, managedCanvasId, initializeCanvas, connectWebSocket])

  // Handle canvas ID changes after initialization (for canvas switching)
  useEffect(() => {
    if (!hasInitializedRef.current || !managedCanvasId) {
      return
    }

    // If the managed canvas ID changed, update local state
    // (The actual switch happens via SWITCH_CANVAS WebSocket message in handleSwitchCanvas)
    if (canvasIdRef.current !== managedCanvasId) {
      console.log('🔄 [Canvas] Canvas ID changed to:', managedCanvasId, '(using existing WebSocket connection)')
      setCanvasId(managedCanvasId)
      canvasIdRef.current = managedCanvasId
    }
  }, [managedCanvasId])

  // Cleanup WebSocket on component unmount only
  useEffect(() => {
    return () => {
      console.log('🔌 [Canvas] Component unmounting, closing WebSocket')
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  // Canvas management handlers
  const handleCreateCanvas = useCallback(async (name: string) => {
    const newCanvas = await createCanvasAPI(name)
    if (newCanvas) {
      showToast('Canvas created successfully', 'success')
      // Switch to the new canvas
      await handleSwitchCanvas(newCanvas.id)
    } else {
      showToast('Failed to create canvas', 'error')
    }
  }, [createCanvasAPI, showToast])

  const handleDeleteCanvas = useCallback(async (canvasId: string) => {
    const success = await deleteCanvasAPI(canvasId)
    if (success) {
      showToast('Canvas deleted successfully', 'success')
      // If we deleted the current canvas, we'll automatically switch to the next available canvas
      // The useCanvasManagement hook handles this automatically
    } else {
      showToast('Failed to delete canvas', 'error')
    }
  }, [deleteCanvasAPI, showToast])

  const handleSwitchCanvas = useCallback(async (targetCanvasId: string) => {
    console.log(`🎨 [Canvas] handleSwitchCanvas called for: ${targetCanvasId}`)

    // Clear local state BEFORE switching to prevent showing stale data
    console.log('🧹 [Canvas] Clearing local state before switch')
    setShapes([])
    setCursors(new Map())
    setActiveUsers([])
    setSelectedIds([])

    const success = await switchCanvasAPI(targetCanvasId, wsRef, () => {
      // On successful switch, just update refs and show confirmation
      // The canvas state has already been rehydrated by the CANVAS_SYNC message from the server
      console.log('✅ [Canvas] Canvas switch confirmed')
      setCanvasId(targetCanvasId)
      canvasIdRef.current = targetCanvasId
      showToast('Switched canvas', 'success')
    })

    if (!success) {
      showToast('Failed to switch canvas', 'error')
    }
  }, [switchCanvasAPI, wsRef, showToast])


  // Note: Shape creation, selection, and management logic now provided by hooks

  // Shape drag handlers from useShapeDrag hook
  const {
    handleShapeDragStart,
    handleShapeDrag,
    handleShapeDragEnd,
  } = useShapeDrag({
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
    unlockShape,
    pushHistory,
    showToast,
    sendMessage,
  })

  // Shape resize handlers from useShapeResize hook
  const {
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  } = useShapeResize({
    shapesRef,
    selectedIdsRef,
    wsRef,
    isResizingShapeRef,
    resizingShapeIdRef,
    resizeThrottleRef,
    resizeBaselineRef,
    recentlyResizedRef,
    setShapes,
    setSelectedIds,
    unlockShape,
    pushHistory,
    sendMessage,
  })

  // Shape rotation handlers from useShapeRotation hook
  const {
    handleRotateStart,
    handleRotateMove,
    handleRotateEnd,
  } = useShapeRotation({
    shapesRef,
    selectedIdsRef,
    wsRef,
    isRotatingShapeRef,
    rotatingShapeIdRef,
    rotationThrottleRef,
    rotationRafRef,
    pendingRotationUpdatesRef,
    rotationFrameScheduledRef,
    rotateBaselineRef,
    recentlyRotatedRef,
    setShapes,
    setSelectedIds,
    unlockShape,
    pushHistory,
    sendMessage,
  })

  // Note: handleDeleteShape is now provided by useShapeManagement hook
  // Note: All drag/resize/rotation handlers are now provided by their respective hooks above

  // Register agentic tools for voice agent
  useAgenticTools({
    onToolsReady,
    currentUserId,
    canvasId,
    wsRef,
    stageRef,
    shapesRef,
    selectedIdsRef,
    createShapesRef,
    handleDeleteShapeRef,
    unlockShapeRef,
    sendMessage,
    setSelectedIds,
    viewportWidth,
    viewportHeight,
  })

  // Notify voice agent when canvas state changes
  useEffect(() => {
    if (onCanvasStateChange) {
      onCanvasStateChange(shapes)
    }
  }, [shapes, onCanvasStateChange])

  // Handle keyboard shortcuts (Undo/Redo/Delete/Escape/Layering)
  useKeyboardShortcuts({
    shapes,
    selectedIdsRef,
    handleDeleteShape,
    unlockShape,
    setSelectedIds,
    performUndo,
    performRedo,
    sendMessage,
  })

  // Shape property change handlers from useShapePropertyHandlers hook
  const {
    handleChangeColor,
    handleChangeOpacity,
    handleCommitRotation,
    handleChangeShadowColor,
    handleChangeShadowStrength,
    handleChangeBorderRadius,
    handleChangeFontFamily,
    handleChangeFontWeight,
  } = useShapePropertyHandlers({
    wsRef,
    selectedIds,
    setShapes,
    recordPropChange,
    sendMessage,
    recentlyModifiedPropsRef,
  })

  // Get zoom handlers from useZoomPan hook (already called above)
  // These handlers will be used by the control panel
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(stageScale * 1.2, 3)
    // Use the current screen position of the canvas center as the anchor
    const anchor = {
      x: stagePos.x + (CANVAS_WIDTH / 2) * stageScale,
      y: stagePos.y + (CANVAS_HEIGHT / 2) * stageScale
    }
    animateZoomTo(newScale, anchor, 200)
  }, [animateZoomTo, stageScale, stagePos, viewportWidth, viewportHeight])

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(stageScale / 1.2, 0.1)
    // Use the current screen position of the canvas center as the anchor
    const anchor = {
      x: stagePos.x + (CANVAS_WIDTH / 2) * stageScale,
      y: stagePos.y + (CANVAS_HEIGHT / 2) * stageScale
    }
    animateZoomTo(newScale, anchor, 200)
  }, [animateZoomTo, stageScale, stagePos, viewportWidth, viewportHeight])

  const handleResetView = useCallback(() => {
    // Center the canvas at 100% zoom
    const targetScale = 1

    // Calculate the centered position: canvas center at viewport center
    const targetPos = {
      x: viewportWidth / 2 - CANVAS_WIDTH / 2,
      y: viewportHeight / 2 - CANVAS_HEIGHT / 2
    }

    // Use animation from the hook
    setStageScale(targetScale)
    setStagePos(targetPos)
  }, [setStageScale, setStagePos, viewportWidth, viewportHeight])

  const handleMinimapNavigate = useCallback((canvasX: number, canvasY: number) => {
    // Calculate new stage position to center the viewport on the clicked canvas coordinates
    const newX = -(canvasX * stageScale) + (viewportWidth / 2)
    const newY = -(canvasY * stageScale) + (viewportHeight / 2)

    // Clamp to canvas boundaries
    const clampedPos = clampStagePosition(stageScale, { x: newX, y: newY })
    setStagePos(clampedPos)
  }, [stageScale, viewportWidth, viewportHeight, clampStagePosition, setStagePos])

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      // Handle error silently
    }
  }, [])

  // Stage event handlers from useStageEvents hook
  const {
    handleStageClick,
    handleMouseMove,
    handleWheel,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
  } = useStageEvents({
    stageRef,
    wsRef,
    selectedIdsRef,
    isDraggingShapeRef,
    justFinishedMultiDragRef,
    cursorThrottleRef,
    viewportWidth,
    viewportHeight,
    isDrawingLasso,
    lassoMode,
    lassoStart,
    lassoEnd,
    shapes,
    setIsDrawingLasso,
    setLassoStart,
    setLassoEnd,
    setSelectedIds,
    unlockShape,
    sendMessage,
    animateZoomTo,
  })


  // Note: Layer management (handleSendToFront, handleSendToBack, etc.) and 
  // Clipboard handlers (handleCopy, handleCut, handlePaste, handleDuplicate) 
  // are now provided by useLayerManagement and useShapeClipboard hooks

  // Viewport culling: calculate visible area with padding
  const visibleShapes = useMemo(() => {
    // Calculate viewport bounds in canvas coordinates with generous padding for smooth scrolling
    const padding = 500 // Extra padding to render shapes slightly outside viewport
    const viewportMinX = (-stagePos.x / stageScale) - padding
    const viewportMaxX = (viewportWidth - stagePos.x) / stageScale + padding
    const viewportMinY = (-stagePos.y / stageScale) - padding
    const viewportMaxY = (viewportHeight - stagePos.y) / stageScale + padding

    // Filter shapes that intersect with viewport
    const filtered = shapes.filter(shape => {
      let shapeMinX: number, shapeMaxX: number, shapeMinY: number, shapeMaxY: number

      if (shape.type === 'circle') {
        const radius = shape.radius || 50
        shapeMinX = shape.x - radius
        shapeMaxX = shape.x + radius
        shapeMinY = shape.y - radius
        shapeMaxY = shape.y + radius
      } else if (shape.type === 'text') {
        const fontSize = (shape as any).fontSize ?? (shape as any).font_size ?? 24
        const estimatedWidth = ((shape as any).textContent || '').length * fontSize * 0.6
        const estimatedHeight = fontSize * 1.2
        shapeMinX = shape.x - estimatedWidth / 2
        shapeMaxX = shape.x + estimatedWidth / 2
        shapeMinY = shape.y - estimatedHeight / 2
        shapeMaxY = shape.y + estimatedHeight / 2
      } else {
        // Rectangle
        const width = shape.width || 100
        const height = shape.height || 100
        shapeMinX = shape.x
        shapeMaxX = shape.x + width
        shapeMinY = shape.y
        shapeMaxY = shape.y + height
      }

      // Check if shape bounds intersect with viewport bounds
      return !(shapeMaxX < viewportMinX || shapeMinX > viewportMaxX ||
        shapeMaxY < viewportMinY || shapeMinY > viewportMaxY)
    })

    // Sort by z-index (ascending order: lowest z-index renders first, highest renders last on top)
    return filtered.sort((a, b) => {
      const aZ = a.z_index ?? a.zIndex ?? 0
      const bZ = b.z_index ?? b.zIndex ?? 0
      return aZ - bZ
    })
  }, [shapes, stagePos.x, stagePos.y, stageScale, viewportWidth, viewportHeight])

  // Prepare shape render props with lock visual states
  const shapeRenderProps = useMemo(() => {
    return visibleShapes.map(shape => {
      const isSelected = selectedIds.includes(shape.id)
      const isLocked = !!shape.locked_at && !!shape.locked_by
      const remainingSeconds = getRemainingLockSeconds(shape.locked_at)
      const isLockedByOther = isLocked && shape.locked_by !== currentUserId && remainingSeconds !== null

      // Lock indicator color: current user = blue, other users = assigned color (or red fallback)
      const strokeColor = isLocked && shape.locked_by
        ? getUserColor(shape.locked_by)
        : isSelected
          ? currentUserColor
          : '#505050'
      // Increase stroke width for locked shapes to make them more visible (4px instead of 2px)
      const strokeWidth = isSelected ? 4 : isLocked ? 4 : 1
      const isDraggable = (!isLocked || shape.locked_by === currentUserId)
      const isPressable = !isLockedByOther

      return {
        shape,
        strokeColor,
        strokeWidth,
        isPressable,
        isDraggable,
        remainingSeconds,
      }
    })
  }, [visibleShapes, selectedIds, currentTime, currentUserId, currentUserColor, getRemainingLockSeconds, getUserColor])

  const selectedShape = useMemo(() => selectedIds.length === 1 ? shapes.find(s => s.id === selectedIds[0]) || null : null, [shapes, selectedIds])

  // Calculate Shape Selection Panel position with fallback
  const [shapeSelectionPanelTop, setShapeSelectionPanelTop] = useState<number | null>(null)

  // Trigger position recalculation when undo-redo panel appears/disappears
  useEffect(() => {
    if (selectedShape) {
      // Delay to ensure DOM has updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const container = containerRef.current
          if (!container) return

          const cRect = container.getBoundingClientRect()
          const undoRedoPanel = document.getElementById('undo-redo-panel')
          const presencePanel = document.getElementById('presence-panel')

          let top = 20 // Default fallback: 20px from top

          if (undoRedoPanel) {
            const urRect = undoRedoPanel.getBoundingClientRect()
            top = Math.max(0, Math.round(urRect.bottom - cRect.top + 20))
          } else if (presencePanel) {
            const pRect = presencePanel.getBoundingClientRect()
            top = Math.max(0, Math.round(pRect.bottom - cRect.top + 20))
          }

          setShapeSelectionPanelTop(top)
        })
      })
    }
  }, [hasUserActed, selectedShape])

  const isLoading = !currentUserId || !canvasId || !wsRef.current

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#0a0a0a' }}>
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Loading Overlay - only over canvas */}
      {isLoading && <LoadingScreen currentUserId={currentUserId} canvasId={canvasId} />}

      {/* Control Panel */}
      <ControlPanel
        onAddRectangle={handleAddShape}
        onAddCircle={handleAddCircle}
        onAddText={handleAddText}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onZoomInHold={() => startZoomHold(1)}
        onZoomOutHold={() => startZoomHold(-1)}
        onStopZoomHold={stopZoomHold}
        stageScale={stageScale}
        onToggleCanvasBg={() => setIsCanvasBgOpen(v => !v)}
        lassoMode={lassoMode}
        onToggleLassoMode={() => setLassoMode(v => !v)}
        onCollapse={() => setIsCanvasBgOpen(false)}
      />

      {/* Pan Mode Indicator removed */}

      {/* Combined Status Panel - Users, Connection, and Performance */}
      <PresencePanel
        currentUserEmail={currentUserEmail}
        currentUserColor={currentUserColor}
        uniqueActiveUsers={uniqueActiveUsers}
        onlineUsersCount={onlineUsersCount}
        connectionState={connectionState}
        reconnectAttempts={reconnectAttempts}
        queuedOperationsCount={operationQueueRef.current.length}
        onSignOut={handleSignOut}
      />

      {/* Undo/Redo Panel - rendered 20px below Status Panel */}
      {hasUserActed && (
        <div
          id="undo-redo-panel"
          style={{
            position: 'absolute',
            right: '20px',
            zIndex: 9,
            // top computed dynamically via inline script below
          }}
          ref={(el) => {
            // Run cleanup if element is being removed or replaced
            if (!el) {
              // Call cleanup function if it exists
              if (undoRedoPanelCleanupRef.current) {
                undoRedoPanelCleanupRef.current()
                undoRedoPanelCleanupRef.current = null
              }
              return
            }

            // Cleanup any existing observers/listeners
            if (undoRedoPanelCleanupRef.current) {
              undoRedoPanelCleanupRef.current()
            }

            const statusPanel = document.getElementById('presence-panel')
            const container = containerRef.current
            if (!statusPanel || !container) return

            const update = () => {
              const cRect = container.getBoundingClientRect()
              const spRect = statusPanel.getBoundingClientRect()
              const top = Math.max(0, Math.round(spRect.bottom - cRect.top + 20))
              el.style.top = `${top}px`
            }
            update()

            const ro = new ResizeObserver(update)
            ro.observe(statusPanel)
            window.addEventListener('resize', update)

            // Store cleanup function in ref
            undoRedoPanelCleanupRef.current = () => {
              ro.disconnect()
              window.removeEventListener('resize', update)
            }
          }}
        >
          <UndoRedoPanel
            canUndo={undoCount > 0}
            canRedo={redoCount > 0}
            onUndo={performUndo}
            onRedo={performRedo}
          />
        </div>
      )}

      {/* Zoom Indicator moved below controls */}

      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={viewportWidth}
        height={viewportHeight}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={!isShapeDragActiveRef.current && !isResizingShapeRef.current && !isRotatingShapeRef.current && !isDrawingLasso}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onMouseMove={(e) => {
          handleMouseMove(e)
          handleStageMouseMove(e)
        }}
        onMouseUp={handleStageMouseUp}
        onDragMove={(e) => {
          // Update position if we're dragging the stage and not a shape
          if (!isShapeDragActiveRef.current) {
            const stage = e.target as Konva.Stage
            setStagePos({ x: stage.x(), y: stage.y() })
          }
        }}
        dragBoundFunc={(pos) => {
          // Constrain stage dragging to canvas boundaries
          const newX = Math.min(0, Math.max(pos.x, viewportWidth - CANVAS_WIDTH * stageScale))
          const newY = Math.min(0, Math.max(pos.y, viewportHeight - CANVAS_HEIGHT * stageScale))
          return { x: newX, y: newY }
        }}
      >
        <CanvasLayers
          canvasWidth={CANVAS_WIDTH}
          canvasHeight={CANVAS_HEIGHT}
          canvasBgHex={canvasBgHex}
          shapeRenderProps={shapeRenderProps}
          selectedIds={selectedIds}
          stageScale={stageScale}
          cursorsArray={cursorsArray}
          isDrawingLasso={isDrawingLasso}
          lassoStart={lassoStart}
          lassoEnd={lassoEnd}
          activeUsers={activeUsers}
          currentUserId={currentUserId}
          onShapeClick={handleShapeClick}
          onDragStart={handleShapeDragStart}
          onDragMove={handleShapeDrag}
          onDragEnd={handleShapeDragEnd}
          onResizeStart={handleResizeStart}
          onResizeMove={handleResizeMove}
          onResizeEnd={handleResizeEnd}
          onRotateStart={handleRotateStart}
          onRotateMove={handleRotateMove}
          onRotateEnd={handleRotateEnd}
          onTextDoubleClick={handleTextDoubleClick}
          onContextMenu={handleShapeContextMenu}
          onCanvasContextMenu={handleCanvasContextMenu}
          getUserColor={getUserColor}
        />
      </Stage>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          mode={contextMenu.mode}
          onClose={closeContextMenu}
          onSendToFront={handleSendToFront}
          onSendToBack={handleSendToBack}
          onMoveForward={handleMoveForward}
          onMoveBackward={handleMoveBackward}
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={handlePaste}
          onDuplicate={handleDuplicate}
          onDelete={handleContextMenuDelete}
          onChangeCanvasColor={() => {
            setIsCanvasBgOpen(true)
          }}
          hasPasteData={clipboard.length > 0}
        />
      )}

      {/* Shape Selection Panel - positioned below Undo/Redo Panel or Presence Panel */}
      {selectedShape && (
        <div
          style={{
            position: 'absolute',
            right: '20px',
            zIndex: 9,
            top: shapeSelectionPanelTop !== null ? `${shapeSelectionPanelTop}px` : 'auto',
          }}
          ref={(el) => {
            // Run cleanup if element is being removed or replaced
            if (!el) {
              if (shapeSelectionPanelCleanupRef.current) {
                shapeSelectionPanelCleanupRef.current()
                shapeSelectionPanelCleanupRef.current = null
              }
              return
            }

            // Cleanup any existing observers/listeners
            if (shapeSelectionPanelCleanupRef.current) {
              shapeSelectionPanelCleanupRef.current()
            }

            const container = containerRef.current
            if (!container) return

            const update = () => {
              const cRect = container.getBoundingClientRect()
              const undoRedoPanel = document.getElementById('undo-redo-panel')
              const presencePanel = document.getElementById('presence-panel')

              let top = 20 // Default fallback: 20px from top

              if (undoRedoPanel) {
                // Position below undo-redo panel if it exists
                const urRect = undoRedoPanel.getBoundingClientRect()
                top = Math.max(0, Math.round(urRect.bottom - cRect.top + 20))
              } else if (presencePanel) {
                // Position below presence panel if undo-redo doesn't exist
                const pRect = presencePanel.getBoundingClientRect()
                top = Math.max(0, Math.round(pRect.bottom - cRect.top + 20))
              }

              setShapeSelectionPanelTop(top)
            }

            // Initial update with a slight delay to ensure DOM is ready
            requestAnimationFrame(() => {
              requestAnimationFrame(update)
            })

            const ro = new ResizeObserver(update)
            const undoRedoPanel = document.getElementById('undo-redo-panel')
            const presencePanel = document.getElementById('presence-panel')

            if (undoRedoPanel) ro.observe(undoRedoPanel)
            if (presencePanel) ro.observe(presencePanel)

            window.addEventListener('resize', update)

            // Store cleanup function in ref
            shapeSelectionPanelCleanupRef.current = () => {
              ro.disconnect()
              window.removeEventListener('resize', update)
            }
          }}
        >
          <ShapeSelectionPanel
            selectedShape={selectedShape as any}
            onChangeColor={handleChangeColor}
            onChangeOpacity={handleChangeOpacity}
            onCommitRotation={handleCommitRotation}
            onChangeShadowColor={handleChangeShadowColor}
            onChangeShadowStrength={handleChangeShadowStrength}
            onChangeBorderRadius={handleChangeBorderRadius}
            onChangeFontFamily={handleChangeFontFamily}
            onChangeFontWeight={handleChangeFontWeight}
            isDraggingOpacityRef={isDraggingOpacityRef}
            isDraggingShadowStrengthRef={isDraggingShadowStrengthRef}
            isDraggingBorderRadiusRef={isDraggingBorderRadiusRef}
          />
        </div>
      )}
      {/* Color Tooltip removed in favor of ShapeSelectionPanel */}

      {/* Floating Canvas Background Color panel (right side) */}
      <CanvasBackgroundPanel
        isOpen={isCanvasBgOpen}
        position={canvasBgPanelPos}
        valueHex={canvasBgHex}
        onChangeHex={(hex) => {
          setCanvasBgHex(hex)
          sendMessage({
            type: 'CANVAS_UPDATE',
            payload: { updates: { backgroundColor: hex } }
          })
          recordCanvasBgChange(hex)
        }}
      />

      {/* Minimap (lower-right) */}
      <Minimap
        shapes={shapes}
        canvasWidth={CANVAS_WIDTH}
        canvasHeight={CANVAS_HEIGHT}
        viewportX={-stagePos.x / stageScale}
        viewportY={-stagePos.y / stageScale}
        viewportWidth={viewportWidth / stageScale}
        viewportHeight={viewportHeight / stageScale}
        stageScale={stageScale}
        onNavigate={handleMinimapNavigate}
      />

      {/* Layers Sidebar (left side) */}
      <LayersSidebar
        shapes={shapes}
        selectedIds={selectedIds}
        onReorderLayers={handleReorderLayers}
        onSelectShape={handleShapeClick}
        currentUserId={currentUserId}
        getUserColor={getUserColor}
        canvases={canvases}
        currentCanvasId={managedCanvasId}
        onSwitchCanvas={handleSwitchCanvas}
        onCreateCanvas={handleCreateCanvas}
        onDeleteCanvas={handleDeleteCanvas}
        isSwitching={isSwitching}
        isCreating={isCreating}
      />
    </div>
  )
}
