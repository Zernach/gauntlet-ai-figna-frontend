'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { AuthButton } from '@/components/AuthButton';
import { CustomText } from '@/components/base';
import { useAppSelector } from '@/lib/redux/hooks';
import { REDUX_SLICES } from '@/types/types';

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
    <main className='hero'>
      <div className='card'>
        <Image
          src='/gauntlet-ai.webp'
          alt='Next.js'
          width={120}
          height={120}
          priority
          style={{ alignSelf: 'center' }}
        />
        <h1>Gauntlet AI</h1>
        <p>Project Starter by Archlife Industries</p>
        <AuthButton />
        <div className='user-json'>
          <CustomText variant='caption'>{currentUserJson}</CustomText>
        </div>
      </div>
    </main>
  );
}
