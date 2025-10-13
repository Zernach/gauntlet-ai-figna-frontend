import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ConnectionStatus, WebSocketState } from '@/types/websocket';

const initialState: WebSocketState = {
    status: 'disconnected',
    canvasId: null,
    lastPingTime: 0,
    latency: 0,
    reconnectAttempts: 0,
    error: null,
};

const websocketSlice = createSlice({
    name: 'websocket',
    initialState,
    reducers: {
        setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
            state.status = action.payload;
            if (action.payload === 'connected') {
                state.reconnectAttempts = 0;
                state.error = null;
            }
        },
        setCanvasId: (state, action: PayloadAction<string | null>) => {
            state.canvasId = action.payload;
        },
        updatePing: (state, action: PayloadAction<{ latency: number }>) => {
            state.lastPingTime = Date.now();
            state.latency = action.payload.latency;
        },
        incrementReconnectAttempts: (state) => {
            state.reconnectAttempts += 1;
        },
        resetReconnectAttempts: (state) => {
            state.reconnectAttempts = 0;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            if (action.payload) {
                state.status = 'error';
            }
        },
        resetWebSocket: () => initialState,
    },
});

export const {
    setConnectionStatus,
    setCanvasId,
    updatePing,
    incrementReconnectAttempts,
    resetReconnectAttempts,
    setError,
    resetWebSocket,
} = websocketSlice.actions;

export const websocketSliceReducer = websocketSlice.reducer;

