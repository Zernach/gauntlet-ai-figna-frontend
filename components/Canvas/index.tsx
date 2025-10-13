import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CanvasRenderer } from './CanvasRenderer';
import { useResponsive } from '@/hooks/useResponsive';

export interface CanvasProps {
    canvasId: string;
}

export const Canvas: React.FC<CanvasProps> = ({ canvasId }) => {
    const { width, height } = useResponsive();

    return (
        <View style={styles.container}>
            <CanvasRenderer width={width} height={height} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
});

