import { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import {
    addShape,
    updateShape,
    deleteShape,
    batchUpdateShapes,
    syncCanvas,
} from '../slices/canvasSlice';
import {
    updateCursor,
    userJoined,
    userLeft,
    updateUserPresence,
    syncPresence,
} from '../slices/presenceSlice';
import {
    setConnectionStatus,
    updatePing,
    incrementReconnectAttempts,
    setError,
} from '../slices/websocketSlice';
import { getWebSocketService } from '@/services/WebSocketService';
import type { WSMessage } from '@/types/websocket';

export const websocketMiddleware: Middleware<
    object,
    RootState
> = (store) => {
    let unsubscribeMessage: (() => void) | null = null;
    let unsubscribeStatus: (() => void) | null = null;

    const handleMessage = (message: WSMessage): void => {
        // Validate message structure
        if (!message || typeof message !== 'object') {
            console.error('Invalid WebSocket message received:', message);
            return;
        }

        const state = store.getState();
        const currentUserId = state.user?.currentUser?.id;

        // Ignore messages from self
        if (message.userId === currentUserId) {
            return;
        }

        switch (message.type) {
            case 'SHAPE_CREATE':
                if (message.payload?.shape) {
                    store.dispatch(addShape(message.payload.shape));
                }
                break;

            case 'SHAPE_UPDATE':
                if (message.payload?.shapeId && message.payload?.updates) {
                    store.dispatch(
                        updateShape({
                            id: message.payload.shapeId,
                            updates: message.payload.updates,
                        }),
                    );
                }
                break;

            case 'SHAPE_DELETE':
                if (message.payload?.shapeId) {
                    store.dispatch(deleteShape(message.payload.shapeId));
                }
                break;

            case 'SHAPES_BATCH_UPDATE':
                if (message.payload?.operations) {
                    store.dispatch(batchUpdateShapes(message.payload.operations));
                }
                break;

            case 'CURSOR_MOVE':
                if (message.payload) {
                    store.dispatch(updateCursor(message.payload));
                }
                break;

            case 'USER_JOIN':
                if (message.payload?.userId && message.payload?.userName && message.canvasId) {
                    store.dispatch(
                        userJoined({
                            userId: message.payload.userId,
                            userName: message.payload.userName,
                            canvasId: message.canvasId,
                        }),
                    );
                }
                break;

            case 'USER_LEAVE':
                if (message.payload?.userId) {
                    store.dispatch(userLeft(message.payload.userId));
                }
                break;

            case 'PRESENCE_UPDATE':
                if (message.payload) {
                    store.dispatch(updateUserPresence(message.payload));
                }
                break;

            case 'CANVAS_SYNC':
                if (message.payload?.shapes && message.payload?.users) {
                    store.dispatch(syncCanvas({ shapes: message.payload.shapes }));
                    store.dispatch(
                        syncPresence({
                            users: message.payload.users,
                        }),
                    );
                }
                break;

            case 'PONG':
                if (message.timestamp) {
                    const latency = Date.now() - message.timestamp;
                    store.dispatch(updatePing({ latency }));
                }
                break;

            case 'ERROR':
                console.error('WebSocket error:', message.payload);
                const errorMessage = message.payload?.message || 'Unknown WebSocket error';
                store.dispatch(setError(errorMessage));
                break;

            default:
                console.warn('Unknown message type:', message);
        }
    };

    return (next) => (action) => {
        // Handle WebSocket connection actions
        if (action.type === 'websocket/connect') {
            const wsService = getWebSocketService();
            const { userId, canvasId } = action.payload;
            const state = store.getState();
            const authToken = state.user?.authTokens?.token;

            console.log('🔌 WebSocket connect - userId:', userId, 'canvasId:', canvasId, 'hasToken:', !!authToken);

            // Clean up previous subscriptions
            if (unsubscribeMessage) unsubscribeMessage();
            if (unsubscribeStatus) unsubscribeStatus();

            // Subscribe to messages
            unsubscribeMessage = wsService.onMessage(handleMessage);

            // Subscribe to status changes
            unsubscribeStatus = wsService.onStatusChange((status) => {
                store.dispatch(setConnectionStatus(status));
                if (status === 'reconnecting') {
                    store.dispatch(incrementReconnectAttempts());
                }
            });

            // Connect with authentication token
            wsService.connect(userId, canvasId, authToken);
        }

        if (action.type === 'websocket/disconnect') {
            const wsService = getWebSocketService();
            wsService.disconnect();

            // Clean up subscriptions
            if (unsubscribeMessage) {
                unsubscribeMessage();
                unsubscribeMessage = null;
            }
            if (unsubscribeStatus) {
                unsubscribeStatus();
                unsubscribeStatus = null;
            }
        }

        // Broadcast shape operations to WebSocket
        if (
            action.type === addShape.type ||
            action.type === updateShape.type ||
            action.type === deleteShape.type
        ) {
            try {
                const wsService = getWebSocketService();

                if (action.type === addShape.type) {
                    wsService.send({
                        type: 'SHAPE_CREATE',
                        payload: { shape: action.payload },
                    });
                } else if (action.type === updateShape.type) {
                    wsService.send({
                        type: 'SHAPE_UPDATE',
                        payload: {
                            shapeId: action.payload.id,
                            updates: action.payload.updates,
                        },
                    });
                } else if (action.type === deleteShape.type) {
                    wsService.send({
                        type: 'SHAPE_DELETE',
                        payload: { shapeId: action.payload },
                    });
                }
            } catch (error) {
                console.error('Error sending WebSocket message:', error);
            }
        }

        return next(action);
    };
};

