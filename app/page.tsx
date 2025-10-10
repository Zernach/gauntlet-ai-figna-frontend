import Image from 'next/image';
import { AuthButton } from '@/components/AuthButton';

export default function HomePage() {
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
      </div>
    </main>
  );
}
