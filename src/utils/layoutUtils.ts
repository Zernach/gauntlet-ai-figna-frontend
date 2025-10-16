/**
 * Layout utility functions for intelligent shape arrangement
 * Used by AI agent to create sophisticated layouts
 */

export interface LayoutPosition {
    x: number
    y: number
}

export interface ShapeForLayout {
    width?: number
    height?: number
    radius?: number
    type: string
}

/**
 * Calculates positions for shapes arranged in a horizontal row
 */
export function arrangeInRow(
    shapes: ShapeForLayout[],
    startX: number,
    startY: number,
    spacing: number = 300
): LayoutPosition[] {
    const positions: LayoutPosition[] = []
    let currentX = startX

    shapes.forEach((shape) => {
        positions.push({ x: currentX, y: startY })

        // Calculate shape width for next position
        const shapeWidth = shape.width || (shape.radius ? shape.radius * 2 : 200)
        currentX += shapeWidth + spacing
    })

    return positions
}

/**
 * Calculates positions for shapes arranged in a vertical column
 */
export function arrangeInColumn(
    shapes: ShapeForLayout[],
    startX: number,
    startY: number,
    spacing: number = 300
): LayoutPosition[] {
    const positions: LayoutPosition[] = []
    let currentY = startY

    shapes.forEach((shape) => {
        positions.push({ x: startX, y: currentY })

        // Calculate shape height for next position
        const shapeHeight = shape.height || (shape.radius ? shape.radius * 2 : 150)
        currentY += shapeHeight + spacing
    })

    return positions
}

/**
 * Calculates positions for shapes arranged in a grid
 * Automatically determines grid dimensions based on shape count
 */
export function arrangeInGrid(
    shapeCount: number,
    startX: number,
    startY: number,
    cellWidth: number = 300,
    cellHeight: number = 300,
    columns?: number
): LayoutPosition[] {
    const positions: LayoutPosition[] = []

    // Auto-calculate columns if not specified (try to make a square grid)
    const cols = columns || Math.ceil(Math.sqrt(shapeCount))

    for (let i = 0; i < shapeCount; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)

        positions.push({
            x: startX + (col * cellWidth),
            y: startY + (row * cellHeight)
        })
    }

    return positions
}

/**
 * Centers shapes around a given point
 */
export function centerShapes(
    shapes: ShapeForLayout[],
    centerX: number,
    centerY: number,
    spacing: number = 50
): LayoutPosition[] {
    if (shapes.length === 1) {
        return [{ x: centerX, y: centerY }]
    }

    // Calculate total width needed
    const totalWidth = shapes.reduce((sum, shape, idx) => {
        const shapeWidth = shape.width || (shape.radius ? shape.radius * 2 : 200)
        return sum + shapeWidth + (idx > 0 ? spacing : 0)
    }, 0)

    const startX = centerX - totalWidth / 2

    return arrangeInRow(shapes, startX, centerY, spacing)
}

/**
 * Distributes shapes evenly between two points
 */
export function distributeEvenly(
    shapeCount: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number
): LayoutPosition[] {
    const positions: LayoutPosition[] = []

    if (shapeCount === 1) {
        return [{ x: (startX + endX) / 2, y: (startY + endY) / 2 }]
    }

    const deltaX = (endX - startX) / (shapeCount - 1)
    const deltaY = (endY - startY) / (shapeCount - 1)

    for (let i = 0; i < shapeCount; i++) {
        positions.push({
            x: startX + (deltaX * i),
            y: startY + (deltaY * i)
        })
    }

    return positions
}

/**
 * Aligns shapes horizontally (left, center, or right)
 */
export function alignHorizontally(
    shapes: Array<{ x: number; width?: number; radius?: number }>,
    alignment: 'left' | 'center' | 'right',
    referenceX: number
): number[] {
    return shapes.map((shape) => {
        const shapeWidth = shape.width || (shape.radius ? shape.radius * 2 : 200)

        switch (alignment) {
            case 'left':
                return referenceX
            case 'center':
                return referenceX - shapeWidth / 2
            case 'right':
                return referenceX - shapeWidth
            default:
                return shape.x
        }
    })
}

/**
 * Aligns shapes vertically (top, middle, or bottom)
 */
export function alignVertically(
    shapes: Array<{ y: number; height?: number; radius?: number }>,
    alignment: 'top' | 'middle' | 'bottom',
    referenceY: number
): number[] {
    return shapes.map((shape) => {
        const shapeHeight = shape.height || (shape.radius ? shape.radius * 2 : 150)

        switch (alignment) {
            case 'top':
                return referenceY
            case 'middle':
                return referenceY - shapeHeight / 2
            case 'bottom':
                return referenceY - shapeHeight
            default:
                return shape.y
        }
    })
}

/**
 * Calculates circle positions around a center point (radial layout)
 */
export function arrangeInCircle(
    shapeCount: number,
    centerX: number,
    centerY: number,
    radius: number = 500
): LayoutPosition[] {
    const positions: LayoutPosition[] = []
    const angleStep = (2 * Math.PI) / shapeCount

    for (let i = 0; i < shapeCount; i++) {
        const angle = i * angleStep - Math.PI / 2 // Start from top
        positions.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        })
    }

    return positions
}

/**
 * Creates a staggered/cascading layout
 */
export function arrangeStaggered(
    shapeCount: number,
    startX: number,
    startY: number,
    offsetX: number = 50,
    offsetY: number = 50
): LayoutPosition[] {
    const positions: LayoutPosition[] = []

    for (let i = 0; i < shapeCount; i++) {
        positions.push({
            x: startX + (i * offsetX),
            y: startY + (i * offsetY)
        })
    }

    return positions
}

