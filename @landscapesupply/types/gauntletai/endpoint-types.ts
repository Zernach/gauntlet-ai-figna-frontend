import { ErrorResponse } from '../shared-types';
import {
  GauntletAnalyticEventType,
  GauntletErrorType,
  GauntletReferrerType,
  GauntletUserType,
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
  userId?: GauntletUserType['userId'];
  email?: GauntletUserType['email'];
  appleUuid?: GauntletUserType['appleUuid'];
  googleUuid?: GauntletUserType['googleUuid'];
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
