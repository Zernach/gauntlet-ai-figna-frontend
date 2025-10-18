import { useState, useCallback } from 'react'

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
  zIndex?: number
  z_index?: number
}

type WSMessage = { type: string; payload?: any }

export function useClipboard() {
  const [clipboard, setClipboard] = useState<Shape[]>([])

  const handleCopy = useCallback((shapes: Shape[], selectedIds: string[]) => {
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id))
    if (selectedShapes.length > 0) {
      setClipboard(selectedShapes)
      return selectedShapes.length
    }
    return 0
  }, [])

  const handleCut = useCallback((
    shapes: Shape[],
    selectedIds: string[],
    onSendMessage: (msg: WSMessage) => void,
    onShowToast: (message: string, type: 'info' | 'warning' | 'error' | 'success') => void
  ) => {
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id))
    if (selectedShapes.length > 0) {
      setClipboard(selectedShapes)

      // Delete the selected shapes in a single batch
      onSendMessage({ type: 'SHAPE_DELETE', payload: { shapeIds: selectedIds } })

      onShowToast(`Cut ${selectedShapes.length} shape(s)`, 'info')
      return selectedShapes.length
    }
    return 0
  }, [])

  const handlePaste = useCallback((
    viewportCenter: { x: number; y: number },
    onSendMessage: (msg: WSMessage) => void,
    onShowToast: (message: string, type: 'info' | 'warning' | 'error' | 'success') => void
  ) => {
    if (clipboard.length === 0) return 0

    // Calculate offset for pasting at viewport center
    const firstShape = clipboard[0]
    const offsetX = viewportCenter.x - firstShape.x
    const offsetY = viewportCenter.y - firstShape.y

    // Paste each shape with offset
    clipboard.forEach(shape => {
      const newShape = {
        ...shape,
        x: shape.x + offsetX,
        y: shape.y + offsetY,
        locked_at: null,
        locked_by: null,
      }
      delete (newShape as any).id
      delete (newShape as any).created_by
      delete (newShape as any).last_modified_by
      delete (newShape as any).last_modified_at

      onSendMessage({ type: 'SHAPE_CREATE', payload: newShape })
    })

    onShowToast(`Pasted ${clipboard.length} shape(s)`, 'success')
    return clipboard.length
  }, [clipboard])

  const handleDuplicate = useCallback((
    shapes: Shape[],
    selectedIds: string[],
    onSendMessage: (msg: WSMessage) => void,
    onShowToast: (message: string, type: 'info' | 'warning' | 'error' | 'success') => void
  ) => {
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id))
    if (selectedShapes.length === 0) return 0

    // Duplicate each shape with a small offset
    selectedShapes.forEach(shape => {
      const newShape = {
        ...shape,
        x: shape.x + 20,
        y: shape.y + 20,
        locked_at: null,
        locked_by: null,
      }
      delete (newShape as any).id
      delete (newShape as any).created_by
      delete (newShape as any).last_modified_by
      delete (newShape as any).last_modified_at

      onSendMessage({ type: 'SHAPE_CREATE', payload: newShape })
    })

    onShowToast(`Duplicated ${selectedShapes.length} shape(s)`, 'success')
    return selectedShapes.length
  }, [])

  return {
    clipboard,
    handleCopy,
    handleCut,
    handlePaste,
    handleDuplicate,
  }
}

