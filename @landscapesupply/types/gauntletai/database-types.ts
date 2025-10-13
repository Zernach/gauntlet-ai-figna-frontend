import {
  ANALYTIC_EVENT_FIELDS,
  DEVICE_FIELDS,
  ERROR_FIELDS,
  REFERRER_FIELDS,
  SHARED_FIELDS,
} from '../shared-types';

export type GauntletAnalyticEventType = SHARED_FIELDS &
  DEVICE_FIELDS &
  ANALYTIC_EVENT_FIELDS & {
    analyticEventId: string;
    userId?: GauntletUserType['userId'];
    referrerId?: GauntletReferrerType['referrerId'];
    // RELATIONSHIPS
    analyticEventUser?: GauntletUserType;
    analyticEventReferrer?: GauntletReferrerType;
  };

export type GauntletAuthenticationType = SHARED_FIELDS & {
  authenticationId: string;
  userId?: GauntletUserType['userId'];
  identityToken?: string;
  authorizationCode?: string;
  cookie?: string;
  expiresAt?: string;
  jwtId?: string;
  deviceId?: string;
  revokedAt?: string;
  replacedByAuthenticationId?: string;
  revokedReason?: string;
  // RELATIONSHIPS
  authenticationUser?: GauntletUserType;
};

export type GauntletErrorType = SHARED_FIELDS &
  ERROR_FIELDS & {
    errorId: string;
    userId?: GauntletUserType['userId'];
    // RELATIONSHIPS
    errorUser?: GauntletUserType;
  };

export type GauntletReferrerType = SHARED_FIELDS &
  REFERRER_FIELDS & {
    referrerId: string;
    userId?: GauntletUserType['userId'];
    // RELATIONSHIPS
    referrerUser?: GauntletUserType;
    referrerAnalyticEvents?: GauntletAnalyticEventType[];
  };

export type GauntletUserType = SHARED_FIELDS & {
  userId: string;
  appleUuid?: string;
  googleUuid?: string;
  email?: string;
  name?: string;
  // RELATIONSHIPS
  userAnalyticEvents?: GauntletAnalyticEventType[];
  userErrors?: GauntletErrorType[];
  userAuthentications?: GauntletAuthenticationType[];
  userReferrers?: GauntletReferrerType[];
};

// ==========================================
// COLLABCANVAS DATABASE TYPES
// ==========================================

/**
 * Canvas Shape Types
 */
export enum GauntletCanvasObjectShape {
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  TEXT = 'text',
  LINE = 'line',
  POLYGON = 'polygon',
  IMAGE = 'image',
}

/**
 * AI Command Status
 */
export enum GauntletAICommandStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Canvas Collaborator Role
 */
export enum GauntletCanvasCollaboratorRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

/**
 * Users Table
 * Stores user account information for canvas collaboration
 */
export type GauntletCanvasUserType = SHARED_FIELDS & {
  id: string; // uuid PK
  username: string;
  email: string;
  displayName?: string;
  avatarColor: string; // hex color for cursor representation
  avatarUrl?: string;
  lastSeenAt?: string; // timestamp
  isOnline?: boolean;
  preferences?: string; // JSON stringified user preferences
  // RELATIONSHIPS
  ownedCanvases?: GauntletCanvasType[];
  createdObjects?: GauntletCanvasObject[];
  presenceRecords?: GauntletPresence[];
  aiCommands?: GauntletAICommand[];
  collaborations?: GauntletCanvasCollaborator[];
};

/**
 * Canvases Table
 * Stores canvas metadata and settings
 */
export type GauntletCanvasType = SHARED_FIELDS & {
  id: string; // uuid PK
  name: string;
  description?: string;
  ownerId: GauntletCanvasUserType['id']; // FK to users
  isPublic: boolean;
  isTemplate?: boolean;
  thumbnailUrl?: string;
  viewportX: number; // default view position
  viewportY: number;
  viewportZoom: number; // default zoom level
  backgroundColor?: string; // hex color
  gridEnabled?: boolean;
  gridSize?: number;
  snapToGrid?: boolean;
  width?: number; // canvas dimensions
  height?: number;
  tags?: string; // JSON array of tags
  lastAccessedAt?: string; // timestamp
  // RELATIONSHIPS
  owner?: GauntletCanvasUserType;
  objects?: GauntletCanvasObject[];
  presenceRecords?: GauntletPresence[];
  aiCommands?: GauntletAICommand[];
  versions?: GauntletCanvasVersion[];
  collaborators?: GauntletCanvasCollaborator[];
};

/**
 * Canvas Objects Table
 * Stores individual shapes and elements on the canvas
 */
export type GauntletCanvasObject = SHARED_FIELDS & {
  id: string; // uuid PK
  canvasId: GauntletCanvasType['id']; // FK to canvases
  type: GauntletCanvasObjectShape; // enum
  x: number; // position
  y: number;
  width?: number; // null for circles
  height?: number; // null for circles
  radius?: number; // for circles
  rotation: number; // degrees
  color: string; // hex color
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number; // 0-1
  textContent?: string; // for text type
  fontSize?: number; // for text type
  fontFamily?: string;
  fontWeight?: string; // normal, bold, etc.
  textAlign?: string; // left, center, right
  zIndex: number; // layer order
  isLocked?: boolean;
  isVisible?: boolean;
  groupId?: string; // for grouping objects
  metadata?: string; // JSON for additional properties
  createdBy: GauntletCanvasUserType['id']; // FK to users
  lastModifiedBy?: GauntletCanvasUserType['id'];
  // RELATIONSHIPS
  canvas?: GauntletCanvasType;
  creator?: GauntletCanvasUserType;
  modifier?: GauntletCanvasUserType;
};

/**
 * Presence Table
 * Tracks real-time user presence and cursor positions
 * Ephemeral - auto-delete after 30s of inactivity
 */
export type GauntletPresence = {
  id: string; // uuid PK
  userId: GauntletCanvasUserType['id']; // FK to users
  canvasId: GauntletCanvasType['id']; // FK to canvases
  cursorX: number;
  cursorY: number;
  viewportX?: number; // current viewport position
  viewportY?: number;
  viewportZoom?: number;
  selectedObjectIds?: string; // JSON array of selected object IDs
  isActive: boolean;
  color?: string; // cursor color override
  lastHeartbeat: string; // timestamp - TTL 30s
  connectionId?: string; // WebSocket connection identifier
  // RELATIONSHIPS
  user?: GauntletCanvasUserType;
  canvas?: GauntletCanvasType;
};

/**
 * AI Commands Table
 * Stores AI command history and execution results
 */
export type GauntletAICommand = SHARED_FIELDS & {
  id: string; // uuid PK
  canvasId: GauntletCanvasType['id']; // FK to canvases
  userId: GauntletCanvasUserType['id']; // FK to users
  commandText: string; // original natural language command
  parsedIntent?: string; // AI-interpreted intent
  status: GauntletAICommandStatus; // enum
  resultObjectIds?: string; // JSON array of created/modified object IDs
  operationsExecuted?: string; // JSON array of operations performed
  errorMessage?: string; // if failed
  executionTimeMs?: number;
  tokensUsed?: number;
  model?: string; // AI model used
  completedAt?: string; // timestamp
  cancelledAt?: string;
  // RELATIONSHIPS
  canvas?: GauntletCanvasType;
  user?: GauntletCanvasUserType;
};

/**
 * Canvas Versions Table
 * Stores canvas snapshots for history/recovery
 */
export type GauntletCanvasVersion = SHARED_FIELDS & {
  id: string; // uuid PK
  canvasId: GauntletCanvasType['id']; // FK to canvases
  versionNumber: number; // incremental version number
  snapshotData: string; // JSON full canvas state
  objectCount?: number;
  changeDescription?: string;
  createdBy: GauntletCanvasUserType['id']; // FK to users
  isAutoSave?: boolean;
  isNamedVersion?: boolean; // user explicitly saved this version
  versionName?: string;
  // RELATIONSHIPS
  canvas?: GauntletCanvasType;
  creator?: GauntletCanvasUserType;
};

/**
 * Canvas Collaborators Table
 * Manages canvas sharing and permissions
 */
export type GauntletCanvasCollaborator = SHARED_FIELDS & {
  id: string; // uuid PK
  canvasId: GauntletCanvasType['id']; // FK to canvases
  userId: GauntletCanvasUserType['id']; // FK to users
  role: GauntletCanvasCollaboratorRole; // enum
  invitedBy?: GauntletCanvasUserType['id']; // FK to users
  invitedAt?: string; // timestamp
  acceptedAt?: string;
  lastAccessedAt?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canShare?: boolean;
  canExport?: boolean;
  // RELATIONSHIPS
  canvas?: GauntletCanvasType;
  user?: GauntletCanvasUserType;
  inviter?: GauntletCanvasUserType;
};

/**
 * Canvas Comments Table (Optional - for future)
 * Allows users to comment on specific canvas areas or objects
 */
export type GauntletCanvasComment = SHARED_FIELDS & {
  id: string; // uuid PK
  canvasId: GauntletCanvasType['id']; // FK to canvases
  userId: GauntletCanvasUserType['id']; // FK to users
  objectId?: GauntletCanvasObject['id']; // FK to canvas_objects (optional)
  content: string;
  x?: number; // position if not tied to object
  y?: number;
  isResolved?: boolean;
  resolvedBy?: GauntletCanvasUserType['id'];
  resolvedAt?: string;
  parentCommentId?: string; // for threaded comments
  // RELATIONSHIPS
  canvas?: GauntletCanvasType;
  user?: GauntletCanvasUserType;
  canvasObject?: GauntletCanvasObject;
  resolver?: GauntletCanvasUserType;
  parentComment?: GauntletCanvasComment;
  replies?: GauntletCanvasComment[];
};

/**
 * Canvas Activity Log Table
 * Tracks all canvas activities for audit trail
 */
export type GauntletCanvasActivity = SHARED_FIELDS & {
  id: string; // uuid PK
  canvasId: GauntletCanvasType['id']; // FK to canvases
  userId: GauntletCanvasUserType['id']; // FK to users
  activityType: string; // e.g., 'object_created', 'object_deleted', 'canvas_shared'
  objectId?: string; // related object ID if applicable
  details?: string; // JSON with activity details
  ipAddress?: string;
  userAgent?: string;
  // RELATIONSHIPS
  canvas?: GauntletCanvasType;
  user?: GauntletCanvasUserType;
};
