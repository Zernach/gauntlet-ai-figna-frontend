import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CustomText } from '@/components/base/CustomText';
import { usePresence } from '@/hooks/usePresence';
import { UserPresenceComponent } from './UserPresence';
import { COLORS } from '@/constants/colors';

export const PresencePanel: React.FC = React.memo(() => {
    const { onlineUsers, onlineUserCount } = usePresence();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <CustomText style={styles.title}>Online Users</CustomText>
                <View style={styles.countBadge}>
                    <CustomText style={styles.countText}>{onlineUserCount}</CustomText>
                </View>
            </View>
            <View style={styles.userList}>
                {onlineUsers.map((user) => (
                    <UserPresenceComponent
                        key={user.userId}
                        user={user}
                        userName={`User ${user.userId.slice(0, 8)}`}
                        userColor={COLORS.primary}
                    />
                ))}
            </View>
        </View>
    );
});

PresencePanel.displayName = 'PresencePanel';

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    countBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    countText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    userList: {
        gap: 8,
    },
});

