import { useRef, useCallback } from 'react'

type PendingPropChange = {
    shapeId: string
    prop: string
    initial: any
    latest: any
    timer: number | null
    startTimestamp: number  // When the user first started changing this property
}

interface HistoryEntry {
    undo: { type: string; payload?: any } | { type: string; payload?: any }[]
    redo: { type: string; payload?: any } | { type: string; payload?: any }[]
    label?: string
    timestamp?: number
    source?: 'user' | 'agent'
}

interface UseShapePropertyTrackingProps {
    shapes: any[]
    pushHistory: (entry: HistoryEntry) => void
}

export function useShapePropertyTracking({ shapes, pushHistory }: UseShapePropertyTrackingProps) {
    const shapesRef = useRef<any[]>([])
    const pendingPropChangesRef = useRef<Map<string, PendingPropChange>>(new Map())

    // Keep shapes ref in sync
    shapesRef.current = shapes

    const finalizePropChange = useCallback((key: string) => {
        const pending = pendingPropChangesRef.current.get(key)
        if (!pending) return

        pending.timer = null
        pendingPropChangesRef.current.delete(key)

        if (pending.initial === pending.latest) return

        pushHistory({
            undo: {
                type: 'SHAPE_UPDATE',
                payload: {
                    shapeId: pending.shapeId,
                    updates: { [pending.prop]: pending.initial }
                }
            },
            redo: {
                type: 'SHAPE_UPDATE',
                payload: {
                    shapeId: pending.shapeId,
                    updates: { [pending.prop]: pending.latest }
                }
            },
            label: `Change ${pending.prop}`,
            timestamp: pending.startTimestamp,  // Use the timestamp when user first started changing
            source: 'user'
        })
    }, [pushHistory])

    const recordPropChange = useCallback((
        shapeId: string,
        prop: string,
        nextValue: any,
        debounceMs: number = 400
    ) => {
        const key = `${shapeId}:${prop}`
        const existing = pendingPropChangesRef.current.get(key)

        if (existing) {
            existing.latest = nextValue
            if (existing.timer != null) window.clearTimeout(existing.timer)
            existing.timer = window.setTimeout(() => finalizePropChange(key), debounceMs)
            pendingPropChangesRef.current.set(key, existing)
            // Keep the original startTimestamp from when user first started changing
            return
        }

        const shape = shapesRef.current.find(s => s.id === shapeId)
        const initial = (shape as any)?.[prop]
        const created: PendingPropChange = {
            shapeId,
            prop,
            initial,
            latest: nextValue,
            timer: window.setTimeout(() => finalizePropChange(key), debounceMs),
            startTimestamp: Date.now()  // Capture when the user first started changing this property
        }
        pendingPropChangesRef.current.set(key, created)
    }, [finalizePropChange])

    return {
        recordPropChange,
        pendingPropChangesRef
    }
}

