import { memo } from 'react'
import { Rect, Circle, Text as KonvaText } from 'react-konva'

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
        locked_at?: string | null
        locked_by?: string | null
        created_by?: string
    }
    strokeColor: string
    strokeWidth: number
    isDraggable: boolean
    isPanning: boolean
    remainingSeconds: number | null
    onShapeClick: (id: string) => void
    onDragStart: (id: string) => void
    onDragMove: (id: string, x: number, y: number) => void
    onDragEnd: (id: string) => void
}

const CanvasShape = memo(({
    shape,
    strokeColor,
    strokeWidth,
    isDraggable,
    isPanning,
    remainingSeconds,
    onShapeClick,
    onDragStart,
    onDragMove,
    onDragEnd,
}: CanvasShapeProps) => {
    const isLocked = remainingSeconds !== null

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
                    onTap={() => !isPanning && onShapeClick(shape.id)}
                    onClick={() => !isPanning && onShapeClick(shape.id)}
                    draggable={isDraggable}
                    onDragStart={() => onDragStart(shape.id)}
                    onDragMove={(e) => {
                        e.cancelBubble = true // Prevent event from bubbling to stage
                        onDragMove(shape.id, e.target.x(), e.target.y())
                    }}
                    onDragEnd={(e) => {
                        e.cancelBubble = true // Prevent event from bubbling to stage
                        onDragEnd(shape.id)
                    }}
                    perfectDrawEnabled={false}
                />
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
                onTap={() => !isPanning && onShapeClick(shape.id)}
                onClick={() => !isPanning && onShapeClick(shape.id)}
                draggable={isDraggable}
                onDragStart={() => onDragStart(shape.id)}
                onDragMove={(e) => {
                    e.cancelBubble = true // Prevent event from bubbling to stage
                    onDragMove(shape.id, e.target.x(), e.target.y())
                }}
                onDragEnd={(e) => {
                    e.cancelBubble = true // Prevent event from bubbling to stage
                    onDragEnd(shape.id)
                }}
                perfectDrawEnabled={false}
            />
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
}, (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    return (
        prevProps.shape.id === nextProps.shape.id &&
        prevProps.shape.x === nextProps.shape.x &&
        prevProps.shape.y === nextProps.shape.y &&
        prevProps.shape.width === nextProps.shape.width &&
        prevProps.shape.height === nextProps.shape.height &&
        prevProps.shape.radius === nextProps.shape.radius &&
        prevProps.shape.color === nextProps.shape.color &&
        prevProps.shape.locked_at === nextProps.shape.locked_at &&
        prevProps.shape.locked_by === nextProps.shape.locked_by &&
        prevProps.strokeColor === nextProps.strokeColor &&
        prevProps.strokeWidth === nextProps.strokeWidth &&
        prevProps.isDraggable === nextProps.isDraggable &&
        prevProps.isPanning === nextProps.isPanning &&
        prevProps.remainingSeconds === nextProps.remainingSeconds
    )
})

CanvasShape.displayName = 'CanvasShape'

export default CanvasShape

