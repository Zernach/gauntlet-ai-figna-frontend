// User Type Definitions

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    color: string;
    isOnline: boolean;
    lastSeen: number;
    createdAt: number;
}

export interface AuthTokens {
    token: string;
    refreshToken: string;
    expiresAt: string;
}

export interface UserState {
    currentUser: User | null;
    authTokens: AuthTokens | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface UserCursor {
    userId: string;
    x: number;
    y: number;
    color: string;
    userName: string;
    timestamp: number;
}

export interface UserPresence {
    userId: string;
    isOnline: boolean;
    lastSeen: number;
    currentCanvasId: string | null;
    isEditing: boolean;
    selectedShapeId: string | null;
}

