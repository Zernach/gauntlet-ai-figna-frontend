import React, { useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { CustomText } from '@/components/base/CustomText';
import type { TextShape } from '@/types/canvas';
import { useShapeStyle, useShapeTransform } from '../BaseShape';

export interface TextShapeProps {
    shape: TextShape;
    isVisible: boolean;
    onPress?: () => void;
    onLongPress?: () => void;
    onTextChange?: (text: string) => void;
}

export const TextShapeComponent: React.FC<TextShapeProps> = React.memo(
    ({ shape, isVisible, onPress, onLongPress, onTextChange }) => {
        const [isEditing, setIsEditing] = useState(false);
        const baseStyle = useShapeStyle(shape);
        const transform = useShapeTransform(shape);

        if (!isVisible) {
            return null;
        }

        const textStyle = StyleSheet.flatten([
            baseStyle,
            {
                color: shape.color,
                fontSize: shape.fontSize,
                fontWeight: shape.fontWeight,
                textAlign: shape.textAlign,
                borderWidth: shape.isSelected ? 2 : 0,
                borderColor: '#3B82F6',
                padding: 8,
                transform,
            },
        ]);

        const handleDoubleTap = useCallback(() => {
            setIsEditing(true);
        }, []);

        const handleBlur = useCallback(() => {
            setIsEditing(false);
        }, []);

        const handleChangeText = useCallback(
            (text: string) => {
                if (onTextChange) {
                    onTextChange(text);
                }
            },
            [onTextChange],
        );

        if (isEditing) {
            return (
                <TextInput
                    style={textStyle}
                    value={shape.text}
                    onChangeText={handleChangeText}
                    onBlur={handleBlur}
                    autoFocus
                    multiline
                />
            );
        }

        return (
            <TouchableOpacity
                style={textStyle}
                onPress={onPress}
                onLongPress={onLongPress}
                onDoublePress={handleDoubleTap}
                activeOpacity={0.8}
            >
                <CustomText
                    style={{
                        fontSize: shape.fontSize,
                        fontWeight: shape.fontWeight,
                        textAlign: shape.textAlign,
                        color: shape.color,
                    }}
                >
                    {shape.text}
                </CustomText>
            </TouchableOpacity>
        );
    },
);

TextShapeComponent.displayName = 'TextShapeComponent';

