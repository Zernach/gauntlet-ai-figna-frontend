# Supabase Authentication Quick Reference

## Quick Start

### Frontend - Sign In
```typescript
import { supabase } from '@/lib/supabase/config';

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin,
  },
});
```

### Frontend - Sign Out
```typescript
import { supabase } from '@/lib/supabase/config';

await supabase.auth.signOut();
```

### Frontend - Auth State Listener
```typescript
import { supabase } from '@/lib/supabase/config';

supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    const accessToken = session.access_token;
    // Use accessToken for API calls
  }
});
```

### Frontend - Get Current Session
```typescript
import { supabase } from '@/lib/supabase/config';

const { data: { session } } = await supabase.auth.getSession();
if (session) {
  const accessToken = session.access_token;
}
```

### Backend - Verify Token
```typescript
import { verifySupabaseToken } from './config/supabase';

const decodedToken = await verifySupabaseToken(accessToken);
const userId = decodedToken.userId;
const email = decodedToken.email;
```

## Configuration

### Supabase Config (Frontend)
```javascript
// app.config.js
extra: {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
}
```

### Supabase Config (Backend)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

## Common Tasks

### Get Current User (Frontend)
```typescript
import { supabase } from '@/lib/supabase/config';

const { data: { user } } = await supabase.auth.getUser();
if (user) {
  console.log('User ID:', user.id);
  console.log('Email:', user.email);
}
```

### Refresh Session (Frontend)
```typescript
const { data: { session }, error } = await supabase.auth.refreshSession();
if (session) {
  const newAccessToken = session.access_token;
}
```

### Initialize Supabase (Backend)
```typescript
import { initializeSupabase } from './config/supabase';

const supabase = initializeSupabase();
```

## File Structure

```
gauntlet-ai-frontend/
├── lib/
│   └── supabase/
│       └── config.ts              # Supabase client initialization
├── components/
│   └── AuthButton.tsx             # Authentication UI component
└── app.config.js                  # Supabase configuration

gauntlet-ai-backend/
├── src/
│   ├── config/
│   │   └── supabase.ts           # Supabase server config
│   ├── middleware/
│   │   └── auth.ts               # Authentication middleware
│   └── routes/
│       └── auth.routes.ts        # Authentication routes
```

## Authentication Flow

```
User → Supabase Auth (Google) → Get Access Token → Use for API calls
                                                           ↓
Backend → Verify Token → Access User Data → Return Response
                                ↓
Frontend ← Protected Data ← Authenticated API calls
```

## Environment Setup

### Development
```bash
# Frontend .env
ENVIRONMENT=dev
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Backend .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Production
```bash
# Frontend .env
ENVIRONMENT=prod
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Backend .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

## Troubleshooting

### "Missing Supabase configuration"
- Check that environment variables are set in `app.config.js`
- Verify `.env` file exists with correct values
- Restart the Expo development server

### "Invalid token"
- Token may be expired (tokens expire after 1 hour by default)
- Call `refreshSession()` to get a new token
- Verify Supabase project URL and keys match

### "Authentication failed"
- Check Supabase Dashboard → Authentication → Providers
- Ensure Google OAuth provider is enabled
- Verify authorized redirect URLs are configured
- Check that callback URL matches your app's domain

## Key Features

### Automatic Token Refresh
Supabase automatically refreshes tokens before they expire when using `onAuthStateChange`.

### Session Persistence
Sessions are automatically persisted using AsyncStorage on mobile and localStorage on web.

### Built-in Security
- Row Level Security (RLS) for database access
- JWT-based authentication
- Automatic token rotation
- PKCE flow for OAuth

## Supabase Dashboard

Dashboard: https://app.supabase.com

Quick Links:
- Authentication: `https://app.supabase.com/project/[project-ref]/auth/users`
- API Settings: `https://app.supabase.com/project/[project-ref]/settings/api`
- Database: `https://app.supabase.com/project/[project-ref]/database/tables`

## Key Files to Reference

1. **AUTHENTICATION_IMPLEMENTATION.md** - Detailed implementation notes
2. **lib/supabase/config.ts** - Supabase client initialization
3. **components/AuthButton.tsx** - Auth UI component
4. **src/config/supabase.ts** (backend) - Supabase server setup
5. **src/middleware/auth.ts** (backend) - Authentication middleware

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

For more information, see [AUTHENTICATION_IMPLEMENTATION.md](./AUTHENTICATION_IMPLEMENTATION.md)

