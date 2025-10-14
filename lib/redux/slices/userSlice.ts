import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User, UserState, AuthTokens } from '@/types/user';

const initialState: UserState = {
    currentUser: null,
    authTokens: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User>) => {
            state.currentUser = action.payload;
            state.isAuthenticated = true;
            state.error = null;
        },
        setAuthTokens: (state, action: PayloadAction<AuthTokens>) => {
            state.authTokens = action.payload;
        },
        setUserAndTokens: (state, action: PayloadAction<{ user: User; tokens: AuthTokens }>) => {
            state.currentUser = action.payload.user;
            state.authTokens = action.payload.tokens;
            state.isAuthenticated = true;
            state.error = null;
        },
        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.currentUser) {
                Object.assign(state.currentUser, action.payload);
            }
        },
        clearUser: (state) => {
            state.currentUser = null;
            state.authTokens = null;
            state.isAuthenticated = false;
            state.error = null;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.isLoading = false;
        },
        resetUserState: () => initialState,
    },
});

export const {
    setUser,
    setAuthTokens,
    setUserAndTokens,
    updateUser,
    clearUser,
    setLoading,
    setError,
    resetUserState,
} = userSlice.actions;

export const userSliceReducer = userSlice.reducer;

