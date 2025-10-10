'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export function AuthButton() {
  const { data: session, status } = useSession();

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
        <button type='button' className='cta' onClick={() => signOut()}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button type='button' className='cta' onClick={() => signIn('google')}>
      Continue with Google
    </button>
  );
}
