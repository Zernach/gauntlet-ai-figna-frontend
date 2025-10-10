import {
  CreateGauntletAnalyticEventsParams,
  CreateGauntletAnalyticEventsResponse,
  CreateGauntletErrorParams,
  CreateGauntletErrorResponse,
  CreateGauntletReferrersParams,
  CreateGauntletReferrersResponse,
  CreateGauntletUserParams,
  CreateGauntletUserResponse,
  GauntletCloudEndpointResponse,
} from '@/@landscapesupply/types/gauntletai';
import { requestCloud } from '@/scripts/requestCloud';

export const createAnalyticEvents = (
  params: CreateGauntletAnalyticEventsParams,
) =>
  requestCloud<CreateGauntletAnalyticEventsResponse>({
    endpoint: '/create-analytic-events',
    method: 'POST',
    params,
  });

export const createReferrers = (params: CreateGauntletReferrersParams) =>
  requestCloud<CreateGauntletReferrersResponse>({
    endpoint: '/create-referrers',
    method: 'POST',
    params,
  });

export const createError = (params: CreateGauntletErrorParams) =>
  requestCloud<CreateGauntletErrorResponse>({
    endpoint: '/create-error',
    method: 'POST',
    params,
  });

export const createUser = (params: CreateGauntletUserParams) =>
  requestCloud<CreateGauntletUserResponse>({
    endpoint: '/create-user',
    method: 'POST',
    params,
  });

export const readCloudVersions = () =>
  requestCloud<GauntletCloudEndpointResponse>({
    endpoint: '/cloud',
    method: 'GET',
  });
