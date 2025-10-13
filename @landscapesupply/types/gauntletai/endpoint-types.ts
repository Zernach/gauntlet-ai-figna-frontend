import { ErrorResponse } from '../shared-types';
import {
  GauntletAnalyticEventType,
  GauntletErrorType,
  GauntletReferrerType,
  GauntletUserType,
  GauntletCanvasUserType,
  GauntletCanvasType,
  GauntletCanvasObject,
  GauntletPresence,
  GauntletAICommand,
  GauntletCanvasVersion,
  GauntletCanvasCollaborator,
  GauntletCanvasComment,
  GauntletCanvasActivity,
  GauntletAICommandStatus,
  GauntletCanvasCollaboratorRole,
} from './database-types';

/*
 * CreateAnalyticEvent
 */
export type CreateGauntletAnalyticEventParams = {
  eventData: GauntletAnalyticEventType;
};

export type CreateGauntletAnalyticEventResponse = ErrorResponse & {
  event: GauntletAnalyticEventType;
};

/*
 * CreateAnalyticEvents
 */
export type CreateGauntletAnalyticEventsParams = {
  events: GauntletAnalyticEventType[];
};

export type CreateGauntletAnalyticEventsResponse = ErrorResponse & {
  analyticEventIds: GauntletAnalyticEventType['analyticEventId'][];
};

/*
 * CreateAnalyticError
 */
export type CreateGauntletErrorParams = {
  error: GauntletErrorType;
};

export type CreateGauntletErrorResponse = ErrorResponse & {
  newError: GauntletErrorType;
};

/*
 * CreateRefferers
 */
export type CreateGauntletReferrersParams = {
  referrers: GauntletReferrerType[];
};

export type CreateGauntletReferrersResponse = ErrorResponse & {
  referrers: GauntletReferrerType[];
};

/*
 * CreateUser
 */
export type CreateGauntletUserParams = {
  user: GauntletUserType;
};

export type CreateGauntletUserResponse = ErrorResponse & {
  user: GauntletUserType;
};

/*
 * ReadAuthentication
 */
export type ReadGauntletAuthenticationParams = {
  sessionToken: string;
};

export type ReadGauntletAuthenticationResponse = ErrorResponse & {
  isValid: boolean;
  user?: GauntletUserType;
  reason?: string;
};

/*
 * UpdateAuthentication
 */
export type UpdateGauntletAuthenticationParams = {
  refreshToken: string | null;
};

export type UpdateGauntletAuthenticationResponse = ErrorResponse & {
  ok: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
};

/*
 * ReadUser
 */
export type ReadGauntletUserParams = {
  email?: GauntletUserType['email'];
};

export type ReadGauntletUserResponse = ErrorResponse & {
  user: GauntletUserType | null;
};

/*
 * DeleteUser
 */
export type DeleteGauntletUserParams = {
  identityToken: string | null;
  nonce: string;
};

export type DeleteGauntletUserResponse = ErrorResponse & {
  isDeleted: boolean;
};

/*
 * CloudEndpoint
 */
export type GauntletCloudEndpointResponse = ErrorResponse & {
  versions: {
    db: string;
    app: string;
  };
};

// ==========================================
// COLLABCANVAS API ENDPOINT TYPES
// ==========================================

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

/*
 * POST /api/gauntlet/auth/login
 * User login
 */
export type LoginCanvasUserParams = {
  email: string;
  password: string;
};

export type LoginCanvasUserResponse = ErrorResponse & {
  token: string;
  refreshToken: string;
  user: GauntletCanvasUserType;
  expiresAt: string;
};

/*
 * POST /api/gauntlet/auth/register
 * User registration
 */
export type RegisterCanvasUserParams = {
  email: string;
  password: string;
  username: string;
  displayName?: string;
};

export type RegisterCanvasUserResponse = ErrorResponse & {
  token: string;
  refreshToken: string;
  user: GauntletCanvasUserType;
  expiresAt: string;
};

/*
 * POST /api/gauntlet/auth/refresh
 * Refresh authentication token
 */
export type RefreshCanvasAuthParams = {
  refreshToken: string;
};

export type RefreshCanvasAuthResponse = ErrorResponse & {
  token: string;
  expiresAt: string;
};

/*
 * DELETE /api/gauntlet/auth/logout
 * User logout
 */
export type LogoutCanvasUserParams = {
  token: string;
};

export type LogoutCanvasUserResponse = ErrorResponse & {
  success: boolean;
};

/*
 * GET /api/gauntlet/auth/profile
 * Get user profile
 */
export type GetCanvasUserProfileParams = {};

export type GetCanvasUserProfileResponse = ErrorResponse & {
  user: GauntletCanvasUserType;
};

/*
 * PUT /api/gauntlet/auth/profile
 * Update user profile
 */
export type UpdateCanvasUserProfileParams = {
  displayName?: string;
  avatarUrl?: string;
  avatarColor?: string;
  preferences?: string;
};

export type UpdateCanvasUserProfileResponse = ErrorResponse & {
  user: GauntletCanvasUserType;
};

// ==========================================
// CANVAS MANAGEMENT ENDPOINTS
// ==========================================

/*
 * GET /api/gauntlet/canvas
 * List user's canvases
 */
export type ListCanvasesParams = {
  page?: number;
  limit?: number;
  includeShared?: boolean;
  includePublic?: boolean;
  sortBy?: 'updatedAt' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
};

export type ListCanvasesResponse = ErrorResponse & {
  canvases: GauntletCanvasType[];
  total: number;
  page: number;
  limit: number;
};

/*
 * POST /api/gauntlet/canvas
 * Create new canvas
 */
export type CreateCanvasParams = {
  name: string;
  description?: string;
  isPublic?: boolean;
  isTemplate?: boolean;
  backgroundColor?: string;
  width?: number;
  height?: number;
};

export type CreateCanvasResponse = ErrorResponse & {
  canvas: GauntletCanvasType;
};

/*
 * GET /api/gauntlet/canvas/{id}
 * Get canvas details with all objects
 */
export type GetCanvasParams = {
  canvasId: string;
  includeObjects?: boolean;
  includeCollaborators?: boolean;
  includeVersions?: boolean;
};

export type GetCanvasResponse = ErrorResponse & {
  canvas: GauntletCanvasType;
  objects?: GauntletCanvasObject[];
  collaborators?: GauntletCanvasCollaborator[];
  versions?: GauntletCanvasVersion[];
};

/*
 * PUT /api/gauntlet/canvas/{id}
 * Update canvas metadata
 */
export type UpdateCanvasParams = {
  canvasId: string;
  name?: string;
  description?: string;
  isPublic?: boolean;
  viewportX?: number;
  viewportY?: number;
  viewportZoom?: number;
  backgroundColor?: string;
  gridEnabled?: boolean;
  gridSize?: number;
  snapToGrid?: boolean;
};

export type UpdateCanvasResponse = ErrorResponse & {
  canvas: GauntletCanvasType;
};

/*
 * DELETE /api/gauntlet/canvas/{id}
 * Delete canvas
 */
export type DeleteCanvasParams = {
  canvasId: string;
};

export type DeleteCanvasResponse = ErrorResponse & {
  success: boolean;
};

/*
 * POST /api/gauntlet/canvas/{id}/fork
 * Fork/duplicate canvas
 */
export type ForkCanvasParams = {
  canvasId: string;
  name: string;
  includeCollaborators?: boolean;
};

export type ForkCanvasResponse = ErrorResponse & {
  canvas: GauntletCanvasType;
};

/*
 * GET /api/gauntlet/canvas/{id}/history
 * Get canvas version history
 */
export type GetCanvasHistoryParams = {
  canvasId: string;
  page?: number;
  limit?: number;
};

export type GetCanvasHistoryResponse = ErrorResponse & {
  versions: GauntletCanvasVersion[];
  total: number;
  page: number;
  limit: number;
};

/*
 * POST /api/gauntlet/canvas/{id}/restore
 * Restore canvas to a specific version
 */
export type RestoreCanvasVersionParams = {
  canvasId: string;
  versionId: string;
};

export type RestoreCanvasVersionResponse = ErrorResponse & {
  canvas: GauntletCanvasType;
  objects: GauntletCanvasObject[];
};

// ==========================================
// SHAPE/OBJECT ENDPOINTS
// ==========================================

// NOTE: Shape create/update/delete operations happen via WebSocket (WSCanvasOperationMessage)
// These HTTP endpoints are for read-only access to canvas objects

/*
 * GET /api/gauntlet/canvas/{id}/shapes
 * Get all shapes for a canvas (read-only)
 */
export type GetCanvasObjectsParams = {
  canvasId: string;
  includeDeleted?: boolean;
};

export type GetCanvasObjectsResponse = ErrorResponse & {
  objects: GauntletCanvasObject[];
  total: number;
};

/*
 * GET /api/gauntlet/canvas/{id}/shapes/{shapeId}
 * Get a single shape (read-only)
 */
export type GetCanvasObjectParams = {
  canvasId: string;
  objectId: string;
};

export type GetCanvasObjectResponse = ErrorResponse & {
  object: GauntletCanvasObject;
};

/*
 * WebSocket: Create a new shape/object on canvas
 * Send via WebSocket with type: 'SHAPE_CREATE'
 */
export type CreateCanvasObjectParams = {
  canvasId: string;
  object: Omit<GauntletCanvasObject, 'id' | 'createdAt' | 'updatedAt' | 'canvasId' | 'createdBy'>;
};

export type CreateCanvasObjectResponse = ErrorResponse & {
  object: GauntletCanvasObject;
};

/*
 * WebSocket: Update an existing shape
 * Send via WebSocket with type: 'SHAPE_UPDATE'
 */
export type UpdateCanvasObjectParams = {
  canvasId: string;
  objectId: string;
  updates: Partial<Omit<GauntletCanvasObject, 'id' | 'canvasId' | 'createdAt' | 'createdBy'>>;
};

export type UpdateCanvasObjectResponse = ErrorResponse & {
  object: GauntletCanvasObject;
};

/*
 * WebSocket: Delete a shape
 * Send via WebSocket with type: 'SHAPE_DELETE'
 */
export type DeleteCanvasObjectParams = {
  canvasId: string;
  objectId: string;
};

export type DeleteCanvasObjectResponse = ErrorResponse & {
  success: boolean;
};

/*
 * WebSocket: Batch create/update/delete operations
 * Send via WebSocket with type: 'SHAPES_BATCH_UPDATE'
 */
export type BatchCanvasOperationsParams = {
  canvasId: string;
  operations: Array<
    | { type: 'create'; object: Omit<GauntletCanvasObject, 'id' | 'createdAt' | 'updatedAt' | 'canvasId' | 'createdBy'> }
    | { type: 'update'; objectId: string; updates: Partial<GauntletCanvasObject> }
    | { type: 'delete'; objectId: string }
  >;
};

export type BatchCanvasOperationsResponse = ErrorResponse & {
  results: Array<{
    success: boolean;
    objectId?: string;
    object?: GauntletCanvasObject;
    error?: string;
  }>;
};

// ==========================================
// AI INTEGRATION ENDPOINTS
// ==========================================

// NOTE: AI command processing happens via WebSocket (WSAIOperationMessage)
// These HTTP endpoints are for read-only access to history and suggestions

/*
 * WebSocket: AI Command Processing (Primary)
 * Send via WebSocket with type: 'AI_COMMAND_START'
 */
export type ProcessAICommandParams = {
  canvasId: string;
  command: string;
  context?: {
    selectedObjectIds?: string[];
    viewport?: {
      x: number;
      y: number;
      zoom: number;
    };
  };
};

export type ProcessAICommandResponse = ErrorResponse & {
  commandId: string;
  operations: Array<{
    type: 'create' | 'update' | 'delete' | 'arrange';
    objectId?: string;
    object?: GauntletCanvasObject;
  }>;
  response: string; // Natural language response from AI
  executionTimeMs: number;
};

/*
 * GET /api/gauntlet/ai/suggestions
 * Get AI-powered suggestions for canvas
 */
export type GetAISuggestionsParams = {
  canvasId: string;
  context?: string;
};

export type GetAISuggestionsResponse = ErrorResponse & {
  suggestions: Array<{
    command: string;
    description: string;
    category: 'layout' | 'creation' | 'modification' | 'style';
  }>;
};

/*
 * POST /api/gauntlet/ai/feedback
 * Send feedback on AI command execution (can be HTTP as it's not time-sensitive)
 */
export type SendAIFeedbackParams = {
  commandId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
};

export type SendAIFeedbackResponse = ErrorResponse & {
  success: boolean;
};

/*
 * GET /api/gauntlet/ai/history
 * Get AI command history for a canvas
 */
export type GetAIHistoryParams = {
  canvasId: string;
  page?: number;
  limit?: number;
  status?: GauntletAICommandStatus;
};

export type GetAIHistoryResponse = ErrorResponse & {
  commands: GauntletAICommand[];
  total: number;
  page: number;
  limit: number;
};

/*
 * WebSocket: Cancel AI command
 * Send via WebSocket with type: 'AI_COMMAND_CANCEL'
 */
export type CancelAICommandParams = {
  commandId: string;
  reason?: string;
};

export type CancelAICommandResponse = ErrorResponse & {
  success: boolean;
  commandId: string;
};

// ==========================================
// COLLABORATION ENDPOINTS
// ==========================================

/*
 * GET /api/gauntlet/canvas/{id}/collaborators
 * Get list of canvas collaborators
 */
export type GetCanvasCollaboratorsParams = {
  canvasId: string;
};

export type GetCanvasCollaboratorsResponse = ErrorResponse & {
  collaborators: GauntletCanvasCollaborator[];
};

/*
 * POST /api/gauntlet/canvas/{id}/invite
 * Invite user to collaborate on canvas
 */
export type InviteCanvasCollaboratorParams = {
  canvasId: string;
  email?: string;
  userId?: string;
  role: GauntletCanvasCollaboratorRole;
};

export type InviteCanvasCollaboratorResponse = ErrorResponse & {
  collaborator: GauntletCanvasCollaborator;
  inviteLink?: string;
};

/*
 * DELETE /api/gauntlet/canvas/{id}/collaborators/{userId}
 * Remove collaborator from canvas
 */
export type RemoveCanvasCollaboratorParams = {
  canvasId: string;
  collaboratorId: string;
};

export type RemoveCanvasCollaboratorResponse = ErrorResponse & {
  success: boolean;
};

/*
 * PUT /api/gauntlet/canvas/{id}/permissions
 * Update collaborator permissions
 */
export type UpdateCollaboratorPermissionsParams = {
  canvasId: string;
  collaboratorId: string;
  role?: GauntletCanvasCollaboratorRole;
  canEdit?: boolean;
  canDelete?: boolean;
  canShare?: boolean;
  canExport?: boolean;
};

export type UpdateCollaboratorPermissionsResponse = ErrorResponse & {
  collaborator: GauntletCanvasCollaborator;
};

// ==========================================
// COMMENTS ENDPOINTS (Optional)
// ==========================================

/*
 * POST /api/gauntlet/canvas/{id}/comments
 * Add comment to canvas
 */
export type CreateCanvasCommentParams = {
  canvasId: string;
  content: string;
  objectId?: string;
  x?: number;
  y?: number;
  parentCommentId?: string;
};

export type CreateCanvasCommentResponse = ErrorResponse & {
  comment: GauntletCanvasComment;
};

/*
 * GET /api/gauntlet/canvas/{id}/comments
 * Get canvas comments
 */
export type GetCanvasCommentsParams = {
  canvasId: string;
  objectId?: string;
  includeResolved?: boolean;
};

export type GetCanvasCommentsResponse = ErrorResponse & {
  comments: GauntletCanvasComment[];
};

/*
 * PUT /api/gauntlet/canvas/{id}/comments/{commentId}/resolve
 * Resolve a comment
 */
export type ResolveCanvasCommentParams = {
  canvasId: string;
  commentId: string;
};

export type ResolveCanvasCommentResponse = ErrorResponse & {
  comment: GauntletCanvasComment;
};

// ==========================================
// ACTIVITY LOG ENDPOINTS
// ==========================================

/*
 * GET /api/gauntlet/canvas/{id}/activity
 * Get canvas activity log
 */
export type GetCanvasActivityParams = {
  canvasId: string;
  page?: number;
  limit?: number;
  activityTypes?: string[];
  startDate?: string;
  endDate?: string;
};

export type GetCanvasActivityResponse = ErrorResponse & {
  activities: GauntletCanvasActivity[];
  total: number;
  page: number;
  limit: number;
};

// ==========================================
// WEBSOCKET MESSAGE TYPES
// ==========================================

/**
 * WebSocket connection message types
 */
export type WSConnectionMessage = {
  type: 'CONNECTION_ESTABLISHED' | 'CONNECTION_ERROR' | 'RECONNECTED';
  userId: string;
  canvasId: string;
  connectionId: string;
  timestamp: number;
};

/**
 * Real-time canvas operation messages
 * ALIGNED with frontend types/websocket.ts
 */
export type WSCanvasOperationMessage = {
  type: 'SHAPE_CREATE' | 'SHAPE_UPDATE' | 'SHAPE_DELETE' | 'SHAPES_BATCH_UPDATE';
  userId: string;
  canvasId: string;
  messageId: string;
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
  timestamp: number;
};

/**
 * Cursor and presence messages
 */
export type WSPresenceMessage = {
  type: 'CURSOR_MOVE' | 'USER_JOIN' | 'USER_LEAVE' | 'USER_SELECTION_CHANGED';
  userId: string;
  canvasId: string;
  data: {
    cursorX?: number;
    cursorY?: number;
    user?: GauntletCanvasUserType;
    selectedObjectIds?: string[];
    viewportX?: number;
    viewportY?: number;
    viewportZoom?: number;
  };
  timestamp: number;
};

/**
 * AI operation messages
 */
export type WSAIOperationMessage = {
  type: 'AI_COMMAND_START' | 'AI_COMMAND_PROGRESS' | 'AI_COMMAND_COMPLETE' | 'AI_COMMAND_ERROR' | 'AI_COMMAND_CANCEL';
  userId: string;
  canvasId: string;
  data: {
    commandId: string;
    command?: string;
    operations?: Array<{
      type: string;
      objectId?: string;
      object?: GauntletCanvasObject;
    }>;
    response?: string;
    error?: string;
    progress?: number; // 0-100
    reason?: string; // cancellation reason
  };
  timestamp: number;
};

/**
 * Canvas state synchronization messages
 */
export type WSCanvasSyncMessage = {
  type: 'CANVAS_STATE_REQUEST' | 'CANVAS_STATE_FULL' | 'CANVAS_STATE_DELTA';
  userId: string;
  canvasId: string;
  data: {
    canvas?: GauntletCanvasType;
    objects?: GauntletCanvasObject[];
    presence?: GauntletPresence[];
    version?: number;
  };
  timestamp: number;
};

/**
 * Error messages
 */
export type WSErrorMessage = {
  type: 'ERROR';
  code: 'UNAUTHORIZED' | 'CANVAS_NOT_FOUND' | 'OPERATION_FAILED' | 'RATE_LIMITED' | 'INVALID_MESSAGE';
  message: string;
  timestamp: number;
};

/**
 * Union type for all WebSocket messages
 */
export type WSMessage =
  | WSConnectionMessage
  | WSCanvasOperationMessage
  | WSPresenceMessage
  | WSAIOperationMessage
  | WSCanvasSyncMessage
  | WSErrorMessage;
