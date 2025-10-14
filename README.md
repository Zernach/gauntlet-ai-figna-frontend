# Gauntlet Frontend

A collaborative canvas application with real-time shape creation and manipulation, powered by Supabase authentication and WebSocket support.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Supabase account and project set up
- Backend server running (see backend README)

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**

Create a `.env` file in the frontend directory:
```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Backend API Configuration
VITE_API_URL=http://localhost:3001/api

# WebSocket Configuration
VITE_WS_URL=ws://localhost:3002
```

**How to get Supabase credentials:**
- Go to https://supabase.com/dashboard
- Select your project
- Navigate to Settings → API
- Copy the "Project URL" (VITE_SUPABASE_URL)
- Copy the "anon public" key (VITE_SUPABASE_ANON_KEY)

3. **Ensure backend is running:**
```bash
# In the backend directory
npm run dev
```

4. **Start the development server:**
```bash
npm run dev
```

5. **Open your browser:**
Navigate to `http://localhost:3000` (or the port shown in terminal)

## ✨ Features

### Canvas Functionality
- 🟦 **Create Rectangles** - Click "Add Rectangle" button (blue)
- 🟢 **Create Circles** - Click "Add Circle" button (green)
- 🖱️ **Move Shapes** - Click and drag any shape to reposition
- ✂️ **Delete Shapes** - Select a shape and press Delete/Backspace
- 🎯 **Select Shapes** - Click on shapes to select (blue outline)

### Pan & Zoom Controls
- 🖐️ **Pan Mode** - Hold **Space bar** to pan the canvas
- 🔍 **Zoom In/Out** - Use mouse wheel or click Zoom buttons
- 🎯 **Reset View** - Click "Reset View" to return to default position

### Collaboration Features
- 👥 **Real-time Collaboration** - See other users' cursors and changes
- 🔒 **Shape Locking** - Shapes lock during drag to prevent conflicts
- 👁️ **User Presence** - See who's online in the presence panel
- 🎨 **User Colors** - Each user gets a unique color for their cursor

### Authentication
- 🔐 **Supabase Auth** - Secure login/signup with email
- 👤 **User Profiles** - Automatic user creation and management

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` (hold) | Enable pan mode |
| `Delete` / `Backspace` | Delete selected shape |
| `Escape` | Deselect shape |
| Mouse Wheel | Zoom in/out |

## 📁 Project Structure

```
src/
├── App.tsx                    # Main application component
├── components/
│   ├── Canvas.tsx            # Canvas with shape creation & manipulation
│   ├── AuthButton.tsx        # Floating authentication button
│   └── AuthModal.tsx         # Login/signup modal
├── hooks/
│   └── useWebSocket.ts       # WebSocket connection hook
├── lib/
│   ├── api.ts               # API client
│   ├── supabase.ts          # Supabase client configuration
│   └── websocket.ts         # WebSocket utilities
├── main.tsx                  # Application entry point
└── index.css                 # Global styles
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linter

## 🐛 Troubleshooting

### "Please sign in to access the canvas"
- Make sure you have valid Supabase credentials in `.env`
- Check that Supabase URL and keys are correct
- Try logging out and logging back in

### Shapes not appearing
- Verify the backend server is running on port 3001
- Check WebSocket connection is active (port 3002)
- Open browser console (F12) to check for errors
- Ensure you're logged in with Supabase authentication

### WebSocket connection fails
- Confirm backend WebSocket server is running
- Check VITE_WS_URL in `.env` matches backend WS_PORT
- Verify firewall isn't blocking WebSocket connections

### Pan mode not working
- Try holding the Space bar while moving the mouse
- Check browser console for any JavaScript errors
- Refresh the page if space bar doesn't respond

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 📝 Notes

- The canvas is 5000x5000 pixels with infinite zoom
- Shapes are constrained within canvas boundaries
- All changes sync in real-time via WebSocket
- User sessions persist in Supabase

