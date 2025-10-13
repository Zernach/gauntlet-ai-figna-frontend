import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { usePresence } from '@/hooks/usePresence';
import { useCanvas } from '@/hooks/useCanvas';
import { UserCursor } from './UserCursor';
import { throttle } from '@/utils/canvas/performance';

export const CursorsLayer: React.FC = React.memo(() => {
    const { cursors, updateOwnCursor } = usePresence();
    const { viewport } = useCanvas();

    const throttledUpdateCursor = useCallback(
        throttle((x: number, y: number) => {
            updateOwnCursor(x, y);
        }, 50),
        [updateOwnCursor],
    );

    return (
        <View style={styles.container} pointerEvents="none">
            {cursors.map((cursor) => (
                <UserCursor
                    key={cursor.userId}
                    cursor={cursor}
                    scale={viewport.scale}
                    offsetX={viewport.offsetX}
                    offsetY={viewport.offsetY}
                />
            ))}
        </View>
    );
});

CursorsLayer.displayName = 'CursorsLayer';

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
});

