import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { CustomText } from '@/components/base/CustomText';
import { useCanvas } from '@/hooks/useCanvas';
import { COLORS } from '@/constants/colors';
import type { ShapeType } from '@/types/canvas';

const SHAPES: Array<{ type: ShapeType | 'select' | 'pan'; label: string; icon: string }> = [
    { type: 'select', label: 'Select', icon: '👆' },
    { type: 'pan', label: 'Pan', icon: '✋' },
    { type: 'rectangle', label: 'Rectangle', icon: '▭' },
    { type: 'circle', label: 'Circle', icon: '○' },
    { type: 'text', label: 'Text', icon: 'T' },
];

export const ShapeSelector: React.FC = React.memo(() => {
    const { currentTool, setTool } = useCanvas();

    const handleToolSelect = useCallback(
        (tool: ShapeType | 'select' | 'pan') => {
            setTool(tool);
        },
        [setTool],
    );

    return (
        <View style={styles.container}>
            {SHAPES.map((shape) => {
                const isActive = currentTool === shape.type;
                return (
                    <TouchableOpacity
                        key={shape.type}
                        style={[styles.button, isActive && styles.buttonActive]}
                        onPress={() => handleToolSelect(shape.type)}
                        activeOpacity={0.7}
                    >
                        <CustomText style={styles.icon}>{shape.icon}</CustomText>
                        <CustomText
                            style={[styles.label, isActive && styles.labelActive]}
                        >
                            {shape.label}
                        </CustomText>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
});

ShapeSelector.displayName = 'ShapeSelector';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        padding: 8,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    button: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: COLORS.backgroundSecondary,
    },
    buttonActive: {
        backgroundColor: COLORS.primary,
    },
    icon: {
        fontSize: 24,
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    labelActive: {
        color: '#FFFFFF',
    },
});

