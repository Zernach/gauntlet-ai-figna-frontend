import { useState, useRef, useCallback } from 'react'

type WSMessage = { type: string; payload?: any }
type HistoryEntry = {
  undo: WSMessage | WSMessage[]
  redo: WSMessage | WSMessage[]
  label?: string
  timestamp?: number  // When the action actually occurred
  source?: 'user' | 'agent' // Who initiated the action
}

interface UseCanvasHistoryParams {
  sendMessage: (message: WSMessage) => void
}

interface UseCanvasHistoryReturn {
  undoCount: number
  redoCount: number
  hasUserActed: boolean
  pushHistory: (entry: HistoryEntry) => void
  performUndo: () => void
  performRedo: () => void
  undoStackRef: React.MutableRefObject<HistoryEntry[]>
  redoStackRef: React.MutableRefObject<HistoryEntry[]>
}

export function useCanvasHistory({ sendMessage }: UseCanvasHistoryParams): UseCanvasHistoryReturn {
  const undoStackRef = useRef<HistoryEntry[]>([])
  const redoStackRef = useRef<HistoryEntry[]>([])
  const [undoCount, setUndoCount] = useState<number>(0)
  const [redoCount, setRedoCount] = useState<number>(0)
  const [hasUserActed, setHasUserActed] = useState<boolean>(false)

  const pushHistory = useCallback((entry: HistoryEntry) => {
    // Add timestamp if not provided
    const entryWithTimestamp = {
      ...entry,
      timestamp: entry.timestamp || Date.now(),
      source: entry.source || 'user'
    }

    // Add to stack
    undoStackRef.current.push(entryWithTimestamp)

    // Sort by timestamp to maintain chronological order
    // This ensures that even if entries are added out of order (due to debouncing),
    // they will be undone in the correct chronological order (most recent first)
    undoStackRef.current.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))

    setUndoCount(undoStackRef.current.length)

    // clear redo stack on new action
    redoStackRef.current = []
    setRedoCount(0)
    if (!hasUserActed) setHasUserActed(true)
  }, [hasUserActed])

  const performUndo = useCallback(() => {
    // Pop from the end (most recent by timestamp)
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
    // Re-sort after adding back
    undoStackRef.current.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))

    setUndoCount(undoStackRef.current.length)
    setRedoCount(redoStackRef.current.length)
  }, [sendMessage])

  return {
    undoCount,
    redoCount,
    hasUserActed,
    pushHistory,
    performUndo,
    performRedo,
    undoStackRef,
    redoStackRef,
  }
}
