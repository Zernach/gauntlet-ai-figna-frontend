// redux thunks
import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  createAnalyticEvents,
  createError,
  createReferrers,
  createUser,
  deleteUser,
  readAuthentication,
  readCloudVersions,
  readUser,
  updateAuthentication,
} from '@/endpoints';
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

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
};

export const createAnalyticEventsThunk = createAsyncThunk<
  CreateGauntletAnalyticEventsResponse,
  CreateGauntletAnalyticEventsParams,
  { rejectValue: string }
>('firstApp/createAnalyticEvents', async (params, thunkAPI) => {
  try {
    return await createAnalyticEvents(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const createReferrersThunk = createAsyncThunk<
  CreateGauntletReferrersResponse,
  CreateGauntletReferrersParams,
  { rejectValue: string }
>('firstApp/createReferrers', async (params, thunkAPI) => {
  try {
    return await createReferrers(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const createErrorThunk = createAsyncThunk<
  CreateGauntletErrorResponse,
  CreateGauntletErrorParams,
  { rejectValue: string }
>('firstApp/createError', async (params, thunkAPI) => {
  try {
    return await createError(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const createUserThunk = createAsyncThunk<
  CreateGauntletUserResponse,
  CreateGauntletUserParams,
  { rejectValue: string }
>('firstApp/createUser', async (params, thunkAPI) => {
  try {
    return await createUser(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const readCloudVersionsThunk = createAsyncThunk<
  GauntletCloudEndpointResponse,
  void,
  { rejectValue: string }
>('firstApp/readCloudVersions', async (_, thunkAPI) => {
  try {
    return await readCloudVersions();
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const readAuthenticationThunk = createAsyncThunk<
  ReadGauntletAuthenticationResponse,
  ReadGauntletAuthenticationParams,
  { rejectValue: string }
>('firstApp/readAuthentication', async (params, thunkAPI) => {
  try {
    return await readAuthentication(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const updateAuthenticationThunk = createAsyncThunk<
  UpdateGauntletAuthenticationResponse,
  UpdateGauntletAuthenticationParams,
  { rejectValue: string }
>('firstApp/updateAuthentication', async (params, thunkAPI) => {
  try {
    return await updateAuthentication(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const readUserThunk = createAsyncThunk<
  ReadGauntletUserResponse,
  ReadGauntletUserParams,
  { rejectValue: string }
>('firstApp/readUser', async (params, thunkAPI) => {
  try {
    return await readUser(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

export const deleteUserThunk = createAsyncThunk<
  DeleteGauntletUserResponse,
  DeleteGauntletUserParams,
  { rejectValue: string }
>('firstApp/deleteUser', async (params, thunkAPI) => {
  try {
    return await deleteUser(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});
