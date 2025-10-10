import {
  CreateGauntletAnalyticEventsParams,
  CreateGauntletAnalyticEventsResponse,
  CreateGauntletErrorParams,
  CreateGauntletErrorResponse,
  CreateGauntletReferrersParams,
  CreateGauntletReferrersResponse,
  CreateGauntletUserParams,
  CreateGauntletUserResponse,
  DeleteGauntletUserParams,
  DeleteGauntletUserResponse,
  GauntletCloudEndpointResponse,
  ReadGauntletAuthenticationParams,
  ReadGauntletAuthenticationResponse,
  ReadGauntletUserParams,
  ReadGauntletUserResponse,
  UpdateGauntletAuthenticationParams,
  UpdateGauntletAuthenticationResponse,
} from '@/@landscapesupply/types/gauntletai';
import { requestCloud } from '@/scripts/requestCloud/requestCloud';

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

export const readAuthentication = (params: ReadGauntletAuthenticationParams) =>
  requestCloud<ReadGauntletAuthenticationResponse>({
    endpoint: '/read-authentication',
    method: 'POST',
    params,
  });

export const updateAuthentication = (
  params: UpdateGauntletAuthenticationParams,
) =>
  requestCloud<UpdateGauntletAuthenticationResponse>({
    endpoint: '/update-authentication',
    method: 'POST',
    params,
  });

export const readUser = (params: ReadGauntletUserParams) =>
  requestCloud<ReadGauntletUserResponse>({
    endpoint: '/read-user',
    method: 'POST',
    params,
  });

export const deleteUser = (params: DeleteGauntletUserParams) =>
  requestCloud<DeleteGauntletUserResponse>({
    endpoint: '/delete-user',
    method: 'POST',
    params,
  });
