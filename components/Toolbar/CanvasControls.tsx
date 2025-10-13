import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { CustomButton } from '@/components/base/CustomButton';
import { CustomText } from '@/components/base/CustomText';
import { useCanvas } from '@/hooks/useCanvas';
import { useWebSocket } from '@/hooks/useWebSocket';
import { COLORS } from '@/constants/colors';

export interface CanvasControlsProps {
    canvasId: string;
}

export const CanvasControls: React.FC<CanvasControlsProps> = React.memo(
    ({ canvasId }) => {
        const { clearSelection, updateViewport } = useCanvas();
        const { status, latency, isConnected } = useWebSocket(canvasId);

        const handleClearSelection = useCallback(() => {
            clearSelection();
        }, [clearSelection]);

        const handleResetViewport = useCallback(() => {
            updateViewport(0, 0, 1);
        }, [updateViewport]);

        const getStatusColor = () => {
            switch (status) {
                case 'connected':
                    return COLORS.success;
                case 'connecting':
                case 'reconnecting':
                    return COLORS.warning;
                case 'error':
                case 'disconnected':
                    return COLORS.error;
                default:
                    return COLORS.textSecondary;
            }
        };

        return (
            <View style={styles.container}>
                <View style={styles.statusContainer}>
                    <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
                    <CustomText style={styles.statusText}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </CustomText>
                    {isConnected && (
                        <CustomText style={styles.latencyText}>
                            {latency}ms
                        </CustomText>
                    )}
                </View>

                <View style={styles.buttonsContainer}>
                    <CustomButton
                        title="Reset View"
                        onPress={handleResetViewport}
                        style={styles.button}
                    />
                    <CustomButton
                        title="Clear Selection"
                        onPress={handleClearSelection}
                        style={styles.button}
                    />
                </View>
            </View>
        );
    },
);

CanvasControls.displayName = 'CanvasControls';

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 12,
        gap: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        flex: 1,
    },
    latencyText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    buttonsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    button: {
        flex: 1,
    },
});

