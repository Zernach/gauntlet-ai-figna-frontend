import type { Shape, ViewportState, CanvasPerformanceMetrics } from '@/types/canvas';
import { isShapeInViewport } from './geometry';

export const getVisibleShapes = (
    shapes: Shape[],
    viewport: ViewportState,
): Shape[] => {
    const viewportBounds = {
        x: -viewport.offsetX / viewport.scale,
        y: -viewport.offsetY / viewport.scale,
        width: viewport.canvasWidth / viewport.scale,
        height: viewport.canvasHeight / viewport.scale,
    };

    return shapes.filter((shape) => isShapeInViewport(shape, viewportBounds));
};

export const shouldCullShape = (
    shape: Shape,
    viewport: ViewportState,
): boolean => {
    const viewportBounds = {
        x: -viewport.offsetX / viewport.scale,
        y: -viewport.offsetY / viewport.scale,
        width: viewport.canvasWidth / viewport.scale,
        height: viewport.canvasHeight / viewport.scale,
    };

    return !isShapeInViewport(shape, viewportBounds);
};

export class PerformanceMonitor {
    private frameCount = 0;
    private lastTime = performance.now();
    private fps = 60;
    private renderTimes: number[] = [];
    private maxRenderTimeSamples = 60;

    public startFrame(): number {
        return performance.now();
    }

    public endFrame(startTime: number, shapeCount: number, visibleCount: number): CanvasPerformanceMetrics {
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        this.renderTimes.push(renderTime);
        if (this.renderTimes.length > this.maxRenderTimeSamples) {
            this.renderTimes.shift();
        }

        this.frameCount++;
        const elapsed = endTime - this.lastTime;

        if (elapsed >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastTime = endTime;
        }

        return {
            fps: this.fps,
            renderTime,
            shapeCount,
            visibleShapeCount: visibleCount,
        };
    }

    public getAverageRenderTime(): number {
        if (this.renderTimes.length === 0) return 0;
        return this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
    }

    public getFPS(): number {
        return this.fps;
    }
}

export const throttle = <T extends (...args: any[]) => void>(
    func: T,
    limit: number,
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return function (this: any, ...args: Parameters<T>) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};

export const debounce = <T extends (...args: any[]) => void>(
    func: T,
    wait: number,
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;
    return function (this: any, ...args: Parameters<T>) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

export const memoizeOne = <T extends (...args: any[]) => any>(fn: T): T => {
    let lastArgs: any[] | null = null;
    let lastResult: any = null;

    return ((...args: any[]) => {
        if (
            lastArgs &&
            lastArgs.length === args.length &&
            lastArgs.every((arg, i) => arg === args[i])
        ) {
            return lastResult;
        }
        lastArgs = args;
        lastResult = fn(...args);
        return lastResult;
    }) as T;
};

