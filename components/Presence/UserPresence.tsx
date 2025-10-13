import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CustomText } from '@/components/base/CustomText';
import type { UserPresence as UserPresenceType } from '@/types/user';
import { COLORS } from '@/constants/colors';

export interface UserPresenceProps {
    user: UserPresenceType;
    userName: string;
    userColor: string;
}

export const UserPresenceComponent: React.FC<UserPresenceProps> = React.memo(
    ({ user, userName, userColor }) => {
        return (
            <View style={styles.container}>
                <View style={[styles.indicator, { backgroundColor: userColor }]} />
                <CustomText style={styles.name}>{userName}</CustomText>
                {user.isEditing && (
                    <View style={styles.editingBadge}>
                        <CustomText style={styles.editingText}>Editing</CustomText>
                    </View>
                )}
            </View>
        );
    },
);

UserPresenceComponent.displayName = 'UserPresenceComponent';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: COLORS.backgroundSecondary,
        borderRadius: 8,
        marginBottom: 8,
    },
    indicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    name: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textPrimary,
        flex: 1,
    },
    editingBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    editingText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

