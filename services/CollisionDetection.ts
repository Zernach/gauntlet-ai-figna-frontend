import type { Shape, Point, BoundingBox } from '@/types/canvas';
import { getBoundingBox, hitTestShape, rectIntersectsRect } from '@/utils/canvas/geometry';

export class CollisionDetection {
    public static checkCollision(shape1: Shape, shape2: Shape): boolean {
        const bounds1 = getBoundingBox(shape1);
        const bounds2 = getBoundingBox(shape2);
        return rectIntersectsRect(bounds1, bounds2);
    }

    public static getCollidingShapes(shape: Shape, shapes: Shape[]): Shape[] {
        return shapes.filter((other) => {
            if (other.id === shape.id) return false;
            return this.checkCollision(shape, other);
        });
    }

    public static getShapesAtPoint(point: Point, shapes: Shape[]): Shape[] {
        return shapes.filter((shape) => hitTestShape(point, shape));
    }

    public static getShapesInArea(area: BoundingBox, shapes: Shape[]): Shape[] {
        return shapes.filter((shape) => {
            const shapeBounds = getBoundingBox(shape);
            return rectIntersectsRect(shapeBounds, area);
        });
    }

    public static getClosestShape(point: Point, shapes: Shape[]): Shape | null {
        let closestShape: Shape | null = null;
        let minDistance = Infinity;

        shapes.forEach((shape) => {
            const bounds = getBoundingBox(shape);
            const centerX = bounds.x + bounds.width / 2;
            const centerY = bounds.y + bounds.height / 2;
            const distance = Math.sqrt(
                Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2),
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestShape = shape;
            }
        });

        return closestShape;
    }

    public static areShapesOverlapping(shapes: Shape[]): boolean {
        for (let i = 0; i < shapes.length; i++) {
            for (let j = i + 1; j < shapes.length; j++) {
                if (this.checkCollision(shapes[i], shapes[j])) {
                    return true;
                }
            }
        }
        return false;
    }
}

