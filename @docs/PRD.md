# Figna CollabCanvas MVP - Product Requirements Document

**Project**: Figna - Realtime Collaborative Design Canvas  
**Goal**: Build a solid multiplayer foundation with basic canvas functionality

**Note**: AI features are intentionally not part of this MVP and will be addressed in future phases.

---

## Architecture Pattern: Backend Proxy

**IMPORTANT ARCHITECTURAL DECISION:**

This application uses a **backend proxy pattern** where:
- Frontend directly accesses **Supabase Auth only** (authentication)
- All database operations go through **Railway backend REST API**
- All real-time updates flow through **Railway WebSocket server**
- Backend subscribes to Supabase Realtime and proxies events to frontend
- Frontend has NO direct access to Supabase database or Supabase Realtime

**Benefits:** Enhanced security, business logic validation, rate limiting, centralized control

---

## Canvas Architecture (MVP)

**Single Global Canvas Approach:**

- MVP features ONE shared global canvas that all authenticated users access
- No project creation or management in MVP
- No canvas selection or dashboard
- All users collaborate on the same shared canvas space
- Future: Will add multi-project support with separate canvases per project

**URL Structure:**

- Simple route (e.g., `/canvas` or just `/`)
- No dynamic canvas IDs needed for MVP

---

## User Stories

### Primary User: Designer/Creator (MVP Priority)

- As a designer, I want to **create an account and log in** so that my work is associated with my identity
- As a designer, I want to **see a large canvas workspace** so that I have room to design
- As a designer, I want to **pan and zoom the canvas smoothly** so that I can navigate my design space
- As a designer, I want to **create basic shapes (rectangles)** so that I can build simple designs
- As a designer, I want to **move objects around the canvas** so that I can arrange my design
- As a designer, I want to **delete objects I've created** so that I can remove mistakes or unwanted elements
- As a designer, I want to **see other users' cursors with their names** so that I know who's working where
- As a designer, I want to **see changes made by other users in real-time** so that we can collaborate seamlessly
- As a designer, I want to **see who else is currently online** so that I know who I'm collaborating with
- As a designer, I want my **work to persist when I leave** so that I don't lose progress

**Note:** Focus on completing all Designer/Creator user stories before addressing Collaborator needs.

### Secondary User: Collaborator (Implement After Primary User)

- As a collaborator, I want to **join an existing canvas session** so that I can work with my team
- As a collaborator, I want to **see all existing objects when I join** so that I have full context
- As a collaborator, I want to **make changes without conflicts** so that multiple people can work simultaneously

---

## Key Features for MVP

### 1. Authentication System

**Must Have:**

- User registration via email/password (Supabase Auth)
- Google social login (Supabase Auth)
- User login/logout
- Persistent user sessions
- User display names visible to collaborators

**Display Name Logic:**

- Use Google display name if signing in via Google
- Use email prefix (before @) if signing in via email/password
- Display truncated version if name is too long (max 20 chars)

**Success Criteria:**

- Users can create accounts and maintain sessions across page refreshes
- Each user has a unique identifier and display name

### 2. Canvas Workspace

**Must Have:**

- Large canvas area (5000x5000px virtual space)
- Smooth pan functionality (click-and-drag)
- Zoom functionality (mousewheel or pinch)
- Visual grid or reference points (optional but helpful)
- Hard boundaries at canvas edges
- 60 FPS performance during all interactions

**Canvas Boundaries:**

- Objects cannot be placed or moved outside boundaries (5000x5000px)
- Drag operations stop at boundary edges
- Visual edge indicators (subtle border or shading) - optional but nice to have

**Success Criteria:**

- Canvas feels responsive and smooth
- No lag during pan/zoom operations
- Can handle at least 500 rectangles without performance degradation
- Objects are constrained within canvas boundaries

### 3. Shape Creation & Manipulation

**Must Have:**

- **Rectangles only for MVP** (circles and text out of scope)
- Ability to create new rectangles (click/drag or button)
- Ability to select shapes (click)
- Ability to move shapes (drag)
- Visual feedback for selected objects
- Fixed styling (gray fill color for all shapes)

**Selection Behavior:**

- Clicking a different shape automatically deselects the previous shape
- Only one shape can be selected at a time (multi-select out of scope)
- Clicking empty canvas deselects current selection

**Success Criteria:**

- Shape creation is intuitive and immediate
- Drag operations are smooth and responsive
- Selected state is clearly visible
- Selection behavior is predictable and consistent

### 4. Real-Time Synchronization

**Must Have:**

- Broadcast shape creation to all users (<100ms)
- Broadcast shape movements to all users (<100ms)
- Broadcast shape deletions to all users (<100ms)
- Handle concurrent edits without breaking
- Object locking: First user to select/drag an object locks it for editing
- Locked objects cannot be moved by other users simultaneously
- Visual indicator showing which user has locked an object
- Auto-release lock when user stops dragging

**Conflict Resolution Strategy:**

- First user to start moving an object acquires the lock
- Other users cannot move the locked object until lock is released
- Lock automatically releases after drag completes or timeout (3-5 seconds)
- Clear visual feedback when attempting to move a locked object

**Success Criteria:**

- Object changes visible to all users within 100ms
- No "ghost objects" or desync issues
- No simultaneous edits to the same object
- Clear visual feedback when an object is locked by another user
- Lock automatically releases after drag completes

### 5. Multiplayer Cursors

**Must Have:**

- Show cursor position for each connected user
- Display user name near cursor
- Update cursor positions in real-time (<50ms)
- Unique color per user

**Cursor Colors:**

- Randomly assigned from predefined color palette on user join
- Ensure sufficient contrast against white/light backgrounds
- Maintain color consistency per user throughout session

**Success Criteria:**

- Cursors move smoothly without jitter
- Names are readable and don't obscure content
- Cursor updates don't impact canvas performance
- Each user has a distinct, visible cursor color

### 6. Shape Deletion

**Must Have:**

- Delete selected shape with Delete/Backspace key
- Broadcast deletion to all users in real-time
- Deleted shapes removed from database immediately
- Cannot delete shapes locked by other users

**Success Criteria:**

- Deletion is instant and syncs across all clients within 100ms
- No "ghost shapes" after deletion
- Deleted shapes permanently removed from persistent storage

### 7. Presence Awareness

**Must Have:**

- List of currently connected users
- Real-time join/leave notifications
- Visual indicator of online status

**Success Criteria:**

- Users can see who's in the session at all times
- Join/leave events update immediately

### 8. State Persistence

**Must Have:**

- Save canvas state to database
- Load canvas state on page load
- Persist through disconnects and reconnects
- Multiple users can rejoin and see same state

**Success Criteria:**

- All users leave and return → work is still there
- Page refresh doesn't lose data
- New users joining see complete current state

### 9. Deployment

**Must Have:**

- Publicly accessible URL
- Stable hosting for 5+ concurrent users
- No setup required for users

**Success Criteria:**

- Anyone can access via URL
- Supports at least 5 simultaneous users
- No crashes under normal load

---

## Data Model

### PostgreSQL Tables (Supabase)

**Table: `canvases`**

```sql
CREATE TABLE canvases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canvas_id TEXT UNIQUE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
```

**Table: `shapes`**

```sql
CREATE TABLE shapes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canvas_id TEXT REFERENCES canvases(canvas_id),
  type TEXT NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  width FLOAT NOT NULL,
  height FLOAT NOT NULL,
  fill TEXT DEFAULT '#cccccc',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified_by UUID REFERENCES auth.users(id),
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),
  is_locked BOOLEAN DEFAULT false,
  locked_by UUID REFERENCES auth.users(id)
);
```

**Table: `presence` (for cursor + presence data)**

```sql
CREATE TABLE presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canvas_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  cursor_color TEXT NOT NULL,
  cursor_x FLOAT,
  cursor_y FLOAT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(canvas_id, user_id)
);
```

**Why PostgreSQL + Backend Proxy?**

- PostgreSQL: Powerful relational database for persistent canvas state (shapes, metadata)
- Backend Proxy Pattern: All database operations go through Railway backend for security and control
- Backend subscribes to Supabase Realtime and broadcasts changes to frontend via WebSocket
- WebSocket Server: Unified channel for all real-time updates (shapes, cursors, presence)
- Frontend only directly accesses Supabase Auth (authentication), nothing else

---

## Proposed Tech Stack

### Chosen Stack: Supabase + Railway Backend

**Frontend:**

- React + Vite
- Konva.js for canvas rendering
- Tailwind CSS for UI

**Backend:**

- Express.js API server (hosted on Railway)
  - Acts as database proxy for all Supabase operations
  - REST endpoints for shape CRUD operations
  - WebSocket server for all real-time updates
  - Subscribes to Supabase Realtime internally
  - JWT authentication middleware
- Supabase (backend only, not directly accessible from frontend):
  - PostgreSQL for state persistence
  - Realtime for database change notifications
  - Auth service (frontend can access directly)

**Deployment:**

- Frontend: Hosted on Cloudflare
- Backend: Railway (Express API + WebSocket server)
- Database: Supabase (PostgreSQL + Auth)

**Pros:**

- Open source and flexible
- PostgreSQL is powerful and scalable
- Supabase Auth is production-ready with social logins
- Backend proxy pattern provides security and control layer
- Can add business logic, rate limiting, and validation in backend
- Railway provides easy deployment with GitHub integration
- Unified WebSocket channel for all real-time updates
- Better for complex queries and future features
- No direct database access from frontend (more secure)

**Cons:**

- More setup than all-in-one solutions
- Need to manage backend server deployment
- Requires WebSocket connection management

**Pitfalls to Watch:**

- Backend becomes single point of failure (needs proper error handling)
- WebSocket connections need proper reconnection logic on both frontend and backend
- Railway has resource limits on free tier
- Need to validate and forward authentication tokens from frontend through backend
- Backend must efficiently proxy Supabase Realtime events to WebSocket clients
- Additional latency from proxy layer (minimize with efficient code)

---

## Recommended Stack for MVP

**Frontend:** React + Vite + Konva.js + Tailwind  
**Backend:** Express.js (Railway) + Supabase (Auth + PostgreSQL + Realtime)  
**Deployment:** Vercel (Frontend) + Railway (Backend)

**Rationale:** This stack provides the right balance of flexibility, security, and built-in features. Supabase Auth handles authentication (frontend can access directly), while the Railway backend acts as a secure proxy for all database operations. This proxy pattern allows us to add business logic, validation, and rate limiting. PostgreSQL is more flexible than document databases for future scaling. All real-time updates flow through a single WebSocket connection for consistency.

---

## Out of Scope for MVP

### Features NOT Included:

- Multiple shape types (circles, text, lines, polygons, etc.)
- Color customization for shapes
- Resize functionality
- Rotate functionality
- Multi-select
- Undo/redo
- Layer management
- Export functionality
- Shape styling (borders, shadows, gradients, etc.)
- Copy/paste
- Keyboard shortcuts beyond delete
- Mobile support
- Multiple projects or canvases
- Canvas dashboard or project list
- User profile management
- Canvas sharing/invite system

### Technical Items NOT Included:

- Operational transforms (OT) or CRDTs for conflict resolution
- Infinite canvas (using fixed 5000x5000px space)
- Canvas minimap
- Performance monitoring/analytics
- User permissions/roles
- Canvas history/versioning
- Optimistic updates (can add if time allows)
- Advanced locking mechanisms

---

## Known Limitations & Trade-offs

1. **Single Global Canvas**: All users share one global canvas (multi-project support in Phase 2)
2. **Basic Shapes**: Rectangles only (other shapes in future releases)
3. **Simple Locking**: First-come lock mechanism (not CRDT or OT)
4. **No Styling**: Fixed gray fill color for all rectangles
5. **No History**: No undo/redo or version control
6. **Desktop Only**: Not optimized for mobile/tablet
7. **Fixed Canvas Size**: 5000x5000px limit (not infinite canvas)
8. **No Permissions**: All users have equal edit access

---

## Success Metrics for MVP Checkpoint

1. **Two users can edit simultaneously** in different browsers
2. **Page refresh mid-edit** preserves all state
3. **Multiple shapes created rapidly** sync without visible lag
4. **Locking works correctly** - only one user can move an object at a time
5. **60 FPS maintained** during all interactions
6. **Deployed and accessible** via public URL

---

## MVP Testing Checklist

### Core Functionality:

- [ ] User can register with email/password
- [ ] User can sign in with Google
- [ ] User can log out and log back in
- [ ] Display name appears correctly for all users

### Canvas Operations:

- [ ] Can create rectangles on canvas
- [ ] Can select rectangles by clicking
- [ ] Can move rectangles by dragging
- [ ] Can delete rectangles with Delete/Backspace key
- [ ] Pan and zoom work smoothly
- [ ] Objects stay within canvas boundaries

### Real-Time Collaboration:

- [ ] Two users in different browsers can both create rectangles
- [ ] User A creates shape → User B sees it within 100ms
- [ ] User A moves shape → User B sees movement in real-time
- [ ] User A locks shape by dragging → User B cannot move it
- [ ] User A deletes shape → disappears for User B immediately
- [ ] Lock releases automatically after drag completes

### Multiplayer Features:

- [ ] Can see other user's cursor position
- [ ] Can see other user's name near their cursor
- [ ] Each user has a unique cursor color
- [ ] Cursor movements are smooth (no jitter)
- [ ] Join/leave presence updates immediately
- [ ] User list shows all currently connected users

### Persistence:

- [ ] Both users leave and return → all shapes persist
- [ ] Page refresh doesn't lose any data
- [ ] New user joining sees complete current state
- [ ] Deleted shapes don't reappear after refresh

### Performance:

- [ ] 60 FPS maintained with 100+ shapes on canvas
- [ ] No lag during rapid shape creation
- [ ] Cursor updates don't cause frame drops
- [ ] Pan/zoom remains smooth with many objects

---

## Risk Mitigation

**Biggest Risk:** Real-time sync breaking under load  
**Mitigation:** Test with multiple browsers early and often; use Firebase Realtime Database for high-frequency updates

**Second Risk:** Performance degradation with many objects  
**Mitigation:** Use canvas-based rendering (Konva), not DOM elements; limit to 500 shapes for MVP

**Third Risk:** Locking mechanism causing deadlocks  
**Mitigation:** Implement automatic lock timeout (3-5 seconds); clear visual feedback for lock state

**Fourth Risk:** Cursor updates causing performance issues  
**Mitigation:** Use Firebase Realtime Database (not Firestore) for cursor positions; throttle updates to 20-30 FPS
