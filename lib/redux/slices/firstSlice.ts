import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AsyncRequestState, REDUX_SLICES } from '@/types/types';
import {
  CreateGauntletAnalyticEventsResponse,
  CreateGauntletErrorResponse,
  CreateGauntletReferrersResponse,
  CreateGauntletUserResponse,
  DeleteGauntletUserResponse,
  GauntletCloudEndpointResponse,
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

export type FirstAppRequestsState = {
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
  count: number;
  requests: FirstAppRequestsState;
};

const initialState: FirstSliceState = {
  count: 0,
  requests: {
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
  },
};

const firstSlice = createSlice({
  name: REDUX_SLICES.FIRST_SLICE,
  initialState,
  reducers: {
    increment(state) {
      state.count += 1;
    },
    incrementByAmount(state, action: PayloadAction<number>) {
      state.count += action.payload;
    },
    reset(state) {
      state.count = initialState.count;
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
          errorMessage:
            (action.payload as string | undefined) ?? action.error.message,
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
          errorMessage:
            (action.payload as string | undefined) ?? action.error.message,
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
          errorMessage:
            (action.payload as string | undefined) ?? action.error.message,
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
      })
      .addCase(createUserThunk.rejected, (state, action) => {
        setRejected({
          state: state.requests.createUser,
          errorMessage:
            (action.payload as string | undefined) ?? action.error.message,
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
          errorMessage:
            (action.payload as string | undefined) ?? action.error.message,
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
          errorMessage:
            (action.payload as string | undefined) ?? action.error.message,
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
          errorMessage:
            (action.payload as string | undefined) ?? action.error.message,
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
      })
      .addCase(readUserThunk.rejected, (state, action) => {
        setRejected({
          state: state.requests.readUser,
          errorMessage:
            (action.payload as string | undefined) ?? action.error.message,
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
      })
      .addCase(deleteUserThunk.rejected, (state, action) => {
        setRejected({
          state: state.requests.deleteUser,
          errorMessage:
            (action.payload as string | undefined) ?? action.error.message,
        });
      });
  },
});

export const { increment, incrementByAmount, reset } = firstSlice.actions;
export const firstSliceReducer = firstSlice.reducer;
