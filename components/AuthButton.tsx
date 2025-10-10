'use client';
import { useCallback, useEffect, useRef } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { createUserThunk, readUserThunk } from '@/lib/redux/thunks';
import { generateRandomUuid } from '@/scripts/generateRandomUuid';
import { persistor, resetReduxState } from '@/lib/redux/store';

export function AuthButton() {
  const dispatch = useAppDispatch();
  const { data: session, status } = useSession();
  const processedEmailRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);
  const email = session?.user?.email ?? null;
  const googleUuid = session?.user?.googleUuid ?? null;
  const name = session?.user?.name ?? undefined;

  useEffect(() => {
    if (status !== 'authenticated' || !email) {
      processedEmailRef.current = null;
      isProcessingRef.current = false;
      return;
    }
    if (processedEmailRef.current === email || isProcessingRef.current) {
      return;
    }
    isProcessingRef.current = true;
    const ensureUserExists = async () => {
      try {
        const readResponse = await dispatch(readUserThunk({ email })).unwrap();
        if (!readResponse.user) {
          await dispatch(
            createUserThunk({
              user: {
                userId: generateRandomUuid(),
                email,
                googleUuid: googleUuid ?? undefined,
                name,
              },
            }),
          ).unwrap();
        }
        processedEmailRef.current = email;
      } catch (error) {
        console.error('Failed to synchronize Google user', error);
        processedEmailRef.current = null;
      } finally {
        isProcessingRef.current = false;
      }
    };
    void ensureUserExists();
  }, [dispatch, email, googleUuid, name, status]);

  const resetReduxStore = useCallback(() => {
    dispatch(resetReduxState());
    persistor.flush().catch((error) => {
      console.error('Failed to flush persisted state after reset', error);
    });
  }, [dispatch]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      resetReduxStore();
    }
  }, [resetReduxStore, status]);

  const handleSignOut = useCallback(() => {
    resetReduxStore();
    void signOut();
  }, [resetReduxStore]);

  if (status === 'loading') {
    return (
      <button type='button' className='cta' disabled>
        Checking session…
      </button>
    );
  }

  if (session) {
    return (
      <div className='auth-state'>
        <p>Signed in as {'Google user'}</p>
        <button type='button' className='cta' onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type='button'
      className='cta'
      onClick={() => {
        void signIn('google');
      }}
    >
      Continue with Google
    </button>
  );
}
