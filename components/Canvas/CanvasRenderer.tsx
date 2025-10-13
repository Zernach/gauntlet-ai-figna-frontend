import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useCanvas } from '@/hooks/useCanvas';
import { useGestures } from '@/hooks/useGestures';
import { getVisibleShapes } from '@/utils/canvas/performance';
import { findShapeAtPoint } from '@/utils/canvas/geometry';
import { Rectangle } from './shapes/Rectangle';
import { Circle } from './shapes/Circle';
import { TextShapeComponent } from './shapes/Text';
import type { Shape } from '@/types/canvas';

export interface CanvasRendererProps {
    width: number;
    height: number;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = React.memo(
    ({ width, height }) => {
        const {
            shapes,
            viewport,
            currentTool,
            createShape,
            updateShape,
            selectShape,
            clearSelection,
            updateViewport,
        } = useCanvas();

        const offsetX = useSharedValue(viewport.offsetX);
        const offsetY = useSharedValue(viewport.offsetY);
        const scale = useSharedValue(viewport.scale);

        // Update shared values when viewport changes
        React.useEffect(() => {
            offsetX.value = withSpring(viewport.offsetX);
            offsetY.value = withSpring(viewport.offsetY);
            scale.value = withSpring(viewport.scale);
        }, [viewport.offsetX, viewport.offsetY, viewport.scale, offsetX, offsetY, scale]);

        const visibleShapes = useMemo(
            () => getVisibleShapes(shapes, viewport),
            [shapes, viewport],
        );

        const handlePan = useCallback(
            (delta: { x: number; y: number }) => {
                if (currentTool === 'pan' || currentTool === 'select') {
                    updateViewport(viewport.offsetX + delta.x, viewport.offsetY + delta.y);
                }
            },
            [currentTool, viewport.offsetX, viewport.offsetY, updateViewport],
        );

        const handlePinch = useCallback(
            (newScale: number, focal: { x: number; y: number }) => {
                const scaleRatio = newScale / viewport.scale;
                const newOffsetX = focal.x - (focal.x - viewport.offsetX) * scaleRatio;
                const newOffsetY = focal.y - (focal.y - viewport.offsetY) * scaleRatio;

                updateViewport(newOffsetX, newOffsetY, newScale);
            },
            [viewport, updateViewport],
        );

        const handleTap = useCallback(
            (position: { x: number; y: number }) => {
                const canvasPoint = {
                    x: (position.x - viewport.offsetX) / viewport.scale,
                    y: (position.y - viewport.offsetY) / viewport.scale,
                };

                if (currentTool === 'select') {
                    const hitResult = findShapeAtPoint(canvasPoint, shapes);
                    if (hitResult.shapeId) {
                        selectShape(hitResult.shapeId);
                    } else {
                        clearSelection();
                    }
                } else if (
                    currentTool === 'rectangle' ||
                    currentTool === 'circle' ||
                    currentTool === 'text'
                ) {
                    createShape(currentTool, canvasPoint);
                }
            },
            [viewport, currentTool, shapes, selectShape, clearSelection, createShape],
        );

        const { composedGesture } = useGestures({
            onPan: handlePan,
            onPinch: handlePinch,
            onTap: handleTap,
        });

        const animatedStyle = useAnimatedStyle(() => {
            return {
                transform: [
                    { translateX: offsetX.value },
                    { translateY: offsetY.value },
                    { scale: scale.value },
                ],
            };
        });

        const renderShape = useCallback(
            (shape: Shape) => {
                const handleShapePress = () => {
                    if (currentTool === 'select') {
                        selectShape(shape.id);
                    }
                };

                const handleTextChange = (text: string) => {
                    updateShape(shape.id, { text });
                };

                const commonProps = {
                    key: shape.id,
                    isVisible: true,
                    onPress: handleShapePress,
                };

                switch (shape.type) {
                    case 'rectangle':
                        return <Rectangle {...commonProps} shape={shape} />;
                    case 'circle':
                        return <Circle {...commonProps} shape={shape} />;
                    case 'text':
                        return (
                            <TextShapeComponent
                                {...commonProps}
                                shape={shape}
                                onTextChange={handleTextChange}
                            />
                        );
                    default:
                        return null;
                }
            },
            [currentTool, selectShape, updateShape],
        );

        return (
            <GestureDetector gesture={composedGesture}>
                <View style={[styles.container, { width, height }]}>
                    <Animated.View style={[styles.canvas, animatedStyle]}>
                        {visibleShapes.map(renderShape)}
                    </Animated.View>
                </View>
            </GestureDetector>
        );
    },
);

CanvasRenderer.displayName = 'CanvasRenderer';

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    canvas: {
        position: 'relative',
        width: '100%',
        height: '100%',
    },
});

