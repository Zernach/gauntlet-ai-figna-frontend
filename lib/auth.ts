import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  const hint =
    'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment. You can copy .env.example to .env.local.';
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing Google OAuth credentials. ${hint}`);
  } else {
    console.warn(`⚠️  ${hint}`);
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId ?? '',
      clientSecret: googleClientSecret ?? ''
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    }
  }
};
