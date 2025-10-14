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
    isPressable: boolean
    isDraggable: boolean
    // isPanning removed: panning is always available via background drag
    remainingSeconds: number | null
    onShapeClick: (id: string) => void
    onDragStart: (id: string) => void
    onDragMove: (id: string, x: number, y: number) => void
    onDragEnd: (id: string) => void
}

const CanvasShape = ({
    shape,
    strokeColor,
    strokeWidth,
    isPressable,
    isDraggable,
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
                    onTap={() => isPressable && onShapeClick(shape.id)}
                    onClick={() => isPressable && onShapeClick(shape.id)}
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
                onTap={() => isPressable && onShapeClick(shape.id)}
                onClick={() => isPressable && onShapeClick(shape.id)}
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
}




export default CanvasShape

