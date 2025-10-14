# Backend Alignment Verification & Updates

## Overview
This document verifies alignment between the current frontend implementation and backend documentation (database schema, types, endpoints, architecture diagrams) to ensure smooth backend development.

**Status**: ⚠️ **Misalignments Found - Updates Required**

---

## 🔍 Verification Results

### ✅ **ALIGNED**: Database Schema
The `DATABASE_SCHEMA.sql` is **mostly aligned** with frontend needs:

**Matches:**
- ✅ `users` table supports user authentication
- ✅ `canvases` table supports canvas metadata
- ✅ `canvas_objects` table supports all shape types
- ✅ `presence` table supports real-time cursors
- ✅ `ai_commands` table ready for Phase 2
- ✅ Proper indexes and triggers in place

**Minor Adjustments Needed:**
- ⚠️ Frontend currently only uses 3 shape types (rectangle, circle, text) but schema supports 6 types (includes line, polygon, image) - **This is fine for future expansion**
- ⚠️ Canvas dimensions not enforced on frontend - need to add width/height to canvas state

### ⚠️ **MISALIGNED**: WebSocket Message Types

**Current Frontend Implementation**:
```typescript
// types/websocket.ts
export type WSMessageType =
  | 'SHAPE_CREATE'      // ← Frontend uses this
  | 'SHAPE_UPDATE'      // ← Frontend uses this
  | 'SHAPE_DELETE'      // ← Frontend uses this
  | 'SHAPES_BATCH_UPDATE'
  | 'CURSOR_MOVE'
  | 'USER_JOIN'
  | 'USER_LEAVE'
  | 'PRESENCE_UPDATE'
  | 'CANVAS_SYNC'
  | 'AI_COMMAND'
  | 'PING'
  | 'PONG'
  | 'ERROR';
```

**Backend Documentation (endpoint-types.ts)**:
```typescript
// MISALIGNED - Uses different names
export type WSCanvasOperationMessage = {
  type: 'OBJECT_CREATED'     // ← Backend doc says this
       | 'OBJECT_UPDATED'    // ← Backend doc says this
       | 'OBJECT_DELETED'    // ← Backend doc says this
       | 'OBJECTS_BATCH';
  ...
}
```

**🔧 Required Fix**: Update backend types to match frontend message types.

### ⚠️ **MISALIGNED**: User Type Definitions

**Frontend Implementation** (types/user.ts):
```typescript
export interface User {
  id: string;              // ← Frontend uses 'id'
  name: string;
  email: string;
  avatar?: string;
  color: string;           // ← hex color for cursor
  isOnline: boolean;
  lastSeen: number;
  createdAt: number;
}
```

**Backend Documentation** (database-types.ts):
```typescript
export type GauntletUserType = {
  id: string;              // ✅ Matches
  username: string;        // ⚠️ Frontend doesn't use 'username'
  email: string;           // ✅ Matches
  displayName?: string;    // ⚠️ Frontend uses 'name' instead
  avatarColor: string;     // ⚠️ Frontend uses 'color' instead
  avatarUrl?: string;      // ⚠️ Frontend uses 'avatar' instead
  isOnline?: boolean;      // ✅ Matches
  lastSeenAt?: string;     // ⚠️ Frontend uses 'lastSeen' as number
  ...
}
```

**🔧 Required Fix**: Align field names between frontend and backend.

### ✅ **ALIGNED**: Shape/Object Types

Frontend and backend both support the core shape structure:
- ✅ Rectangle, Circle, Text shapes
- ✅ Position (x, y), dimensions (width, height, radius)
- ✅ Rotation, color, opacity
- ✅ Z-index for layering
- ✅ Creator tracking (createdBy, createdAt)

### ⚠️ **PARTIALLY ALIGNED**: Canvas State

**Frontend Canvas State**:
```typescript
export interface CanvasState {
  shapes: Record<string, Shape>;     // ✅ Stored in DB as canvas_objects
  selectedShapeIds: string[];        // ❌ Not stored in DB
  viewport: ViewportState;           // ✅ Partially stored (x, y, zoom)
  isDrawing: boolean;                // ❌ Client-only state
  currentTool: ShapeType | 'select' | 'pan'; // ❌ Client-only state
  currentColor: string;              // ❌ User preference
  gridEnabled: boolean;              // ✅ Stored in canvases table
  snapToGrid: boolean;               // ✅ Stored in canvases table
  history: CanvasHistoryState;       // ✅ Stored in canvas_versions
}
```

**Analysis**: Mix of persistent and transient state is correct - no changes needed.

---

## 🔧 Required Backend Updates

### 1. Update WebSocket Message Types (endpoint-types.ts)

**REPLACE**:
```typescript
export type WSCanvasOperationMessage = {
  type: 'OBJECT_CREATED' | 'OBJECT_UPDATED' | 'OBJECT_DELETED' | 'OBJECTS_BATCH';
  // ...
}
```

**WITH**:
```typescript
export type WSCanvasOperationMessage = {
  type: 'SHAPE_CREATE' | 'SHAPE_UPDATE' | 'SHAPE_DELETE' | 'SHAPES_BATCH_UPDATE';
  userId: string;
  canvasId: string;
  messageId: string;
  timestamp: number;
  data: {
    shapeId?: string;
    shape?: GauntletCanvasObject;
    updates?: Partial<GauntletCanvasObject>;
    operations?: Array<{
      type: 'create' | 'update' | 'delete';
      shapeId: string;
      shape?: GauntletCanvasObject;
      updates?: Partial<GauntletCanvasObject>;
    }>;
  };
}
```

### 2. Add Type Mapping Helpers

Create mapping functions for frontend<->backend type conversion:

```typescript
// utils/typeMappers.ts

/**
 * Maps frontend User to backend GauntletUserType
 */
export function mapUserToBackend(user: User): Partial<GauntletUserType> {
  return {
    id: user.id,
    username: user.email.split('@')[0], // derive from email
    email: user.email,
    displayName: user.name,
    avatarColor: user.color,
    avatarUrl: user.avatar,
    isOnline: user.isOnline,
    lastSeenAt: new Date(user.lastSeen).toISOString(),
    createdAt: new Date(user.createdAt).toISOString(),
  };
}

/**
 * Maps backend GauntletUserType to frontend User
 */
export function mapUserToFrontend(dbUser: GauntletUserType): User {
  return {
    id: dbUser.id,
    name: dbUser.displayName || dbUser.username,
    email: dbUser.email,
    avatar: dbUser.avatarUrl,
    color: dbUser.avatarColor,
    isOnline: dbUser.isOnline || false,
    lastSeen: dbUser.lastSeenAt ? new Date(dbUser.lastSeenAt).getTime() : Date.now(),
    createdAt: dbUser.createdAt ? new Date(dbUser.createdAt).getTime() : Date.now(),
  };
}

/**
 * Maps frontend Shape to backend GauntletCanvasObject
 */
export function mapShapeToBackend(shape: Shape, canvasId: string): Partial<GauntletCanvasObject> {
  const base = {
    id: shape.id,
    canvasId,
    type: shape.type as GauntletCanvasObjectShape,
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
    rotation: shape.rotation,
    color: shape.color,
    opacity: shape.opacity,
    zIndex: shape.zIndex,
    isLocked: shape.isLocked,
    isVisible: !shape.isLocked, // implied
    createdBy: shape.createdBy,
    createdAt: new Date(shape.createdAt).toISOString(),
    updatedAt: new Date(shape.updatedAt).toISOString(),
  };

  if (shape.type === 'rectangle') {
    return {
      ...base,
      strokeWidth: shape.strokeWidth,
      strokeColor: shape.strokeColor,
      metadata: JSON.stringify({ cornerRadius: shape.cornerRadius }),
    };
  } else if (shape.type === 'circle') {
    return {
      ...base,
      radius: shape.radius,
      strokeWidth: shape.strokeWidth,
      strokeColor: shape.strokeColor,
    };
  } else if (shape.type === 'text') {
    return {
      ...base,
      textContent: shape.text,
      fontSize: shape.fontSize,
      fontFamily: shape.fontFamily,
      fontWeight: shape.fontWeight,
      textAlign: shape.textAlign,
    };
  }

  return base;
}

/**
 * Maps backend GauntletCanvasObject to frontend Shape
 */
export function mapShapeToFrontend(dbObject: GauntletCanvasObject): Shape | null {
  const base = {
    id: dbObject.id,
    x: dbObject.x,
    y: dbObject.y,
    width: dbObject.width || 100,
    height: dbObject.height || 100,
    rotation: dbObject.rotation,
    color: dbObject.color,
    opacity: dbObject.opacity || 1,
    zIndex: dbObject.zIndex,
    isSelected: false, // transient state
    isLocked: dbObject.isLocked || false,
    createdBy: dbObject.createdBy,
    createdAt: new Date(dbObject.createdAt || Date.now()).getTime(),
    updatedAt: new Date(dbObject.updatedAt || Date.now()).getTime(),
  };

  if (dbObject.type === GauntletCanvasObjectShape.RECTANGLE) {
    const metadata = dbObject.metadata ? JSON.parse(dbObject.metadata) : {};
    return {
      ...base,
      type: 'rectangle',
      cornerRadius: metadata.cornerRadius || 0,
      strokeWidth: dbObject.strokeWidth || 0,
      strokeColor: dbObject.strokeColor || '#000000',
    } as RectangleShape;
  } else if (dbObject.type === GauntletCanvasObjectShape.CIRCLE) {
    return {
      ...base,
      type: 'circle',
      radius: dbObject.radius || 50,
      strokeWidth: dbObject.strokeWidth || 0,
      strokeColor: dbObject.strokeColor || '#000000',
    } as CircleShape;
  } else if (dbObject.type === GauntletCanvasObjectShape.TEXT) {
    return {
      ...base,
      type: 'text',
      text: dbObject.textContent || '',
      fontSize: dbObject.fontSize || 16,
      fontFamily: dbObject.fontFamily || 'System',
      fontWeight: (dbObject.fontWeight as 'normal' | 'bold') || 'normal',
      textAlign: (dbObject.textAlign as 'left' | 'center' | 'right') || 'left',
    } as TextShape;
  }

  return null; // Unsupported type
}
```

### 3. Update Architecture Diagrams

Update `architecture-mermaid.md` to reflect:
- ✅ Simplified user system (removed legacy slices)
- ✅ Correct WebSocket message types
- ✅ Current Redux state structure
- ✅ Frontend field names

---

## 📋 Backend Implementation Checklist

### Phase 1: Core Backend (Priority: Critical)

- [ ] **Database Setup**
  - [ ] Run DATABASE_SCHEMA.sql to create tables
  - [ ] Set up connection pooling (PgBouncer recommended)
  - [ ] Configure PostgreSQL for optimal performance
  - [ ] Set up automated backups

- [ ] **Authentication Service**
  - [ ] Implement JWT-based authentication
  - [ ] POST /api/gauntlet/auth/login endpoint
  - [ ] POST /api/gauntlet/auth/register endpoint
  - [ ] POST /api/gauntlet/auth/refresh endpoint
  - [ ] GET /api/gauntlet/auth/profile endpoint
  - [ ] Integrate with Google OAuth (demo mode → real OAuth)

- [ ] **Canvas REST API**
  - [ ] GET /api/gauntlet/canvas (list canvases)
  - [ ] POST /api/gauntlet/canvas (create canvas)
  - [ ] GET /api/gauntlet/canvas/:id (get canvas with objects)
  - [ ] PUT /api/gauntlet/canvas/:id (update canvas metadata)
  - [ ] DELETE /api/gauntlet/canvas/:id (soft delete canvas)

- [ ] **WebSocket Server**
  - [ ] Connection management with authentication
  - [ ] Room/canvas-based broadcasting
  - [ ] Handle SHAPE_CREATE messages
  - [ ] Handle SHAPE_UPDATE messages
  - [ ] Handle SHAPE_DELETE messages
  - [ ] Handle SHAPES_BATCH_UPDATE messages
  - [ ] Handle CURSOR_MOVE messages (throttled)
  - [ ] Handle USER_JOIN/USER_LEAVE messages
  - [ ] Handle CANVAS_SYNC requests
  - [ ] PING/PONG heartbeat mechanism
  - [ ] Automatic cleanup of stale presence records

- [ ] **Presence Tracking**
  - [ ] Real-time cursor position updates
  - [ ] User online/offline status
  - [ ] Automated presence cleanup (30s TTL)
  - [ ] Presence broadcasting to room members

- [ ] **State Persistence**
  - [ ] Save shapes to database on every operation
  - [ ] Implement optimistic locking for concurrent edits
  - [ ] Canvas snapshot creation (auto-save every 5 minutes)
  - [ ] State recovery on reconnection

### Phase 2: AI Integration (Post-MVP)

- [ ] **AI Service**
  - [ ] OpenAI API integration
  - [ ] Natural language command parsing
  - [ ] Function calling for canvas operations
  - [ ] Handle AI_COMMAND messages via WebSocket
  - [ ] Stream AI responses to frontend
  - [ ] Store AI command history

- [ ] **Advanced Features**
  - [ ] Canvas version history
  - [ ] Collaborator invitations
  - [ ] Comments system
  - [ ] Activity logging
  - [ ] Export/import canvas

---

## 🎯 Recommended Backend Stack

```
Backend Stack:
├── Server: Node.js (Express or Fastify)
├── WebSocket: ws or Socket.io
├── Database: PostgreSQL 14+
├── ORM: Prisma or TypeORM
├── Authentication: JWT + Passport.js
├── AI: OpenAI API (GPT-4)
├── Testing: Jest + Supertest
└── Deployment: Docker + Kubernetes/Railway/Fly.io
```

---

## 📝 Backend Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gauntletaidb
DATABASE_POOL_SIZE=20

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/gauntlet/auth/google/callback

# WebSocket
WS_PORT=8080
WS_PATH=/ws/gauntlet

# AI Service
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4-turbo-preview

# CORS
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🔄 Frontend-Backend Integration Points

### 1. Authentication Flow
```
Frontend                 Backend
   ↓                        ↓
Login Screen  →  POST /api/gauntlet/auth/login
   ↓                        ↓
Store JWT     ←  {token, user, expiresAt}
   ↓                        ↓
Set Headers   →  Authorization: Bearer <token>
```

### 2. Canvas Connection Flow
```
Frontend                 Backend
   ↓                        ↓
Connect WS    →  WSS /ws/gauntlet/canvas/:id
   ↓                        ↓
Auth Token    →  {token: 'Bearer ...'}
   ↓                        ↓
Join Room     ←  {type: 'CANVAS_SYNC', data: {...}}
   ↓                        ↓
Render Canvas ←  Continuous updates
```

### 3. Shape Operation Flow
```
Frontend                 Backend
   ↓                        ↓
User creates  →  {type: 'SHAPE_CREATE', data: {shape}}
   ↓                        ↓
Optimistic UI →  Save to DB
   ↓                        ↓
Confirmation  ←  Broadcast to all users
```

---

## ✅ Verification Complete

**Summary**:
- ✅ Database schema is ready
- ⚠️ WebSocket message types need alignment
- ⚠️ User type field names need mapping
- ✅ Shape types are compatible
- ✅ Canvas state structure is appropriate

**Next Steps**:
1. Update `endpoint-types.ts` with correct WebSocket message types
2. Create type mapper utilities for frontend↔backend conversion
3. Begin backend implementation with authentication and WebSocket server
4. Test integration with current frontend

---

*Document created: January 2025*
*Frontend Version: Phase 1 MVP Complete*

