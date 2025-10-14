import { memo } from 'react'
import { Rect, Text as KonvaText, Group } from 'react-konva'

interface CanvasCursorProps {
    cursor: {
        userId: string
        username: string
        displayName: string
        email: string
        color: string
        x: number
        y: number
    }
}

const CanvasCursor = memo(({ cursor }: CanvasCursorProps) => {
    return (
        <Group>
            {/* Cursor pointer */}
            <Rect
                x={cursor.x}
                y={cursor.y}
                width={2}
                height={16}
                fill={cursor.color}
                listening={false}
            />
            <Rect
                x={cursor.x}
                y={cursor.y}
                width={12}
                height={2}
                fill={cursor.color}
                listening={false}
            />
            {/* User name label */}
            <KonvaText
                x={cursor.x + 14}
                y={cursor.y - 2}
                text={cursor.email}
                fontSize={12}
                fill="#ffffff"
                fontStyle="bold"
                listening={false}
            />
        </Group>
    )
}, (prevProps, nextProps) => {
    // Only re-render if cursor position or color changed
    return (
        prevProps.cursor.userId === nextProps.cursor.userId &&
        prevProps.cursor.x === nextProps.cursor.x &&
        prevProps.cursor.y === nextProps.cursor.y &&
        prevProps.cursor.color === nextProps.cursor.color &&
        prevProps.cursor.email === nextProps.cursor.email
    )
})

CanvasCursor.displayName = 'CanvasCursor'

export default CanvasCursor

