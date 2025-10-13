import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas } from '@/components/Canvas';
import { CursorsLayer } from '@/components/Cursors';
import { PresencePanel } from '@/components/Presence';
import { Toolbar } from '@/components/Toolbar';
import { useWebSocket } from '@/hooks/useWebSocket';
import { COLORS } from '@/constants/colors';

export interface CanvasScreenProps {
    canvasId: string;
}

export const CanvasScreen: React.FC<CanvasScreenProps> = ({ canvasId }) => {
    // Initialize WebSocket connection
    useWebSocket(canvasId);

    return (
        <View style={styles.container}>
            <View style={styles.mainContent}>
                <View style={styles.canvasContainer}>
                    <Canvas canvasId={canvasId} />
                    <CursorsLayer />
                </View>
                <View style={styles.sidebar}>
                    <PresencePanel />
                    <Toolbar canvasId={canvasId} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundSecondary,
    },
    mainContent: {
        flex: 1,
        flexDirection: 'row',
    },
    canvasContainer: {
        flex: 1,
        position: 'relative',
    },
    sidebar: {
        width: 320,
        backgroundColor: COLORS.backgroundSecondary,
        padding: 16,
        gap: 16,
        borderLeftWidth: 1,
        borderLeftColor: COLORS.border,
    },
});

