import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
    CanvasState,
    Shape,
    ShapeType,
    ViewportState,
} from '@/types/canvas';

const initialViewport: ViewportState = {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    canvasWidth: 1920,
    canvasHeight: 1080,
};

const initialState: CanvasState = {
    shapes: {},
    selectedShapeIds: [],
    viewport: initialViewport,
    isDrawing: false,
    currentTool: 'select',
    currentColor: '#3B82F6',
    gridEnabled: false,
    snapToGrid: false,
    history: {
        past: [],
        future: [],
        maxHistorySize: 50,
    },
};

const canvasSlice = createSlice({
    name: 'canvas',
    initialState,
    reducers: {
        // Shape operations
        addShape: (state, action: PayloadAction<Shape>) => {
            state.shapes[action.payload.id] = action.payload;
        },
        updateShape: (
            state,
            action: PayloadAction<{ id: string; updates: Partial<Shape> }>,
        ) => {
            const shape = state.shapes[action.payload.id];
            if (shape) {
                Object.assign(shape, action.payload.updates);
                shape.updatedAt = Date.now();
            }
        },
        deleteShape: (state, action: PayloadAction<string>) => {
            delete state.shapes[action.payload];
            state.selectedShapeIds = state.selectedShapeIds.filter(
                (id) => id !== action.payload,
            );
        },
        batchUpdateShapes: (
            state,
            action: PayloadAction<
                Array<{
                    type: 'create' | 'update' | 'delete';
                    shapeId: string;
                    shape?: Shape;
                    updates?: Partial<Shape>;
                }>
            >,
        ) => {
            action.payload.forEach((operation) => {
                if (operation.type === 'create' && operation.shape) {
                    state.shapes[operation.shapeId] = operation.shape;
                } else if (operation.type === 'update' && operation.updates) {
                    const shape = state.shapes[operation.shapeId];
                    if (shape) {
                        Object.assign(shape, operation.updates);
                        shape.updatedAt = Date.now();
                    }
                } else if (operation.type === 'delete') {
                    delete state.shapes[operation.shapeId];
                    state.selectedShapeIds = state.selectedShapeIds.filter(
                        (id) => id !== operation.shapeId,
                    );
                }
            });
        },

        // Selection operations
        selectShape: (state, action: PayloadAction<string>) => {
            if (!state.selectedShapeIds.includes(action.payload)) {
                state.selectedShapeIds.push(action.payload);
            }
            Object.values(state.shapes).forEach((shape) => {
                shape.isSelected = state.selectedShapeIds.includes(shape.id);
            });
        },
        deselectShape: (state, action: PayloadAction<string>) => {
            state.selectedShapeIds = state.selectedShapeIds.filter(
                (id) => id !== action.payload,
            );
            const shape = state.shapes[action.payload];
            if (shape) {
                shape.isSelected = false;
            }
        },
        clearSelection: (state) => {
            state.selectedShapeIds = [];
            Object.values(state.shapes).forEach((shape) => {
                shape.isSelected = false;
            });
        },
        setSelectedShapes: (state, action: PayloadAction<string[]>) => {
            state.selectedShapeIds = action.payload;
            Object.values(state.shapes).forEach((shape) => {
                shape.isSelected = action.payload.includes(shape.id);
            });
        },

        // Viewport operations
        updateViewport: (state, action: PayloadAction<Partial<ViewportState>>) => {
            Object.assign(state.viewport, action.payload);
        },
        setViewportPosition: (
            state,
            action: PayloadAction<{ offsetX: number; offsetY: number }>,
        ) => {
            state.viewport.offsetX = action.payload.offsetX;
            state.viewport.offsetY = action.payload.offsetY;
        },
        setViewportScale: (state, action: PayloadAction<number>) => {
            state.viewport.scale = Math.max(0.1, Math.min(10, action.payload));
        },
        resetViewport: (state) => {
            state.viewport = initialViewport;
        },

        // Tool operations
        setCurrentTool: (
            state,
            action: PayloadAction<ShapeType | 'select' | 'pan'>,
        ) => {
            state.currentTool = action.payload;
        },
        setCurrentColor: (state, action: PayloadAction<string>) => {
            state.currentColor = action.payload;
        },
        setIsDrawing: (state, action: PayloadAction<boolean>) => {
            state.isDrawing = action.payload;
        },

        // Canvas settings
        toggleGrid: (state) => {
            state.gridEnabled = !state.gridEnabled;
        },
        toggleSnapToGrid: (state) => {
            state.snapToGrid = !state.snapToGrid;
        },

        // Canvas sync
        syncCanvas: (
            state,
            action: PayloadAction<{ shapes: Record<string, Shape> }>,
        ) => {
            state.shapes = action.payload.shapes;
        },

        // Clear canvas
        clearCanvas: (state) => {
            state.shapes = {};
            state.selectedShapeIds = [];
        },

        // Reset
        resetCanvas: () => initialState,
    },
});

export const {
    addShape,
    updateShape,
    deleteShape,
    batchUpdateShapes,
    selectShape,
    deselectShape,
    clearSelection,
    setSelectedShapes,
    updateViewport,
    setViewportPosition,
    setViewportScale,
    resetViewport,
    setCurrentTool,
    setCurrentColor,
    setIsDrawing,
    toggleGrid,
    toggleSnapToGrid,
    syncCanvas,
    clearCanvas,
    resetCanvas,
} = canvasSlice.actions;

export const canvasSliceReducer = canvasSlice.reducer;

