import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { CustomText } from '@/components/base/CustomText';
import type { UserCursor as UserCursorType } from '@/types/user';

export interface UserCursorProps {
    cursor: UserCursorType;
    scale: number;
    offsetX: number;
    offsetY: number;
}

export const UserCursor: React.FC<UserCursorProps> = React.memo(
    ({ cursor, scale, offsetX, offsetY }) => {
        const x = useSharedValue(cursor.x * scale + offsetX);
        const y = useSharedValue(cursor.y * scale + offsetY);

        React.useEffect(() => {
            x.value = withSpring(cursor.x * scale + offsetX, {
                damping: 20,
                stiffness: 200,
            });
            y.value = withSpring(cursor.y * scale + offsetY, {
                damping: 20,
                stiffness: 200,
            });
        }, [cursor.x, cursor.y, scale, offsetX, offsetY, x, y]);

        const animatedStyle = useAnimatedStyle(() => {
            return {
                transform: [{ translateX: x.value }, { translateY: y.value }],
            };
        });

        return (
            <Animated.View style={[styles.cursorContainer, animatedStyle]}>
                <View style={[styles.cursor, { backgroundColor: cursor.color }]} />
                <View style={[styles.nameTag, { backgroundColor: cursor.color }]}>
                    <CustomText style={styles.nameText}>{cursor.userName}</CustomText>
                </View>
            </Animated.View>
        );
    },
);

UserCursor.displayName = 'UserCursor';

const styles = StyleSheet.create({
    cursorContainer: {
        position: 'absolute',
        pointerEvents: 'none',
    },
    cursor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    nameTag: {
        marginTop: 4,
        marginLeft: 2,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    nameText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
});

