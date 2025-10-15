# Figna CollabCanvas MVP - Development Task List
## Realtime Collaborative Design Canvas

## Architecture Overview: Backend Proxy Pattern

**IMPORTANT:** The frontend uses a **proxy architecture** for security and control:

- ✅ **Frontend CAN directly access:** Supabase Auth (authentication only)
- ❌ **Frontend CANNOT directly access:** Supabase database or Supabase Realtime
- ✅ **All database operations:** Must go through Railway backend REST API
- ✅ **All real-time updates:** Must go through Railway WebSocket server
- 🔄 **Backend proxies:** Supabase Realtime events to frontend via WebSocket

**Data Flow:**
1. Frontend → Railway Backend API → Supabase Database (writes)
2. Supabase Database → Supabase Realtime → Railway WebSocket → Frontend (reads/updates)
3. Frontend → Supabase Auth (authentication only, direct access allowed)

---

## Project File Structure

```
figna/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── AuthProvider.jsx
│   │   ├── Canvas/
│   │   │   ├── Canvas.jsx
│   │   │   ├── CanvasControls.jsx
│   │   │   └── Shape.jsx
│   │   ├── Collaboration/
│   │   │   ├── Cursor.jsx
│   │   │   ├── UserPresence.jsx
│   │   │   └── PresenceList.jsx
│   │   └── Layout/
│   │       ├── Navbar.jsx
│   │       └── Sidebar.jsx
│   ├── services/
│   │   ├── supabase.js
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── canvas.js
│   │   └── presence.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCanvas.js
│   │   ├── useCursors.js
│   │   └── usePresence.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── CanvasContext.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── tests/
│   ├── setup.js
│   ├── unit/
│   │   ├── utils/
│   │   │   └── helpers.test.js
│   │   ├── services/
│   │   │   ├── auth.test.js
│   │   │   └── canvas.test.js
│   │   └── contexts/
│   │       └── CanvasContext.test.js
│   └── integration/
│       ├── auth-flow.test.js
│       ├── canvas-sync.test.js
│       └── multiplayer.test.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.local
└── README.md
```

---

## PR #1: Project Setup & Supabase Configuration

**Branch:** `setup/initial-config`  
**Goal:** Initialize project with all dependencies and Supabase configuration

### Tasks:

- [x] **1.1: Initialize React + Vite Project**

  - Files to create: `package.json`, `vite.config.ts`, `index.html`
  - Run: `npm create vite@latest figna -- --template react-ts`
  - Verify dev server runs

- [x] **1.2: Install Core Dependencies**

  - Files to update: `package.json`
  - Install:
    ```bash
    npm install @supabase/supabase-js konva react-konva socket.io-client
    npm install -D tailwindcss postcss autoprefixer
    ```

- [x] **1.3: Configure Tailwind CSS**

  - Files to create: `tailwind.config.js`, `postcss.config.js`
  - Files to update: `src/index.css`
  - Run: `npx tailwindcss init -p`
  - Add Tailwind directives to `index.css`

- [ ] **1.4: Set Up Supabase Project**

  - Create Supabase project in console
  - Enable Authentication (Email/Password AND Google OAuth)
  - Note Project URL and anon key
  - Set up database tables (canvases, shapes, presence)
  - Files to create: `.env.local`, `.env.example`
  - Add Supabase config keys to `.env.local`

- [ ] **1.5: Create Supabase Auth Service File**

  - Files to create: `src/services/supabase.js`
  - Initialize Supabase client **for Auth only**
  - Export `supabase` client instance (auth operations only)
  - Note: Frontend does NOT use Supabase for database or realtime

- [ ] **1.6: Create API Client Service File**

  - Files to create: `src/services/api.js`
  - Configure HTTP client for Railway backend REST API
  - Configure WebSocket connection to Railway backend
  - Export `apiClient` (HTTP) and `wsClient` (WebSocket)
  - All database operations go through this backend proxy

- [ ] **1.7: Configure Git & .gitignore**

  - Files to create/update: `.gitignore`
  - Ensure `.env.local` is ignored
  - Add `node_modules/`, `dist/` to `.gitignore`

- [ ] **1.8: Create README with Setup Instructions**
  - Files to create: `README.md`
  - Include setup steps, env variables needed, run commands
  - Document Railway backend URL configuration

**PR Checklist:**

- [ ] Dev server runs successfully
- [ ] Supabase Auth client initialized without errors
- [ ] Railway API client configured (HTTP + WebSocket)
- [ ] Tailwind classes work in test component
- [ ] `.env.local` is in `.gitignore`
- [ ] Can connect to Railway backend (once deployed)
- [ ] Frontend does NOT have direct Supabase database access

---

## PR #2: Authentication System

**Branch:** `feature/authentication`  
**Goal:** Complete user authentication with login/signup flows

### Tasks:

- [ ] **2.1: Create Auth Context**

  - Files to create: `src/contexts/AuthContext.jsx`
  - Provide: `currentUser`, `loading`, `login()`, `signup()`, `logout()`

- [ ] **2.2: Create Auth Service**

  - Files to create: `src/services/auth.js`
  - Use Supabase Auth methods
  - Functions: `signUp(email, password, displayName)`, `signIn(email, password)`, `signInWithGoogle()`, `signOut()`
  - Display name logic: Extract from Google profile or use email prefix
  - Store display name in user metadata

- [ ] **2.3: Create Auth Hook**

  - Files to create: `src/hooks/useAuth.js`
  - Return auth context values

- [ ] **2.4: Build Signup Component**

  - Files to create: `src/components/Auth/Signup.jsx`
  - Form fields: email, password, display name
  - Handle signup errors
  - Redirect to canvas on success

- [ ] **2.5: Build Login Component**

  - Files to create: `src/components/Auth/Login.jsx`
  - Form fields: email, password
  - Add "Sign in with Google" button
  - Handle login errors
  - Link to signup page

- [ ] **2.6: Create Auth Provider Wrapper**

  - Files to create: `src/components/Auth/AuthProvider.jsx`
  - Wrap entire app with AuthContext
  - Show loading state during auth check

- [ ] **2.7: Update App.jsx with Protected Routes**

  - Files to update: `src/App.jsx`
  - Show Login/Signup if not authenticated
  - Show Canvas if authenticated
  - Basic routing logic

- [ ] **2.8: Create Navbar Component**
  - Files to create: `src/components/Layout/Navbar.jsx`
  - Display current user name
  - Logout button

**PR Checklist:**

- [ ] Can create new account with email/password
- [ ] Can login with existing account
- [ ] Can sign in with Google
- [ ] Display name appears correctly (Google name or email prefix)
- [ ] Display name truncates at 20 chars if too long
- [ ] Logout works and redirects to login
- [ ] Auth state persists on page refresh

---

## PR #3: Basic Canvas Rendering

**Branch:** `feature/canvas-basic`  
**Goal:** Canvas with pan, zoom, and basic stage setup

### Tasks:

- [ ] **3.1: Create Canvas Constants**

  - Files to create: `src/utils/constants.js`
  - Define: `CANVAS_WIDTH = 5000`, `CANVAS_HEIGHT = 5000`, `VIEWPORT_WIDTH`, `VIEWPORT_HEIGHT`

- [ ] **3.2: Create Canvas Context**

  - Files to create: `src/contexts/CanvasContext.jsx`
  - State: `shapes`, `selectedId`, `stageRef`
  - Provide methods to add/update/delete shapes

- [ ] **3.3: Build Base Canvas Component**

  - Files to create: `src/components/Canvas/Canvas.jsx`
  - Set up Konva Stage and Layer
  - Container div with fixed dimensions
  - Background color/grid (optional)

- [ ] **3.4: Implement Pan Functionality**

  - Files to update: `src/components/Canvas/Canvas.jsx`
  - Handle `onDragMove` on Stage
  - Constrain panning to canvas bounds (5000x5000px)
  - Prevent objects from being placed/moved outside boundaries

- [ ] **3.5: Implement Zoom Functionality**

  - Files to update: `src/components/Canvas/Canvas.jsx`
  - Handle `onWheel` event
  - Zoom to cursor position
  - Min zoom: 0.1, Max zoom: 3

- [ ] **3.6: Create Canvas Controls Component**

  - Files to create: `src/components/Canvas/CanvasControls.jsx`
  - Buttons: "Zoom In", "Zoom Out", "Reset View", "Add Shape"
  - Position: Fixed/floating on canvas

- [ ] **3.7: Add Canvas to App**
  - Files to update: `src/App.jsx`
  - Wrap Canvas in CanvasContext
  - Include Navbar and Canvas

**PR Checklist:**

- [ ] Canvas renders at correct size (5000x5000px)
- [ ] Can pan by dragging canvas background
- [ ] Can zoom with mousewheel
- [ ] Zoom centers on cursor position
- [ ] Reset view button works
- [ ] Canvas boundaries are enforced (optional: visual indicators)
- [ ] 60 FPS maintained during pan/zoom

---

## PR #4: Shape Creation & Manipulation

**Branch:** `feature/shapes`  
**Goal:** Create, select, and move shapes on canvas

### Tasks:

- [ ] **4.1: Create Shape Component**

  - Files to create: `src/components/Canvas/Shape.jsx`
  - Support: **Rectangles only for MVP**
  - Props: `id`, `x`, `y`, `width`, `height`, `fill`, `isSelected`, `isLocked`, `lockedBy`

- [ ] **4.2: Add Shape Creation Logic**

  - Files to update: `src/contexts/CanvasContext.jsx`
  - Function: `addShape(type, position)`
  - Generate unique ID for each shape
  - Default properties: 100x100px, fixed gray fill (#cccccc)

- [ ] **4.3: Implement Shape Rendering**

  - Files to update: `src/components/Canvas/Canvas.jsx`
  - Map over `shapes` array
  - Render Shape component for each

- [ ] **4.4: Add Shape Selection**

  - Files to update: `src/components/Canvas/Shape.jsx`
  - Handle `onClick` to set selected
  - Visual feedback: border/outline when selected
  - Files to update: `src/contexts/CanvasContext.jsx`
  - State: `selectedId`

- [ ] **4.5: Implement Shape Dragging**

  - Files to update: `src/components/Canvas/Shape.jsx`
  - Enable `draggable={true}`
  - Handle `onDragEnd` to update position
  - Files to update: `src/contexts/CanvasContext.jsx`
  - Function: `updateShape(id, updates)`

- [ ] **4.6: Add Click-to-Deselect**

  - Files to update: `src/components/Canvas/Canvas.jsx`
  - Handle Stage `onClick` to deselect when clicking background

- [ ] **4.7: Connect "Add Shape" Button**

  - Files to update: `src/components/Canvas/CanvasControls.jsx`
  - Button creates shape at center of current viewport

- [ ] **4.8: Add Delete Functionality**
  - Files to update: `src/contexts/CanvasContext.jsx`
  - Function: `deleteShape(id)`
  - Files to update: `src/components/Canvas/Canvas.jsx`
  - Add keyboard listener for Delete/Backspace key
  - Delete selected shape when key pressed
  - Cannot delete shapes locked by other users

**PR Checklist:**

- [ ] Can create rectangles via button
- [ ] Rectangles render at correct positions with gray fill
- [ ] Can select rectangles by clicking
- [ ] Can drag rectangles smoothly
- [ ] Selection state shows visually
- [ ] Can delete selected rectangle with Delete/Backspace key
- [ ] Clicking another shape deselects the previous one
- [ ] Clicking empty canvas deselects current selection
- [ ] Objects cannot be moved outside canvas boundaries
- [ ] No lag with 20+ shapes

---

## PR #5: Real-Time Shape Synchronization

**Branch:** `feature/realtime-sync`  
**Goal:** Sync shape changes across all connected users

### Tasks:

- [ ] **5.1: Design PostgreSQL Schema**

  - Tables: `canvases`, `shapes` (already created in Supabase)
  - Shapes table columns:
    - id (UUID, primary key)
    - canvas_id (text, references canvases)
    - type (text, e.g. 'rectangle')
    - x, y, width, height (float)
    - fill (text)
    - created_by (UUID, references auth.users)
    - created_at, last_modified_at (timestamptz)
    - is_locked (boolean)
    - locked_by (UUID, nullable)

- [ ] **5.2: Create Canvas Service**

  - Files to create: `src/services/canvas.js`
  - **All operations go through Railway backend (proxy pattern)**
  - Function: `subscribeToShapes(canvasId, callback)` - WebSocket listener (backend proxies Supabase Realtime)
  - Function: `createShape(canvasId, shapeData)` - POST to Railway API
  - Function: `updateShape(canvasId, shapeId, updates)` - PUT to Railway API
  - Function: `deleteShape(canvasId, shapeId)` - DELETE to Railway API
  - No direct Supabase calls from frontend

- [ ] **5.3: Create Canvas Hook**

  - Files to create: `src/hooks/useCanvas.js`
  - Subscribe to Railway WebSocket on mount (backend handles Supabase Realtime)
  - Sync local state with updates from WebSocket
  - Return: `shapes`, `addShape()`, `updateShape()`, `deleteShape()`

- [ ] **5.4: Integrate Real-Time Updates in Context**

  - Files to update: `src/contexts/CanvasContext.jsx`
  - Replace local state with `useCanvas` hook
  - Listen to Railway WebSocket for shape changes
  - Update local shapes array on remote changes
  - All updates proxied through backend

- [ ] **5.5: Implement Object Locking**

  - Files to update: `src/services/canvas.js`
  - Strategy: First user to select/drag acquires lock via Railway API
  - Function: `lockShape(canvasId, shapeId, userId)` - POST to Railway API
  - Function: `unlockShape(canvasId, shapeId)` - POST to Railway API
  - Backend handles auto-release lock after timeout (3-5 seconds)
  - Visual indicator showing which user has locked an object
  - Other users cannot move locked objects

- [ ] **5.6: Add Loading States**

  - Files to update: `src/contexts/CanvasContext.jsx`
  - Show loading spinner while initial shapes load
  - Files to update: `src/components/Canvas/Canvas.jsx`
  - Display "Loading canvas..." message

- [ ] **5.7: Handle Offline/Reconnection**
  - Files to update: `src/hooks/useCanvas.js`
  - Handle WebSocket reconnection to Railway backend
  - Show reconnection status
  - Re-fetch initial state from Railway API on reconnect
  - Backend handles Supabase Realtime resubscription internally

**PR Checklist:**

- [ ] Open two browsers: creating shape in one appears in other
- [ ] User A starts dragging shape → shape locks for User A
- [ ] User B cannot move shape while User A has it locked
- [ ] Lock shows visual indicator (e.g., different border color)
- [ ] Lock releases automatically when User A stops dragging
- [ ] Lock releases after timeout (3-5 seconds) if User A disconnects mid-drag
- [ ] Moving shape in one browser updates in other (<100ms)
- [ ] Deleting shape in one removes from other
- [ ] Cannot delete shapes locked by other users
- [ ] Page refresh loads all existing shapes
- [ ] All users leave and return: shapes still there
- [ ] No duplicate shapes or sync issues

---

## PR #6: Multiplayer Cursors

**Branch:** `feature/cursors`  
**Goal:** Real-time cursor tracking for all connected users

### Tasks:

- [ ] **6.1: Design WebSocket Message Schema**

  - WebSocket events for cursor updates
  - Message structure:
    ```json
    {
      "type": "cursor_update",
      "data": {
        "userId": "uuid",
        "canvasId": "global-canvas-v1",
        "displayName": "string",
        "cursorColor": "string",
        "x": "number",
        "y": "number"
      }
    }
    ```

- [ ] **6.2: Create Cursor Service**

  - Files to create: `src/services/cursors.js`
  - Connect to Railway WebSocket server
  - Function: `updateCursorPosition(canvasId, userId, x, y, name, color)` - emit WebSocket event
  - Function: `subscribeToCursors(canvasId, callback)` - listen to WebSocket events
  - Function: `removeCursor(canvasId, userId)` - emit disconnect event

- [ ] **6.3: Create Cursors Hook**

  - Files to create: `src/hooks/useCursors.js`
  - Track mouse position on canvas
  - Convert screen coords to canvas coords
  - Throttle updates to ~60Hz (16ms)
  - Return: `cursors` object (keyed by userId)

- [ ] **6.4: Build Cursor Component**

  - Files to create: `src/components/Collaboration/Cursor.jsx`
  - SVG cursor icon with user color
  - Name label next to cursor
  - Smooth CSS transitions for movement

- [ ] **6.5: Integrate Cursors into Canvas**

  - Files to update: `src/components/Canvas/Canvas.jsx`
  - Add `onMouseMove` handler to Stage
  - Update cursor position via WebSocket to Railway backend
  - Render Cursor components for all other users

- [ ] **6.6: Assign User Colors**

  - Files to create: `src/utils/helpers.js`
  - Function: `generateUserColor(userId)` - randomly assigned on join
  - Color palette: 8-10 distinct colors with sufficient contrast
  - Maintain color consistency per user throughout session

- [ ] **6.7: Handle Cursor Cleanup**

  - Files to update: `src/hooks/useCursors.js`
  - Remove cursor on component unmount
  - Backend handles WebSocket disconnect event for auto-cleanup

- [ ] **6.8: Optimize Cursor Updates**
  - Files to update: `src/hooks/useCursors.js`
  - Throttle mouse events to 20-30 FPS (not full 60Hz)
  - Only send if position changed significantly (>2px)

**PR Checklist:**

- [ ] Moving mouse shows cursor to other users
- [ ] Cursor has correct user name and color
- [ ] Cursors move smoothly without jitter
- [ ] Cursor disappears when user leaves
- [ ] Updates happen within 50ms
- [ ] No performance impact with 5 concurrent cursors

---

## PR #7: User Presence System

**Branch:** `feature/presence`  
**Goal:** Show who's online and active on the canvas

### Tasks:

- [ ] **7.1: Design Presence Schema**

  - Uses PostgreSQL `presence` table in Supabase
  - WebSocket events for online/offline status
  - Combined with cursor data for efficiency
  - Backend updates `last_seen` timestamp periodically

- [ ] **7.2: Create Presence Service**

  - Files to create: `src/services/presence.js`
  - Function: `setUserOnline(canvasId, userId, name, color)` - WebSocket emit to Railway
  - Function: `setUserOffline(canvasId, userId)` - WebSocket emit to Railway
  - Function: `subscribeToPresence(canvasId, callback)` - WebSocket listener (Railway backend proxies DB updates)
  - Backend handles WebSocket disconnect to auto-set offline in database
  - No direct Supabase access from frontend

- [ ] **7.3: Create Presence Hook**

  - Files to create: `src/hooks/usePresence.js`
  - Set user online on mount
  - Subscribe to presence changes
  - Return: `onlineUsers` array

- [ ] **7.4: Build Presence List Component**

  - Files to create: `src/components/Collaboration/PresenceList.jsx`
  - Display list of online users
  - Show user color dot + name
  - Show count: "3 users online"

- [ ] **7.5: Build User Presence Badge**

  - Files to create: `src/components/Collaboration/UserPresence.jsx`
  - Avatar/initial with user color
  - Tooltip with full name

- [ ] **7.6: Add Presence to Navbar**

  - Files to update: `src/components/Layout/Navbar.jsx`
  - Include PresenceList component
  - Position in top-right corner

- [ ] **7.7: Integrate Presence System**
  - Files to update: `src/App.jsx`
  - Initialize presence when canvas loads
  - Clean up on unmount

**PR Checklist:**

- [ ] Current user appears in presence list
- [ ] Other users appear when they join
- [ ] Users disappear when they leave
- [ ] User count is accurate
- [ ] Colors match cursor colors
- [ ] Updates happen in real-time

---

## PR #8: Testing, Polish & Bug Fixes

**Branch:** `fix/testing-polish`  
**Goal:** Ensure MVP requirements are met and fix critical bugs

### Tasks:

- [ ] **8.1: Multi-User Testing**

  - Test with 2-5 concurrent users
  - Create shapes simultaneously
  - Move shapes simultaneously
  - Check for race conditions

- [ ] **8.2: Performance Testing**

  - Create 500+ shapes and test FPS
  - Test pan/zoom with many objects
  - Monitor Railway API response times
  - Monitor WebSocket message frequency
  - Optimize if needed

- [ ] **8.3: Persistence Testing**

  - All users leave canvas
  - Return and verify shapes remain
  - Test page refresh mid-edit
  - Test browser close and reopen

- [ ] **8.4: Error Handling**

  - Files to update: All service files
  - Add try/catch blocks
  - Display user-friendly error messages
  - Handle network failures gracefully

- [ ] **8.5: UI Polish**

  - Files to update: All component files
  - Consistent spacing and colors
  - Responsive button states
  - Loading states for all async operations

- [ ] **8.6: Verify Keyboard Shortcuts**

  - Files to verify: `src/components/Canvas/Canvas.jsx`
  - Delete/Backspace key: delete selected shape (already implemented in PR #4)
  - Escape key: deselect (optional enhancement)
  - Note: Undo/redo is out of scope for MVP

- [ ] **8.7: Cross-Browser Testing**

  - Test in Chrome, Firefox, Safari
  - Fix any compatibility issues

- [ ] **8.8: Document Known Issues**
  - Files to update: `README.md`
  - List any known bugs or limitations
  - Add troubleshooting section

**PR Checklist:**

- [ ] All MVP requirements pass
- [ ] No console errors
- [ ] Smooth performance on test devices
- [ ] Works in multiple browsers
- [ ] Error messages are helpful

---

## PR #9: Deployment & Final Prep

**Branch:** `deploy/production`  
**Goal:** Deploy to production and finalize documentation

### Tasks:

- [ ] **9.1: Deploy Backend to Railway**

  - Connect GitHub repo to Railway
  - Configure environment variables (Supabase keys, JWT secret)
  - Deploy Express + WebSocket server
  - Note deployed Railway URL

- [ ] **9.2: Configure Frontend Environment Variables**

  - Files to update: `.env.example`
  - Add Supabase URL and anon key (Auth only)
  - Add Railway backend REST API URL
  - Add Railway WebSocket URL
  - Document all required env vars
  - Note: Supabase credentials are for Auth only, not database access

- [ ] **9.3: Build Production Bundle**

  - Run: `npm run build`
  - Test production build locally with Railway backend
  - Check bundle size

- [ ] **9.4: Deploy Frontend to Vercel**

  - Connect GitHub repo to Vercel
  - Configure environment variables
  - Deploy React app
  - Test deployed URL

- [ ] **9.5: Set Up Supabase RLS Policies**

  - Enable Row Level Security on tables
  - Create service role policies (backend access only)
  - Backend uses service role key (not anon key)
  - RLS policies prevent direct frontend access
  - Only backend can read/write to database tables
  - Frontend can only access Auth via anon key

- [ ] **9.6: Configure CORS on Railway Backend**

  - Allow requests from Vercel frontend URL
  - Configure WebSocket CORS settings
  - Test cross-origin requests

- [ ] **9.7: Update README with Deployment Info**

  - Files to update: `README.md`
  - Add live demo link
  - Add deployment instructions for Railway and Vercel
  - Document environment variables
  - Add architecture diagram (optional)

- [ ] **9.8: Final Production Testing**

  - Test with 5 concurrent users on deployed URL
  - Verify Supabase auth works
  - Verify shapes sync via Railway backend
  - Verify cursors work via WebSocket
  - Verify presence works
  - Test Railway backend health endpoints

- [ ] **9.9: Create Demo Video Script**
  - Outline key features to demonstrate
  - Prepare 2-3 browser windows for demo

**PR Checklist:**

- [ ] Backend deployed to Railway and accessible
- [ ] Frontend deployed to Vercel and accessible via public URL
- [ ] Supabase Auth works in production
- [ ] Real-time features work in production
- [ ] WebSocket connections stable
- [ ] 5+ concurrent users tested successfully
- [ ] README has deployment links and instructions
- [ ] RLS policies configured and working

---

## MVP Completion Checklist

### Required Features:

- [ ] Basic canvas with pan/zoom (5000x5000px with boundaries)
- [ ] Rectangle shapes with gray fill (#cccccc)
- [ ] Ability to create, move, and delete objects
- [ ] Object locking (first user to drag locks the object)
- [ ] Real-time sync between 2+ users (<100ms)
- [ ] Multiplayer cursors with name labels and unique colors
- [ ] Presence awareness (who's online)
- [ ] User authentication (email/password AND Google login)
- [ ] Deployed and publicly accessible

### Performance Targets:

- [ ] 60 FPS during all interactions
- [ ] Shape changes sync in <100ms
- [ ] Cursor positions sync in <50ms
- [ ] Support 500+ simple objects without FPS drops
- [ ] Support 5+ concurrent users without degradation

### Testing Scenarios:

- [ ] 2 users editing simultaneously in different browsers
- [ ] User A drags shape → User B sees it locked and cannot move it
- [ ] Lock releases when User A stops dragging → User B can now move it
- [ ] User A deletes shape → disappears for User B immediately
- [ ] One user refreshing mid-edit confirms state persistence
- [ ] Multiple shapes created and moved rapidly to test sync performance
- [ ] Test with 500+ rectangles to verify performance target

---

## Post-MVP: Phase 2 Preparation

**Next PRs (After MVP Deadline):**

- PR #10: Multiple shape types (circles, text)
- PR #11: Shape styling (colors, borders)
- PR #12: Resize and rotate functionality
- PR #13: AI agent integration
- PR #14: Multi-select and grouping
- PR #15: Undo/redo system (Implemented locally on frontend)

### Note: Frontend Undo/Redo (local-only)
- Implemented a local undo/redo stack in `src/components/Canvas.tsx`.
- Tracks: create, delete, drag/move, resize, rotate, text edits, color/opacity/shadow/font changes, and canvas background color.
- Executes by re-sending appropriate WebSocket messages to mirror prior states; no backend changes required.
- UI: `UndoRedoPanel` renders below the active users panel and only appears after the first action.
- Shortcuts: Cmd/Ctrl+Z (undo), Shift+Cmd/Ctrl+Z or Ctrl+Y (redo).
