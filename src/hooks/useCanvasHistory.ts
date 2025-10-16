import { useRef, useState, useCallback } from 'react'

type WSMessage = { type: string; payload?: any }
type HistoryEntry = { undo: WSMessage | WSMessage[]; redo: WSMessage | WSMessage[]; label?: string }

export function useCanvasHistory() {
  const undoStackRef = useRef<HistoryEntry[]>([])
  const redoStackRef = useRef<HistoryEntry[]>([])
  const [undoCount, setUndoCount] = useState<number>(0)
  const [redoCount, setRedoCount] = useState<number>(0)
  const [hasUserActed, setHasUserActed] = useState<boolean>(false)

  const pushHistory = useCallback((entry: HistoryEntry) => {
    undoStackRef.current.push(entry)
    setUndoCount(undoStackRef.current.length)
    redoStackRef.current = [] // Clear redo stack when new action is performed
    setRedoCount(0)
    setHasUserActed(true)
  }, [])

  const performUndo = useCallback((sendMessage: (msg: WSMessage) => void) => {
    if (undoStackRef.current.length === 0) return

    const entry = undoStackRef.current.pop()
    if (!entry) return

    // Send undo message(s)
    if (Array.isArray(entry.undo)) {
      entry.undo.forEach(msg => sendMessage(msg))
    } else {
      sendMessage(entry.undo)
    }

    // Push to redo stack
    redoStackRef.current.push(entry)
    setUndoCount(undoStackRef.current.length)
    setRedoCount(redoStackRef.current.length)
  }, [])

  const performRedo = useCallback((sendMessage: (msg: WSMessage) => void) => {
    if (redoStackRef.current.length === 0) return

    const entry = redoStackRef.current.pop()
    if (!entry) return

    // Send redo message(s)
    if (Array.isArray(entry.redo)) {
      entry.redo.forEach(msg => sendMessage(msg))
    } else {
      sendMessage(entry.redo)
    }

    // Push back to undo stack
    undoStackRef.current.push(entry)
    setUndoCount(undoStackRef.current.length)
    setRedoCount(redoStackRef.current.length)
  }, [])

  return {
    undoCount,
    redoCount,
    hasUserActed,
    pushHistory,
    performUndo,
    performRedo,
  }
}

