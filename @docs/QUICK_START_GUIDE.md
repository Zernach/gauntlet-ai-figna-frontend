# CollabCanvas - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
All dependencies are already installed in `package.json`. The app is ready to run!

### Running the App

```bash
# Start the development server
yarn start

# For iOS
yarn ios

# For Android
yarn android

# For Web
yarn web
```

---

## 📱 Using the App

### 1. Login
- Click "Continue with Google (Demo)"
- You'll be signed in automatically with a demo account
- Each session gets a unique ID and random color
- Note: Real Google OAuth integration coming soon!

### 2. Canvas Tools

#### Shape Tools
- **Select (👆)**: Select and move shapes
- **Pan (✋)**: Move around the canvas
- **Rectangle (▭)**: Create rectangles
- **Circle (○)**: Create circles
- **Text (T)**: Create text boxes

#### Creating Shapes
1. Select a shape tool
2. Tap/click anywhere on the canvas
3. The shape appears with your selected color

#### Moving Shapes
1. Select the "Select" tool
2. Tap/click on a shape to select it (blue border appears)
3. Drag to move the shape

#### Editing Text
1. Double-tap/click a text shape
2. Type your text
3. Tap outside to finish

### 3. Canvas Navigation

- **Pan**: Use two fingers to drag (or Pan tool)
- **Zoom**: Pinch to zoom in/out
- **Reset View**: Click "Reset View" button

### 4. Color Picker

- Select any color from the palette
- New shapes will use the selected color
- 9 preset colors available

### 5. Collaboration Features

#### See Other Users
- Online users appear in the right sidebar
- Count badge shows total online users
- Each user has a unique color

#### Real-time Cursors
- See where other users are pointing
- Cursors show user names
- Smooth animations for cursor movement

#### Connection Status
- **Green**: Connected
- **Yellow**: Connecting/Reconnecting
- **Red**: Disconnected/Error
- Latency indicator shows ping time

---

## 🎨 Canvas Controls

### Toolbar Buttons

| Button | Action |
|--------|--------|
| Reset View | Center canvas and reset zoom |
| Clear Selection | Deselect all shapes |

### Keyboard Shortcuts (Future)
- `Delete` - Delete selected shape
- `Ctrl/Cmd + Z` - Undo (Phase 2)
- `Ctrl/Cmd + Y` - Redo (Phase 2)

---

## 🔌 WebSocket Connection

### Automatic Features
- **Auto-connect**: Connects when you log in
- **Auto-reconnect**: Reconnects if disconnected
- **State sync**: All changes broadcast in real-time
- **Offline support**: Changes saved locally

### Connection States
1. **Disconnected**: Not connected to server
2. **Connecting**: Establishing connection
3. **Connected**: Active real-time sync
4. **Reconnecting**: Attempting to reconnect
5. **Error**: Connection failed

---

## 🎯 Best Practices

### Performance
- Keep shapes count under 500 for best performance
- Use viewport culling (automatic)
- Shapes outside view are not rendered

### Collaboration
- Each user has a unique color
- You can see what others are editing
- Changes sync instantly
- Offline changes sync when reconnected

### Creating Designs
1. Start with basic shapes
2. Use colors to organize
3. Add text for labels
4. Move shapes to arrange layout

---

## 🐛 Troubleshooting

### Connection Issues
- **Red status**: Check WebSocket server is running
- **Reconnecting**: Wait for automatic reconnection
- **Offline**: Changes saved, will sync when online

### Performance Issues
- Too many shapes? Consider clearing some
- Zoom out to see overall canvas
- Check device performance

### Shape Issues
- Can't select shape? Make sure "Select" tool is active
- Shape disappeared? Check if it's outside viewport
- Text not editing? Double-tap/click the text shape

---

## 📊 Technical Details

### State Persistence
- Canvas state saved automatically
- Survives app restarts
- Uses AsyncStorage for React Native

### WebSocket Messages
All operations broadcast:
- Shape create/update/delete
- Cursor movements
- User join/leave
- Presence updates

### Performance Optimizations
- Viewport culling active
- Component memoization
- Throttled cursor updates (50ms)
- Efficient Redux selectors

---

## 🚧 Coming in Phase 2

- **AI Integration**: Natural language commands
- **Advanced Features**: Undo/redo, grouping, layers
- **Enhanced Collaboration**: Comments, locking, permissions
- **Export/Import**: Save and load canvas states

---

## 💡 Tips & Tricks

1. **Quick Navigation**: Use Pan tool for easy canvas movement
2. **Precise Placement**: Zoom in for detailed work
3. **Color Coding**: Use colors to group related shapes
4. **Text Labels**: Add text to annotate your design
5. **Presence Panel**: Keep eye on who's online

---

## 📚 Architecture

### Frontend Stack
- React Native
- Redux Toolkit
- React Native Reanimated
- React Native Gesture Handler

### Communication
- WebSocket for real-time sync
- Redux middleware for message handling
- Automatic reconnection

### State Management
- Canvas state (shapes, viewport)
- User state (authentication)
- Presence state (cursors, users)
- WebSocket state (connection)

---

## 🎉 Have Fun Collaborating!

CollabCanvas is designed for real-time collaborative design. Invite others to join the same canvas and design together!

---

*For technical details, see PHASE_1_IMPLEMENTATION_COMPLETE.md*

