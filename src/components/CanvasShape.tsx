import { Rect, Circle, Text as KonvaText, Group } from 'react-konva'
import { useRef, useState, useEffect, memo } from 'react'

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
    onRotateStart?: (id: string) => void
    onRotateMove?: (id: string, rotation: number) => void
    onRotateEnd?: (id: string) => void
    stageScale: number
    onTextDoubleClick?: (id: string) => void
}

const CanvasShapeComponent = ({
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
    onRotateStart: _onRotateStart,
    onRotateMove: _onRotateMove,
    onRotateEnd: _onRotateEnd,
    stageScale,
    onTextDoubleClick,
}: CanvasShapeProps) => {
    const isLocked = remainingSeconds !== null
    const BASE_HANDLE_PX = 16
    const handleSize = BASE_HANDLE_PX / stageScale
    const handleStrokeThin = 1 / stageScale
    const handleStrokeThick = 2 / stageScale
    const ROTATION_OFFSET_PX = 28
    const rotationOffset = ROTATION_OFFSET_PX / stageScale

    if (shape.type === 'text') {
        const textRef = useRef<any>(null)
        const [textWidth, setTextWidth] = useState<number>(0)
        const [textHeight, setTextHeight] = useState<number>(0)
        const [baselineFontSize, setBaselineFontSize] = useState<number>(shape.fontSize ?? shape.font_size ?? 24)
        const [baselineWidth, setBaselineWidth] = useState<number>(0)
        const [baselineHeight, setBaselineHeight] = useState<number>(0)

        const text = shape.textContent ?? shape.text_content ?? 'Text'
        const fontSize = shape.fontSize ?? shape.font_size ?? 24
        const fontFamily = shape.fontFamily ?? shape.font_family ?? 'Inter'
        const fontWeight = shape.fontWeight ?? shape.font_weight ?? 'normal'
        const textAlign = shape.textAlign ?? shape.text_align ?? 'left'

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
                    fontFamily={fontFamily}
                    fontStyle={fontWeight}
                    align={textAlign}
                    fill={shape.color || '#ffffff'}
                    rotation={shape.rotation || 0}
                    opacity={shape.opacity ?? 1}
                    shadowColor={shape.shadowColor ?? 'transparent'}
                    shadowBlur={(shape.shadowStrength ?? 0)}
                    shadowOpacity={Math.min(1, Math.max(0, (shape.shadowStrength ?? 0) / 50))}
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
                            strokeWidth={handleStrokeThin}
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
                        {/* Rotation handle */}
                        <Rect
                            x={(shape.x + textWidth / 2) - handleSize / 2}
                            y={(shape.y - rotationOffset) - handleSize / 2}
                            width={handleSize}
                            height={handleSize}
                            fill="#4f46e5"
                            stroke="#ffffff"
                            strokeWidth={handleStrokeThick}
                            draggable
                            onDragStart={(e) => {
                                e.cancelBubble = true
                                _onRotateStart && _onRotateStart(shape.id)
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

                                // Calculate rotation angle
                                const centerX = shape.x + textWidth / 2
                                const centerY = shape.y + textHeight / 2
                                const angle = Math.atan2(canvasY - centerY, canvasX - centerX) * (180 / Math.PI)

                                _onRotateMove && _onRotateMove(shape.id, angle)
                            }}
                            onDragEnd={(e) => {
                                e.cancelBubble = true
                                _onRotateEnd && _onRotateEnd(shape.id)
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
                    rotation={shape.rotation || 0}
                    opacity={shape.opacity ?? 1}
                    shadowColor={shape.shadowColor ?? 'transparent'}
                    shadowBlur={(shape.shadowStrength ?? 0)}
                    shadowOpacity={Math.min(1, Math.max(0, (shape.shadowStrength ?? 0) / 50))}
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
                            strokeWidth={handleStrokeThin}
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
                        {/* Rotation handle */}
                        <Rect
                            x={shape.x - handleSize / 2}
                            y={(shape.y - rotationOffset) - handleSize / 2}
                            width={handleSize}
                            height={handleSize}
                            fill="#4f46e5"
                            stroke="#ffffff"
                            strokeWidth={handleStrokeThick}
                            draggable
                            onDragStart={(e) => {
                                e.cancelBubble = true
                                _onRotateStart && _onRotateStart(shape.id)
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

                                // Calculate rotation angle
                                const angle = Math.atan2(canvasY - shape.y, canvasX - shape.x) * (180 / Math.PI)

                                _onRotateMove && _onRotateMove(shape.id, angle)
                            }}
                            onDragEnd={(e) => {
                                e.cancelBubble = true
                                _onRotateEnd && _onRotateEnd(shape.id)
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
                rotation={shape.rotation || 0}
                opacity={shape.opacity ?? 1}
                shadowColor={shape.shadowColor ?? 'transparent'}
                shadowBlur={(shape.shadowStrength ?? 0)}
                shadowOpacity={Math.min(1, Math.max(0, (shape.shadowStrength ?? 0) / 50))}
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
                        strokeWidth={handleStrokeThin}
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
                        strokeWidth={handleStrokeThin}
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
                        strokeWidth={handleStrokeThin}
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
                        strokeWidth={handleStrokeThin}
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
                    {/* Rotation handle */}
                    <Rect
                        x={(shape.x + (shape.width || DEFAULT_SHAPE_SIZE) / 2) - handleSize / 2}
                        y={(shape.y - rotationOffset) - handleSize / 2}
                        width={handleSize}
                        height={handleSize}
                        fill="#4f46e5"
                        stroke="#ffffff"
                        strokeWidth={handleStrokeThick}
                        draggable
                        onDragStart={(e) => {
                            e.cancelBubble = true
                            _onRotateStart && _onRotateStart(shape.id)
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

                            // Calculate rotation angle
                            const centerX = shape.x + (shape.width || DEFAULT_SHAPE_SIZE) / 2
                            const centerY = shape.y + (shape.height || DEFAULT_SHAPE_SIZE) / 2
                            const angle = Math.atan2(canvasY - centerY, canvasX - centerX) * (180 / Math.PI)

                            _onRotateMove && _onRotateMove(shape.id, angle)
                        }}
                        onDragEnd={(e) => {
                            e.cancelBubble = true
                            _onRotateEnd && _onRotateEnd(shape.id)
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

function areEqual(prev: CanvasShapeProps, next: CanvasShapeProps) {
    const a = prev.shape
    const b = next.shape
    // Only re-render when drawing-relevant props change
    if (a.id !== b.id) return false
    if (a.type !== b.type) return false
    if (a.x !== b.x || a.y !== b.y) return false
    if ((a.width ?? DEFAULT_SHAPE_SIZE) !== (b.width ?? DEFAULT_SHAPE_SIZE)) return false
    if ((a.height ?? DEFAULT_SHAPE_SIZE) !== (b.height ?? DEFAULT_SHAPE_SIZE)) return false
    if ((a.radius ?? DEFAULT_SHAPE_SIZE / 2) !== (b.radius ?? DEFAULT_SHAPE_SIZE / 2)) return false
    if ((a.rotation ?? 0) !== (b.rotation ?? 0)) return false
    if (a.color !== b.color) return false
    if ((a.textContent ?? a.text_content) !== (b.textContent ?? b.text_content)) return false
    if ((a.fontSize ?? a.font_size) !== (b.fontSize ?? b.font_size)) return false
    if ((a.fontFamily ?? a.font_family) !== (b.fontFamily ?? b.font_family)) return false
    if ((a.fontWeight ?? a.font_weight) !== (b.fontWeight ?? b.font_weight)) return false
    if ((a.textAlign ?? a.text_align) !== (b.textAlign ?? b.text_align)) return false

    if (prev.strokeColor !== next.strokeColor) return false
    if (prev.strokeWidth !== next.strokeWidth) return false
    if (prev.isPressable !== next.isPressable) return false
    if (prev.isDraggable !== next.isDraggable) return false
    if ((prev.isSelected ?? false) !== (next.isSelected ?? false)) return false
    if ((prev.canResize ?? false) !== (next.canResize ?? false)) return false
    if ((prev.remainingSeconds ?? null) !== (next.remainingSeconds ?? null)) return false
    if (prev.stageScale !== next.stageScale) return false

    // Handlers are stable (from useCallback) in parent; ignore identity changes
    return true
}

const CanvasShape = memo(CanvasShapeComponent, areEqual)

export default CanvasShape

