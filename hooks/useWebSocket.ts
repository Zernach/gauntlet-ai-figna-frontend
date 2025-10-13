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
        if (!currentUser || !canvasId) return;

        // Initialize WebSocket service if not already done
        initWebSocketService(WEBSOCKET_CONFIG);

        // Dispatch connect action
        dispatch({
            type: 'websocket/connect',
            payload: { userId: currentUser.id, canvasId },
        });
    }, [dispatch, currentUser, canvasId]);

    const disconnect = useCallback(() => {
        dispatch({ type: 'websocket/disconnect' });
    }, [dispatch]);

    useEffect(() => {
        if (currentUser && canvasId) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [currentUser, canvasId, connect, disconnect]);

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

