import { useEffect, useRef, useState, useCallback } from 'react'
import { Stage, Layer, Rect, Circle, Text as KonvaText } from 'react-konva'
import Konva from 'konva'
import { supabase } from '../lib/supabase'

// Canvas constants - Extremely expansive canvas
const CANVAS_WIDTH = 50000
const CANVAS_HEIGHT = 50000
const VIEWPORT_WIDTH = window.innerWidth
const VIEWPORT_HEIGHT = window.innerHeight
const DEFAULT_SHAPE_SIZE = 100
const SHAPE_COLOR = '#cccccc'

// User color palette for cursors
const USER_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
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
  is_locked?: boolean
  locked_by?: string
  created_by?: string
}

interface Cursor {
  userId: string
  username: string
  displayName: string
  color: string
  x: number
  y: number
}

interface ActiveUser {
  userId: string
  username: string
  displayName: string
  color: string
}

export default function Canvas() {
  const stageRef = useRef<Konva.Stage>(null)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map())
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [stageScale, setStageScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [canvasId, setCanvasId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserColor, setCurrentUserColor] = useState<string>('#3b82f6')
  const [isPanning, setIsPanning] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const cursorThrottleRef = useRef<number>(0)
  const dragThrottleRef = useRef<number>(0)
  const dragPositionRef = useRef<{ shapeId: string; x: number; y: number } | null>(null)
  const isDraggingShapeRef = useRef<boolean>(false)

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

        // Assign user color
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
        if (message.payload.shapes) {
          setShapes(message.payload.shapes)
        }
        if (message.payload.activeUsers) {
          setActiveUsers(message.payload.activeUsers)
        }
        break

      case 'SHAPE_CREATE':
        // New shape created
        if (message.payload.shape) {
          setShapes(prev => {
            // Check if shape already exists to prevent duplicates
            const exists = prev.some(s => s.id === message.payload.shape.id)
            if (exists) {
              return prev
            }
            return [...prev, message.payload.shape]
          })
        }
        break

      case 'SHAPE_UPDATE':
        // Shape updated
        if (message.payload.shape) {
          setShapes(prev => prev.map(s =>
            s.id === message.payload.shape.id ? message.payload.shape : s
          ))
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
        if (message.payload.userId !== currentUserId) {
          setCursors(prev => {
            const newCursors = new Map(prev)
            newCursors.set(message.payload.userId, {
              userId: message.payload.userId,
              username: message.payload.username,
              displayName: message.payload.displayName,
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
        console.log('User joined:', message.payload.username)
        setActiveUsers(prev => {
          if (prev.find(u => u.userId === message.payload.userId)) return prev
          return [...prev, {
            userId: message.payload.userId,
            username: message.payload.username,
            displayName: message.payload.displayName,
            color: message.payload.color,
          }]
        })
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
  }, [currentUserId, selectedId])

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

  // Handle shape selection
  const handleShapeClick = useCallback((id: string) => {
    const shape = shapes.find(s => s.id === id)
    if (shape && shape.is_locked && shape.locked_by !== currentUserId) {
      // Shape is locked by another user
      console.log('Shape is locked by another user')
      return
    }
    setSelectedId(id)
  }, [shapes, currentUserId])

  // Handle shape drag start
  const handleShapeDragStart = useCallback((id: string) => {
    if (!wsRef.current) return

    // Set dragging flag to prevent stage click deselection
    isDraggingShapeRef.current = true

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
    const shape = shapes.find(s => s.id === id)
    if (!shape) return

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
  }, [shapes])

  // Handle shape drag end (unlock and send final position)
  const handleShapeDragEnd = useCallback((id: string) => {
    if (!wsRef.current) return

    // Clear dragging flag after a brief delay to prevent immediate stage click
    setTimeout(() => {
      isDraggingShapeRef.current = false
    }, 10)

    // Send final position and unlock shape
    const finalPos = dragPositionRef.current
    if (finalPos && finalPos.shapeId === id) {
      wsRef.current.send(JSON.stringify({
        type: 'SHAPE_UPDATE',
        payload: {
          shapeId: id,
          updates: {
            x: finalPos.x,
            y: finalPos.y,
            isLocked: false,
          },
        },
      }))
    } else {
      // Just unlock if no position stored
      wsRef.current.send(JSON.stringify({
        type: 'SHAPE_UPDATE',
        payload: {
          shapeId: id,
          updates: {
            isLocked: false,
          },
        },
      }))
    }

    // Clear drag position
    dragPositionRef.current = null
    dragThrottleRef.current = 0
  }, [])

  // Handle shape deletion
  const handleDeleteShape = useCallback(() => {
    if (!selectedId || !wsRef.current) return

    const shape = shapes.find(s => s.id === selectedId)
    if (shape && shape.is_locked && shape.locked_by !== currentUserId) {
      // Cannot delete locked shapes
      console.log('Cannot delete shape locked by another user')
      return
    }

    wsRef.current.send(JSON.stringify({
      type: 'SHAPE_DELETE',
      payload: { shapeId: selectedId },
    }))

    setSelectedId(null)
  }, [selectedId, shapes, currentUserId])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        handleDeleteShape()
      } else if (e.key === 'Escape') {
        setSelectedId(null)
      } else if (e.key === ' ' && !isPanning) {
        e.preventDefault()
        setIsPanning(true)
        document.body.style.cursor = 'grab'
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && isPanning) {
        e.preventDefault()
        setIsPanning(false)
        document.body.style.cursor = 'default'
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      document.body.style.cursor = 'default'
    }
  }, [handleDeleteShape, isPanning])

  // Handle stage click (deselect)
  const handleStageClick = useCallback((e: any) => {
    // Don't deselect if we just finished dragging a shape
    if (isDraggingShapeRef.current) {
      return
    }

    // If clicking on empty stage, deselect
    if (e.target === e.target.getStage()) {
      setSelectedId(null)
    }
  }, [])

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

  // Handle zoom
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault()

    const stage = stageRef.current
    if (!stage) return

    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()

    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const direction = e.evt.deltaY > 0 ? -1 : 1
    const scaleBy = 1.05
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy

    // Constrain zoom level
    newScale = Math.max(0.1, Math.min(3, newScale))

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }

    setStageScale(newScale)
    setStagePos(newPos)
  }, [])

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(stageScale * 1.2, 3)
    setStageScale(newScale)
  }, [stageScale])

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(stageScale / 1.2, 0.1)
    setStageScale(newScale)
  }, [stageScale])

  const handleResetView = useCallback(() => {
    setStageScale(1)
    setStagePos({ x: 0, y: 0 })
  }, [])

  // Show authentication prompt if not connected
  if (!currentUserId || !canvasId || !wsRef.current) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            Canvas Loading...
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            {!currentUserId
              ? 'Please sign in to access the canvas.'
              : !canvasId
                ? 'Initializing canvas...'
                : 'Connecting to WebSocket...'}
          </p>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite',
          }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Canvas Controls */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        backgroundColor: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <button
          onClick={handleAddShape}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
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
            backgroundColor: '#10b981',
            color: 'white',
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
            backgroundColor: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
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
            backgroundColor: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
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
            backgroundColor: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Reset View
        </button>
        <div style={{
          padding: '8px',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#6b7280',
          textAlign: 'center',
        }}>
          Hold <strong>Space</strong> to pan
        </div>
      </div>

      {/* Pan Mode Indicator */}
      {isPanning && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          pointerEvents: 'none',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          🖐️ Pan Mode Active
        </div>
      )}

      {/* Presence List */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10,
        backgroundColor: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minWidth: '200px',
      }}>
        <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
          Online ({activeUsers.length + 1})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Current user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: currentUserColor,
            }} />
            <span style={{ fontSize: '13px' }}>You</span>
          </div>
          {/* Other users */}
          {activeUsers.map(user => (
            <div key={user.userId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: user.color,
              }} />
              <span style={{ fontSize: '13px' }}>
                {user.displayName || user.username}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={VIEWPORT_WIDTH}
        height={VIEWPORT_HEIGHT}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={isPanning}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onMouseMove={handleMouseMove}
        onDragMove={(e) => {
          const stage = e.target as Konva.Stage
          setStagePos({ x: stage.x(), y: stage.y() })
        }}
        dragBoundFunc={(pos) => {
          // Constrain stage dragging to canvas boundaries
          const newX = Math.min(0, Math.max(pos.x, VIEWPORT_WIDTH - CANVAS_WIDTH * stageScale))
          const newY = Math.min(0, Math.max(pos.y, VIEWPORT_HEIGHT - CANVAS_HEIGHT * stageScale))
          return { x: newX, y: newY }
        }}
      >
        <Layer>
          {/* Canvas Background */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="#f8f9fa"
            listening={false}
          />

          {/* Canvas Border */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            stroke="#e5e7eb"
            strokeWidth={2}
            listening={false}
          />

          {/* Shapes */}
          {shapes.map(shape => {
            const isSelected = selectedId === shape.id
            const strokeColor = isSelected ? '#3b82f6' : shape.is_locked ? '#ef4444' : '#000000'
            const strokeWidth = isSelected ? 3 : shape.is_locked ? 2 : 1
            const isDraggable = !isPanning && (!shape.is_locked || shape.locked_by === currentUserId)

            if (shape.type === 'circle') {
              return (
                <Circle
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  radius={shape.radius || DEFAULT_SHAPE_SIZE / 2}
                  fill={shape.color}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  onClick={() => !isPanning && handleShapeClick(shape.id)}
                  draggable={isDraggable}
                  onDragStart={() => handleShapeDragStart(shape.id)}
                  onDragMove={(e) => {
                    handleShapeDrag(shape.id, e.target.x(), e.target.y())
                  }}
                  onDragEnd={() => handleShapeDragEnd(shape.id)}
                />
              )
            }

            // Default to rectangle
            return (
              <Rect
                key={shape.id}
                x={shape.x}
                y={shape.y}
                width={shape.width || DEFAULT_SHAPE_SIZE}
                height={shape.height || DEFAULT_SHAPE_SIZE}
                fill={shape.color}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                onClick={() => !isPanning && handleShapeClick(shape.id)}
                draggable={isDraggable}
                onDragStart={() => handleShapeDragStart(shape.id)}
                onDragMove={(e) => {
                  handleShapeDrag(shape.id, e.target.x(), e.target.y())
                }}
                onDragEnd={() => handleShapeDragEnd(shape.id)}
              />
            )
          })}

          {/* Other users' cursors */}
          {Array.from(cursors.values()).map(cursor => (
            <g key={cursor.userId}>
              {/* Cursor pointer */}
              <Rect
                x={cursor.x}
                y={cursor.y}
                width={2}
                height={16}
                fill={cursor.color}
                listening={false}
              />
              <Rect
                x={cursor.x}
                y={cursor.y}
                width={12}
                height={2}
                fill={cursor.color}
                listening={false}
              />
              {/* User name label */}
              <KonvaText
                x={cursor.x + 14}
                y={cursor.y - 2}
                text={cursor.displayName || cursor.username}
                fontSize={12}
                fill={cursor.color}
                fontStyle="bold"
                listening={false}
              />
            </g>
          ))}
        </Layer>
      </Stage>
    </div>
  )
}
