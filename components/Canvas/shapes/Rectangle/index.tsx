import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import type { RectangleShape } from '@/types/canvas';
import { useShapeStyle, useShapeTransform } from '../BaseShape';

export interface RectangleProps {
    shape: RectangleShape;
    isVisible: boolean;
    onPress?: () => void;
    onLongPress?: () => void;
}

export const Rectangle: React.FC<RectangleProps> = React.memo(
    ({ shape, isVisible, onPress, onLongPress }) => {
        const style = useShapeStyle(shape);
        const transform = useShapeTransform(shape);

        if (!isVisible) {
            return null;
        }

        const rectangleStyle = StyleSheet.flatten([
            style,
            {
                backgroundColor: shape.color,
                borderRadius: shape.cornerRadius,
                borderWidth: shape.isSelected ? 3 : shape.strokeWidth,
                borderColor: shape.isSelected ? '#3B82F6' : shape.strokeColor,
                transform,
            },
        ]);

        return (
            <TouchableOpacity
                style={rectangleStyle}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.8}
            />
        );
    },
);

Rectangle.displayName = 'Rectangle';

