import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
// TODO: Replace with expo-auth-session for OAuth
// import * as AuthSession from 'expo-auth-session';
// import * as WebBrowser from 'expo-web-browser';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { setUser, clearUser } from '@/lib/redux/slices/userSlice';
import { generateRandomUuid } from '@/scripts/generateRandomUuid';
import { persistor, resetReduxState } from '@/lib/redux/store';
import { CustomButton, CustomText } from '@/components/base';
import { COLORS } from '@/constants/colors';
import { REDUX_SLICES } from '@/types/types';
import type { User } from '@/types/user';

// WebBrowser.maybeCompleteAuthSession();

const styles = StyleSheet.create({
  authState: {
    gap: 12,
    alignItems: 'center',
  },
  ctaButton: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  ctaButtonGradient: {
    backgroundColor: COLORS.accentPrimary,
  },
  ctaButtonText: {
    color: COLORS.background,
    fontWeight: '600' as const,
  },
  signedInText: {
    color: COLORS.foreground,
  },
});

export function AuthButton() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(
    (state) => state[REDUX_SLICES.USER]?.currentUser,
  );

  const resetReduxStore = useCallback(() => {
    dispatch(resetReduxState());
    dispatch(clearUser());
    persistor.flush().catch((error) => {
      console.error('Failed to flush persisted state after reset', error);
    });
  }, [dispatch]);

  const handleSignIn = useCallback(() => {
    // TODO: Implement Google OAuth with expo-auth-session
    // For now, create a demo user
    const userId = generateRandomUuid();
    const email = 'demo@example.com';
    const name = 'Demo User';

    const userData: User = {
      id: userId,
      name,
      email,
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      isOnline: true,
      lastSeen: Date.now(),
      createdAt: Date.now(),
    };
    dispatch(setUser(userData));
  }, [dispatch]);

  const handleSignOut = useCallback(() => {
    resetReduxStore();
  }, [resetReduxStore]);

  if (currentUser) {
    return (
      <View style={styles.authState}>
        <CustomText style={styles.signedInText}>
          Signed in as {currentUser.name}
        </CustomText>
        <CustomButton
          label='Sign out'
          onPress={handleSignOut}
          style={[styles.ctaButton, styles.ctaButtonGradient]}
          textStyle={styles.ctaButtonText}
        />
      </View>
    );
  }

  return (
    <CustomButton
      label='Continue with Google (Demo)'
      onPress={handleSignIn}
      style={[styles.ctaButton, styles.ctaButtonGradient]}
      textStyle={styles.ctaButtonText}
    />
  );
}
