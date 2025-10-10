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
 * CloudEndpoint
 */
export type GauntletCloudEndpointResponse = ErrorResponse & {
  versions: {
    db: string;
    app: string;
  };
};
