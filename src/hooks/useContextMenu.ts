import { useState, useRef, useCallback } from 'react'

export interface ContextMenuState {
    x: number
    y: number
    mode: 'shape' | 'canvas'
    shapeId?: string
}

export function useContextMenu() {
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
    const contextMenuShapeIdRef = useRef<string | null>(null)

    const openContextMenu = useCallback((menuState: ContextMenuState) => {
        setContextMenu(menuState)
        if (menuState.shapeId) {
            contextMenuShapeIdRef.current = menuState.shapeId
        }
    }, [])

    const closeContextMenu = useCallback(() => {
        setContextMenu(null)
        contextMenuShapeIdRef.current = null
    }, [])

    return {
        contextMenu,
        contextMenuShapeIdRef,
        openContextMenu,
        closeContextMenu
    }
}

