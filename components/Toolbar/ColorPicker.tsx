import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { CustomText } from '@/components/base/CustomText';
import { useCanvas } from '@/hooks/useCanvas';
import { COLORS } from '@/constants/colors';

const PRESET_COLORS = [
    '#EF4444', // Red
    '#F59E0B', // Orange
    '#10B981', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#000000', // Black
    '#6B7280', // Gray
    '#FFFFFF', // White
];

export const ColorPicker: React.FC = React.memo(() => {
    const { currentColor, setColor } = useCanvas();

    const handleColorSelect = useCallback(
        (color: string) => {
            setColor(color);
        },
        [setColor],
    );

    return (
        <View style={styles.container}>
            <CustomText style={styles.title}>Color</CustomText>
            <View style={styles.colorGrid}>
                {PRESET_COLORS.map((color) => {
                    const isActive = currentColor === color;
                    return (
                        <TouchableOpacity
                            key={color}
                            style={[
                                styles.colorButton,
                                { backgroundColor: color },
                                isActive && styles.colorButtonActive,
                                color === '#FFFFFF' && styles.colorButtonWhite,
                            ]}
                            onPress={() => handleColorSelect(color)}
                            activeOpacity={0.7}
                        />
                    );
                })}
            </View>
        </View>
    );
});

ColorPicker.displayName = 'ColorPicker';

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    colorButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorButtonActive: {
        borderColor: COLORS.primary,
        borderWidth: 3,
    },
    colorButtonWhite: {
        borderColor: COLORS.border,
    },
});

