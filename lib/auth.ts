import { CONFIG, ENVIRONMENT } from '@/constants/config';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

if (!CONFIG.GOOGLE_CLIENT_ID || !CONFIG.GOOGLE_CLIENT_SECRET) {
  const hint =
    'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment. You can copy .env.example to .env.local.';
  if (ENVIRONMENT === 'prod') {
    throw new Error(`Missing Google OAuth credentials. ${hint}`);
  } else {
    console.warn(`⚠️  ${hint}`);
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: CONFIG.GOOGLE_CLIENT_ID ?? '',
      clientSecret: CONFIG.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        if (account.provider === 'google' && account.providerAccountId) {
          token.googleId = account.providerAccountId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
        }
        if (typeof token.googleId === 'string') {
          session.user.googleUuid = token.googleId;
        }
      }
      return session;
    },
  },
};
