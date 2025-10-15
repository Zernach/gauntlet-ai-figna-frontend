import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import Konva from 'konva'
import { supabase } from '../lib/supabase'
import ColorSlider from './ColorSlider'
import CanvasShape from './CanvasShape'
import CanvasCursor from './CanvasCursor'
import ControlPanel from './ControlPanel'
import ShapeSelectionPanel from './ShapeSelectionPanel'
import UndoRedoPanel from './UndoRedoPanel'

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
  rotation?: number
  color: string
  opacity?: number
  shadowColor?: string
  shadowStrength?: number
  text_content?: string
  font_size?: number
  font_family?: string
  font_weight?: string
  text_align?: string
  textContent?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  textAlign?: string
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map())
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [stageScale, setStageScale] = useState(1)
  const [canvasBgHex, setCanvasBgHex] = useState<string>('#1a1a1a')
  const [isCanvasBgOpen, setIsCanvasBgOpen] = useState<boolean>(false)
  const [canvasBgPanelPos, setCanvasBgPanelPos] = useState<{ top: number; left: number } | null>(null)
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
  const isResizingShapeRef = useRef<boolean>(false)
  const resizingShapeIdRef = useRef<string | null>(null)
  const resizeThrottleRef = useRef<number>(0)
  const shapesRef = useRef<Shape[]>([])
  const currentUserIdRef = useRef<string | null>(null)
  const selectedIdRef = useRef<string | null>(null)
  const isDragMoveRef = useRef<boolean>(false)
  const isShapeDragActiveRef = useRef<boolean>(false) // Track if we're actively dragging a shape
  // Rotation refs
  const isRotatingShapeRef = useRef<boolean>(false)
  const rotatingShapeIdRef = useRef<string | null>(null)
  const rotationThrottleRef = useRef<number>(0)
  const rotationRafRef = useRef<number | null>(null)
  const pendingRotationUpdatesRef = useRef<Map<string, number>>(new Map())
  const rotationFrameScheduledRef = useRef<boolean>(false)
  // Drag batching refs
  const dragRafRef = useRef<number | null>(null)
  const pendingDragUpdatesRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  const dragFrameScheduledRef = useRef<boolean>(false)

  // Undo/Redo state
  type WSMessage = { type: string; payload?: any }
  type HistoryEntry = { undo: WSMessage | WSMessage[]; redo: WSMessage | WSMessage[]; label?: string }
  const undoStackRef = useRef<HistoryEntry[]>([])
  const redoStackRef = useRef<HistoryEntry[]>([])
  const [undoCount, setUndoCount] = useState<number>(0)
  const [redoCount, setRedoCount] = useState<number>(0)
  const [hasUserActed, setHasUserActed] = useState<boolean>(false)

  const sendMessage = useCallback((msg: WSMessage) => {
    if (!wsRef.current) return
    wsRef.current.send(JSON.stringify(msg))
  }, [])

  const pushHistory = useCallback((entry: HistoryEntry) => {
    undoStackRef.current.push(entry)
    setUndoCount(undoStackRef.current.length)
    // clear redo stack on new action
    redoStackRef.current = []
    setRedoCount(0)
    if (!hasUserActed) setHasUserActed(true)
  }, [hasUserActed])

  const performUndo = useCallback(() => {
    const entry = undoStackRef.current.pop()
    if (!entry) return
    const msgs = Array.isArray(entry.undo) ? entry.undo : [entry.undo]
    msgs.forEach(sendMessage)
    redoStackRef.current.push(entry)
    setUndoCount(undoStackRef.current.length)
    setRedoCount(redoStackRef.current.length)
  }, [sendMessage])

  const performRedo = useCallback(() => {
    const entry = redoStackRef.current.pop()
    if (!entry) return
    const msgs = Array.isArray(entry.redo) ? entry.redo : [entry.redo]
    msgs.forEach(sendMessage)
    undoStackRef.current.push(entry)
    setUndoCount(undoStackRef.current.length)
    setRedoCount(redoStackRef.current.length)
  }, [sendMessage])

  // Baselines for compound interactions
  const dragBaselineRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  const resizeBaselineRef = useRef<Map<string, any>>(new Map())
  const rotateBaselineRef = useRef<Map<string, number>>(new Map())

  // Debounced property change tracking per shape
  type PendingPropChange = { shapeId: string; prop: string; initial: any; latest: any; timer: number | null }
  const pendingPropChangesRef = useRef<Map<string, PendingPropChange>>(new Map())
  const finalizePropChange = useCallback((key: string) => {
    const pending = pendingPropChangesRef.current.get(key)
    if (!pending) return
    pending.timer = null
    pendingPropChangesRef.current.delete(key)
    if (pending.initial === pending.latest) return
    pushHistory({
      undo: { type: 'SHAPE_UPDATE', payload: { shapeId: pending.shapeId, updates: { [pending.prop]: pending.initial } } },
      redo: { type: 'SHAPE_UPDATE', payload: { shapeId: pending.shapeId, updates: { [pending.prop]: pending.latest } } },
      label: `Change ${pending.prop}`,
    })
  }, [pushHistory])

  const recordPropChange = useCallback((shapeId: string, prop: string, nextValue: any, debounceMs: number = 400) => {
    const key = `${shapeId}:${prop}`
    const existing = pendingPropChangesRef.current.get(key)
    if (existing) {
      existing.latest = nextValue
      if (existing.timer != null) window.clearTimeout(existing.timer)
      existing.timer = window.setTimeout(() => finalizePropChange(key), debounceMs)
      pendingPropChangesRef.current.set(key, existing)
      return
    }
    const shape = shapesRef.current.find(s => s.id === shapeId)
    const initial = (shape as any)?.[prop]
    const created: PendingPropChange = { shapeId, prop, initial, latest: nextValue, timer: window.setTimeout(() => finalizePropChange(key), debounceMs) }
    pendingPropChangesRef.current.set(key, created)
  }, [finalizePropChange])

  // Debounced canvas background change tracking
  const pendingCanvasBgRef = useRef<{ initial: string; latest: string; timer: number | null } | null>(null)
  const finalizeCanvasBgChange = useCallback(() => {
    const p = pendingCanvasBgRef.current
    if (!p) return
    pendingCanvasBgRef.current = null
    if (p.initial === p.latest) return
    pushHistory({
      undo: { type: 'CANVAS_UPDATE', payload: { updates: { backgroundColor: p.initial } } },
      redo: { type: 'CANVAS_UPDATE', payload: { updates: { backgroundColor: p.latest } } },
      label: 'Change canvas background',
    })
  }, [pushHistory])

  const recordCanvasBgChange = useCallback((nextHex: string, debounceMs: number = 400) => {
    if (pendingCanvasBgRef.current) {
      pendingCanvasBgRef.current.latest = nextHex
      if (pendingCanvasBgRef.current.timer != null) window.clearTimeout(pendingCanvasBgRef.current.timer)
      pendingCanvasBgRef.current.timer = window.setTimeout(finalizeCanvasBgChange, debounceMs)
      return
    }
    pendingCanvasBgRef.current = { initial: canvasBgHex, latest: nextHex, timer: window.setTimeout(finalizeCanvasBgChange, debounceMs) }
  }, [canvasBgHex, finalizeCanvasBgChange])

  // Zoom animation refs
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

  // Color throttle ref
  const colorThrottleRef = useRef<number>(0)
  const opacityThrottleRef = useRef<number>(0)
  const shadowThrottleRef = useRef<number>(0)


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

  // Keep stage position ref in sync for continuous zoom calculations
  useEffect(() => {
    stagePosRef.current = stagePos
  }, [stagePos])

  // Start/stop continuous zoom
  const startZoomHold = useCallback((direction: 1 | -1) => {
    zoomHoldDirectionRef.current = direction
    zoomHoldActiveRef.current = true
    zoomHoldLastTsRef.current = 0
    // Cancel any existing zoom animation to avoid fighting animations
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

      const stage = stageRef.current
      if (!stage) {
        zoomHoldRafRef.current = requestAnimationFrame(step)
        return
      }

      const oldScale = stage.scaleX()
      const speedPerMs = 0.0007 // multiplicative scale speed
      const factor = 1 + speedPerMs * dt
      let newScale = zoomHoldDirectionRef.current > 0 ? oldScale * factor : oldScale / factor
      newScale = Math.max(0.1, Math.min(3, newScale))

      const anchor = { x: VIEWPORT_WIDTH / 2, y: VIEWPORT_HEIGHT / 2 }
      const newPos = computeAnchoredPosition(oldScale, newScale, stagePosRef.current, anchor)

      setStageScale(newScale)
      setStagePos(newPos)

      zoomHoldRafRef.current = requestAnimationFrame(step)
    }

    zoomHoldRafRef.current = requestAnimationFrame(step)
  }, [cancelZoomAnimation, computeAnchoredPosition])

  const stopZoomHold = useCallback(() => {
    zoomHoldActiveRef.current = false
    zoomHoldLastTsRef.current = 0
    if (zoomHoldRafRef.current != null) {
      cancelAnimationFrame(zoomHoldRafRef.current)
      zoomHoldRafRef.current = null
    }
  }, [])

  // Cleanup continuous zoom on unmount
  useEffect(() => {
    return () => {
      if (zoomHoldRafRef.current != null) {
        cancelAnimationFrame(zoomHoldRafRef.current)
        zoomHoldRafRef.current = null
      }
      zoomHoldActiveRef.current = false
      // Cleanup any pending drag animation frame
      if (dragRafRef.current != null) {
        cancelAnimationFrame(dragRafRef.current)
        dragRafRef.current = null
      }
      pendingDragUpdatesRef.current.clear()
      dragFrameScheduledRef.current = false
    }
  }, [])

  // Recompute canvas background panel position when opened or on resize
  const computeCanvasBgPanelPosition = useCallback(() => {
    const container = containerRef.current
    const btn = typeof document !== 'undefined' ? document.getElementById('canvas-bg-btn') : null
    const panel = typeof document !== 'undefined' ? document.getElementById('main-control-panel') : null
    if (!container || !btn || !panel) return
    const cRect = container.getBoundingClientRect()
    const bRect = btn.getBoundingClientRect()
    const pRect = panel.getBoundingClientRect()
    const gap = 12
    const top = Math.round(bRect.top - cRect.top)
    const left = Math.round(pRect.right - cRect.left + gap)
    setCanvasBgPanelPos({ top, left })
  }, [])

  useEffect(() => {
    if (!isCanvasBgOpen) return
    computeCanvasBgPanelPosition()
    const onResize = () => computeCanvasBgPanelPosition()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isCanvasBgOpen, computeCanvasBgPanelPosition])

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
    const textContent = s.textContent !== undefined ? s.textContent : (s.text_content !== undefined ? s.text_content : undefined)
    const fontSize = s.fontSize !== undefined ? s.fontSize : (s.font_size !== undefined ? s.font_size : undefined)
    const opacity = s.opacity !== undefined ? s.opacity : undefined
    const shadowColor = s.shadowColor !== undefined ? s.shadowColor : (s.shadow_color !== undefined ? s.shadow_color : undefined)
    const shadowStrength = s.shadowStrength !== undefined ? s.shadowStrength : (s.shadow_strength !== undefined ? s.shadow_strength : undefined)
    return {
      ...s,
      locked_at,
      locked_by,
      textContent,
      fontSize,
      opacity,
      shadowColor,
      shadowStrength,
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

        // Get API URL (trim trailing slash to avoid double slashes)
        const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl

        // Get the global canvas (will be created automatically if it doesn't exist)
        const response = await fetch(`${API_URL}/canvas`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Accept': 'application/json',
          },
        })

        if (!response.ok) throw new Error(`Failed to fetch global canvas: ${response.status} ${response.statusText}`)

        // Ensure we actually received JSON to avoid parsing HTML error pages
        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          const text = await response.text()
          throw new Error(`Expected JSON but received '${contentType}'. Check VITE_API_URL. Body: ${text.slice(0, 200)}`)
        }

        const result = await response.json()
        const canvas = result.data

        console.log('✅ Connected to global canvas:', canvas.name)
        // Hydrate canvas background immediately from API response (before WS sync)
        const initialBg = canvas.background_color ?? canvas.backgroundColor
        if (initialBg) {
          setCanvasBgHex(initialBg)
        }
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
        if (message.payload.canvas) {
          const bg = message.payload.canvas.background_color ?? message.payload.canvas.backgroundColor
          if (bg) setCanvasBgHex(bg)
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

      case 'CANVAS_UPDATE':
        if (message.payload.canvas) {
          const bg = message.payload.canvas.background_color ?? message.payload.canvas.backgroundColor
          if (bg) setCanvasBgHex(bg)
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
          // Record undo/redo if it was created by current user
          try {
            const createdBy = message.payload.shape.created_by ?? message.payload.shape.createdBy
            if (createdBy && createdBy === currentUserIdRef.current) {
              const fullShape = normalizeShape(message.payload.shape)
              pushHistory({
                undo: { type: 'SHAPE_DELETE', payload: { shapeId: fullShape.id } },
                redo: { type: 'SHAPE_CREATE', payload: { ...fullShape } },
                label: 'Create shape',
              })
            }
          } catch { }
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
              // If we're currently resizing this shape, preserve local geometry (x/y/size)
              if (isResizingShapeRef.current && resizingShapeIdRef.current === s.id) {
                return {
                  ...shape,
                  x: s.x,
                  y: s.y,
                  width: s.width,
                  height: s.height,
                  radius: s.radius,
                }
              }
              // If we're currently rotating this shape, preserve local rotation to avoid flicker
              if (isRotatingShapeRef.current && rotatingShapeIdRef.current === s.id) {
                return {
                  ...shape,
                  rotation: s.rotation,
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

      case 'ACTIVE_USERS':
        if (message.payload && Array.isArray(message.payload.activeUsers)) {
          // Remove current user and deduplicate by email
          const otherUsers = message.payload.activeUsers.filter((u: ActiveUser) => u.userId !== currentUserIdRef.current)
          const uniqueUsers = otherUsers.filter((user: ActiveUser, index: number, self: ActiveUser[]) =>
            index === self.findIndex((u: ActiveUser) => u.email === user.email)
          )
          setActiveUsers(uniqueUsers)
        }
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

  // Handle text creation
  const handleAddText = useCallback(() => {
    if (!wsRef.current || !canvasId || !currentUserId) return

    const centerX = -stagePos.x / stageScale + (VIEWPORT_WIDTH / 2) / stageScale
    const centerY = -stagePos.y / stageScale + (VIEWPORT_HEIGHT / 2) / stageScale

    const x = Math.max(0, Math.min(centerX, CANVAS_WIDTH))
    const y = Math.max(0, Math.min(centerY, CANVAS_HEIGHT))

    const shapeData = {
      type: 'text',
      x,
      y,
      color: '#ffffff',
      textContent: 'Text',
      fontSize: 24,
      fontFamily: 'Inter',
      fontWeight: 'normal',
      textAlign: 'left',
    }

    wsRef.current.send(JSON.stringify({
      type: 'SHAPE_CREATE',
      payload: shapeData,
    }))
  }, [stagePos, stageScale, canvasId, currentUserId])

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
      wsRef.current.send(JSON.stringify({
        type: 'SHAPE_UPDATE',
        payload: {
          shapeId: id,
          updates: { textContent: newText },
        },
      }))
    }
  }, [])

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
    const s = shapesRef.current.find(sh => sh.id === id)
    if (s) {
      dragBaselineRef.current.set(id, { x: s.x, y: s.y })
    }

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

  const flushPendingRotationUpdates = useCallback(() => {
    rotationFrameScheduledRef.current = false
    const pending = pendingRotationUpdatesRef.current
    if (pending.size === 0) return
    setShapes(prev => prev.map(s => {
      const angle = pending.get(s.id)
      return angle !== undefined ? { ...s, rotation: angle } : s
    }))
    pending.clear()
  }, [])

  const flushPendingDragUpdates = useCallback(() => {
    dragFrameScheduledRef.current = false
    const pending = pendingDragUpdatesRef.current
    if (pending.size === 0) return
    setShapes(prev => prev.map(s => {
      const u = pending.get(s.id)
      return u ? { ...s, x: u.x, y: u.y } : s
    }))
    pending.clear()
  }, [])

  // Handle shape drag - rAF-batched local update with throttled WebSocket sync
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

    // Queue local update; flush at most once per frame
    pendingDragUpdatesRef.current.set(id, { x: constrainedX, y: constrainedY })
    if (!dragFrameScheduledRef.current) {
      dragFrameScheduledRef.current = true
      dragRafRef.current = requestAnimationFrame(flushPendingDragUpdates)
    }

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
      const base = dragBaselineRef.current.get(id)
      if (base && (base.x !== finalPos.x || base.y !== finalPos.y)) {
        pushHistory({
          undo: { type: 'SHAPE_UPDATE', payload: { shapeId: id, updates: { x: base.x, y: base.y } } },
          redo: { type: 'SHAPE_UPDATE', payload: { shapeId: id, updates: { x: finalPos.x, y: finalPos.y } } },
          label: 'Move shape',
        })
      }
    }

    // Clear drag position
    dragPositionRef.current = null
    dragThrottleRef.current = 0
    dragBaselineRef.current.delete(id)

    // Cancel any pending rAF and clear queued drag updates
    if (dragRafRef.current != null) {
      cancelAnimationFrame(dragRafRef.current)
      dragRafRef.current = null
    }
    pendingDragUpdatesRef.current.clear()
    dragFrameScheduledRef.current = false

    // After dropping, unlock and deselect the shape
    unlockShape(id)
    setSelectedId(null)
  }, [])

  // Resize handlers
  const handleResizeStart = useCallback((id: string) => {
    if (!wsRef.current) return
    isResizingShapeRef.current = true
    resizingShapeIdRef.current = id
    // Select and lock immediately
    setSelectedId(id)
    const s = shapesRef.current.find(sh => sh.id === id)
    if (s) {
      if (s.type === 'circle') {
        resizeBaselineRef.current.set(id, { radius: s.radius })
      } else if (s.type === 'text') {
        const fs = (s as any).fontSize ?? (s as any).font_size ?? 24
        resizeBaselineRef.current.set(id, { fontSize: fs })
      } else {
        resizeBaselineRef.current.set(id, { x: s.x, y: s.y, width: s.width, height: s.height })
      }
    }
    wsRef.current.send(JSON.stringify({
      type: 'SHAPE_UPDATE',
      payload: {
        shapeId: id,
        updates: { isLocked: true },
      },
    }))
  }, [])

  const handleResizeMove = useCallback((id: string, updates: { x?: number; y?: number; width?: number; height?: number; radius?: number; fontSize?: number }) => {
    const shape = shapesRef.current.find(s => s.id === id)
    if (!shape) return

    const minRectSize = 10
    const minRadius = 5

    if (shape.type === 'circle') {
      const currentRadius = shape.radius || DEFAULT_SHAPE_SIZE / 2
      let newRadius = updates.radius !== undefined ? updates.radius : currentRadius
      newRadius = Math.max(minRadius, newRadius)
      // Constrain circle within canvas
      const maxRadius = Math.min(shape.x, shape.y, CANVAS_WIDTH - shape.x, CANVAS_HEIGHT - shape.y)
      newRadius = Math.min(newRadius, Math.max(minRadius, maxRadius))

      // Optimistic update
      setShapes(prev => prev.map(s => s.id === id ? { ...s, radius: newRadius } : s))

      const now = Date.now()
      if (wsRef.current && now - resizeThrottleRef.current > 50) {
        resizeThrottleRef.current = now
        wsRef.current.send(JSON.stringify({
          type: 'SHAPE_UPDATE',
          payload: { shapeId: id, updates: { radius: newRadius } },
        }))
      }
      return
    }

    // Text proportional resize via fontSize
    if (shape.type === 'text' && updates.fontSize !== undefined) {
      const newFontSize = Math.max(8, Math.min(512, Math.round(updates.fontSize)))
      // Optimistic update
      setShapes(prev => prev.map(s => s.id === id ? { ...s, fontSize: newFontSize } : s))

      const now = Date.now()
      if (wsRef.current && now - resizeThrottleRef.current > 50) {
        resizeThrottleRef.current = now
        wsRef.current.send(JSON.stringify({
          type: 'SHAPE_UPDATE',
          payload: { shapeId: id, updates: { fontSize: newFontSize } },
        }))
      }
      return
    }

    // Rectangle resize
    const currentW = shape.width || DEFAULT_SHAPE_SIZE
    const currentH = shape.height || DEFAULT_SHAPE_SIZE
    let newX = updates.x !== undefined ? updates.x : shape.x
    let newY = updates.y !== undefined ? updates.y : shape.y
    let newW = updates.width !== undefined ? updates.width : currentW
    let newH = updates.height !== undefined ? updates.height : currentH

    // Clamp position to canvas
    newX = Math.max(0, newX)
    newY = Math.max(0, newY)
    // Clamp size to min
    newW = Math.max(minRectSize, newW)
    newH = Math.max(minRectSize, newH)
    // Clamp size to stay within canvas bounds
    newW = Math.min(newW, CANVAS_WIDTH - newX)
    newH = Math.min(newH, CANVAS_HEIGHT - newY)

    // Optimistic update
    setShapes(prev => prev.map(s => s.id === id ? { ...s, x: newX, y: newY, width: newW, height: newH } : s))

    const now = Date.now()
    if (wsRef.current && now - resizeThrottleRef.current > 50) {
      resizeThrottleRef.current = now
      wsRef.current.send(JSON.stringify({
        type: 'SHAPE_UPDATE',
        payload: { shapeId: id, updates: { x: newX, y: newY, width: newW, height: newH } },
      }))
    }
  }, [])

  const handleResizeEnd = useCallback((id: string) => {
    if (!wsRef.current) return
    // Send final geometry
    const s = shapesRef.current.find(sh => sh.id === id)
    if (s) {
      const updates: any = {}
      if (s.type === 'circle') {
        updates.radius = s.radius
      } else if (s.type === 'text') {
        const fs = (s as any).fontSize ?? (s as any).font_size ?? 24
        updates.fontSize = Math.max(8, Math.min(512, Math.round(fs)))
      } else {
        updates.x = s.x
        updates.y = s.y
        updates.width = s.width
        updates.height = s.height
      }
      wsRef.current.send(JSON.stringify({ type: 'SHAPE_UPDATE', payload: { shapeId: id, updates } }))
      const base = resizeBaselineRef.current.get(id)
      if (base) {
        let before: any = {}
        let after: any = {}
        if (s.type === 'circle') {
          before = { radius: base.radius }
          after = { radius: updates.radius }
        } else if (s.type === 'text') {
          before = { fontSize: base.fontSize }
          after = { fontSize: updates.fontSize }
        } else {
          before = { x: base.x, y: base.y, width: base.width, height: base.height }
          after = { x: updates.x, y: updates.y, width: updates.width, height: updates.height }
        }
        const changed = Object.keys(after).some(k => (before as any)[k] !== (after as any)[k])
        if (changed) {
          pushHistory({
            undo: { type: 'SHAPE_UPDATE', payload: { shapeId: id, updates: before } },
            redo: { type: 'SHAPE_UPDATE', payload: { shapeId: id, updates: after } },
            label: 'Resize shape',
          })
        }
      }
    }

    // Clear flags
    isResizingShapeRef.current = false
    resizingShapeIdRef.current = null
    resizeThrottleRef.current = 0
    resizeBaselineRef.current.delete(id)

    // Unlock and deselect
    unlockShape(id)
    setSelectedId(null)
  }, [])

  // Rotation handlers
  const handleRotateStart = useCallback((id: string) => {
    if (!wsRef.current) return
    // Select and lock immediately
    setSelectedId(id)
    isRotatingShapeRef.current = true
    rotatingShapeIdRef.current = id
    const s = shapesRef.current.find(sh => sh.id === id)
    if (s) {
      rotateBaselineRef.current.set(id, s.rotation ?? 0)
    }
    wsRef.current.send(JSON.stringify({
      type: 'SHAPE_UPDATE',
      payload: { shapeId: id, updates: { isLocked: true } },
    }))
  }, [])

  const handleRotateMove = useCallback((id: string, rotation: number) => {
    const shape = shapesRef.current.find(s => s.id === id)
    if (!shape) return

    // Queue local rotation update; flush at most once per frame
    pendingRotationUpdatesRef.current.set(id, rotation)
    if (!rotationFrameScheduledRef.current) {
      rotationFrameScheduledRef.current = true
      rotationRafRef.current = requestAnimationFrame(flushPendingRotationUpdates)
    }

    // Throttle WebSocket rotation updates (~20fps)
    const now = Date.now()
    if (now - rotationThrottleRef.current < 50) return
    rotationThrottleRef.current = now

    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'SHAPE_UPDATE',
        payload: { shapeId: id, updates: { rotation } },
      }))
    }
  }, [])

  const handleRotateEnd = useCallback((id: string) => {
    if (!wsRef.current) return
    // Send final rotation
    const s = shapesRef.current.find(sh => sh.id === id)
    if (s) {
      wsRef.current.send(JSON.stringify({
        type: 'SHAPE_UPDATE',
        payload: { shapeId: id, updates: { rotation: s.rotation } },
      }))
      const base = rotateBaselineRef.current.get(id) ?? 0
      const finalRot = s.rotation ?? 0
      if (base !== finalRot) {
        pushHistory({
          undo: { type: 'SHAPE_UPDATE', payload: { shapeId: id, updates: { rotation: base } } },
          redo: { type: 'SHAPE_UPDATE', payload: { shapeId: id, updates: { rotation: finalRot } } },
          label: 'Rotate shape',
        })
      }
    }
    // Cleanup rotation batching
    if (rotationRafRef.current != null) {
      cancelAnimationFrame(rotationRafRef.current)
      rotationRafRef.current = null
    }
    pendingRotationUpdatesRef.current.clear()
    rotationFrameScheduledRef.current = false
    rotationThrottleRef.current = 0
    isRotatingShapeRef.current = false
    rotatingShapeIdRef.current = null
    // Unlock and deselect
    unlockShape(id)
    setSelectedId(null)
    rotateBaselineRef.current.delete(id)
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

    if (shape) {
      const snapshot = { ...shape }
      pushHistory({
        undo: { type: 'SHAPE_CREATE', payload: snapshot },
        redo: { type: 'SHAPE_DELETE', payload: { shapeId: snapshot.id } },
        label: 'Delete shape',
      })
    }

    wsRef.current.send(JSON.stringify({
      type: 'SHAPE_DELETE',
      payload: { shapeId: idToDelete },
    }))

    setSelectedId(null)
  }, [])

  // Handle keyboard shortcuts (Undo/Redo/Delete/Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const ctrlOrMeta = isMac ? e.metaKey : e.ctrlKey
      if (ctrlOrMeta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        performUndo()
        return
      }
      if ((ctrlOrMeta && e.key.toLowerCase() === 'z' && e.shiftKey) || (!isMac && e.ctrlKey && e.key.toLowerCase() === 'y')) {
        e.preventDefault()
        performRedo()
        return
      }
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
  }, [handleDeleteShape, selectedId, unlockShape, performUndo, performRedo])

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

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }, [])

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

  const selectedShape = useMemo(() => shapes.find(s => s.id === selectedId) || null, [shapes, selectedId])

  const handleChangeColor = useCallback((hex: string) => {
    if (!selectedId || !wsRef.current) return
    // Optimistic local update
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, color: hex } : s))
    // Debounced history
    recordPropChange(selectedId, 'color', hex)
    const now = Date.now()
    if (now - colorThrottleRef.current > 50) {
      colorThrottleRef.current = now
      wsRef.current.send(JSON.stringify({
        type: 'SHAPE_UPDATE',
        payload: { shapeId: selectedId, updates: { color: hex } },
      }))
    }
  }, [selectedId, recordPropChange])

  // Panel handlers
  const handleChangeOpacity = useCallback((opacity01: number) => {
    if (!selectedId || !wsRef.current) return
    const clamped = Math.max(0, Math.min(1, opacity01))
    // Optimistic
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, opacity: clamped } : s))
    recordPropChange(selectedId, 'opacity', clamped)
    const now = Date.now()
    if (now - opacityThrottleRef.current > 50) {
      opacityThrottleRef.current = now
      wsRef.current.send(JSON.stringify({
        type: 'SHAPE_UPDATE',
        payload: { shapeId: selectedId, updates: { opacity: clamped } },
      }))
    }
  }, [selectedId, recordPropChange])

  const handleCommitRotation = useCallback((rotationDeg: number) => {
    if (!selectedId || !wsRef.current) return
    const normalized = Math.round(rotationDeg)
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, rotation: normalized } : s))
    recordPropChange(selectedId, 'rotation', normalized)
    wsRef.current.send(JSON.stringify({
      type: 'SHAPE_UPDATE',
      payload: { shapeId: selectedId, updates: { rotation: normalized } },
    }))
  }, [selectedId, recordPropChange])

  const handleChangeShadowColor = useCallback((hex: string) => {
    if (!selectedId || !wsRef.current) return
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, shadowColor: hex } : s))
    recordPropChange(selectedId, 'shadowColor', hex)
    wsRef.current.send(JSON.stringify({
      type: 'SHAPE_UPDATE',
      payload: { shapeId: selectedId, updates: { shadowColor: hex } },
    }))
  }, [selectedId, recordPropChange])

  const handleChangeShadowStrength = useCallback((strength: number) => {
    if (!selectedId || !wsRef.current) return
    const v = Math.max(0, Math.min(50, Math.round(strength)))
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, shadowStrength: v } : s))
    recordPropChange(selectedId, 'shadowStrength', v)
    const now = Date.now()
    if (now - shadowThrottleRef.current > 50) {
      shadowThrottleRef.current = now
      wsRef.current.send(JSON.stringify({
        type: 'SHAPE_UPDATE',
        payload: { shapeId: selectedId, updates: { shadowStrength: v } },
      }))
    }
  }, [selectedId, recordPropChange])

  const handleChangeFontFamily = useCallback((family: string) => {
    if (!selectedId || !wsRef.current) return
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, fontFamily: family } : s))
    recordPropChange(selectedId, 'fontFamily', family)
    wsRef.current.send(JSON.stringify({
      type: 'SHAPE_UPDATE',
      payload: { shapeId: selectedId, updates: { fontFamily: family } },
    }))
  }, [selectedId, recordPropChange])

  const handleChangeFontWeight = useCallback((weight: string) => {
    if (!selectedId || !wsRef.current) return
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, fontWeight: weight } : s))
    recordPropChange(selectedId, 'fontWeight', weight)
    wsRef.current.send(JSON.stringify({
      type: 'SHAPE_UPDATE',
      payload: { shapeId: selectedId, updates: { fontWeight: weight } },
    }))
  }, [selectedId, recordPropChange])

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
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#0a0a0a' }}>
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
      />

      {/* Pan Mode Indicator removed */}

      {/* Presence List */}
      <div id="presence-panel" style={{
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
        <button
          onClick={handleSignOut}
          title="Sign out"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '22px',
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#2a2a2a',
            color: '#ffffff',
            border: '1px solid #404040',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            lineHeight: 1,
          }}
        >
          ⎋
        </button>
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

      {/* Undo/Redo Panel - rendered 20px below Presence List */}
      {hasUserActed && (
        <div
          style={{
            position: 'absolute',
            right: '20px',
            zIndex: 9,
            // top computed dynamically via inline script below
          }}
          ref={(el) => {
            if (!el) return
            const presence = document.getElementById('presence-panel')
            const container = containerRef.current
            if (!presence || !container) return
            const update = () => {
              const cRect = container.getBoundingClientRect()
              const pRect = presence.getBoundingClientRect()
              const top = Math.max(0, Math.round(pRect.bottom - cRect.top + 20))
              el.style.top = `${top}px`
            }
            update()
            const ro = new ResizeObserver(update)
            ro.observe(presence)
            window.addEventListener('resize', update)
            return () => {
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
        width={VIEWPORT_WIDTH}
        height={VIEWPORT_HEIGHT}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={!isShapeDragActiveRef.current && !isResizingShapeRef.current && !isRotatingShapeRef.current}
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
            fill={canvasBgHex}
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
              isSelected={selectedId === props.shape.id}
              canResize={props.isDraggable}
              remainingSeconds={props.remainingSeconds}
              stageScale={stageScale}
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
      {/* Shape Selection Panel (lower-right) */}
      {selectedShape && (
        <ShapeSelectionPanel
          selectedShape={selectedShape as any}
          onChangeColor={handleChangeColor}
          onChangeOpacity={handleChangeOpacity}
          onCommitRotation={handleCommitRotation}
          onChangeShadowColor={handleChangeShadowColor}
          onChangeShadowStrength={handleChangeShadowStrength}
          onChangeFontFamily={handleChangeFontFamily}
          onChangeFontWeight={handleChangeFontWeight}
        />
      )}
      {/* Color Tooltip removed in favor of ShapeSelectionPanel */}

      {/* Floating Canvas Background Color panel (right side) */}
      {isCanvasBgOpen && (
        <div
          style={{
            position: 'absolute',
            top: canvasBgPanelPos ? `${canvasBgPanelPos.top}px` : '20px',
            left: canvasBgPanelPos ? `${canvasBgPanelPos.left}px` : 'calc(20px + 200px + 12px)',
            zIndex: 11,
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            border: '1px solid #404040',
            borderRadius: '12px',
            padding: '12px 14px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Canvas Background
          </div>
          <ColorSlider
            valueHex={canvasBgHex}
            onChangeHex={(hex) => {
              setCanvasBgHex(hex)
              if (wsRef.current) {
                wsRef.current.send(JSON.stringify({
                  type: 'CANVAS_UPDATE',
                  payload: { updates: { backgroundColor: hex } }
                }))
              }
              recordCanvasBgChange(hex)
            }}
            allowHexEdit={true}
            layout="row"
          />
        </div>
      )}
    </div>
  )
}

// Render a small HTML tooltip below the selected shape with a hue slider
// We place it absolutely within the outer container returned by Canvas
