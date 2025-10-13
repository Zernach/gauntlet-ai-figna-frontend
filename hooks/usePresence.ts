import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
    updateCursor,
    setUserEditing,
    setUserSelectedShape,
} from '@/lib/redux/slices/presenceSlice';
import type { UserCursor } from '@/types/user';

export const usePresence = () => {
    const dispatch = useAppDispatch();
    const presence = useAppSelector((state) => state.presence);
    const currentUser = useAppSelector((state) => state.user?.currentUser);

    const cursors = useMemo(() => Object.values(presence.cursors), [presence.cursors]);
    const onlineUsers = useMemo(
        () => presence.onlineUserIds.map((id: string) => presence.users[id]).filter(Boolean),
        [presence.onlineUserIds, presence.users],
    );

    const updateOwnCursor = useCallback(
        (x: number, y: number) => {
            if (!currentUser) return;

            const cursor: UserCursor = {
                userId: currentUser.id,
                x,
                y,
                color: currentUser.color,
                userName: currentUser.name,
                timestamp: Date.now(),
            };

            dispatch(updateCursor(cursor));
        },
        [dispatch, currentUser],
    );

    const setEditing = useCallback(
        (isEditing: boolean) => {
            if (!currentUser) return;
            dispatch(setUserEditing({ userId: currentUser.id, isEditing }));
        },
        [dispatch, currentUser],
    );

    const setSelectedShape = useCallback(
        (shapeId: string | null) => {
            if (!currentUser) return;
            dispatch(setUserSelectedShape({ userId: currentUser.id, shapeId }));
        },
        [dispatch, currentUser],
    );

    return {
        cursors,
        onlineUsers,
        onlineUserCount: presence.onlineUserIds.length,
        updateOwnCursor,
        setEditing,
        setSelectedShape,
    };
};

