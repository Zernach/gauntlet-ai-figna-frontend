# Gauntlet AI

A real-time collaborative design canvas application with Supabase Authentication and AI integration built with React Native and Expo.

## Features

- 🎨 Real-time collaborative canvas
- 🔐 Supabase Authentication with Google Sign-In
- 🌐 Cross-platform support (Web, iOS, Android)
- 🔌 WebSocket-based real-time updates
- 📱 Modern UI with gesture support
- 🎯 Redux state management with persistence

## Prerequisites

- Node.js 22+ 
- Yarn package manager
- Supabase project (see setup below)
- Expo CLI (installed globally or via npx)

## Quick Start

### 1. Clone and Install

```bash
cd gauntlet-ai
yarn install
```

### 2. Configure Supabase

Create a `.env` file in the project root:

```bash
ENVIRONMENT=dev
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Replace with your actual Supabase project URL and anonymous key from the Supabase Dashboard.

### 3. Run the Application

```bash
# Start development server
yarn start

# Run on web
yarn web

# Run on iOS (requires Xcode)
yarn ios

# Run on Android (requires Android Studio)
yarn android
```

## Authentication Setup

This project uses **Supabase Authentication** with Google Sign-In. To set up authentication:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable Google OAuth provider in Authentication → Providers
3. Configure authorized redirect URLs
4. Copy your project URL and anon key to `.env`

For detailed setup instructions, see:
- **[AUTH_QUICK_REFERENCE.md](./AUTH_QUICK_REFERENCE.md)** - Quick reference for authentication
- **[AUTHENTICATION_IMPLEMENTATION.md](./AUTHENTICATION_IMPLEMENTATION.md)** - Implementation details

### Supabase Dashboard

- **Dashboard**: [app.supabase.com](https://app.supabase.com)
- **Documentation**: [supabase.com/docs](https://supabase.com/docs)

## Project Structure

```
gauntlet-ai/
├── app/                          # Expo Router pages
│   ├── _layout.tsx              # Root layout with providers
│   └── index.tsx                # Home page
├── components/                   # React components
│   ├── AuthButton.tsx           # Supabase authentication UI
│   ├── base/                    # Base UI components
│   ├── Canvas/                  # Canvas components
│   ├── Cursors/                 # Cursor rendering
│   ├── Presence/                # User presence
│   └── Toolbar/                 # Canvas toolbar
├── lib/                         # Core libraries
│   ├── supabase/                # Supabase configuration
│   │   └── config.ts           # Supabase client initialization
│   ├── redux/                   # Redux store and slices
│   └── auth/                    # Auth utilities
├── services/                    # External services
│   └── WebSocketService.ts     # WebSocket client
├── constants/                   # App constants
│   ├── config.ts               # Environment configuration
│   └── colors.ts               # Color palette
├── types/                       # TypeScript types
├── endpoints/                   # API endpoints
└── utils/                       # Utility functions
```

## Backend Integration

This frontend connects to a Node.js/Express backend. The backend:

- Verifies Supabase JWT tokens
- Manages WebSocket connections for real-time collaboration
- Provides REST API for data operations
- Uses Supabase as the database

For backend setup, see the `gauntlet-ai-backend` directory README.

## Environment Configuration

The app supports three environments configured in `constants/config.ts`:

- **local**: `http://localhost:3000/api/gauntlet`
- **dev**: `https://api-dev.archlife.org/api/gauntlet`
- **prod**: `https://api.archlife.org/api/gauntlet`

Set the environment in `constants/config.ts` or via environment variable.

## Development

### Available Scripts

- `yarn start` - Start Expo development server
- `yarn web` - Run on web browser
- `yarn ios` - Run on iOS simulator
- `yarn android` - Run on Android emulator
- `yarn lint` - Run ESLint
- `yarn pre` - Run TypeScript check and lint
- `yarn build:web` - Build for web deployment
- `yarn deploy` - Deploy to Netlify

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Functional components with hooks
- Redux for global state management
- Supabase SDK for authentication and database

## Deployment

### Web Deployment (Netlify)

```bash
yarn build:web
yarn deploy
```

The app is configured to deploy to Netlify. See `netlify.toml` for configuration.

### Mobile Deployment

For iOS and Android app store deployment, use Expo Application Services (EAS):

```bash
# Build for iOS
yarn build:ios

# Build for Android
yarn build:android
```

## Testing Authentication

1. Start the backend server (in `gauntlet-ai-backend` directory)
2. Start the frontend: `yarn start`
3. Open in browser or mobile device
4. Click "Continue with Google"
5. Sign in with your Google account
6. Verify that:
   - User profile appears
   - API calls work
   - WebSocket connection establishes
   - Real-time features function

## Troubleshooting

### Common Issues

**"Missing Supabase configuration"**
- Check `.env` file exists with correct Supabase URL and anon key
- Restart the Expo development server

**"Authentication failed"**
- Ensure Google OAuth provider is enabled in Supabase Dashboard
- Check authorized redirect URLs in Supabase Dashboard
- Verify backend is running and accessible

**"WebSocket connection failed"**
- Check backend is running
- Verify JWT token is being generated
- Check network connectivity

For more troubleshooting tips, see the [Supabase Documentation](https://supabase.com/docs).

## Documentation

- [AUTH_QUICK_REFERENCE.md](./AUTH_QUICK_REFERENCE.md) - Quick authentication reference
- [AUTHENTICATION_IMPLEMENTATION.md](./AUTHENTICATION_IMPLEMENTATION.md) - Implementation details

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Routing**: Expo Router
- **State Management**: Redux Toolkit with Redux Persist
- **Authentication**: Supabase Authentication
- **Database**: Supabase (PostgreSQL)
- **UI**: Custom components with React Native gesture handler
- **Canvas**: React Native Skia
- **Real-time**: WebSockets
- **Deployment**: Netlify (web), EAS (mobile)

## Contributing

1. Create a feature branch off `main`
2. Make your changes
3. Run `yarn pre` to check TypeScript and linting
4. Commit with descriptive messages
5. Create a pull request

**Note**: Do not commit to `main` branch directly!

## License

MIT

## Author

Ryan Zernach (ryan@zernach.com)

---

For questions or issues, please contact the development team or create an issue in the repository.
