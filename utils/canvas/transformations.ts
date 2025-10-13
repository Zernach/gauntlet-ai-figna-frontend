import type { Point, ViewportState } from '@/types/canvas';

export const screenToCanvas = (
    screenPoint: Point,
    viewport: ViewportState,
): Point => {
    return {
        x: (screenPoint.x - viewport.offsetX) / viewport.scale,
        y: (screenPoint.y - viewport.offsetY) / viewport.scale,
    };
};

export const canvasToScreen = (
    canvasPoint: Point,
    viewport: ViewportState,
): Point => {
    return {
        x: canvasPoint.x * viewport.scale + viewport.offsetX,
        y: canvasPoint.y * viewport.scale + viewport.offsetY,
    };
};

export const applyPan = (
    viewport: ViewportState,
    deltaX: number,
    deltaY: number,
): ViewportState => {
    return {
        ...viewport,
        offsetX: viewport.offsetX + deltaX,
        offsetY: viewport.offsetY + deltaY,
    };
};

export const applyZoom = (
    viewport: ViewportState,
    scaleFactor: number,
    focalPoint: Point,
): ViewportState => {
    const newScale = Math.max(0.1, Math.min(10, viewport.scale * scaleFactor));
    const scaleRatio = newScale / viewport.scale;

    // Calculate new offset to keep focal point stationary
    const newOffsetX = focalPoint.x - (focalPoint.x - viewport.offsetX) * scaleRatio;
    const newOffsetY = focalPoint.y - (focalPoint.y - viewport.offsetY) * scaleRatio;

    return {
        ...viewport,
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
    };
};

export const zoomToFit = (
    canvasWidth: number,
    canvasHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    padding: number = 50,
): ViewportState => {
    const scaleX = (viewportWidth - padding * 2) / canvasWidth;
    const scaleY = (viewportHeight - padding * 2) / canvasHeight;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (viewportWidth - canvasWidth * scale) / 2;
    const offsetY = (viewportHeight - canvasHeight * scale) / 2;

    return {
        offsetX,
        offsetY,
        scale,
        canvasWidth: viewportWidth,
        canvasHeight: viewportHeight,
    };
};

export const centerViewport = (
    canvasWidth: number,
    canvasHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    scale: number = 1,
): ViewportState => {
    const offsetX = (viewportWidth - canvasWidth * scale) / 2;
    const offsetY = (viewportHeight - canvasHeight * scale) / 2;

    return {
        offsetX,
        offsetY,
        scale,
        canvasWidth: viewportWidth,
        canvasHeight: viewportHeight,
    };
};

export const rotatePoint = (
    point: Point,
    center: Point,
    angle: number,
): Point => {
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    const dx = point.x - center.x;
    const dy = point.y - center.y;

    return {
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos,
    };
};

