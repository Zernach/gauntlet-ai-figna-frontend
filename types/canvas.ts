// Canvas Type Definitions

export type ShapeType = 'rectangle' | 'circle' | 'text';

export interface Point {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Transform {
    x: number;
    y: number;
    rotation: number;
    scale: number;
}

export interface BaseShapeProps {
    id: string;
    type: ShapeType;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    color: string;
    opacity: number;
    zIndex: number;
    isSelected: boolean;
    isLocked: boolean;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}

export interface RectangleShape extends BaseShapeProps {
    type: 'rectangle';
    cornerRadius: number;
    strokeWidth: number;
    strokeColor: string;
}

export interface CircleShape extends BaseShapeProps {
    type: 'circle';
    radius: number;
    strokeWidth: number;
    strokeColor: string;
}

export interface TextShape extends BaseShapeProps {
    type: 'text';
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: 'normal' | 'bold';
    textAlign: 'left' | 'center' | 'right';
}

export type Shape = RectangleShape | CircleShape | TextShape;

export interface ViewportState {
    offsetX: number;
    offsetY: number;
    scale: number;
    canvasWidth: number;
    canvasHeight: number;
}

export interface CanvasState {
    shapes: Record<string, Shape>;
    selectedShapeIds: string[];
    viewport: ViewportState;
    isDrawing: boolean;
    currentTool: ShapeType | 'select' | 'pan';
    currentColor: string;
    gridEnabled: boolean;
    snapToGrid: boolean;
    history: CanvasHistoryState;
}

export interface CanvasHistoryState {
    past: CanvasSnapshot[];
    future: CanvasSnapshot[];
    maxHistorySize: number;
}

export interface CanvasSnapshot {
    shapes: Record<string, Shape>;
    timestamp: number;
}

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface HitTestResult {
    shapeId: string | null;
    distance: number;
}

export interface CanvasPerformanceMetrics {
    fps: number;
    renderTime: number;
    shapeCount: number;
    visibleShapeCount: number;
}

