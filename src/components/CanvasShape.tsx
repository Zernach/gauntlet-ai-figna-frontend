import { Rect, Circle, Text as KonvaText, Group } from 'react-konva'
import { useRef, useState, useEffect } from 'react'

const DEFAULT_SHAPE_SIZE = 100

interface CanvasShapeProps {
    shape: {
        id: string
        type: string
        x: number
        y: number
        width?: number
        height?: number
        radius?: number
        color: string
        text_content?: string
        font_size?: number
        textContent?: string
        fontSize?: number
        locked_at?: string | null
        locked_by?: string | null
        created_by?: string
    }
    strokeColor: string
    strokeWidth: number
    isPressable: boolean
    isDraggable: boolean
    isSelected?: boolean
    canResize?: boolean
    // isPanning removed: panning is always available via background drag
    remainingSeconds: number | null
    onShapeClick: (id: string) => void
    onDragStart: (id: string) => void
    onDragMove: (id: string, x: number, y: number) => void
    onDragEnd: (id: string) => void
    onResizeStart?: (id: string, handle: string) => void
    onResizeMove?: (id: string, updates: { x?: number; y?: number; width?: number; height?: number; radius?: number; fontSize?: number }) => void
    onResizeEnd?: (id: string) => void
    onTextDoubleClick?: (id: string) => void
}

const CanvasShape = ({
    shape,
    strokeColor,
    strokeWidth,
    isPressable,
    isDraggable,
    isSelected = false,
    canResize = false,
    remainingSeconds,
    onShapeClick,
    onDragStart,
    onDragMove,
    onDragEnd,
    onResizeStart,
    onResizeMove,
    onResizeEnd,
    onTextDoubleClick,
}: CanvasShapeProps) => {
    const isLocked = remainingSeconds !== null
    const handleSize = 8

    if (shape.type === 'text') {
        const textRef = useRef<any>(null)
        const [textWidth, setTextWidth] = useState<number>(0)
        const [textHeight, setTextHeight] = useState<number>(0)
        const [baselineFontSize, setBaselineFontSize] = useState<number>(shape.fontSize ?? shape.font_size ?? 24)
        const [baselineWidth, setBaselineWidth] = useState<number>(0)
        const [baselineHeight, setBaselineHeight] = useState<number>(0)

        const text = shape.textContent ?? shape.text_content ?? 'Text'
        const fontSize = shape.fontSize ?? shape.font_size ?? 24

        useEffect(() => {
            if (textRef.current) {
                setTextWidth(textRef.current.width())
                setTextHeight(textRef.current.height())
            }
        }, [text, fontSize])

        return (
            <>
                <KonvaText
                    ref={textRef}
                    x={shape.x}
                    y={shape.y}
                    text={text}
                    fontSize={fontSize}
                    fill={shape.color || '#ffffff'}
                    onTap={() => isPressable && onShapeClick(shape.id)}
                    onClick={() => isPressable && onShapeClick(shape.id)}
                    onDblClick={() => onTextDoubleClick && onTextDoubleClick(shape.id)}
                    onDblTap={() => onTextDoubleClick && onTextDoubleClick(shape.id)}
                    draggable={isDraggable}
                    onDragStart={() => onDragStart(shape.id)}
                    onDragMove={(e) => {
                        e.cancelBubble = true
                        onDragMove(shape.id, e.target.x(), e.target.y())
                    }}
                    onDragEnd={(e) => {
                        e.cancelBubble = true
                        onDragEnd(shape.id)
                    }}
                    perfectDrawEnabled={false}
                />
                {isSelected && canResize && (
                    <Group>
                        <Rect
                            x={(shape.x + textWidth) - handleSize / 2}
                            y={(shape.y + textHeight) - handleSize / 2}
                            width={handleSize}
                            height={handleSize}
                            fill="#ffffff"
                            stroke={strokeColor}
                            strokeWidth={1}
                            draggable
                            onDragStart={(e) => {
                                e.cancelBubble = true
                                onResizeStart && onResizeStart(shape.id, 'text-scale')
                                // Capture baseline metrics for proportional scaling
                                setBaselineFontSize(fontSize)
                                setBaselineWidth(textWidth || 1)
                                setBaselineHeight(textHeight || 1)
                            }}
                            onDragMove={(e) => {
                                e.cancelBubble = true
                                const stage = e.target.getStage()
                                if (!stage) return
                                const pointer = stage.getPointerPosition()
                                if (!pointer) return
                                const scaleX = stage.scaleX()
                                const scaleY = stage.scaleY()
                                const stageX = stage.x()
                                const stageY = stage.y()
                                const canvasX = (pointer.x - stageX) / scaleX
                                const canvasY = (pointer.y - stageY) / scaleY
                                const dx = Math.max(1, canvasX - shape.x)
                                const dy = Math.max(1, canvasY - shape.y)
                                const baseW = Math.max(1, baselineWidth || textWidth || 1)
                                const baseH = Math.max(1, baselineHeight || textHeight || 1)
                                // proportional scale factor based on diagonal
                                const baseDiag = Math.sqrt(baseW * baseW + baseH * baseH)
                                const newDiag = Math.sqrt(dx * dx + dy * dy)
                                const scale = Math.max(0.2, Math.min(10, newDiag / baseDiag))
                                const newFontSize = Math.max(8, Math.min(512, baselineFontSize * scale))
                                onResizeMove && onResizeMove(shape.id, { fontSize: newFontSize })
                            }}
                            onDragEnd={(e) => {
                                e.cancelBubble = true
                                onResizeEnd && onResizeEnd(shape.id)
                            }}
                            perfectDrawEnabled={false}
                        />
                    </Group>
                )}
                {/* Countdown timer for locked shapes */}
                {isLocked && remainingSeconds !== null && (
                    <KonvaText
                        x={shape.x - 20}
                        y={shape.y - (fontSize * 0.8)}
                        text={`🔒 ${Math.ceil(remainingSeconds)}s`}
                        fontSize={14}
                        fontStyle="bold"
                        fill="#ef4444"
                        listening={false}
                    />
                )}
            </>
        )
    }

    if (shape.type === 'circle') {
        return (
            <>
                <Circle
                    x={shape.x}
                    y={shape.y}
                    radius={shape.radius || DEFAULT_SHAPE_SIZE / 2}
                    fill={shape.color}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    onTap={() => isPressable && onShapeClick(shape.id)}
                    onClick={() => isPressable && onShapeClick(shape.id)}
                    draggable={isDraggable}
                    onDragStart={() => onDragStart(shape.id)}
                    onDragMove={(e) => {
                        e.cancelBubble = true
                        onDragMove(shape.id, e.target.x(), e.target.y())
                    }}
                    onDragEnd={(e) => {
                        e.cancelBubble = true
                        onDragEnd(shape.id)
                    }}
                    perfectDrawEnabled={false}
                />
                {isSelected && canResize && (
                    <Group>
                        {/* Radius handle at the rightmost point */}
                        <Rect
                            x={(shape.x + (shape.radius || DEFAULT_SHAPE_SIZE / 2)) - handleSize / 2}
                            y={shape.y - handleSize / 2}
                            width={handleSize}
                            height={handleSize}
                            fill="#ffffff"
                            stroke={strokeColor}
                            strokeWidth={1}
                            draggable
                            onDragStart={(e) => {
                                e.cancelBubble = true
                                onResizeStart && onResizeStart(shape.id, 'circle-radius')
                            }}
                            onDragMove={(e) => {
                                e.cancelBubble = true
                                const stage = e.target.getStage()
                                if (!stage) return
                                const pointer = stage.getPointerPosition()
                                if (!pointer) return
                                const scaleX = stage.scaleX()
                                const scaleY = stage.scaleY()
                                const stageX = stage.x()
                                const stageY = stage.y()
                                const canvasX = (pointer.x - stageX) / scaleX
                                const canvasY = (pointer.y - stageY) / scaleY
                                const dx = canvasX - shape.x
                                const dy = canvasY - shape.y
                                const newRadius = Math.max(5, Math.sqrt(dx * dx + dy * dy))
                                onResizeMove && onResizeMove(shape.id, { radius: newRadius })
                            }}
                            onDragEnd={(e) => {
                                e.cancelBubble = true
                                onResizeEnd && onResizeEnd(shape.id)
                            }}
                            perfectDrawEnabled={false}
                        />
                    </Group>
                )}
                {/* Countdown timer for locked shapes */}
                {isLocked && remainingSeconds !== null && (
                    <KonvaText
                        x={shape.x - 15}
                        y={shape.y - 8}
                        text={`🔒 ${Math.ceil(remainingSeconds)}s`}
                        fontSize={14}
                        fontStyle="bold"
                        fill="#ef4444"
                        listening={false}
                    />
                )}
            </>
        )
    }

    // Default to rectangle
    return (
        <>
            <Rect
                x={shape.x}
                y={shape.y}
                width={shape.width || DEFAULT_SHAPE_SIZE}
                height={shape.height || DEFAULT_SHAPE_SIZE}
                fill={shape.color}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                onTap={() => isPressable && onShapeClick(shape.id)}
                onClick={() => isPressable && onShapeClick(shape.id)}
                draggable={isDraggable}
                onDragStart={() => onDragStart(shape.id)}
                onDragMove={(e) => {
                    e.cancelBubble = true
                    onDragMove(shape.id, e.target.x(), e.target.y())
                }}
                onDragEnd={(e) => {
                    e.cancelBubble = true
                    onDragEnd(shape.id)
                }}
                perfectDrawEnabled={false}
            />
            {isSelected && canResize && (
                <Group>
                    {/* NW handle */}
                    <Rect
                        x={(shape.x) - handleSize / 2}
                        y={(shape.y) - handleSize / 2}
                        width={handleSize}
                        height={handleSize}
                        fill="#ffffff"
                        stroke={strokeColor}
                        strokeWidth={1}
                        draggable
                        onDragStart={(e) => {
                            e.cancelBubble = true
                            onResizeStart && onResizeStart(shape.id, 'nw')
                        }}
                        onDragMove={(e) => {
                            e.cancelBubble = true
                            const stage = e.target.getStage()
                            if (!stage) return
                            const pointer = stage.getPointerPosition()
                            if (!pointer) return
                            const scaleX = stage.scaleX()
                            const scaleY = stage.scaleY()
                            const stageX = stage.x()
                            const stageY = stage.y()
                            const canvasX = (pointer.x - stageX) / scaleX
                            const canvasY = (pointer.y - stageY) / scaleY
                            const currentW = shape.width || DEFAULT_SHAPE_SIZE
                            const currentH = shape.height || DEFAULT_SHAPE_SIZE
                            const minSize = 10
                            const newX = Math.min(shape.x + currentW - minSize, canvasX)
                            const newY = Math.min(shape.y + currentH - minSize, canvasY)
                            const newW = Math.max(minSize, (shape.x + currentW) - newX)
                            const newH = Math.max(minSize, (shape.y + currentH) - newY)
                            onResizeMove && onResizeMove(shape.id, { x: newX, y: newY, width: newW, height: newH })
                        }}
                        onDragEnd={(e) => {
                            e.cancelBubble = true
                            onResizeEnd && onResizeEnd(shape.id)
                        }}
                        perfectDrawEnabled={false}
                    />
                    {/* NE handle */}
                    <Rect
                        x={(shape.x + (shape.width || DEFAULT_SHAPE_SIZE)) - handleSize / 2}
                        y={(shape.y) - handleSize / 2}
                        width={handleSize}
                        height={handleSize}
                        fill="#ffffff"
                        stroke={strokeColor}
                        strokeWidth={1}
                        draggable
                        onDragStart={(e) => {
                            e.cancelBubble = true
                            onResizeStart && onResizeStart(shape.id, 'ne')
                        }}
                        onDragMove={(e) => {
                            e.cancelBubble = true
                            const stage = e.target.getStage()
                            if (!stage) return
                            const pointer = stage.getPointerPosition()
                            if (!pointer) return
                            const scaleX = stage.scaleX()
                            const scaleY = stage.scaleY()
                            const stageX = stage.x()
                            const stageY = stage.y()
                            const canvasX = (pointer.x - stageX) / scaleX
                            const canvasY = (pointer.y - stageY) / scaleY
                            const currentH2 = shape.height || DEFAULT_SHAPE_SIZE
                            const minSize = 10
                            const newW = Math.max(minSize, canvasX - shape.x)
                            const newY = Math.min(shape.y + currentH2 - minSize, canvasY)
                            const newH = Math.max(minSize, (shape.y + currentH2) - newY)
                            onResizeMove && onResizeMove(shape.id, { y: newY, width: newW, height: newH })
                        }}
                        onDragEnd={(e) => {
                            e.cancelBubble = true
                            onResizeEnd && onResizeEnd(shape.id)
                        }}
                        perfectDrawEnabled={false}
                    />
                    {/* SW handle */}
                    <Rect
                        x={(shape.x) - handleSize / 2}
                        y={(shape.y + (shape.height || DEFAULT_SHAPE_SIZE)) - handleSize / 2}
                        width={handleSize}
                        height={handleSize}
                        fill="#ffffff"
                        stroke={strokeColor}
                        strokeWidth={1}
                        draggable
                        onDragStart={(e) => {
                            e.cancelBubble = true
                            onResizeStart && onResizeStart(shape.id, 'sw')
                        }}
                        onDragMove={(e) => {
                            e.cancelBubble = true
                            const stage = e.target.getStage()
                            if (!stage) return
                            const pointer = stage.getPointerPosition()
                            if (!pointer) return
                            const scaleX = stage.scaleX()
                            const scaleY = stage.scaleY()
                            const stageX = stage.x()
                            const stageY = stage.y()
                            const canvasX = (pointer.x - stageX) / scaleX
                            const canvasY = (pointer.y - stageY) / scaleY
                            const currentW3 = shape.width || DEFAULT_SHAPE_SIZE
                            const minSize = 10
                            const newX = Math.min(shape.x + currentW3 - minSize, canvasX)
                            const newW = Math.max(minSize, (shape.x + currentW3) - newX)
                            const newH = Math.max(minSize, canvasY - shape.y)
                            onResizeMove && onResizeMove(shape.id, { x: newX, width: newW, height: newH })
                        }}
                        onDragEnd={(e) => {
                            e.cancelBubble = true
                            onResizeEnd && onResizeEnd(shape.id)
                        }}
                        perfectDrawEnabled={false}
                    />
                    {/* SE handle */}
                    <Rect
                        x={(shape.x + (shape.width || DEFAULT_SHAPE_SIZE)) - handleSize / 2}
                        y={(shape.y + (shape.height || DEFAULT_SHAPE_SIZE)) - handleSize / 2}
                        width={handleSize}
                        height={handleSize}
                        fill="#ffffff"
                        stroke={strokeColor}
                        strokeWidth={1}
                        draggable
                        onDragStart={(e) => {
                            e.cancelBubble = true
                            onResizeStart && onResizeStart(shape.id, 'se')
                        }}
                        onDragMove={(e) => {
                            e.cancelBubble = true
                            const stage = e.target.getStage()
                            if (!stage) return
                            const pointer = stage.getPointerPosition()
                            if (!pointer) return
                            const scaleX = stage.scaleX()
                            const scaleY = stage.scaleY()
                            const stageX = stage.x()
                            const stageY = stage.y()
                            const canvasX = (pointer.x - stageX) / scaleX
                            const canvasY = (pointer.y - stageY) / scaleY
                            const minSize = 10
                            const newW = Math.max(minSize, canvasX - shape.x)
                            const newH = Math.max(minSize, canvasY - shape.y)
                            onResizeMove && onResizeMove(shape.id, { width: newW, height: newH })
                        }}
                        onDragEnd={(e) => {
                            e.cancelBubble = true
                            onResizeEnd && onResizeEnd(shape.id)
                        }}
                        perfectDrawEnabled={false}
                    />
                </Group>
            )}
            {/* Countdown timer for locked shapes */}
            {isLocked && remainingSeconds !== null && (
                <KonvaText
                    x={shape.x + 5}
                    y={shape.y + 5}
                    text={`🔒 ${Math.ceil(remainingSeconds)}s`}
                    fontSize={14}
                    fontStyle="bold"
                    fill="#ef4444"
                    listening={false}
                />
            )}
        </>
    )
}




export default CanvasShape

