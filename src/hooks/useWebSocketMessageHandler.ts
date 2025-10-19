import { useCallback } from 'react'
import type { Shape, ActiveUser } from '../types/canvas'

interface UseWebSocketMessageHandlerParams {
  currentUserIdRef: React.MutableRefObject<string | null>
  isDraggingShapeRef: React.MutableRefObject<boolean>
  isResizingShapeRef: React.MutableRefObject<boolean>
  isRotatingShapeRef: React.MutableRefObject<boolean>
  resizingShapeIdRef: React.MutableRefObject<string | null>
  rotatingShapeIdRef: React.MutableRefObject<string | null>
  dragPositionRef: React.MutableRefObject<{ shapeId: string; x: number; y: number } | null>
  pendingDragUpdatesRef: React.MutableRefObject<Map<string, { x: number; y: number }>>
  recentlyDraggedRef: React.MutableRefObject<Map<string, { x: number; y: number; timestamp: number }>>
  recentlyResizedRef: React.MutableRefObject<Map<string, any>>
  recentlyRotatedRef: React.MutableRefObject<Map<string, { rotation: number; timestamp: number }>>
  isDraggingOpacityRef: React.MutableRefObject<boolean>
  isDraggingShadowStrengthRef: React.MutableRefObject<boolean>
  isDraggingBorderRadiusRef: React.MutableRefObject<boolean>
  recentlyModifiedPropsRef: React.MutableRefObject<Map<string, { props: Partial<Shape>; timestamp: number }>>
  normalizeShape: (shape: any) => Shape
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  setCanvasBgHex: React.Dispatch<React.SetStateAction<string>>
  setActiveUsers: React.Dispatch<React.SetStateAction<ActiveUser[]>>
  setCursors: React.Dispatch<React.SetStateAction<Map<string, any>>>
  setCurrentUserColor: React.Dispatch<React.SetStateAction<string>>
  pushHistory: (entry: any) => void
  onCanvasSwitched?: (payload: { canvasId: string; success: boolean; error?: string }) => void
}

export function useWebSocketMessageHandler({
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
  onCanvasSwitched,
}: UseWebSocketMessageHandlerParams) {
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'CANVAS_SYNC':
        // Initial sync with all shapes and users
        if (message.payload.shapes) {
          setShapes((message.payload.shapes as any[]).map(normalizeShape))
        }
        if (message.payload.canvas) {
          const bg = message.payload.canvas.background_color ?? message.payload.canvas.backgroundColor
          if (bg) setCanvasBgHex(bg)
        }
        if (message.payload.activeUsers) {
          // Filter out current user from active users list and deduplicate
          const otherUsers = message.payload.activeUsers.filter((u: ActiveUser) => u.userId !== currentUserIdRef.current)

          // Deduplicate by email - keep only the first occurrence of each email address
          const uniqueUsers = otherUsers.filter((user: ActiveUser, index: number, self: ActiveUser[]) =>
            index === self.findIndex((u: ActiveUser) => u.email === user.email)
          )

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
                undo: { type: 'SHAPE_DELETE', payload: { shapeIds: [fullShape.id] } },
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
          const shape = normalizeShape(message.payload.shape)

          // Add last modified info from message payload
          if (message.payload.lastModifiedBy) {
            shape.last_modified_by = message.payload.lastModifiedBy
          }
          if (message.payload.lastModifiedAt) {
            shape.last_modified_at = message.payload.lastModifiedAt
          }

          setShapes(prev => prev.map(s => {
            if (s.id === shape.id) {
              // If we're currently dragging this shape OR it has pending drag updates (multi-shape drag),
              // only update non-position properties to avoid conflict with local optimistic updates
              if (isDraggingShapeRef.current && (
                dragPositionRef.current?.shapeId === s.id ||
                pendingDragUpdatesRef.current.has(s.id)
              )) {
                return {
                  ...shape,
                  x: s.x,
                  y: s.y,
                }
              }
              // Check if this shape was recently dragged - preserve position for 1500ms after drag ends
              // to prevent animation from delayed server updates (especially for multi-shape drags)
              const recentDrag = recentlyDraggedRef.current.get(shape.id)
              if (recentDrag) {
                const timeSinceDrag = Date.now() - recentDrag.timestamp
                // Within 1500ms of drag end, preserve local position to prevent animation
                if (timeSinceDrag < 1500) {
                  return {
                    ...shape,
                    x: recentDrag.x,
                    y: recentDrag.y,
                  }
                } else {
                  // Clean up old entry
                  recentlyDraggedRef.current.delete(shape.id)
                }
              }
              // Check if this shape was recently resized - preserve geometry for 1000ms after resize ends
              // to prevent animation from delayed server updates
              const recentResize = recentlyResizedRef.current.get(shape.id)
              if (recentResize) {
                const timeSinceResize = Date.now() - recentResize.timestamp
                // Within 1000ms of resize end, preserve local geometry to prevent animation
                if (timeSinceResize < 1000) {
                  return {
                    ...shape,
                    ...(recentResize.x !== undefined && { x: recentResize.x }),
                    ...(recentResize.y !== undefined && { y: recentResize.y }),
                    ...(recentResize.width !== undefined && { width: recentResize.width }),
                    ...(recentResize.height !== undefined && { height: recentResize.height }),
                    ...(recentResize.radius !== undefined && { radius: recentResize.radius }),
                    ...(recentResize.fontSize !== undefined && { fontSize: recentResize.fontSize, font_size: recentResize.fontSize }),
                  }
                } else {
                  // Clean up old entry
                  recentlyResizedRef.current.delete(shape.id)
                }
              }
              // Check if this shape was recently rotated - preserve rotation for 1000ms after rotation ends
              // to prevent animation from delayed server updates
              const recentRotation = recentlyRotatedRef.current.get(shape.id)
              if (recentRotation) {
                const timeSinceRotation = Date.now() - recentRotation.timestamp
                // Within 1000ms of rotation end, preserve local rotation to prevent animation
                if (timeSinceRotation < 1000) {
                  return {
                    ...shape,
                    rotation: recentRotation.rotation,
                  }
                } else {
                  // Clean up old entry
                  recentlyRotatedRef.current.delete(shape.id)
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
                  fontSize: s.fontSize ?? (s as any).font_size,
                  font_size: s.fontSize ?? (s as any).font_size,
                }
              }
              // If we're currently rotating this shape, preserve local rotation to avoid flicker
              if (isRotatingShapeRef.current && rotatingShapeIdRef.current === s.id) {
                return {
                  ...shape,
                  rotation: s.rotation,
                }
              }
              // If we're currently dragging sliders, preserve those properties to prevent jumpy behavior
              const preservedProps: Partial<Shape> = {}
              if (isDraggingOpacityRef.current) {
                preservedProps.opacity = s.opacity
              }
              if (isDraggingShadowStrengthRef.current) {
                preservedProps.shadowStrength = s.shadowStrength
              }
              if (isDraggingBorderRadiusRef.current) {
                preservedProps.borderRadius = s.borderRadius
              }

              // Check if any properties were recently modified (extended grace period after release)
              const recentlyModified = recentlyModifiedPropsRef.current.get(shape.id)
              if (recentlyModified) {
                const timeSinceModification = Date.now() - recentlyModified.timestamp
                // Within 1000ms grace period, preserve local properties to prevent glitch
                if (timeSinceModification < 1000) {
                  Object.assign(preservedProps, recentlyModified.props)
                } else {
                  // Clean up old entry
                  recentlyModifiedPropsRef.current.delete(shape.id)
                }
              }

              // If any properties need to be preserved, return merged shape
              if (Object.keys(preservedProps).length > 0) {
                return {
                  ...shape,
                  ...preservedProps,
                }
              }
              return shape
            }
            return s
          }))
        }
        break

      case 'SHAPES_BATCH_UPDATE':
        // Batch shape updates from agent tool calls
        if (message.payload.shapes && Array.isArray(message.payload.shapes)) {
          setShapes(prev => {
            const updatedShapesMap = new Map<string, Shape>(
              message.payload.shapes.map((shape: any) => [shape.id, normalizeShape(shape)])
            )

            return prev.map((s): Shape => {
              const updatedShape = updatedShapesMap.get(s.id)
              if (!updatedShape) return s

              // Apply the same conflict resolution as SHAPE_UPDATE for smooth UX
              // If we're currently dragging this shape, preserve position
              if (isDraggingShapeRef.current && (
                dragPositionRef.current?.shapeId === s.id ||
                pendingDragUpdatesRef.current.has(s.id)
              )) {
                return {
                  ...updatedShape,
                  x: s.x,
                  y: s.y,
                }
              }

              // Check if this shape was recently dragged
              const recentDrag = recentlyDraggedRef.current.get(s.id)
              if (recentDrag && Date.now() - recentDrag.timestamp < 1500) {
                return {
                  ...updatedShape,
                  x: recentDrag.x,
                  y: recentDrag.y,
                }
              }

              // Check if this shape was recently resized
              const recentResize = recentlyResizedRef.current.get(s.id)
              if (recentResize && Date.now() - recentResize.timestamp < 1000) {
                return {
                  ...updatedShape,
                  ...(recentResize.x !== undefined && { x: recentResize.x }),
                  ...(recentResize.y !== undefined && { y: recentResize.y }),
                  ...(recentResize.width !== undefined && { width: recentResize.width }),
                  ...(recentResize.height !== undefined && { height: recentResize.height }),
                  ...(recentResize.radius !== undefined && { radius: recentResize.radius }),
                  ...(recentResize.fontSize !== undefined && { fontSize: recentResize.fontSize, font_size: recentResize.fontSize }),
                }
              }

              // Check if this shape was recently rotated
              const recentRotation = recentlyRotatedRef.current.get(s.id)
              if (recentRotation && Date.now() - recentRotation.timestamp < 1000) {
                return {
                  ...updatedShape,
                  rotation: recentRotation.rotation,
                }
              }

              // If we're currently resizing this shape, preserve local geometry
              if (isResizingShapeRef.current && resizingShapeIdRef.current === s.id) {
                return {
                  ...updatedShape,
                  x: s.x,
                  y: s.y,
                  width: s.width,
                  height: s.height,
                  radius: s.radius,
                  fontSize: s.fontSize ?? (s as any).font_size,
                  font_size: s.fontSize ?? (s as any).font_size,
                }
              }

              // If we're currently rotating this shape, preserve local rotation
              if (isRotatingShapeRef.current && rotatingShapeIdRef.current === s.id) {
                return {
                  ...updatedShape,
                  rotation: s.rotation,
                }
              }

              // Check for properties being actively modified
              const preservedProps: Partial<Shape> = {}
              if (isDraggingOpacityRef.current) {
                preservedProps.opacity = s.opacity
              }
              if (isDraggingShadowStrengthRef.current) {
                preservedProps.shadowStrength = s.shadowStrength
              }
              if (isDraggingBorderRadiusRef.current) {
                preservedProps.borderRadius = s.borderRadius
              }

              // Check if any properties were recently modified
              const recentlyModified = recentlyModifiedPropsRef.current.get(s.id)
              if (recentlyModified && Date.now() - recentlyModified.timestamp < 1000) {
                Object.assign(preservedProps, recentlyModified.props)
              }

              // Apply preserved properties if any
              if (Object.keys(preservedProps).length > 0) {
                return {
                  ...updatedShape,
                  ...preservedProps,
                }
              }

              return updatedShape
            })
          })
        }
        break

      case 'SHAPE_DELETE':
        // Shape(s) deleted
        // Support both singular shapeId (legacy) and plural shapeIds (new)
        const deletedIds = message.payload.shapeIds || (message.payload.shapeId ? [message.payload.shapeId] : [])
        if (deletedIds.length > 0) {
          setShapes(prev => prev.filter(s => !deletedIds.includes(s.id)))
          // Remove from selection if they were selected
          setSelectedIds(prev => prev.filter(id => !deletedIds.includes(id)))
        }
        break

      case 'SHAPES_GROUPED':
        // Shapes grouped together
        if (message.payload.shapes && Array.isArray(message.payload.shapes)) {
          setShapes(prev => {
            const updated = [...prev]
            message.payload.shapes.forEach((groupedShape: any) => {
              const normalized = normalizeShape(groupedShape)
              const index = updated.findIndex(s => s.id === normalized.id)
              if (index !== -1) {
                updated[index] = { ...updated[index], ...normalized }
              }
            })
            return updated
          })
        }
        break

      case 'SHAPES_UNGROUPED':
        // Shapes ungrouped
        if (message.payload.shapes && Array.isArray(message.payload.shapes)) {
          setShapes(prev => {
            const updated = [...prev]
            message.payload.shapes.forEach((ungroupedShape: any) => {
              const normalized = normalizeShape(ungroupedShape)
              const index = updated.findIndex(s => s.id === normalized.id)
              if (index !== -1) {
                updated[index] = { ...updated[index], ...normalized }
              }
            })
            return updated
          })
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
              return prev
            }
            const newUser = {
              userId: message.payload.userId,
              username: message.payload.username,
              displayName: message.payload.displayName,
              email: message.payload.email,
              color: message.payload.color,
            }

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

      case 'CANVAS_SWITCHED':
        // Canvas switch completed - notify callback
        if (onCanvasSwitched) {
          onCanvasSwitched(message.payload)
        }
        break

      case 'ERROR':
        break
    }
  }, [
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
    onCanvasSwitched,
  ])

  return { handleWebSocketMessage }
}

