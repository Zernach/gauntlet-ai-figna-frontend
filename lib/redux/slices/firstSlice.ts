import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AsyncRequestState, REDUX_SLICES } from '@/types/types';
import {
  CreateGauntletAnalyticEventsResponse,
  CreateGauntletErrorResponse,
  CreateGauntletReferrersResponse,
  CreateGauntletUserResponse,
  GauntletCloudEndpointResponse,
} from '@/@landscapesupply/types/gauntletai';
import {
  createAnalyticEventsThunk,
  createErrorThunk,
  createReferrersThunk,
  createUserThunk,
  readCloudVersionsThunk,
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
        setPending(state.requests.createAnalyticEvents);
      })
      .addCase(createAnalyticEventsThunk.fulfilled, (state, action) => {
        setFulfilled(state.requests.createAnalyticEvents, action.payload);
      })
      .addCase(createAnalyticEventsThunk.rejected, (state, action) => {
        setRejected(
          state.requests.createAnalyticEvents,
          (action.payload as string | undefined) ?? action.error.message,
        );
      })
      .addCase(createReferrersThunk.pending, (state) => {
        setPending(state.requests.createReferrers);
      })
      .addCase(createReferrersThunk.fulfilled, (state, action) => {
        setFulfilled(state.requests.createReferrers, action.payload);
      })
      .addCase(createReferrersThunk.rejected, (state, action) => {
        setRejected(
          state.requests.createReferrers,
          (action.payload as string | undefined) ?? action.error.message,
        );
      })
      .addCase(createErrorThunk.pending, (state) => {
        setPending(state.requests.createError);
      })
      .addCase(createErrorThunk.fulfilled, (state, action) => {
        setFulfilled(state.requests.createError, action.payload);
      })
      .addCase(createErrorThunk.rejected, (state, action) => {
        setRejected(
          state.requests.createError,
          (action.payload as string | undefined) ?? action.error.message,
        );
      })
      .addCase(createUserThunk.pending, (state) => {
        setPending(state.requests.createUser);
      })
      .addCase(createUserThunk.fulfilled, (state, action) => {
        setFulfilled(state.requests.createUser, action.payload);
      })
      .addCase(createUserThunk.rejected, (state, action) => {
        setRejected(
          state.requests.createUser,
          (action.payload as string | undefined) ?? action.error.message,
        );
      })
      .addCase(readCloudVersionsThunk.pending, (state) => {
        setPending(state.requests.readCloudVersions);
      })
      .addCase(readCloudVersionsThunk.fulfilled, (state, action) => {
        setFulfilled(state.requests.readCloudVersions, action.payload);
      })
      .addCase(readCloudVersionsThunk.rejected, (state, action) => {
        setRejected(
          state.requests.readCloudVersions,
          (action.payload as string | undefined) ?? action.error.message,
        );
      });
  },
});

export const { increment, incrementByAmount, reset } = firstSlice.actions;
export const firstSliceReducer = firstSlice.reducer;
