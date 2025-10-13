import type { Point, BoundingBox, Shape, HitTestResult } from '@/types/canvas';

export const distance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
};

export const pointInRect = (
    point: Point,
    rect: { x: number; y: number; width: number; height: number },
): boolean => {
    return (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
    );
};

export const pointInCircle = (
    point: Point,
    center: Point,
    radius: number,
): boolean => {
    return distance(point, center) <= radius;
};

export const getBoundingBox = (shape: Shape): BoundingBox => {
    switch (shape.type) {
        case 'rectangle':
        case 'text':
            return {
                x: shape.x,
                y: shape.y,
                width: shape.width,
                height: shape.height,
            };
        case 'circle':
            const radius = shape.radius;
            return {
                x: shape.x - radius,
                y: shape.y - radius,
                width: radius * 2,
                height: radius * 2,
            };
    }
};

export const hitTestShape = (point: Point, shape: Shape): boolean => {
    // Apply rotation if needed (simplified for now)
    // TODO: Implement proper rotation transformation

    switch (shape.type) {
        case 'rectangle':
        case 'text':
            return pointInRect(point, {
                x: shape.x,
                y: shape.y,
                width: shape.width,
                height: shape.height,
            });
        case 'circle':
            return pointInCircle(point, { x: shape.x, y: shape.y }, shape.radius);
        default:
            return false;
    }
};

export const findShapeAtPoint = (
    point: Point,
    shapes: Shape[],
): HitTestResult => {
    // Test shapes in reverse order (highest z-index first)
    const sortedShapes = [...shapes].sort((a, b) => b.zIndex - a.zIndex);

    for (const shape of sortedShapes) {
        if (hitTestShape(point, shape)) {
            return {
                shapeId: shape.id,
                distance: 0,
            };
        }
    }

    return {
        shapeId: null,
        distance: Infinity,
    };
};

export const rectIntersectsRect = (
    rect1: BoundingBox,
    rect2: BoundingBox,
): boolean => {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
};

export const isShapeInViewport = (
    shape: Shape,
    viewport: { x: number; y: number; width: number; height: number },
): boolean => {
    const shapeBounds = getBoundingBox(shape);
    return rectIntersectsRect(shapeBounds, viewport);
};

export const snapToGrid = (value: number, gridSize: number): number => {
    return Math.round(value / gridSize) * gridSize;
};

export const snapPointToGrid = (point: Point, gridSize: number): Point => {
    return {
        x: snapToGrid(point.x, gridSize),
        y: snapToGrid(point.y, gridSize),
    };
};

