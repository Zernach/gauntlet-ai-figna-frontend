import Image from 'next/image';
import { AuthButton } from '@/components/AuthButton';

export default function HomePage() {
  return (
    <main className="hero">
      <div className="card">
        <Image
          src="/next.svg"
          alt="Next.js"
          width={120}
          height={75}
          priority
        />
        <h1>Google OAuth Starter</h1>
        <p>
          Plug in your Google OAuth Client ID and Secret, then use the sign-in button below
          to validate the flow.
        </p>
        <AuthButton />
      </div>
      <footer>
        <small>
          Configure credentials in <code>.env.local</code>, then run <code>npm run dev</code> and
          click the button above.
        </small>
      </footer>
    </main>
  );
}
