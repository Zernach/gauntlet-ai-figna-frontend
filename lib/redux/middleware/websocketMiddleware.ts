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
        const state = store.getState();
        const currentUserId = state.user?.currentUser?.id;

        // Ignore messages from self
        if (message.userId === currentUserId) {
            return;
        }

        switch (message.type) {
            case 'SHAPE_CREATE':
                store.dispatch(addShape(message.data.shape));
                break;

            case 'SHAPE_UPDATE':
                store.dispatch(
                    updateShape({
                        id: message.data.shapeId,
                        updates: message.data.updates,
                    }),
                );
                break;

            case 'SHAPE_DELETE':
                store.dispatch(deleteShape(message.data.shapeId));
                break;

            case 'SHAPES_BATCH_UPDATE':
                store.dispatch(batchUpdateShapes(message.data.operations));
                break;

            case 'CURSOR_MOVE':
                store.dispatch(updateCursor(message.data));
                break;

            case 'USER_JOIN':
                store.dispatch(
                    userJoined({
                        userId: message.data.userId,
                        userName: message.data.userName,
                        canvasId: message.canvasId,
                    }),
                );
                break;

            case 'USER_LEAVE':
                store.dispatch(userLeft(message.data.userId));
                break;

            case 'PRESENCE_UPDATE':
                store.dispatch(updateUserPresence(message.data));
                break;

            case 'CANVAS_SYNC':
                store.dispatch(syncCanvas({ shapes: message.data.shapes }));
                store.dispatch(
                    syncPresence({
                        users: message.data.users,
                    }),
                );
                break;

            case 'PONG':
                const latency = Date.now() - message.timestamp;
                store.dispatch(updatePing({ latency }));
                break;

            case 'ERROR':
                console.error('WebSocket error:', message.data);
                store.dispatch(setError(message.data.message));
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

            // Connect
            wsService.connect(userId, canvasId);
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
                        data: { shape: action.payload },
                    });
                } else if (action.type === updateShape.type) {
                    wsService.send({
                        type: 'SHAPE_UPDATE',
                        data: {
                            shapeId: action.payload.id,
                            updates: action.payload.updates,
                        },
                    });
                } else if (action.type === deleteShape.type) {
                    wsService.send({
                        type: 'SHAPE_DELETE',
                        data: { shapeId: action.payload },
                    });
                }
            } catch (error) {
                console.error('Error sending WebSocket message:', error);
            }
        }

        return next(action);
    };
};

