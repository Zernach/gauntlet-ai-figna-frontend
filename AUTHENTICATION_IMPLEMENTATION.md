# Supabase Authentication Implementation

**Date**: October 14, 2025  
**Project**: Gauntlet AI  
**Authentication**: Supabase Auth with Google OAuth

## Overview

Gauntlet AI uses Supabase Authentication for user management and authentication. This provides secure, scalable authentication with built-in support for multiple OAuth providers, session management, and automatic token refresh.

## Architecture

### Frontend (React Native + Expo)

The frontend uses the Supabase JavaScript client to handle authentication:

```
User Action → Supabase Client → OAuth Provider → Supabase Auth
                                                      ↓
                                            Access Token + User Data
                                                      ↓
                                            Redux Store (Persisted)
                                                      ↓
                                            API Calls (Authorization Header)
```

### Backend (Node.js + Express)

The backend verifies Supabase JWT tokens and manages user data:

```
API Request → Auth Middleware → Verify JWT Token → Access User
                                                         ↓
                                                   User Context
                                                         ↓
                                                   Route Handler
```

## Implementation Details

### 1. Supabase Client Initialization

**File**: `lib/supabase/config.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

**Key Features:**
- **Auto Refresh**: Tokens automatically refresh before expiration
- **Persist Session**: Sessions saved to AsyncStorage/localStorage
- **Detect Session**: Handles OAuth callbacks automatically

### 2. Authentication Component

**File**: `components/AuthButton.tsx`

The `AuthButton` component handles the complete authentication flow:

**Sign In Flow:**
1. User clicks "Continue with Google"
2. Supabase opens OAuth consent screen
3. User authorizes the application
4. Supabase redirects back with session
5. `onAuthStateChange` listener receives session
6. Session data stored in Redux
7. Access token used for API calls

**Sign Out Flow:**
1. User clicks "Sign out"
2. Supabase invalidates session
3. Redux store cleared
4. User redirected to login

**Key Features:**
- Automatic session detection
- Token refresh handling
- Redux integration
- Persistent state management

### 3. Backend Token Verification

**File**: `src/middleware/auth.ts` (backend)

The backend middleware verifies Supabase JWT tokens:

```typescript
export async function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decodedToken = await verifySupabaseToken(token);
    req.user = {
      uid: decodedToken.userId,
      email: decodedToken.email,
      ...decodedToken,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

**Token Verification:**
- Uses Supabase JWT secret to verify signature
- Extracts user ID and metadata
- Attaches user to request object
- Fails gracefully with 401 errors

### 4. Redux Integration

**File**: `lib/redux/slices/userSlice.ts`

User authentication state is managed in Redux:

```typescript
interface UserState {
  currentUser: User | null;
  authTokens: {
    token: string;
    refreshToken: string;
    expiresAt: string;
  } | null;
}

// Actions:
- setUserAndTokens: Store user and tokens
- clearUser: Clear authentication state
- updateTokens: Update tokens after refresh
```

**Persistence:**
- Redux state persisted using `redux-persist`
- Survives app restarts
- Cleared on explicit sign-out

### 5. API Request Setup

**File**: `lib/auth/setupAuthHeaders.ts`

Automatically includes authentication tokens in API requests:

```typescript
export function setupAuthHeaders() {
  setAuthHeadersProvider(() => {
    const authTokens = store.getState().user.authTokens;
    
    if (authTokens?.token) {
      return {
        'Authorization': `Bearer ${authTokens.token}`,
      };
    }
    
    return {};
  });
}
```

This is called once during app initialization and automatically adds the `Authorization` header to all API requests.

## Authentication Flow Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ Click "Sign In"
       ▼
┌─────────────────┐
│  AuthButton     │
└──────┬──────────┘
       │ signInWithOAuth('google')
       ▼
┌─────────────────┐
│ Supabase Client │
└──────┬──────────┘
       │ Opens OAuth
       ▼
┌─────────────────┐
│ Google OAuth    │
└──────┬──────────┘
       │ User authorizes
       ▼
┌─────────────────┐
│ Supabase Auth   │
└──────┬──────────┘
       │ Creates session
       ▼
┌─────────────────┐
│onAuthStateChange│
└──────┬──────────┘
       │ Fires with session
       ▼
┌─────────────────┐
│  Redux Store    │
└──────┬──────────┘
       │ Store user + tokens
       ▼
┌─────────────────┐
│   API Calls     │
└──────┬──────────┘
       │ Include Bearer token
       ▼
┌─────────────────┐
│    Backend      │
└──────┬──────────┘
       │ Verify token
       ▼
┌─────────────────┐
│  User Context   │
└─────────────────┘
```

## Security Features

### 1. JWT Token Security
- Tokens signed with Supabase JWT secret
- Short expiration time (1 hour default)
- Automatic refresh before expiration
- Secure token storage (encrypted on device)

### 2. OAuth Security
- PKCE flow for additional security
- State parameter prevents CSRF attacks
- Tokens never exposed to frontend directly
- Callback URLs validated by Supabase

### 3. Row Level Security (RLS)
- Database access controlled by policies
- Users can only access their own data
- Service role key bypasses RLS (backend only)
- Fine-grained access control

### 4. Transport Security
- All communication over HTTPS
- Tokens in Authorization headers only
- No tokens in URLs or query parameters

## Token Lifecycle

### Access Token
- **Duration**: 1 hour (default)
- **Purpose**: API authentication
- **Storage**: Redux (persisted)
- **Refresh**: Automatic via Supabase client

### Refresh Token
- **Duration**: 30 days (default)
- **Purpose**: Get new access tokens
- **Storage**: Redux (persisted)
- **Rotation**: New refresh token issued on refresh

### Session Management
- Sessions automatically refreshed
- Refresh happens 5 minutes before expiration
- Failed refresh triggers sign-out
- Session persistence across app restarts

## Error Handling

### Frontend Errors

**Invalid Session:**
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED' && !session) {
    // Refresh failed, sign out user
    dispatch(clearUser());
  }
});
```

**Network Errors:**
```typescript
try {
  await supabase.auth.signInWithOAuth({ provider: 'google' });
} catch (error) {
  Alert.alert('Sign In Error', error.message);
}
```

### Backend Errors

**Invalid Token:**
```typescript
catch (error) {
  res.status(401).json({
    error: 'Unauthorized',
    message: 'Invalid or expired token',
  });
}
```

**Missing Token:**
```typescript
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Missing authorization header',
  });
}
```

## Configuration

### Frontend Environment Variables

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
ENVIRONMENT=dev|prod
```

### Backend Environment Variables

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Supabase Dashboard Configuration

1. **Enable Google OAuth:**
   - Go to Authentication → Providers
   - Enable Google provider
   - Add Client ID and Secret from Google Cloud Console

2. **Configure Redirect URLs:**
   - Add your app's redirect URLs
   - Web: `https://yourdomain.com`
   - Local: `http://localhost:19006`

3. **Configure Email Templates:**
   - Customize confirmation emails
   - Set up password reset templates

## Testing

### Test Sign In
```bash
1. Start app: yarn start
2. Click "Continue with Google"
3. Sign in with test account
4. Verify user appears in Supabase Dashboard
5. Check Redux DevTools for user state
6. Verify API calls include Authorization header
```

### Test Token Refresh
```bash
1. Sign in
2. Wait 55 minutes (or modify token expiry)
3. Verify automatic refresh happens
4. Check that new tokens are stored
5. Verify API calls continue working
```

### Test Sign Out
```bash
1. Sign out
2. Verify user cleared from Redux
3. Verify persisted state cleared
4. Verify API calls fail without token
5. Check Supabase session is invalidated
```

## Troubleshooting

### "Authentication failed"
- Check Google OAuth is enabled in Supabase
- Verify redirect URLs are configured
- Check Client ID and Secret are correct

### "Token expired"
- Token refresh may have failed
- Check network connectivity
- Verify Supabase project is active

### "User not found"
- User may not exist in database
- Check user creation logic in backend
- Verify database tables exist

## Benefits of Supabase Auth

### Compared to Custom Auth
- ✅ Built-in security best practices
- ✅ Automatic token refresh
- ✅ Session persistence
- ✅ Multi-provider support
- ✅ Email verification
- ✅ Password reset flows

### Compared to Firebase Auth
- ✅ Open source
- ✅ Direct database access
- ✅ Row Level Security
- ✅ Real-time subscriptions
- ✅ No vendor lock-in
- ✅ Self-hosting option

## Future Enhancements

### Additional Providers
- Sign in with Apple
- Sign in with GitHub
- Email/password authentication
- Magic link authentication

### Advanced Features
- Multi-factor authentication (2FA)
- Phone number authentication
- Custom SMTP for emails
- User roles and permissions

### Security Improvements
- Rate limiting on auth endpoints
- Suspicious activity detection
- Device fingerprinting
- Session management dashboard

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/auth-signinwithoauth)
- [JWT Best Practices](https://supabase.com/docs/learn/auth-deep-dive/auth-deep-dive-jwts)

---

**Last Updated**: October 14, 2025  
**Status**: ✅ Active and Production-Ready

