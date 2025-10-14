import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import Konva from 'konva'
import { supabase } from '../lib/supabase'
import CanvasShape from './CanvasShape'
import CanvasCursor from './CanvasCursor'

// Canvas constants - Extremely expansive canvas
const CANVAS_WIDTH = 50000
const CANVAS_HEIGHT = 50000
const VIEWPORT_WIDTH = window.innerWidth
const VIEWPORT_HEIGHT = window.innerHeight
const DEFAULT_SHAPE_SIZE = 100
const SHAPE_COLOR = '#c1c1c1' // Gray shapes

// User color palette - Bright NEON colors
const USER_COLORS = [
  '#72fa41', '#24ccff', '#fbff00', '#ff69b4', '#00ffff',
  '#ff00ff', '#00ff00', '#ff0080', '#80ff00', '#ff8000',
  '#0080ff', '#ff0040', '#40ff00', '#00ff80', '#8000ff'
]

interface Shape {
  id: string
  type: string
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  color: string
  locked_at?: string | null
  locked_by?: string | null
  created_by?: string
}

interface Cursor {
  userId: string
  username: string
  displayName: string
  email: string
  color: string
  x: number
  y: number
}

interface ActiveUser {
  userId: string
  username: string
  displayName: string
  email: string
  color: string
}

export default function Canvas() {
  const stageRef = useRef<Konva.Stage>(null)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map())
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [stageScale, setStageScale] = useState(1)
  const [stagePos, setStagePos] = useState({
    x: VIEWPORT_WIDTH / 2 - CANVAS_WIDTH / 2,
    y: VIEWPORT_HEIGHT / 2 - CANVAS_HEIGHT / 2
  })
  const [canvasId, setCanvasId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('')
  const [currentUserColor, setCurrentUserColor] = useState<string>('#3b82f6')
  const [currentTime, setCurrentTime] = useState(Date.now()) // For countdown timers
  const wsRef = useRef<WebSocket | null>(null)
  const cursorThrottleRef = useRef<number>(0)
  const dragThrottleRef = useRef<number>(0)
  const dragPositionRef = useRef<{ shapeId: string; x: number; y: number } | null>(null)
  const isDraggingShapeRef = useRef<boolean>(false)
  const shapesRef = useRef<Shape[]>([])
  const currentUserIdRef = useRef<string | null>(null)
  const selectedIdRef = useRef<string | null>(null)
  const isDragMoveRef = useRef<boolean>(false)
  const isShapeDragActiveRef = useRef<boolean>(false) // Track if we're actively dragging a shape

  // Zoom animation refs
  const zoomAnimRafRef = useRef<number | null>(null)
  const zoomAnimStartRef = useRef<number>(0)
  const zoomFromScaleRef = useRef<number>(1)
  const zoomToScaleRef = useRef<number>(1)
  const zoomFromPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const zoomToPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Easing function for smooth zoom
  const easeInOutCubic = useCallback((t: number) => (
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  ), [])

  const clampStagePosition = useCallback((scale: number, desired: { x: number; y: number }) => {
    const scaledWidth = CANVAS_WIDTH * scale
    const scaledHeight = CANVAS_HEIGHT * scale

    // If content smaller than viewport, center it on that axis
    let x: number
    if (scaledWidth <= VIEWPORT_WIDTH) {
      x = (VIEWPORT_WIDTH - scaledWidth) / 2
    } else {
      const minX = VIEWPORT_WIDTH - scaledWidth
      const maxX = 0
      x = Math.max(minX, Math.min(desired.x, maxX))
    }

    let y: number
    if (scaledHeight <= VIEWPORT_HEIGHT) {
      y = (VIEWPORT_HEIGHT - scaledHeight) / 2
    } else {
      const minY = VIEWPORT_HEIGHT - scaledHeight
      const maxY = 0
      y = Math.max(minY, Math.min(desired.y, maxY))
    }

    return { x, y }
  }, [])

  const computeAnchoredPosition = useCallback((oldScale: number, newScale: number, currentPos: { x: number; y: number }, anchorScreen: { x: number; y: number }) => {
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

  const animateZoomTo = useCallback((targetScale: number, anchor: { x: number; y: number }, durationMs: number = 200) => {
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

  // Keep refs in sync with state
  useEffect(() => {
    shapesRef.current = shapes
  }, [shapes])

  useEffect(() => {
    currentUserIdRef.current = currentUserId
  }, [currentUserId])

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

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
      lockedShapes.forEach(shape => {
        const isLockedByOther = shape.locked_by && shape.locked_by !== currentUserId
        if (isLockedByOther && shape.locked_by) {
          console.log(`🔒 DEBUG: Shape ${shape.id.slice(0, 8)} is LOCKED by user ${shape.locked_by.slice(0, 8)}`)
        }
      })
    }
    // Note: getUserColor intentionally not in deps to avoid re-render loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, currentUserId])

  // Helper function to calculate remaining lock seconds
  const getRemainingLockSeconds = useCallback((lockedAt?: string | null): number | null => {
    if (!lockedAt) return null
    const lockTime = new Date(lockedAt).getTime()
    const elapsed = (currentTime - lockTime) / 1000
    const remaining = Math.max(0, 10 - elapsed)
    return remaining > 0 ? remaining : null
  }, [currentTime])

  // Helper function to get user color by user ID
  const getUserColor = useCallback((userId: string): string => {
    // First check if it's the current user
    if (userId === currentUserId) {
      return currentUserColor
    }
    // Check active users
    const user = activeUsers.find(u => u.userId === userId)
    if (user) {
      return user.color
    }
    // Fallback: calculate color from user ID
    const colorIndex = parseInt(userId.slice(0, 8), 16) % USER_COLORS.length
    return USER_COLORS[colorIndex]
  }, [currentUserId, currentUserColor, activeUsers])

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

  // Normalize shape fields (ensure snake_case for lock fields)
  const normalizeShape = useCallback((s: any): Shape => {
    const locked_at = s.locked_at !== undefined ? s.locked_at : (s.lockedAt !== undefined ? s.lockedAt : null)
    const locked_by = s.locked_by !== undefined ? s.locked_by : (s.lockedBy !== undefined ? s.lockedBy : null)
    return {
      ...s,
      locked_at,
      locked_by,
    }
  }, [])

  // Initialize canvas and WebSocket
  useEffect(() => {
    const initCanvas = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          console.warn('⚠️ No active session. Please sign in to use the canvas.')
          return
        }

        console.log('✅ User authenticated:', session.user.email)
        setCurrentUserId(session.user.id)
        setCurrentUserEmail(session.user.email || '')
        currentUserIdRef.current = session.user.id

        // Color will be assigned by server and received via CANVAS_SYNC
        // Calculate local fallback color in case server doesn't send one
        const colorIndex = parseInt(session.user.id.slice(0, 8), 16) % USER_COLORS.length
        setCurrentUserColor(USER_COLORS[colorIndex])

        // Get API URL
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

        // Get the global canvas (will be created automatically if it doesn't exist)
        const response = await fetch(`${API_URL}/canvas`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (!response.ok) throw new Error('Failed to fetch global canvas')

        const result = await response.json()
        const canvas = result.data

        console.log('✅ Connected to global canvas:', canvas.name)
        setCanvasId(canvas.id)
        connectWebSocket(canvas.id, session.access_token)
      } catch (error) {
        console.error('Failed to initialize canvas:', error)
      }
    }

    initCanvas()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const connectWebSocket = useCallback((canvasId: string, token: string) => {
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002'
    const ws = new WebSocket(`${WS_URL}?token=${token}&canvasId=${canvasId}`)

    ws.onopen = () => {
      console.log('✅ WebSocket connected')
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      handleWebSocketMessage(message)
    }

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected')
    }

    wsRef.current = ws
  }, [])

  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('📨 WebSocket message:', message.type)

    switch (message.type) {
      case 'CANVAS_SYNC':
        // Initial sync with all shapes and users
        console.log('CANVAS_SYNC received:', message.payload)
        if (message.payload.shapes) {
          setShapes((message.payload.shapes as any[]).map(normalizeShape))
        }
        if (message.payload.activeUsers) {
          console.log('Active users from server:', message.payload.activeUsers)
          // Filter out current user from active users list and deduplicate
          const otherUsers = message.payload.activeUsers.filter((u: ActiveUser) => u.userId !== currentUserIdRef.current)

          // Deduplicate by email - keep only the first occurrence of each email address
          const uniqueUsers = otherUsers.filter((user: ActiveUser, index: number, self: ActiveUser[]) =>
            index === self.findIndex((u: ActiveUser) => u.email === user.email)
          )

          console.log('Other users after filtering and deduplication:', uniqueUsers)
          setActiveUsers(uniqueUsers)

          // Update current user's color from server if present
          const currentUserData = message.payload.activeUsers.find((u: ActiveUser) => u.userId === currentUserIdRef.current)
          if (currentUserData && currentUserData.color) {
            setCurrentUserColor(currentUserData.color)
          }
        }
        break

      case 'SHAPE_CREATE':
        // New shape created
        if (message.payload.shape) {
          setShapes(prev => {
            // Check if shape already exists to prevent duplicates
            const incoming = normalizeShape(message.payload.shape)
            const exists = prev.some(s => s.id === incoming.id)
            if (exists) {
              return prev
            }
            return [...prev, incoming]
          })
        }
        break

      case 'SHAPE_UPDATE':
        // Shape updated
        if (message.payload.shape) {

          // Debug: Only log lock/unlock events
          const shape = normalizeShape(message.payload.shape)
          if (shape.locked_at || shape.locked_by) {
            const isOtherUser = shape.locked_by && shape.locked_by !== currentUserIdRef.current
            if (isOtherUser && shape.locked_by) {
              console.log(`📨 SHAPE_UPDATE: Shape ${shape.id.slice(0, 8)} LOCKED by ${shape.locked_by.slice(0, 8)}`)
            }
          }
          console.log('🧩 SHAPE: ', shape)
          setShapes(prev => prev.map(s => {
            if (s.id === shape.id) {
              // If we're currently dragging this shape, only update non-position properties
              // to avoid conflict with local optimistic updates
              if (isDraggingShapeRef.current && dragPositionRef.current?.shapeId === s.id) {
                return {
                  ...shape,
                  x: s.x,
                  y: s.y,
                }
              }
              return shape
            }
            return s
          }))

          // If an auto-unlock happened for the currently selected shape, clear selection locally
          const wasSelected = selectedIdRef.current && selectedIdRef.current === shape.id
          const becameUnlocked = (!shape.locked_at && !shape.locked_by)
          if (wasSelected && becameUnlocked) {
            setSelectedId(null)
          }
        }
        break

      case 'SHAPE_DELETE':
        // Shape deleted
        if (message.payload.shapeId) {
          setShapes(prev => prev.filter(s => s.id !== message.payload.shapeId))
          if (selectedId === message.payload.shapeId) {
            setSelectedId(null)
          }
        }
        break

      case 'CURSOR_MOVE':
        // Update cursor position
        if (message.payload.userId !== currentUserIdRef.current) {
          setCursors(prev => {
            const newCursors = new Map(prev)
            newCursors.set(message.payload.userId, {
              userId: message.payload.userId,
              username: message.payload.username,
              displayName: message.payload.displayName,
              email: message.payload.email,
              color: message.payload.color,
              x: message.payload.x,
              y: message.payload.y,
            })
            return newCursors
          })
        }
        break

      case 'USER_JOIN':
        // User joined
        console.log('USER_JOIN received:', message.payload)
        // Don't add current user to activeUsers list
        if (message.payload.userId === currentUserIdRef.current) {
          // Update current user's color if it's the current user joining
          if (message.payload.color) {
            setCurrentUserColor(message.payload.color)
          }
        } else {
          setActiveUsers(prev => {
            // Check if user with same email already exists
            if (prev.find(u => u.email === message.payload.email)) {
              console.log('User with this email already exists in activeUsers, skipping')
              return prev
            }
            const newUser = {
              userId: message.payload.userId,
              username: message.payload.username,
              displayName: message.payload.displayName,
              email: message.payload.email,
              color: message.payload.color,
            }
            console.log('Adding new user to activeUsers:', newUser)

            // Add new user and deduplicate by email (extra safety check)
            const updatedUsers = [...prev, newUser]
            const uniqueUsers = updatedUsers.filter((user, index, self) =>
              index === self.findIndex(u => u.email === user.email)
            )
            return uniqueUsers
          })
        }
        break

      case 'USER_LEAVE':
        // User left
        console.log('User left:', message.payload.username)
        setActiveUsers(prev => prev.filter(u => u.userId !== message.payload.userId))
        setCursors(prev => {
          const newCursors = new Map(prev)
          newCursors.delete(message.payload.userId)
          return newCursors
        })
        break

      case 'ERROR':
        console.error('WebSocket error:', message.payload.message)
        break
    }
  }, [])

  // Handle shape creation
  const handleAddShape = useCallback(() => {
    if (!wsRef.current || !canvasId || !currentUserId) return

    // Calculate center of current viewport
    const centerX = -stagePos.x / stageScale + (VIEWPORT_WIDTH / 2) / stageScale
    const centerY = -stagePos.y / stageScale + (VIEWPORT_HEIGHT / 2) / stageScale

    // Ensure shape stays within canvas boundaries
    const x = Math.max(0, Math.min(centerX - DEFAULT_SHAPE_SIZE / 2, CANVAS_WIDTH - DEFAULT_SHAPE_SIZE))
    const y = Math.max(0, Math.min(centerY - DEFAULT_SHAPE_SIZE / 2, CANVAS_HEIGHT - DEFAULT_SHAPE_SIZE))

    const shapeData = {
      type: 'rectangle',
      x,
      y,
      width: DEFAULT_SHAPE_SIZE,
      height: DEFAULT_SHAPE_SIZE,
      color: SHAPE_COLOR,
    }

    wsRef.current.send(JSON.stringify({
      type: 'SHAPE_CREATE',
      payload: shapeData,
    }))
  }, [stagePos, stageScale, canvasId, currentUserId])

  // Handle circle creation
  const handleAddCircle = useCallback(() => {
    if (!wsRef.current || !canvasId || !currentUserId) return

    // Calculate center of current viewport
    const centerX = -stagePos.x / stageScale + (VIEWPORT_WIDTH / 2) / stageScale
    const centerY = -stagePos.y / stageScale + (VIEWPORT_HEIGHT / 2) / stageScale

    // Ensure shape stays within canvas boundaries
    const x = Math.max(DEFAULT_SHAPE_SIZE / 2, Math.min(centerX, CANVAS_WIDTH - DEFAULT_SHAPE_SIZE / 2))
    const y = Math.max(DEFAULT_SHAPE_SIZE / 2, Math.min(centerY, CANVAS_HEIGHT - DEFAULT_SHAPE_SIZE / 2))

    const shapeData = {
      type: 'circle',
      x,
      y,
      radius: DEFAULT_SHAPE_SIZE / 2,
      color: SHAPE_COLOR,
    }

    wsRef.current.send(JSON.stringify({
      type: 'SHAPE_CREATE',
      payload: shapeData,
    }))
  }, [stagePos, stageScale, canvasId, currentUserId])

  // Helper function to unlock a shape
  const unlockShape = useCallback((shapeId: string) => {
    if (wsRef.current) {
      console.log('🔓 Unlocking shape:', shapeId)
      wsRef.current.send(JSON.stringify({
        type: 'SHAPE_UPDATE',
        payload: {
          shapeId,
          updates: {
            isLocked: false,
          },
        },
      }))
    }
  }, [])

  // Handle shape selection
  const handleShapeClick = useCallback((id: string) => {
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
        console.log('⛔ Shape is locked by another user')
        return
      }
    }

    // If switching selection, unlock the previously selected shape
    if (selectedId && selectedId !== id) {
      unlockShape(selectedId)
    }

    // Set selected locally
    setSelectedId(id)

    // Send lock message to server to notify other users
    if (wsRef.current) {
      console.log('🔒 Locking shape on selection:', id)
      wsRef.current.send(JSON.stringify({
        type: 'SHAPE_UPDATE',
        payload: {
          shapeId: id,
          updates: {
            isLocked: true,
          },
        },
      }))
    }
  }, [selectedId, unlockShape])

  // Handle shape drag start
  const handleShapeDragStart = useCallback((id: string) => {
    if (!wsRef.current) return

    // Set dragging flags to prevent stage click deselection and accidental selection
    isDraggingShapeRef.current = true
    isShapeDragActiveRef.current = true // Mark shape drag as active
    isDragMoveRef.current = false // Reset drag move flag

    // Select the shape being dragged
    setSelectedId(id)

    // Send lock message immediately
    wsRef.current.send(JSON.stringify({
      type: 'SHAPE_UPDATE',
      payload: {
        shapeId: id,
        updates: {
          isLocked: true,
        },
      },
    }))
  }, [])

  // Handle shape drag - optimistic update with throttled WebSocket sync
  const handleShapeDrag = useCallback((id: string, x: number, y: number) => {
    const shape = shapesRef.current.find(s => s.id === id)
    if (!shape) return

    // Mark that an actual drag move occurred
    isDragMoveRef.current = true

    let constrainedX: number
    let constrainedY: number

    // Constrain to canvas boundaries based on shape type
    if (shape.type === 'circle') {
      const radius = shape.radius || DEFAULT_SHAPE_SIZE / 2
      constrainedX = Math.max(radius, Math.min(x, CANVAS_WIDTH - radius))
      constrainedY = Math.max(radius, Math.min(y, CANVAS_HEIGHT - radius))
    } else {
      // Rectangle or other shapes
      const width = shape.width || DEFAULT_SHAPE_SIZE
      const height = shape.height || DEFAULT_SHAPE_SIZE
      constrainedX = Math.max(0, Math.min(x, CANVAS_WIDTH - width))
      constrainedY = Math.max(0, Math.min(y, CANVAS_HEIGHT - height))
    }

    // Optimistic local update - update immediately for smooth dragging
    setShapes(prev => prev.map(s =>
      s.id === id ? { ...s, x: constrainedX, y: constrainedY } : s
    ))

    // Store the drag position
    dragPositionRef.current = { shapeId: id, x: constrainedX, y: constrainedY }

    // Throttle WebSocket updates to reduce network traffic (every 50ms)
    const now = Date.now()
    if (wsRef.current && now - dragThrottleRef.current > 50) {
      dragThrottleRef.current = now

      wsRef.current.send(JSON.stringify({
        type: 'SHAPE_UPDATE',
        payload: {
          shapeId: id,
          updates: {
            x: constrainedX,
            y: constrainedY,
          },
        },
      }))
    }
  }, [])

  // Handle shape drag end (send final position but keep locked if still selected)
  const handleShapeDragEnd = useCallback((id: string) => {
    if (!wsRef.current) return

    // Clear shape drag active flag immediately
    isShapeDragActiveRef.current = false

    // Clear dragging flag after a longer delay to prevent accidental clicks/deselections
    setTimeout(() => {
      isDraggingShapeRef.current = false
    }, 100)

    // Clear drag move flag after an even longer delay to prevent onClick from firing
    setTimeout(() => {
      isDragMoveRef.current = false
    }, 150)

    // Send final position
    // Keep shape locked since it's still selected after drag ends
    const finalPos = dragPositionRef.current
    if (finalPos && finalPos.shapeId === id) {
      wsRef.current.send(JSON.stringify({
        type: 'SHAPE_UPDATE',
        payload: {
          shapeId: id,
          updates: {
            x: finalPos.x,
            y: finalPos.y,
            // Keep shape locked - it will be unlocked when deselected
          },
        },
      }))
    }

    // Clear drag position
    dragPositionRef.current = null
    dragThrottleRef.current = 0

    // After dropping, unlock and deselect the shape
    unlockShape(id)
    setSelectedId(null)
  }, [])

  // Handle shape deletion
  const handleDeleteShape = useCallback((shapeId?: string) => {
    if (!wsRef.current) return

    // Use passed shapeId or fall back to selectedId from closure
    const idToDelete = shapeId
    if (!idToDelete) return

    const shape = shapesRef.current.find(s => s.id === idToDelete)
    if (shape && shape.locked_at && shape.locked_by !== currentUserIdRef.current) {
      // Check if lock is still valid
      const lockTime = new Date(shape.locked_at).getTime()
      const elapsed = (Date.now() - lockTime) / 1000
      if (elapsed < 10) {
        // Cannot delete locked shapes
        console.log('Cannot delete shape locked by another user')
        return
      }
    }

    wsRef.current.send(JSON.stringify({
      type: 'SHAPE_DELETE',
      payload: { shapeId: idToDelete },
    }))

    setSelectedId(null)
  }, [])

  // Handle keyboard shortcuts (Delete/Backspace/Escape only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        // Use a ref to get the current selectedId to avoid re-creating effect
        const currentSelectedId = selectedId
        if (currentSelectedId) {
          handleDeleteShape(currentSelectedId)
        }
      } else if (e.key === 'Escape') {
        // Unlock shape before deselecting
        if (selectedId) {
          unlockShape(selectedId)
        }
        setSelectedId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.cursor = 'default'
    }
  }, [handleDeleteShape, selectedId, unlockShape])

  // Handle stage click (deselect)
  const handleStageClick = useCallback((e: any) => {
    // Don't deselect if we just finished dragging a shape
    if (isDraggingShapeRef.current) {
      return
    }

    // If clicking on empty stage, deselect
    if (e.target === e.target.getStage()) {
      // Unlock shape before deselecting
      if (selectedId) {
        unlockShape(selectedId)
      }
      setSelectedId(null)
    }
  }, [selectedId, unlockShape])

  // Handle mouse move for cursor tracking
  const handleMouseMove = useCallback((e: any) => {
    if (!wsRef.current) return

    const stage = e.target.getStage()
    const pointerPos = stage.getPointerPosition()

    if (!pointerPos) return

    // Convert screen coords to canvas coords
    const x = (pointerPos.x - stage.x()) / stage.scaleX()
    const y = (pointerPos.y - stage.y()) / stage.scaleY()

    // Throttle cursor updates to 30 FPS (33ms)
    const now = Date.now()
    if (now - cursorThrottleRef.current > 33) {
      cursorThrottleRef.current = now

      wsRef.current.send(JSON.stringify({
        type: 'CURSOR_MOVE',
        payload: { x, y },
      }))
    }
  }, [])

  // Handle zoom (wheel) - center-anchored and animated
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault()

    const stage = stageRef.current
    if (!stage) return

    const oldScale = stage.scaleX()
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const scaleBy = 1.05
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
    newScale = Math.max(0.1, Math.min(3, newScale))

    const anchor = { x: VIEWPORT_WIDTH / 2, y: VIEWPORT_HEIGHT / 2 }
    animateZoomTo(newScale, anchor, 150)
  }, [animateZoomTo])

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(stageScale * 1.2, 3)
    const anchor = { x: VIEWPORT_WIDTH / 2, y: VIEWPORT_HEIGHT / 2 }
    animateZoomTo(newScale, anchor, 200)
  }, [animateZoomTo, stageScale])

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(stageScale / 1.2, 0.1)
    const anchor = { x: VIEWPORT_WIDTH / 2, y: VIEWPORT_HEIGHT / 2 }
    animateZoomTo(newScale, anchor, 200)
  }, [animateZoomTo, stageScale])

  const handleResetView = useCallback(() => {
    const anchor = { x: VIEWPORT_WIDTH / 2, y: VIEWPORT_HEIGHT / 2 }
    animateZoomTo(1, anchor, 250)
  }, [animateZoomTo])

  // Memoize shape rendering props to avoid recalculating on every render
  const shapeRenderProps = useMemo(() => {
    return shapes.map(shape => {
      const isSelected = selectedId === shape.id
      const remainingSeconds = getRemainingLockSeconds(shape.locked_at)
      // Treat as locked whenever locked_by exists; unlock will be delivered by server.
      const isLocked = !!shape.locked_by
      const isLockedByOther = isLocked && shape.locked_by !== currentUserId

      // Locked state takes precedence: show locker's color when locked by someone (including self)
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
  }, [shapes, selectedId, currentTime, currentUserId, currentUserColor, getRemainingLockSeconds, getUserColor])

  // Show authentication prompt if not connected
  if (!currentUserId || !canvasId || !wsRef.current) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
      }}>
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          border: '1px solid #404040',
          maxWidth: '400px',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#ffffff' }}>
            Canvas Loading...
          </h2>
          <p style={{ color: '#b0b0b0', marginBottom: '24px' }}>
            {!currentUserId
              ? 'Please sign in to access the canvas.'
              : !canvasId
                ? 'Initializing canvas...'
                : 'Connecting to WebSocket...'}
          </p>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #404040',
            borderTop: '4px solid #24ccff',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite',
          }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#0a0a0a' }}>
      {/* Controls + Zoom container (top-left column) */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Canvas Controls */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          border: '1px solid #404040',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <button
            onClick={handleAddShape}
            style={{
              padding: '8px 16px',
              backgroundColor: '#72fa41',
              color: '#000000',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Add Rectangle
          </button>
          <button
            onClick={handleAddCircle}
            style={{
              padding: '8px 16px',
              backgroundColor: '#24ccff',
              color: '#000000',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Add Circle
          </button>
          <button
            onClick={handleZoomIn}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2a2a2a',
              color: '#ffffff',
              border: '1px solid #404040',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Zoom In
          </button>
          <button
            onClick={handleZoomOut}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2a2a2a',
              color: '#ffffff',
              border: '1px solid #404040',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Zoom Out
          </button>
          <button
            onClick={handleResetView}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2a2a2a',
              color: '#ffffff',
              border: '1px solid #404040',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Reset View
          </button>
        </div>

        {/* Zoom Indicator (below controls) */}
        <div style={{
          backgroundColor: 'rgba(26,26,26,0.9)',
          color: '#ffffff',
          padding: '6px 10px',
          borderRadius: '6px',
          border: '1px solid #404040',
          fontSize: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          width: 'fit-content'
        }}>
          {Math.round(stageScale * 100)}%
        </div>
      </div>

      {/* Pan Mode Indicator removed */}

      {/* Presence List */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10,
        backgroundColor: '#1a1a1a',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        border: '1px solid #404040',
        minWidth: '200px',
      }}>
        <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#ffffff' }}>
          Online ({onlineUsersCount})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Current user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: currentUserColor,
              boxShadow: `0 0 4px ${currentUserColor}`,
            }} />
            <span style={{ fontSize: '13px', color: '#ffffff' }}>{currentUserEmail} (you)</span>
          </div>
          {/* Other users - using memoized uniqueActiveUsers */}
          {uniqueActiveUsers.map(user => (
            <div key={user.userId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: user.color,
                boxShadow: `0 0 4px ${user.color}`,
              }} />
              <span style={{ fontSize: '13px', color: '#ffffff' }}>
                {user.email || user.username || 'Unknown User'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Zoom Indicator moved below controls */}

      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={VIEWPORT_WIDTH}
        height={VIEWPORT_HEIGHT}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={!isShapeDragActiveRef.current}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onMouseMove={handleMouseMove}
        onDragMove={(e) => {
          // Update position if we're dragging the stage and not a shape
          if (!isShapeDragActiveRef.current) {
            const stage = e.target as Konva.Stage
            setStagePos({ x: stage.x(), y: stage.y() })
          }
        }}
        dragBoundFunc={(pos) => {
          // Constrain stage dragging to canvas boundaries
          const newX = Math.min(0, Math.max(pos.x, VIEWPORT_WIDTH - CANVAS_WIDTH * stageScale))
          const newY = Math.min(0, Math.max(pos.y, VIEWPORT_HEIGHT - CANVAS_HEIGHT * stageScale))
          return { x: newX, y: newY }
        }}
      >
        {/* Background Layer - separate layer prevents re-renders */}
        <Layer listening={false}>
          {/* Canvas Background */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="#1a1a1a"
            listening={false}
          />

          {/* Canvas Border */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            stroke="#404040"
            strokeWidth={2}
            listening={false}
          />
        </Layer>

        {/* Shapes Layer - separate layer prevents re-renders of other elements */}
        <Layer>
          {shapeRenderProps.map(props => (
            <CanvasShape
              key={props.shape.id}
              shape={props.shape}
              strokeColor={props.strokeColor}
              strokeWidth={props.strokeWidth}
              isPressable={props.isPressable}
              isDraggable={props.isDraggable}
              remainingSeconds={props.remainingSeconds}
              onShapeClick={handleShapeClick}
              onDragStart={handleShapeDragStart}
              onDragMove={handleShapeDrag}
              onDragEnd={handleShapeDragEnd}
            />
          ))}
        </Layer>

        {/* Cursors Layer - separate layer prevents re-renders when cursors move */}
        <Layer listening={false}>
          {cursorsArray.map(cursor => (
            <CanvasCursor key={cursor.userId} cursor={cursor} />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}
