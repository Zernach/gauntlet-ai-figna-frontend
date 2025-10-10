# Gauntlet Google OAuth Starter

This is a minimal [Next.js](https://nextjs.org/) + [NextAuth.js](https://next-auth.js.org/) project that presents a single-page experience with a Google sign-in button. The project is ready to accept your own Google OAuth Client ID and Secret.

## Prerequisites

- Node.js 18.17+ or 20.x (aligns with the current Next.js LTS support)
- npm 9+
- A Google Cloud project with OAuth consent configured

## 1. Configure Google OAuth

1. Visit the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create or select a project, then configure the OAuth consent screen if you have not already.
3. Create new **OAuth 2.0 Client Credentials** of type **Web application**.
4. Add the following Authorized redirect URI for local development:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
5. Note the generated **Client ID** and **Client Secret**.

## 2. Provide Environment Variables

Copy `.env.example` to `.env.local` (Next.js loads this automatically) and paste the values you just created:

```sh
cp .env.example .env.local
# edit .env.local and fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET
```

Generate a strong `NEXTAUTH_SECRET` (for example: `openssl rand -base64 32`).

## 3. Install and Run

```sh
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and click **Continue with Google** to complete the OAuth flow.

## Project structure

- `app/` – App Router pages and global styles, including the hero page with the OAuth button.
- `app/api/auth/[...nextauth]/route.ts` – NextAuth.js route handler wired with Google provider credentials.
- `components/AuthButton.tsx` – Client-side sign-in / sign-out button that reflects the active session.
- `lib/auth.ts` – Central place for NextAuth configuration.
- `.env.example` – Template for the required environment variables.

## Next steps

From here you can:

- Protect routes with [`auth()`](https://next-auth.js.org/configuration/nextjs#middleware) or server actions.
- Capture user details in your own database during the `session` or `jwt` callbacks.
- Extend the UI under `app/page.tsx` to match your product branding.

