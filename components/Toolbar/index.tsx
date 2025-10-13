import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShapeSelector } from './ShapeSelector';
import { ColorPicker } from './ColorPicker';
import { CanvasControls } from './CanvasControls';
import { COLORS } from '@/constants/colors';

export interface ToolbarProps {
    canvasId: string;
}

export const Toolbar: React.FC<ToolbarProps> = React.memo(({ canvasId }) => {
    return (
        <View style={styles.container}>
            <ShapeSelector />
            <ColorPicker />
            <CanvasControls canvasId={canvasId} />
        </View>
    );
});

Toolbar.displayName = 'Toolbar';

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 16,
        backgroundColor: COLORS.backgroundSecondary,
    },
});

