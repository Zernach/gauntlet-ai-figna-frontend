# Railway Production Setup Guide

## Overview
Your frontend is now configured to automatically switch between local development and Railway production environments.

## Configuration Files Updated

### 1. `app.config.js`
- Added `RAILWAY_API_URL` and `RAILWAY_WS_URL` to expo config extras
- Changed default environment from 'dev' to 'local'

### 2. `constants/config.ts`
- Added `WS_URL` to each environment configuration
- Updated to use Railway URLs from environment variables
- Added `IS_DEV` and `IS_LOCAL` exports for convenience
- Fixed environment detection to use the actual environment value

### 3. `constants/websocket.ts`
- Now uses `CONFIG.WS_URL` instead of hardcoded localhost
- Automatically switches between `ws://` (local) and `wss://` (production)

## Setup Instructions

### Step 1: Create Local .env File

See [ENV_TEMPLATE.md](./ENV_TEMPLATE.md) for detailed instructions.

Quick start:
```bash
cd /Users/zernach/code/gauntlet/frontend
touch .env
```

Add the following content (replace with your actual Railway URL):

```env
# Environment (local, dev, prod)
ENVIRONMENT=local

# Railway Production URLs
RAILWAY_API_URL=https://your-app.railway.app
RAILWAY_WS_URL=wss://your-app.railway.app

# Supabase (if needed)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 2: Get Your Railway URLs

1. Go to your Railway dashboard
2. Click on your backend project
3. Go to **Settings** → **Networking**
4. Copy your Railway domain (e.g., `backend-production-xxxx.up.railway.app`)
5. Update your `.env` file with:
   - `RAILWAY_API_URL=https://your-actual-domain.railway.app`
   - `RAILWAY_WS_URL=wss://your-actual-domain.railway.app`

**Note:** Railway uses the same domain for both HTTP and WebSocket - just switch the protocol!

### Step 3: Development vs Production

#### Local Development
```bash
# Uses localhost:3001 (HTTP) and localhost:3002 (WebSocket)
ENVIRONMENT=local npm start
```

#### Production Testing
```bash
# Uses Railway URLs
ENVIRONMENT=prod npm start
```

#### Dev Environment (optional)
```bash
# Uses Railway URLs or dev.archlife.org fallback
ENVIRONMENT=dev npm start
```

## Environment Behavior

| Environment | HTTP Endpoint | WebSocket Endpoint |
|-------------|--------------|-------------------|
| **local** | `http://localhost:3001/api/gauntlet` | `ws://localhost:3002` |
| **dev** | Railway URL or fallback to dev.archlife.org | Railway WS or fallback |
| **prod** | Railway URL or fallback to archlife.org | Railway WS or fallback |

## Deploying to Production (e.g., Netlify/Vercel)

When deploying your frontend, set these environment variables in your hosting platform:

```
ENVIRONMENT=prod
RAILWAY_API_URL=https://your-app.railway.app
RAILWAY_WS_URL=wss://your-app.railway.app
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Verifying Your Setup

1. Start your backend on Railway
2. Start your frontend locally with `ENVIRONMENT=prod npm start`
3. Check the console logs to verify it's connecting to Railway
4. Test WebSocket connections in your canvas app

## Troubleshooting

### WebSocket Connection Issues
- Verify Railway domain is correct (no trailing slashes)
- Check that your backend is running on Railway
- Ensure your backend accepts WebSocket upgrades
- Railway automatically handles SSL/TLS for `wss://`

### Environment Not Switching
- Clear Metro bundler cache: `npm start -- --reset-cache`
- Verify `.env` file is in the frontend root directory
- Check that `ENVIRONMENT` variable is set correctly

### CORS Issues
Make sure your Railway backend has CORS configured to accept requests from your frontend domain.

## Next Steps

1. Update your `.env` file with actual Railway URLs
2. Test locally with production environment
3. Deploy frontend with production environment variables
4. Monitor Railway logs for any connection issues

## Important Notes

- `.env` files are gitignored for security
- Railway provides automatic SSL (HTTPS/WSS)
- WebSocket and HTTP use the same Railway domain
- Railway spins down after inactivity on free tier (cold starts)

