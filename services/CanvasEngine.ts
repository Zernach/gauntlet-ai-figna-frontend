import type { Shape, ViewportState } from '@/types/canvas';
import { getVisibleShapes } from '@/utils/canvas/performance';

export class CanvasEngine {
    private shapes: Map<string, Shape> = new Map();
    private viewport: ViewportState;

    constructor(viewport: ViewportState) {
        this.viewport = viewport;
    }

    public addShape(shape: Shape): void {
        this.shapes.set(shape.id, shape);
    }

    public updateShape(id: string, updates: Partial<Shape>): void {
        const shape = this.shapes.get(id);
        if (shape) {
            this.shapes.set(id, { ...shape, ...updates, updatedAt: Date.now() } as Shape);
        }
    }

    public deleteShape(id: string): void {
        this.shapes.delete(id);
    }

    public getShape(id: string): Shape | undefined {
        return this.shapes.get(id);
    }

    public getAllShapes(): Shape[] {
        return Array.from(this.shapes.values());
    }

    public getVisibleShapes(): Shape[] {
        return getVisibleShapes(this.getAllShapes(), this.viewport);
    }

    public updateViewport(viewport: ViewportState): void {
        this.viewport = viewport;
    }

    public clearShapes(): void {
        this.shapes.clear();
    }

    public getShapeCount(): number {
        return this.shapes.size;
    }

    public syncShapes(shapes: Record<string, Shape>): void {
        this.shapes.clear();
        Object.values(shapes).forEach((shape) => {
            this.shapes.set(shape.id, shape);
        });
    }

    public getShapesAsRecord(): Record<string, Shape> {
        const record: Record<string, Shape> = {};
        this.shapes.forEach((shape, id) => {
            record[id] = shape;
        });
        return record;
    }
}

let canvasEngineInstance: CanvasEngine | null = null;

export const getCanvasEngine = (viewport?: ViewportState): CanvasEngine => {
    if (!canvasEngineInstance && viewport) {
        canvasEngineInstance = new CanvasEngine(viewport);
    }
    if (!canvasEngineInstance) {
        throw new Error('CanvasEngine not initialized');
    }
    return canvasEngineInstance;
};

export const initCanvasEngine = (viewport: ViewportState): CanvasEngine => {
    canvasEngineInstance = new CanvasEngine(viewport);
    return canvasEngineInstance;
};

