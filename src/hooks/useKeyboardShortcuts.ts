import { useEffect } from 'react'
import type { Shape } from '../types/canvas'

interface UseKeyboardShortcutsParams {
  shapes: Shape[]
  selectedIdsRef: React.MutableRefObject<string[]>
  handleDeleteShapes: (shapeIds: string[]) => void
  unlockShapes: (shapeIds: string[]) => void
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  performUndo: () => void
  performRedo: () => void
  sendMessage: (message: any) => void
}

export function useKeyboardShortcuts({
  shapes,
  selectedIdsRef,
  handleDeleteShapes,
  unlockShapes,
  setSelectedIds,
  performUndo,
  performRedo,
  sendMessage,
}: UseKeyboardShortcutsParams) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const ctrlOrMeta = isMac ? e.metaKey : e.ctrlKey

      // Undo
      if (ctrlOrMeta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        performUndo()
        return
      }

      // Redo
      if ((ctrlOrMeta && e.key.toLowerCase() === 'z' && e.shiftKey) || (!isMac && e.ctrlKey && e.key.toLowerCase() === 'y')) {
        e.preventDefault()
        performRedo()
        return
      }

      // Layer shortcuts (Cmd/Ctrl + [ ] for layering)
      if (ctrlOrMeta && selectedIdsRef.current.length > 0) {
        // Bring to front: Cmd/Ctrl + Shift + ]
        if (e.shiftKey && e.key === ']') {
          e.preventDefault()
          const maxZ = Math.max(...shapes.map(s => s.zIndex || 0), 0)
          // Update all selected shapes, maintaining their relative order
          selectedIdsRef.current.forEach((shapeId, index) => {
            sendMessage({
              type: 'SHAPE_UPDATE',
              payload: { shapeId, updates: { zIndex: maxZ + 1 + index } },
            })
          })
          return
        }
        // Send to back: Cmd/Ctrl + Shift + [
        if (e.shiftKey && e.key === '[') {
          e.preventDefault()
          const minZ = Math.min(...shapes.map(s => s.zIndex || 0), 0)
          // Update all selected shapes, maintaining their relative order
          selectedIdsRef.current.forEach((shapeId, index) => {
            sendMessage({
              type: 'SHAPE_UPDATE',
              payload: { shapeId, updates: { zIndex: minZ - selectedIdsRef.current.length + index } },
            })
          })
          return
        }
        // Move forward: Cmd/Ctrl + ]
        if (!e.shiftKey && e.key === ']') {
          e.preventDefault()
          selectedIdsRef.current.forEach(shapeId => {
            const shape = shapes.find(s => s.id === shapeId)
            if (shape) {
              const currentZ = shape.zIndex || 0
              sendMessage({
                type: 'SHAPE_UPDATE',
                payload: { shapeId, updates: { zIndex: currentZ + 1 } },
              })
            }
          })
          return
        }
        // Move backward: Cmd/Ctrl + [
        if (!e.shiftKey && e.key === '[') {
          e.preventDefault()
          selectedIdsRef.current.forEach(shapeId => {
            const shape = shapes.find(s => s.id === shapeId)
            if (shape) {
              const currentZ = shape.zIndex || 0
              sendMessage({
                type: 'SHAPE_UPDATE',
                payload: { shapeId, updates: { zIndex: currentZ - 1 } },
              })
            }
          })
          return
        }
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Check if a text input or editable element is focused
        const activeElement = document.activeElement
        const isEditableElement =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          (activeElement instanceof HTMLElement && activeElement.isContentEditable)

        // If an editable element is focused, allow normal text editing
        if (isEditableElement) {
          return
        }

        e.preventDefault()
        // Use the ref to get current selectedIds
        if (selectedIdsRef.current.length > 0) {
          handleDeleteShapes(selectedIdsRef.current)
        }
      } else if (e.key === 'Escape') {
        // Unlock shapes before deselecting
        if (selectedIdsRef.current.length > 0) {
          unlockShapes(selectedIdsRef.current)
        }
        setSelectedIds([])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.cursor = 'default'
    }
  }, [handleDeleteShapes, unlockShapes, performUndo, performRedo, shapes, sendMessage, selectedIdsRef, setSelectedIds])
}

