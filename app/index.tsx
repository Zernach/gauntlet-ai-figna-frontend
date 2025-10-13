import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AuthButton } from '@/components/AuthButton';
import { CustomText, CustomImage } from '@/components/base';
import { useAppSelector } from '@/lib/redux/hooks';
import { REDUX_SLICES } from '@/types/types';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

const styles = StyleSheet.create({
    hero: {
        maxWidth: 420,
        width: '100%',
        alignItems: 'center',
    },
    card: {
        backgroundColor: COLORS.cardBackground,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        borderRadius: 16,
        padding: 40,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 1,
        shadowRadius: 40,
        gap: 24,
        width: '100%',
    },
    title: {
        fontSize: 30,
        fontWeight: TYPOGRAPHY.weight.semiBold,
        color: COLORS.foreground,
        textAlign: 'center',
    },
    subtitle: {
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    userJson: {
        marginTop: 8,
    },
});

export default function HomePage() {
    const currentUser = useAppSelector(
        (state) => state[REDUX_SLICES.FIRST_SLICE].user,
    );

    const currentUserJson = useMemo(() => {
        if (!currentUser) {
            return null;
        }
        return JSON.stringify(currentUser, null, 2);
    }, [currentUser]);

    return (
        <View style={styles.hero}>
            <View style={styles.card}>
                <CustomImage
                    imageProps={{
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
                        source: require('../public/gauntlet-ai.webp'),
                        accessibilityLabel: 'Gauntlet AI Logo',
                        style: { width: 120, height: 120, alignSelf: 'center' },
                        resizeMode: 'contain',
                    }}
                />
                <CustomText style={styles.title}>Gauntlet AI</CustomText>
                <CustomText style={styles.subtitle}>
                    Project Starter by Archlife Industries
                </CustomText>
                <CustomText style={styles.subtitle}>
                    Powered by React Native
                </CustomText>
                <AuthButton />
                <View style={styles.userJson}>
                    <CustomText variant='caption'>{currentUserJson}</CustomText>
                </View>
            </View>
        </View>
    );
}
