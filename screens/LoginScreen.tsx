import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CustomText } from '@/components/base/CustomText';
import { CustomImage } from '@/components/base/CustomImage';
import { AuthButton } from '@/components/AuthButton';
import { COLORS } from '@/constants/colors';

export interface LoginScreenProps {
    onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = () => {
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <CustomImage
                    imageProps={{
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
                        source: require('../public/gauntlet-ai.webp'),
                        accessibilityLabel: 'CollabCanvas Logo',
                        style: { width: 120, height: 120, alignSelf: 'center' },
                        resizeMode: 'contain',
                    }}
                />
                <CustomText style={styles.title}>Welcome to CollabCanvas</CustomText>
                <CustomText style={styles.subtitle}>
                    Real-time collaborative design canvas with AI integration
                </CustomText>

                <View style={styles.authContainer}>
                    <AuthButton />
                </View>

                <View style={styles.features}>
                    <CustomText style={styles.featureText}>
                        ✨ Real-time collaboration
                    </CustomText>
                    <CustomText style={styles.featureText}>
                        🎨 Draw shapes and add text
                    </CustomText>
                    <CustomText style={styles.featureText}>
                        👥 See other users in real-time
                    </CustomText>
                    <CustomText style={styles.featureText}>
                        💾 Auto-save and offline support
                    </CustomText>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundSecondary,
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 450,
        backgroundColor: COLORS.cardBackground,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        borderRadius: 16,
        padding: 40,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 1,
        shadowRadius: 40,
        elevation: 5,
        gap: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.foreground,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    authContainer: {
        marginTop: 8,
        alignItems: 'center',
    },
    features: {
        marginTop: 16,
        gap: 12,
    },
    featureText: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
});

