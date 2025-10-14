import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { supabase } from '@/lib/supabase/config';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { setUserAndTokens, clearUser } from '@/lib/redux/slices/userSlice';
import { persistor, resetReduxState } from '@/lib/redux/store';
import { CustomButton, CustomText, CustomTextInput } from '@/components/base';
import { COLORS } from '@/constants/colors';
import { REDUX_SLICES } from '@/types/types';
import type { User } from '@/types/user';

const styles = StyleSheet.create({
  authState: {
    gap: 12,
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
    gap: 16,
  },
  inputField: {
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
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
  googleButton: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.buttonGhostBorder,
  },
  googleButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '600' as const,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.buttonGhostBorder,
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  toggleText: {
    color: COLORS.accentPrimary,
    textDecorationLine: 'underline',
    fontSize: 14,
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
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Transform Supabase user to app User type
  const transformUser = useCallback((session: Session): User => {
    const user = session.user;
    return {
      id: user.id,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
      email: user.email || '',
      avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      color: user.user_metadata?.avatar_color || '#' + Math.floor(Math.random() * 16777215).toString(16),
      isOnline: true,
      lastSeen: Date.now(),
      createdAt: new Date(user.created_at).getTime(),
    };
  }, []);

  // Handle Supabase auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSupabaseUser(session.user);

        if (!currentUser) {
          // User has an active session, set up user state
          const user = transformUser(session);
          dispatch(setUserAndTokens({
            user,
            tokens: {
              token: session.access_token,
              refreshToken: session.refresh_token || '',
              expiresAt: new Date(session.expires_at! * 1000).toISOString(),
            },
          }));
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSupabaseUser(session?.user || null);

      if (event === 'SIGNED_IN' && session) {
        const user = transformUser(session);
        dispatch(setUserAndTokens({
          user,
          tokens: {
            token: session.access_token,
            refreshToken: session.refresh_token || '',
            expiresAt: new Date(session.expires_at! * 1000).toISOString(),
          },
        }));
      } else if (event === 'SIGNED_OUT') {
        dispatch(clearUser());
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Update tokens when they're refreshed
        const user = transformUser(session);
        dispatch(setUserAndTokens({
          user,
          tokens: {
            token: session.access_token,
            refreshToken: session.refresh_token || '',
            expiresAt: new Date(session.expires_at! * 1000).toISOString(),
          },
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch, currentUser, transformUser]);

  const handleEmailSignIn = useCallback(async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setIsAuthenticating(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      // Session will be handled by the onAuthStateChange listener
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Email sign in error:', error);
      Alert.alert(
        'Sign In Error',
        error?.message || 'Failed to sign in with email'
      );
    } finally {
      setIsAuthenticating(false);
    }
  }, [email, password]);

  const handleEmailSignUp = useCallback(async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setIsAuthenticating(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            avatar_color: '#' + Math.floor(Math.random() * 16777215).toString(16),
          },
        },
      });

      if (error) {
        throw error;
      }

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        Alert.alert(
          'Confirmation Required',
          'Please check your email to confirm your account'
        );
      }

      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Email sign up error:', error);
      Alert.alert(
        'Sign Up Error',
        error?.message || 'Failed to sign up with email'
      );
    } finally {
      setIsAuthenticating(false);
    }
  }, [email, password]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsAuthenticating(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Platform.OS === 'web' ? window.location.origin : undefined,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }

      // For web, the browser will redirect. For mobile, handle the session.
      if (Platform.OS !== 'web' && data.url) {
        // On mobile, you might want to open the URL in a browser
        console.log('Open this URL to sign in:', data.url);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setIsAuthenticating(false);

      Alert.alert(
        'Sign In Error',
        error?.message || 'Failed to sign in with Google'
      );
    } finally {
      // Don't reset authenticating state for web, as redirect will happen
      if (Platform.OS !== 'web') {
        setIsAuthenticating(false);
      }
    }
  }, []);

  const resetReduxStore = useCallback(() => {
    dispatch(resetReduxState());
    dispatch(clearUser());
    persistor.flush().catch((error) => {
      console.error('Failed to flush persisted state after reset', error);
    });
  }, [dispatch]);

  const handleSignOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      resetReduxStore();
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Sign Out Error', 'Failed to sign out');
    }
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
    <View style={styles.formContainer}>
      <CustomTextInput
        style={styles.inputField}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isAuthenticating}
      />
      <CustomTextInput
        style={styles.inputField}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        editable={!isAuthenticating}
      />
      <CustomButton
        label={isAuthenticating ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
        onPress={isSignUp ? handleEmailSignUp : handleEmailSignIn}
        style={[styles.ctaButton, styles.ctaButtonGradient]}
        textStyle={styles.ctaButtonText}
        disabled={isAuthenticating}
      />
      <CustomButton
        label={isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        onPress={() => setIsSignUp(!isSignUp)}
        style={styles.toggleText}
        textStyle={styles.toggleText}
        disabled={isAuthenticating}
      />
      
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <CustomText style={styles.dividerText}>OR</CustomText>
        <View style={styles.dividerLine} />
      </View>

      <CustomButton
        label={isAuthenticating ? 'Authenticating...' : 'Continue with Google'}
        onPress={handleGoogleSignIn}
        style={[styles.ctaButton, styles.googleButton]}
        textStyle={styles.googleButtonText}
        disabled={isAuthenticating}
      />
    </View>
  );
}
