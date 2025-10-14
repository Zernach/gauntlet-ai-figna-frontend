import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { initWebSocketService } from '@/services/WebSocketService';
import { WEBSOCKET_CONFIG } from '@/constants/websocket';
import type { ConnectionStatus } from '@/types/websocket';

export const useWebSocket = (canvasId: string | null) => {
    const dispatch = useAppDispatch();
    const websocketState = useAppSelector((state) => state.websocket);
    const currentUser = useAppSelector((state) => state.user?.currentUser);

    const connect = useCallback(() => {
        if (!canvasId) return;

        // Initialize WebSocket service if not already done
        initWebSocketService(WEBSOCKET_CONFIG);

        // Use demo user ID for development if no current user
        const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001';

        // Dispatch connect action
        dispatch({
            type: 'websocket/connect',
            payload: { userId, canvasId },
        });
    }, [dispatch, currentUser, canvasId]);

    const disconnect = useCallback(() => {
        dispatch({ type: 'websocket/disconnect' });
    }, [dispatch]);

    useEffect(() => {
        if (canvasId) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [canvasId, connect, disconnect]);

    return {
        status: websocketState.status,
        latency: websocketState.latency,
        error: websocketState.error,
        isConnected: websocketState.status === 'connected',
        isConnecting: websocketState.status === 'connecting',
        isReconnecting: websocketState.status === 'reconnecting',
        connect,
        disconnect,
    };
};

