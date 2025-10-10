import { createSlice } from '@reduxjs/toolkit';
import { AsyncRequestState, REDUX_SLICES } from '@/types/types';
import {
  CreateGauntletAnalyticEventsResponse,
  CreateGauntletErrorResponse,
  CreateGauntletReferrersResponse,
  CreateGauntletUserResponse,
  DeleteGauntletUserResponse,
  GauntletCloudEndpointResponse,
  GauntletUserType,
  ReadGauntletAuthenticationResponse,
  ReadGauntletUserResponse,
  UpdateGauntletAuthenticationResponse,
} from '@/@landscapesupply/types/gauntletai';
import {
  createAnalyticEventsThunk,
  createErrorThunk,
  createReferrersThunk,
  createUserThunk,
  deleteUserThunk,
  readAuthenticationThunk,
  readCloudVersionsThunk,
  readUserThunk,
  updateAuthenticationThunk,
} from '@/lib/redux/thunks';
import {
  createAsyncInitialState,
  setPending,
  setFulfilled,
  setRejected,
} from '../helpers';

type FirstSliceRequestsState = {
  createAnalyticEvents: AsyncRequestState<CreateGauntletAnalyticEventsResponse>;
  createReferrers: AsyncRequestState<CreateGauntletReferrersResponse>;
  createError: AsyncRequestState<CreateGauntletErrorResponse>;
  createUser: AsyncRequestState<CreateGauntletUserResponse>;
  readCloudVersions: AsyncRequestState<GauntletCloudEndpointResponse>;
  readAuthentication: AsyncRequestState<ReadGauntletAuthenticationResponse>;
  updateAuthentication: AsyncRequestState<UpdateGauntletAuthenticationResponse>;
  readUser: AsyncRequestState<ReadGauntletUserResponse>;
  deleteUser: AsyncRequestState<DeleteGauntletUserResponse>;
};

export type FirstSliceState = {
  user: GauntletUserType | null;
  requests: FirstSliceRequestsState;
};

export const createInitialRequestsState = (): FirstSliceRequestsState => ({
  createAnalyticEvents:
    createAsyncInitialState<CreateGauntletAnalyticEventsResponse>(),
  createReferrers: createAsyncInitialState<CreateGauntletReferrersResponse>(),
  createError: createAsyncInitialState<CreateGauntletErrorResponse>(),
  createUser: createAsyncInitialState<CreateGauntletUserResponse>(),
  readCloudVersions: createAsyncInitialState<GauntletCloudEndpointResponse>(),
  readAuthentication:
    createAsyncInitialState<ReadGauntletAuthenticationResponse>(),
  updateAuthentication:
    createAsyncInitialState<UpdateGauntletAuthenticationResponse>(),
  readUser: createAsyncInitialState<ReadGauntletUserResponse>(),
  deleteUser: createAsyncInitialState<DeleteGauntletUserResponse>(),
});

const initialState: FirstSliceState = {
  user: null,
  requests: createInitialRequestsState(),
};

const firstSlice = createSlice({
  name: REDUX_SLICES.FIRST_SLICE,
  initialState,
  reducers: {
    reset(state) {
      state.user = null;
      state.requests = createInitialRequestsState();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAnalyticEventsThunk.pending, (state) => {
        setPending({ state: state.requests.createAnalyticEvents });
      })
      .addCase(createAnalyticEventsThunk.fulfilled, (state, action) => {
        setFulfilled({
          state: state.requests.createAnalyticEvents,
          payload: action.payload,
        });
      })
      .addCase(createAnalyticEventsThunk.rejected, (state, action) => {
        setRejected({
          state: state.requests.createAnalyticEvents,
          errorMessage: action.payload ?? action.error.message,
        });
      })
      .addCase(createReferrersThunk.pending, (state) => {
        setPending({ state: state.requests.createReferrers });
      })
      .addCase(createReferrersThunk.fulfilled, (state, action) => {
        setFulfilled({
          state: state.requests.createReferrers,
          payload: action.payload,
        });
      })
      .addCase(createReferrersThunk.rejected, (state, action) => {
        setRejected({
          state: state.requests.createReferrers,
          errorMessage: action.payload ?? action.error.message,
        });
      })
      .addCase(createErrorThunk.pending, (state) => {
        setPending({ state: state.requests.createError });
      })
      .addCase(createErrorThunk.fulfilled, (state, action) => {
        setFulfilled({
          state: state.requests.createError,
          payload: action.payload,
        });
      })
      .addCase(createErrorThunk.rejected, (state, action) => {
        setRejected({
          state: state.requests.createError,
          errorMessage: action.payload ?? action.error.message,
        });
      })
      .addCase(createUserThunk.pending, (state) => {
        setPending({ state: state.requests.createUser });
      })
      .addCase(createUserThunk.fulfilled, (state, action) => {
        setFulfilled({
          state: state.requests.createUser,
          payload: action.payload,
        });
        state.user = action.payload.user;
      })
      .addCase(createUserThunk.rejected, (state, action) => {
        setRejected({
          state: state.requests.createUser,
          errorMessage: action.payload ?? action.error.message,
        });
      })
      .addCase(readCloudVersionsThunk.pending, (state) => {
        setPending({ state: state.requests.readCloudVersions });
      })
      .addCase(readCloudVersionsThunk.fulfilled, (state, action) => {
        setFulfilled({
          state: state.requests.readCloudVersions,
          payload: action.payload,
        });
      })
      .addCase(readCloudVersionsThunk.rejected, (state, action) => {
        setRejected({
          state: state.requests.readCloudVersions,
          errorMessage: action.payload ?? action.error.message,
        });
      })
      .addCase(readAuthenticationThunk.pending, (state) => {
        setPending({ state: state.requests.readAuthentication });
      })
      .addCase(readAuthenticationThunk.fulfilled, (state, action) => {
        setFulfilled({
          state: state.requests.readAuthentication,
          payload: action.payload,
        });
      })
      .addCase(readAuthenticationThunk.rejected, (state, action) => {
        setRejected({
          state: state.requests.readAuthentication,
          errorMessage: action.payload ?? action.error.message,
        });
      })
      .addCase(updateAuthenticationThunk.pending, (state) => {
        setPending({ state: state.requests.updateAuthentication });
      })
      .addCase(updateAuthenticationThunk.fulfilled, (state, action) => {
        setFulfilled({
          state: state.requests.updateAuthentication,
          payload: action.payload,
        });
      })
      .addCase(updateAuthenticationThunk.rejected, (state, action) => {
        setRejected({
          state: state.requests.updateAuthentication,
          errorMessage: action.payload ?? action.error.message,
        });
      })
      .addCase(readUserThunk.pending, (state) => {
        setPending({ state: state.requests.readUser });
      })
      .addCase(readUserThunk.fulfilled, (state, action) => {
        setFulfilled({
          state: state.requests.readUser,
          payload: action.payload,
        });
        state.user = action.payload.user;
      })
      .addCase(readUserThunk.rejected, (state, action) => {
        setRejected({
          state: state.requests.readUser,
          errorMessage: action.payload ?? action.error.message,
        });
      })
      .addCase(deleteUserThunk.pending, (state) => {
        setPending({ state: state.requests.deleteUser });
      })
      .addCase(deleteUserThunk.fulfilled, (state, action) => {
        setFulfilled({
          state: state.requests.deleteUser,
          payload: action.payload,
        });
        if (action.payload.isDeleted) {
          state.user = null;
        }
      })
      .addCase(deleteUserThunk.rejected, (state, action) => {
        setRejected({
          state: state.requests.deleteUser,
          errorMessage: action.payload ?? action.error.message,
        });
      });
  },
});

export const { reset } = firstSlice.actions;
export const firstSliceReducer = firstSlice.reducer;
