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
    userId?: string;
    referrerId?: GauntletReferrerType['referrerId'];
    // RELATIONSHIPS
    analyticEventUser?: GauntletUserType;
    analyticEventReferrer?: GauntletReferrerType;
  };

export type GauntletAuthenticationType = SHARED_FIELDS & {
  authenticationId: string;
  userId?: string;
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
    userId?: string;
    // RELATIONSHIPS
    errorUser?: GauntletUserType;
  };

export type GauntletReferrerType = SHARED_FIELDS &
  REFERRER_FIELDS & {
    referrerId: string;
    userId?: string;
    // RELATIONSHIPS
    referrerUser?: GauntletUserType;
    referrerAnalyticEvents?: GauntletAnalyticEventType[];
  };

/**
 * @deprecated Use GauntletUserType instead - types have been consolidated
 * Legacy type alias for backward compatibility
 */
export type GauntletLegacyUserType = GauntletUserType & {
  userId: string; // Alias for id
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
 * Users Table - Consolidated user type for canvas collaboration
 * Replaces both legacy GauntletUserType and GauntletCanvasUserType
 */
export type GauntletUserType = SHARED_FIELDS & {
  // Primary fields
  id: string; // uuid PK (replaces userId)
  username: string;
  email: string;
  displayName?: string;
  avatarColor: string; // hex color for cursor representation
  avatarUrl?: string;
  lastSeenAt?: string; // timestamp
  isOnline?: boolean;
  preferences?: string; // JSON stringified user preferences
  // Legacy OAuth fields (for backward compatibility)
  appleUuid?: string;
  googleUuid?: string;
  name?: string; // Alias for displayName
  // RELATIONSHIPS
  ownedCanvases?: GauntletCanvasType[];
  createdObjects?: GauntletCanvasObject[];
  presenceRecords?: GauntletPresence[];
  aiCommands?: GauntletAICommand[];
  collaborations?: GauntletCanvasCollaborator[];
  userAnalyticEvents?: GauntletAnalyticEventType[];
  userErrors?: GauntletErrorType[];
  userAuthentications?: GauntletAuthenticationType[];
  userReferrers?: GauntletReferrerType[];
};

/**
 * Canvases Table
 * Stores canvas metadata and settings
 */
export type GauntletCanvasType = SHARED_FIELDS & {
  id: string; // uuid PK
  name: string;
  description?: string;
  ownerId: GauntletUserType['id']; // FK to users
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
  owner?: GauntletUserType;
  objects?: GauntletCanvasObject[];
  presenceRecords?: GauntletPresence[];
  aiCommands?: GauntletAICommand[];
  versions?: GauntletCanvasVersion[];
  collaborators?: GauntletCanvasCollaborator[];
  comments?: GauntletCanvasComment[];
  activities?: GauntletCanvasActivity[];
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
  createdBy: GauntletUserType['id']; // FK to users
  lastModifiedBy?: GauntletUserType['id'];
  // RELATIONSHIPS
  canvas?: GauntletCanvasType;
  creator?: GauntletUserType;
  modifier?: GauntletUserType;
  comments?: GauntletCanvasComment[];
};

/**
 * Presence Table
 * Tracks real-time user presence and cursor positions
 * Ephemeral - auto-delete after 30s of inactivity
 */
export type GauntletPresence = {
  id: string; // uuid PK
  userId: GauntletUserType['id']; // FK to users
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
  user?: GauntletUserType;
  canvas?: GauntletCanvasType;
};

/**
 * AI Commands Table
 * Stores AI command history and execution results
 */
export type GauntletAICommand = SHARED_FIELDS & {
  id: string; // uuid PK
  canvasId: GauntletCanvasType['id']; // FK to canvases
  userId: GauntletUserType['id']; // FK to users
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
  user?: GauntletUserType;
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
  createdBy: GauntletUserType['id']; // FK to users
  isAutoSave?: boolean;
  isNamedVersion?: boolean; // user explicitly saved this version
  versionName?: string;
  // RELATIONSHIPS
  canvas?: GauntletCanvasType;
  creator?: GauntletUserType;
};

/**
 * Canvas Collaborators Table
 * Manages canvas sharing and permissions
 */
export type GauntletCanvasCollaborator = SHARED_FIELDS & {
  id: string; // uuid PK
  canvasId: GauntletCanvasType['id']; // FK to canvases
  userId: GauntletUserType['id']; // FK to users
  role: GauntletCanvasCollaboratorRole; // enum
  invitedBy?: GauntletUserType['id']; // FK to users
  invitedAt?: string; // timestamp
  acceptedAt?: string;
  lastAccessedAt?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canShare?: boolean;
  canExport?: boolean;
  // RELATIONSHIPS
  canvas?: GauntletCanvasType;
  user?: GauntletUserType;
  inviter?: GauntletUserType;
};

/**
 * Canvas Comments Table (Optional - for future)
 * Allows users to comment on specific canvas areas or objects
 */
export type GauntletCanvasComment = SHARED_FIELDS & {
  id: string; // uuid PK
  canvasId: GauntletCanvasType['id']; // FK to canvases
  userId: GauntletUserType['id']; // FK to users
  objectId?: GauntletCanvasObject['id']; // FK to canvas_objects (optional)
  content: string;
  x?: number; // position if not tied to object
  y?: number;
  isResolved?: boolean;
  resolvedBy?: GauntletUserType['id'];
  resolvedAt?: string;
  parentCommentId?: string; // for threaded comments
  // RELATIONSHIPS
  canvas?: GauntletCanvasType;
  user?: GauntletUserType;
  canvasObject?: GauntletCanvasObject;
  resolver?: GauntletUserType;
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
  userId: GauntletUserType['id']; // FK to users
  activityType: string; // e.g., 'object_created', 'object_deleted', 'canvas_shared'
  objectId?: string; // related object ID if applicable
  details?: string; // JSON with activity details
  ipAddress?: string;
  userAgent?: string;
  // RELATIONSHIPS
  canvas?: GauntletCanvasType;
  user?: GauntletUserType;
};
