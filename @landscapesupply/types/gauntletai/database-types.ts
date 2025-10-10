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
