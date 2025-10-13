import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserCursor, UserPresence } from '@/types/user';

export interface PresenceState {
    cursors: Record<string, UserCursor>;
    users: Record<string, UserPresence>;
    onlineUserIds: string[];
}

const initialState: PresenceState = {
    cursors: {},
    users: {},
    onlineUserIds: [],
};

const presenceSlice = createSlice({
    name: 'presence',
    initialState,
    reducers: {
        // Cursor operations
        updateCursor: (state, action: PayloadAction<UserCursor>) => {
            state.cursors[action.payload.userId] = action.payload;
        },
        removeCursor: (state, action: PayloadAction<string>) => {
            delete state.cursors[action.payload];
        },
        clearCursors: (state) => {
            state.cursors = {};
        },

        // User presence operations
        userJoined: (
            state,
            action: PayloadAction<{
                userId: string;
                userName: string;
                canvasId: string;
            }>,
        ) => {
            const { userId, userName, canvasId } = action.payload;
            state.users[userId] = {
                userId,
                isOnline: true,
                lastSeen: Date.now(),
                currentCanvasId: canvasId,
                isEditing: false,
                selectedShapeId: null,
            };
            if (!state.onlineUserIds.includes(userId)) {
                state.onlineUserIds.push(userId);
            }
        },
        userLeft: (state, action: PayloadAction<string>) => {
            const userId = action.payload;
            const user = state.users[userId];
            if (user) {
                user.isOnline = false;
                user.lastSeen = Date.now();
            }
            state.onlineUserIds = state.onlineUserIds.filter((id) => id !== userId);
            delete state.cursors[userId];
        },
        updateUserPresence: (state, action: PayloadAction<UserPresence>) => {
            state.users[action.payload.userId] = action.payload;
        },
        setUserEditing: (
            state,
            action: PayloadAction<{ userId: string; isEditing: boolean }>,
        ) => {
            const user = state.users[action.payload.userId];
            if (user) {
                user.isEditing = action.payload.isEditing;
            }
        },
        setUserSelectedShape: (
            state,
            action: PayloadAction<{ userId: string; shapeId: string | null }>,
        ) => {
            const user = state.users[action.payload.userId];
            if (user) {
                user.selectedShapeId = action.payload.shapeId;
            }
        },

        // Batch operations
        syncPresence: (
            state,
            action: PayloadAction<{
                users: UserPresence[];
                cursors?: Record<string, UserCursor>;
            }>,
        ) => {
            state.users = {};
            state.onlineUserIds = [];
            action.payload.users.forEach((user) => {
                state.users[user.userId] = user;
                if (user.isOnline) {
                    state.onlineUserIds.push(user.userId);
                }
            });
            if (action.payload.cursors) {
                state.cursors = action.payload.cursors;
            }
        },

        // Reset
        resetPresence: () => initialState,
    },
});

export const {
    updateCursor,
    removeCursor,
    clearCursors,
    userJoined,
    userLeft,
    updateUserPresence,
    setUserEditing,
    setUserSelectedShape,
    syncPresence,
    resetPresence,
} = presenceSlice.actions;

export const presenceSliceReducer = presenceSlice.reducer;

