# Gauntlet Frontend

A minimal collaborative canvas application with Supabase authentication and WebSocket support.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.sample`:
```bash
cp .env.sample .env
```

3. Add your Supabase credentials to `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3002
```

4. Make sure the backend is running on ports 3001 (HTTP) and 3002 (WebSocket)

5. Start the development server:
```bash
npm start
```

## Features

- 🎨 Grey canvas workspace
- 🔐 Supabase authentication (login/signup)
- 🔌 WebSocket connection to backend
- 💚 Real-time connection status indicator

## Structure

- `src/App.tsx` - Main application component
- `src/components/Canvas.tsx` - Grey canvas display
- `src/components/AuthButton.tsx` - Floating authentication button
- `src/components/AuthModal.tsx` - Login/signup modal
- `src/hooks/useWebSocket.ts` - WebSocket connection hook
- `src/lib/supabase.ts` - Supabase client configuration

