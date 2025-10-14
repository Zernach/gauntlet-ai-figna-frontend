# Type Mappers Reference - Frontend ↔ Backend

## Overview
This document provides reference implementations for converting between frontend types and backend database types. These mappers should be implemented on the backend server.

---

## User Type Mapping

### Frontend → Backend

```typescript
// Backend: utils/typeMappers.ts

import type { User } from '@/types/user'; // Frontend type
import type { GauntletUserType } from '@/@landscapesupply/types/gauntletai/database-types';

/**
 * Maps frontend User to backend GauntletUserType
 */
export function mapUserToBackend(user: User): Partial<GauntletUserType> {
  return {
    id: user.id,
    username: user.email.split('@')[0], // Derive username from email
    email: user.email,
    displayName: user.name,
    avatarColor: user.color,
    avatarUrl: user.avatar,
    isOnline: user.isOnline,
    lastSeenAt: new Date(user.lastSeen).toISOString(),
    createdAt: new Date(user.createdAt).toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
    preferences: JSON.stringify({}), // Empty for now
  };
}
```

### Backend → Frontend

```typescript
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
```

---

## Shape Type Mapping

### Frontend → Backend

```typescript
import type { Shape, RectangleShape, CircleShape, TextShape } from '@/types/canvas';
import type { GauntletCanvasObject, GauntletCanvasObjectShape } from '@/@landscapesupply/types/gauntletai/database-types';

/**
 * Maps frontend Shape to backend GauntletCanvasObject
 */
export function mapShapeToBackend(
  shape: Shape,
  canvasId: string
): Partial<GauntletCanvasObject> {
  const base = {
    id: shape.id,
    canvasId,
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
    rotation: shape.rotation,
    color: shape.color,
    opacity: shape.opacity,
    zIndex: shape.zIndex,
    isLocked: shape.isLocked,
    isVisible: true, // Always visible in frontend
    createdBy: shape.createdBy,
    createdAt: new Date(shape.createdAt).toISOString(),
    updatedAt: new Date(shape.updatedAt).toISOString(),
    isDeleted: false,
  };

  // Type-specific fields
  if (shape.type === 'rectangle') {
    return {
      ...base,
      type: GauntletCanvasObjectShape.RECTANGLE,
      strokeWidth: shape.strokeWidth,
      strokeColor: shape.strokeColor,
      // Store cornerRadius in metadata since it's not a direct DB field
      metadata: JSON.stringify({ cornerRadius: shape.cornerRadius }),
    };
  } else if (shape.type === 'circle') {
    return {
      ...base,
      type: GauntletCanvasObjectShape.CIRCLE,
      radius: shape.radius,
      width: null, // Circles don't use width/height
      height: null,
      strokeWidth: shape.strokeWidth,
      strokeColor: shape.strokeColor,
    };
  } else if (shape.type === 'text') {
    return {
      ...base,
      type: GauntletCanvasObjectShape.TEXT,
      textContent: shape.text,
      fontSize: shape.fontSize,
      fontFamily: shape.fontFamily,
      fontWeight: shape.fontWeight,
      textAlign: shape.textAlign,
    };
  }

  return base;
}
```

### Backend → Frontend

```typescript
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
    isSelected: false, // Transient client-side state
    isLocked: dbObject.isLocked || false,
    createdBy: dbObject.createdBy,
    createdAt: new Date(dbObject.createdAt || Date.now()).getTime(),
    updatedAt: new Date(dbObject.updatedAt || Date.now()).getTime(),
  };

  // Parse type and add type-specific fields
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

  // Unsupported type (line, polygon, image not implemented in frontend yet)
  return null;
}
```

---

## Presence Type Mapping

### Frontend → Backend

```typescript
import type { UserCursor, UserPresence } from '@/types/user';
import type { GauntletPresence } from '@/@landscapesupply/types/gauntletai/database-types';

/**
 * Maps frontend UserCursor to backend Presence entry
 */
export function mapCursorToPresence(
  cursor: UserCursor,
  canvasId: string,
  connectionId: string
): Partial<GauntletPresence> {
  return {
    userId: cursor.userId,
    canvasId,
    cursorX: cursor.x,
    cursorY: cursor.y,
    color: cursor.color,
    isActive: true,
    lastHeartbeat: new Date().toISOString(),
    connectionId,
  };
}

/**
 * Maps frontend UserPresence to backend Presence update
 */
export function mapPresenceToBackend(
  presence: UserPresence,
  canvasId: string
): Partial<GauntletPresence> {
  return {
    userId: presence.userId,
    canvasId,
    isActive: presence.isOnline,
    selectedObjectIds: presence.selectedShapeId 
      ? JSON.stringify([presence.selectedShapeId])
      : JSON.stringify([]),
    lastHeartbeat: new Date(presence.lastSeen).toISOString(),
  };
}
```

### Backend → Frontend

```typescript
/**
 * Maps backend Presence to frontend UserCursor
 */
export function mapPresenceToCursor(
  dbPresence: GauntletPresence,
  userName: string
): UserCursor {
  return {
    userId: dbPresence.userId,
    x: dbPresence.cursorX,
    y: dbPresence.cursorY,
    color: dbPresence.color || '#3B82F6',
    userName,
    timestamp: new Date(dbPresence.lastHeartbeat).getTime(),
  };
}

/**
 * Maps backend Presence to frontend UserPresence
 */
export function mapPresenceToFrontend(dbPresence: GauntletPresence): UserPresence {
  const selectedIds = dbPresence.selectedObjectIds 
    ? JSON.parse(dbPresence.selectedObjectIds)
    : [];
    
  return {
    userId: dbPresence.userId,
    isOnline: dbPresence.isActive,
    lastSeen: new Date(dbPresence.lastHeartbeat).getTime(),
    currentCanvasId: dbPresence.canvasId,
    isEditing: selectedIds.length > 0,
    selectedShapeId: selectedIds[0] || null,
  };
}
```

---

## Canvas Type Mapping

### Frontend → Backend

```typescript
import type { ViewportState } from '@/types/canvas';
import type { GauntletCanvasType } from '@/@landscapesupply/types/gauntletai/database-types';

/**
 * Maps frontend viewport settings to backend Canvas update
 */
export function mapViewportToBackend(viewport: ViewportState): Partial<GauntletCanvasType> {
  return {
    viewportX: viewport.offsetX,
    viewportY: viewport.offsetY,
    viewportZoom: viewport.scale,
    width: viewport.canvasWidth,
    height: viewport.canvasHeight,
    updatedAt: new Date().toISOString(),
  };
}
```

### Backend → Frontend

```typescript
/**
 * Maps backend Canvas to frontend ViewportState
 */
export function mapCanvasToViewport(dbCanvas: GauntletCanvasType): ViewportState {
  return {
    offsetX: dbCanvas.viewportX,
    offsetY: dbCanvas.viewportY,
    scale: dbCanvas.viewportZoom,
    canvasWidth: dbCanvas.width || 1920,
    canvasHeight: dbCanvas.height || 1080,
  };
}
```

---

## WebSocket Message Mapping

### Frontend → Backend

```typescript
import type { WSMessage } from '@/types/websocket';
import type { WSCanvasOperationMessage } from '@/@landscapesupply/types/gauntletai/endpoint-types';

/**
 * Maps frontend WebSocket message to backend format
 * Note: Frontend and backend message types are now aligned, so minimal mapping needed
 */
export function mapWSMessageToBackend(
  message: WSMessage,
  canvasId: string
): WSCanvasOperationMessage | null {
  // Frontend and backend now use same message types (SHAPE_CREATE, SHAPE_UPDATE, etc.)
  // Just ensure all required fields are present
  
  if (
    message.type === 'SHAPE_CREATE' ||
    message.type === 'SHAPE_UPDATE' ||
    message.type === 'SHAPE_DELETE' ||
    message.type === 'SHAPES_BATCH_UPDATE'
  ) {
    return {
      type: message.type,
      userId: message.userId,
      canvasId,
      messageId: message.messageId,
      timestamp: message.timestamp,
      data: message.data,
    } as WSCanvasOperationMessage;
  }
  
  return null;
}
```

---

## Usage Example in Backend Route Handler

```typescript
// Backend: routes/canvas.ts

import express from 'express';
import { mapShapeToBackend, mapShapeToFrontend } from '../utils/typeMappers';
import { db } from '../db';

const router = express.Router();

// GET /api/gauntlet/canvas/:id
router.get('/:id', async (req, res) => {
  const canvasId = req.params.id;
  
  // Fetch from database
  const dbCanvas = await db.canvases.findUnique({
    where: { id: canvasId },
    include: { objects: true },
  });
  
  if (!dbCanvas) {
    return res.status(404).json({ error: 'Canvas not found' });
  }
  
  // Map objects to frontend format
  const shapes = dbCanvas.objects
    .map(mapShapeToFrontend)
    .filter(shape => shape !== null);
  
  res.json({
    canvas: dbCanvas,
    objects: shapes,
  });
});

// WebSocket handler example
wss.on('connection', (ws, req) => {
  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'SHAPE_CREATE') {
      const { shape } = message.data;
      
      // Map to backend format
      const dbShape = mapShapeToBackend(shape, message.canvasId);
      
      // Save to database
      await db.canvas_objects.create({ data: dbShape });
      
      // Broadcast to other users
      broadcast(message.canvasId, message, ws);
    }
  });
});
```

---

## Field Name Reference Table

| Frontend Field | Backend Field | Notes |
|----------------|---------------|-------|
| `id` | `id` | ✅ Same |
| `name` | `displayName` | User's display name |
| `email` | `email` | ✅ Same |
| `color` | `avatarColor` | Hex color for cursor |
| `avatar` | `avatarUrl` | URL to avatar image |
| `lastSeen` | `lastSeenAt` | Timestamp (number vs ISO string) |
| `createdAt` | `createdAt` | Timestamp (number vs ISO string) |
| `isOnline` | `isOnline` | ✅ Same |
| `shape.text` | `textContent` | For text shapes |
| `shape.strokeWidth` | `strokeWidth` | ✅ Same |
| `shape.strokeColor` | `strokeColor` | ✅ Same |

---

## Important Notes

1. **Timestamps**: Frontend uses `number` (milliseconds), backend uses ISO strings
2. **Optional Fields**: Frontend types are stricter - always provide defaults when mapping
3. **JSON Fields**: Backend uses JSON strings for arrays/objects (e.g., `selectedObjectIds`)
4. **Null Handling**: Always check for null/undefined when mapping
5. **Type Safety**: Use TypeScript strict mode to catch mapping errors

---

*Reference implementation for backend development*
*Last updated: January 2025*

