import React, { useMemo } from 'react';
import type { Shape } from '@/types/canvas';

export interface BaseShapeProps {
    shape: Shape;
    isVisible: boolean;
    onPress?: () => void;
    onLongPress?: () => void;
}

export const BaseShape: React.FC<BaseShapeProps> = React.memo(
    ({ shape, isVisible }) => {
        if (!isVisible) {
            return null;
        }

        // Base shape is abstract - actual rendering is done by specific shape types
        return null;
    },
);

BaseShape.displayName = 'BaseShape';

export const useShapeTransform = (shape: Shape) => {
    return useMemo(() => {
        const transform = [
            { translateX: shape.x },
            { translateY: shape.y },
            { rotate: `${shape.rotation}deg` },
        ];
        return transform;
    }, [shape.x, shape.y, shape.rotation]);
};

export const useShapeStyle = (shape: Shape) => {
    return useMemo(() => {
        return {
            position: 'absolute' as const,
            width: shape.width,
            height: shape.height,
            opacity: shape.opacity,
            zIndex: shape.zIndex,
        };
    }, [shape.width, shape.height, shape.opacity, shape.zIndex]);
};

