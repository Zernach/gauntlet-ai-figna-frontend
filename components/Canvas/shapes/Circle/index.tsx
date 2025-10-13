import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import type { CircleShape } from '@/types/canvas';
import { useShapeStyle, useShapeTransform } from '../BaseShape';

export interface CircleProps {
    shape: CircleShape;
    isVisible: boolean;
    onPress?: () => void;
    onLongPress?: () => void;
}

export const Circle: React.FC<CircleProps> = React.memo(
    ({ shape, isVisible, onPress, onLongPress }) => {
        const baseStyle = useShapeStyle(shape);
        const transform = useShapeTransform(shape);

        if (!isVisible) {
            return null;
        }

        const circleStyle = StyleSheet.flatten([
            baseStyle,
            {
                width: shape.radius * 2,
                height: shape.radius * 2,
                backgroundColor: shape.color,
                borderRadius: shape.radius,
                borderWidth: shape.isSelected ? 3 : shape.strokeWidth,
                borderColor: shape.isSelected ? '#3B82F6' : shape.strokeColor,
                transform,
            },
        ]);

        return (
            <TouchableOpacity
                style={circleStyle}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.8}
            />
        );
    },
);

Circle.displayName = 'Circle';

