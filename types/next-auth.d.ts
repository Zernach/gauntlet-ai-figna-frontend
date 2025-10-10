import { GauntletUserType } from '@/@landscapesupply/types/gauntletai';
import type { DefaultSession } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
    user?: DefaultSession['user'] & {
      googleUuid?: GauntletUserType['googleUuid'];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    googleUuid?: GauntletUserType['googleUuid'];
  }
}
