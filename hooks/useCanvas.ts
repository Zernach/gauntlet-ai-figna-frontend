import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    deselectShape,
    clearSelection,
    setViewportPosition,
    setViewportScale,
    setCurrentTool,
    setCurrentColor,
} from '@/lib/redux/slices/canvasSlice';
import type { Shape, ShapeType, Point } from '@/types/canvas';
import { generateRandomUuid } from '@/scripts/generateRandomUuid';

export const useCanvas = () => {
    const dispatch = useAppDispatch();
    const canvas = useAppSelector((state) => state.canvas);
    const currentUser = useAppSelector((state) => state.user?.currentUser);

    const shapes = useMemo(() => Object.values(canvas.shapes), [canvas.shapes]);
    const selectedShapes = useMemo(
        () =>
            canvas.selectedShapeIds
                .map((id) => canvas.shapes[id])
                .filter((shape) => shape !== undefined),
        [canvas.selectedShapeIds, canvas.shapes],
    );

    const createShape = useCallback(
        (type: ShapeType, position: Point, size?: { width: number; height: number }) => {
            if (!currentUser) return null;

            const baseShape = {
                id: generateRandomUuid(),
                type,
                x: position.x,
                y: position.y,
                width: size?.width || 100,
                height: size?.height || 100,
                rotation: 0,
                color: canvas.currentColor,
                opacity: 1,
                zIndex: Object.keys(canvas.shapes).length,
                isSelected: false,
                isLocked: false,
                createdBy: currentUser.id,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            let newShape: Shape;

            switch (type) {
                case 'rectangle':
                    newShape = {
                        ...baseShape,
                        type: 'rectangle',
                        cornerRadius: 0,
                        strokeWidth: 2,
                        strokeColor: '#000000',
                    };
                    break;
                case 'circle':
                    newShape = {
                        ...baseShape,
                        type: 'circle',
                        radius: Math.min(baseShape.width, baseShape.height) / 2,
                        strokeWidth: 2,
                        strokeColor: '#000000',
                    };
                    break;
                case 'text':
                    newShape = {
                        ...baseShape,
                        type: 'text',
                        text: 'Double-click to edit',
                        fontSize: 16,
                        fontFamily: 'System',
                        fontWeight: 'normal',
                        textAlign: 'left',
                    };
                    break;
                default:
                    return null;
            }

            dispatch(addShape(newShape));
            return newShape.id;
        },
        [dispatch, canvas.currentColor, canvas.shapes, currentUser],
    );

    const updateShapeById = useCallback(
        (id: string, updates: Partial<Shape>) => {
            dispatch(updateShape({ id, updates }));
        },
        [dispatch],
    );

    const deleteShapeById = useCallback(
        (id: string) => {
            dispatch(deleteShape(id));
        },
        [dispatch],
    );

    const selectShapeById = useCallback(
        (id: string) => {
            dispatch(selectShape(id));
        },
        [dispatch],
    );

    const deselectShapeById = useCallback(
        (id: string) => {
            dispatch(deselectShape(id));
        },
        [dispatch],
    );

    const clearShapeSelection = useCallback(() => {
        dispatch(clearSelection());
    }, [dispatch]);

    const updateViewport = useCallback(
        (offsetX: number, offsetY: number, scale?: number) => {
            dispatch(setViewportPosition({ offsetX, offsetY }));
            if (scale !== undefined) {
                dispatch(setViewportScale(scale));
            }
        },
        [dispatch],
    );

    const setTool = useCallback(
        (tool: ShapeType | 'select' | 'pan') => {
            dispatch(setCurrentTool(tool));
        },
        [dispatch],
    );

    const setColor = useCallback(
        (color: string) => {
            dispatch(setCurrentColor(color));
        },
        [dispatch],
    );

    const screenToCanvas = useCallback(
        (screenX: number, screenY: number): Point => {
            return {
                x: (screenX - canvas.viewport.offsetX) / canvas.viewport.scale,
                y: (screenY - canvas.viewport.offsetY) / canvas.viewport.scale,
            };
        },
        [canvas.viewport],
    );

    const canvasToScreen = useCallback(
        (canvasX: number, canvasY: number): Point => {
            return {
                x: canvasX * canvas.viewport.scale + canvas.viewport.offsetX,
                y: canvasY * canvas.viewport.scale + canvas.viewport.offsetY,
            };
        },
        [canvas.viewport],
    );

    return {
        shapes,
        selectedShapes,
        viewport: canvas.viewport,
        currentTool: canvas.currentTool,
        currentColor: canvas.currentColor,
        isDrawing: canvas.isDrawing,
        createShape,
        updateShape: updateShapeById,
        deleteShape: deleteShapeById,
        selectShape: selectShapeById,
        deselectShape: deselectShapeById,
        clearSelection: clearShapeSelection,
        updateViewport,
        setTool,
        setColor,
        screenToCanvas,
        canvasToScreen,
    };
};

