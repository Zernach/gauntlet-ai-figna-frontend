# Environment Variables Template

Create a `.env` file in the frontend root directory with the following variables:

```env
# Environment Configuration
ENVIRONMENT=local

# Railway Backend URLs
RAILWAY_API_URL=https://your-app.railway.app
RAILWAY_WS_URL=wss://your-app.railway.app

# Supabase Configuration
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

## Setup Instructions

1. Copy the content above to a `.env` file in the frontend root
2. Replace placeholder values with your actual configuration
3. Never commit the `.env` file to version control (it's already in .gitignore)

## Environment Options

### `ENVIRONMENT`

Controls which backend endpoints the app connects to:

- **`local`** (Default) - For local development
  - HTTP API: `http://localhost:3001/api/gauntlet`
  - WebSocket: `ws://localhost:3002`
  - Make sure your backend is running locally!

- **`dev`** - For development/staging environment
  - Uses Railway URLs if provided, otherwise falls back to `api-dev.archlife.org`

- **`prod`** - For production deployment
  - Uses Railway URLs if provided, otherwise falls back to `api.archlife.org`

## Getting Your Railway URLs

### Step 1: Deploy Backend to Railway

If you haven't already:
1. Go to [Railway](https://railway.app/)
2. Sign in with GitHub
3. Create new project from your backend repository
4. Railway will automatically detect and deploy your Node.js app

### Step 2: Get Your Domain

1. Go to your Railway dashboard
2. Click on your backend project
3. Go to **Settings** → **Networking**
4. Copy your Railway domain (e.g., `backend-production-xxxx.up.railway.app`)

### Step 3: Update .env

```env
RAILWAY_API_URL=https://backend-production-xxxx.up.railway.app
RAILWAY_WS_URL=wss://backend-production-xxxx.up.railway.app
```

**Note:** Railway uses the **same domain** for both HTTP and WebSocket connections. Just change the protocol (`https://` vs `wss://`)

## Getting Supabase Credentials

### Step 1: From Supabase Dashboard

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (use the same project as your backend)
3. Go to **Project Settings** (gear icon) → **API**

### Step 2: Copy Credentials

You'll find:
- **Project URL** → Use for `SUPABASE_URL`
  - Format: `https://abc123.supabase.co`
- **anon/public key** → Use for `SUPABASE_ANON_KEY`
  - This is safe to use in the frontend

### Step 3: Update .env

```env
SUPABASE_URL=https://abc123.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
```

⚠️ **Important:** Use the **anon key** in frontend, never the service role key!

## Example Configurations

### Local Development

```env
ENVIRONMENT=local
SUPABASE_URL=https://abc123.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-key
```

This uses localhost endpoints automatically. No Railway URLs needed!

### Production Deployment

```env
ENVIRONMENT=prod
RAILWAY_API_URL=https://backend-production-xxxx.railway.app
RAILWAY_WS_URL=wss://backend-production-xxxx.railway.app
SUPABASE_URL=https://abc123.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-key
```

## Running the App

### Local Development (with local backend)

```bash
npm start
# or
ENVIRONMENT=local npm start
```

Connects to `localhost:3001` and `localhost:3002`

### Local Development (with Railway backend)

```bash
ENVIRONMENT=prod npm start
```

Connects to your Railway backend while developing locally

### Production Build

When deploying to Netlify/Vercel:

1. Set environment variables in your hosting platform's dashboard
2. Set `ENVIRONMENT=prod`
3. Set all Railway and Supabase variables
4. Deploy!

## Troubleshooting

### "Cannot connect to server"

- ✅ Check that backend is running (locally or on Railway)
- ✅ Verify Railway URLs are correct (no trailing slashes)
- ✅ Check `ENVIRONMENT` variable is set correctly
- ✅ Clear Metro cache: `npm start -- --reset-cache`

### WebSocket connection fails

- ✅ Railway automatically handles WebSocket upgrades
- ✅ Use `wss://` (secure) protocol for Railway, not `ws://`
- ✅ Make sure backend WebSocket server is running
- ✅ Check Railway logs for errors

### Authentication issues

- ✅ Verify Supabase URL and anon key are correct
- ✅ Check that Supabase project is the same as backend
- ✅ Ensure JWT secret matches between frontend and backend

## Security Best Practices

✅ **DO:**
- Use `.env` for local development
- Use hosting platform's environment variables for production
- Use Supabase anon key (public key) in frontend
- Keep `.env` in `.gitignore`

❌ **DON'T:**
- Commit `.env` files to git
- Use service role keys in frontend code
- Hardcode credentials in source code
- Share credentials in public channels

## Next Steps

1. Create your `.env` file using this template
2. Get your Railway domain from Railway dashboard
3. Get Supabase credentials from Supabase dashboard
4. Test locally with `npm start`
5. Test with production backend using `ENVIRONMENT=prod npm start`
6. Deploy to production with environment variables configured

For more details, see [RAILWAY_SETUP.md](./RAILWAY_SETUP.md)

