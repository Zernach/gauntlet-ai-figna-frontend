import { useState, useRef, useCallback } from 'react'

interface HistoryEntry {
    undo: { type: string; payload?: any } | { type: string; payload?: any }[]
    redo: { type: string; payload?: any } | { type: string; payload?: any }[]
    label?: string
}

interface UseCanvasBackgroundProps {
    initialColor?: string
    pushHistory: (entry: HistoryEntry) => void
}

export function useCanvasBackground({
    initialColor = '#1a1a1a',
    pushHistory
}: UseCanvasBackgroundProps) {
    const [canvasBgHex, setCanvasBgHex] = useState<string>(initialColor)
    const [isCanvasBgOpen, setIsCanvasBgOpen] = useState<boolean>(false)
    const [canvasBgPanelPos, setCanvasBgPanelPos] = useState<{ top: number; left: number } | null>(null)

    const pendingCanvasBgRef = useRef<{
        initial: string
        latest: string
        timer: number | null
    } | null>(null)

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
            if (pendingCanvasBgRef.current.timer != null) {
                window.clearTimeout(pendingCanvasBgRef.current.timer)
            }
            pendingCanvasBgRef.current.timer = window.setTimeout(finalizeCanvasBgChange, debounceMs)
            return
        }

        pendingCanvasBgRef.current = {
            initial: canvasBgHex,
            latest: nextHex,
            timer: window.setTimeout(finalizeCanvasBgChange, debounceMs)
        }
    }, [canvasBgHex, finalizeCanvasBgChange])

    return {
        canvasBgHex,
        setCanvasBgHex,
        isCanvasBgOpen,
        setIsCanvasBgOpen,
        canvasBgPanelPos,
        setCanvasBgPanelPos,
        recordCanvasBgChange,
        pendingCanvasBgRef
    }
}

