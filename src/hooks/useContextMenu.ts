import { useState, useRef, useCallback } from 'react'

export interface ContextMenuState {
    x: number
    y: number
    mode: 'shape' | 'canvas'
    shapeId?: string
    canvasX?: number  // Canvas coordinates for paste operations
    canvasY?: number
}

interface UseContextMenuProps {
    stageRef?: React.RefObject<any>
}

export function useContextMenu(props?: UseContextMenuProps) {
    const stageRef = props?.stageRef
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
    const contextMenuShapeIdRef = useRef<string | null>(null)
    const contextMenuCanvasPositionRef = useRef<{ x: number; y: number } | null>(null)

    const openContextMenu = useCallback((menuState: ContextMenuState) => {
        setContextMenu(menuState)
        if (menuState.shapeId) {
            contextMenuShapeIdRef.current = menuState.shapeId
        }
        if (menuState.canvasX !== undefined && menuState.canvasY !== undefined) {
            contextMenuCanvasPositionRef.current = { x: menuState.canvasX, y: menuState.canvasY }
        }
    }, [])

    const closeContextMenu = useCallback(() => {
        setContextMenu(null)
        contextMenuShapeIdRef.current = null
        contextMenuCanvasPositionRef.current = null
    }, [])

    // Shape context menu handler
    const handleShapeContextMenu = useCallback((e: any, shapeId: string) => {
        e.evt.preventDefault()
        const stage = stageRef?.current
        if (!stage) return

        // Get screen position
        const pos = stage.getPointerPosition()
        if (!pos) return

        // Convert screen coords to canvas coords for paste operations
        const canvasX = (pos.x - stage.x()) / stage.scaleX()
        const canvasY = (pos.y - stage.y()) / stage.scaleY()

        openContextMenu({ x: pos.x, y: pos.y, mode: 'shape', shapeId, canvasX, canvasY })
    }, [stageRef, openContextMenu])

    // Canvas context menu handler
    const handleCanvasContextMenu = useCallback((e: any) => {
        // Only trigger if we right-clicked on the canvas (not on a shape)
        const target = e.target

        // Check if the target is the background layer or stage
        if (target.getClassName() === 'Rect' && target.attrs.id === 'canvas-background') {
            e.evt.preventDefault()
            const stage = stageRef?.current
            if (!stage) return

            // Get screen position
            const pos = stage.getPointerPosition()
            if (!pos) return

            // Convert screen coords to canvas coords for paste operations
            const canvasX = (pos.x - stage.x()) / stage.scaleX()
            const canvasY = (pos.y - stage.y()) / stage.scaleY()

            openContextMenu({ x: pos.x, y: pos.y, mode: 'canvas', canvasX, canvasY })
        }
    }, [stageRef, openContextMenu])

    return {
        contextMenu,
        contextMenuShapeIdRef,
        contextMenuCanvasPositionRef,
        openContextMenu,
        closeContextMenu,
        handleShapeContextMenu,
        handleCanvasContextMenu,
    }
}

