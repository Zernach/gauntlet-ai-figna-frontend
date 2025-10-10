import {
  AnyAction,
  combineReducers,
  configureStore,
  createAction,
} from '@reduxjs/toolkit';
import type {
  PersistConfig,
  PersistedState,
} from 'redux-persist/es/types';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { REDUX_SLICES } from '@/types/types';
import {
  createInitialRequestsState,
  firstSliceReducer,
} from './slices/firstSlice';
import type { FirstSliceState } from './slices/firstSlice';
import { secondSliceReducer } from './slices/secondSlice';

export const resetReduxState = createAction('root/resetReduxState');

const combinedReducer = combineReducers({
  [REDUX_SLICES.FIRST_SLICE]: firstSliceReducer,
  [REDUX_SLICES.SECOND_SLICE]: secondSliceReducer,
});

type RootReducerState = ReturnType<typeof combinedReducer>;

const rootReducer = (
  state: RootReducerState | undefined,
  action: AnyAction,
) => {
  if (resetReduxState.match(action)) {
    return combinedReducer(undefined, action);
  }

  return combinedReducer(state, action);
};

const ensureFirstSliceRequests = (
  state: FirstSliceState | undefined,
): FirstSliceState | undefined => {
  if (!state) {
    return state;
  }

  const defaultRequests = createInitialRequestsState();
  const existingRequests =
    state.requests && typeof state.requests === 'object'
      ? state.requests
      : undefined;

  return {
    ...state,
    requests: {
      ...defaultRequests,
      ...(existingRequests ?? {}),
    },
  };
};

type PersistedRootState = Record<string, unknown> & {
  _persist?: unknown;
};

const applyMigrations: PersistConfig<
  RootReducerState
>['migrate'] = async (persistedState) => {
  if (!persistedState) {
    return persistedState;
  }

  const nextState: PersistedRootState = {
    ...(persistedState as PersistedRootState),
  };

  const firstSliceState = (
    REDUX_SLICES.FIRST_SLICE in nextState
      ? nextState[REDUX_SLICES.FIRST_SLICE]
      : undefined
  ) as FirstSliceState | undefined;

  if (firstSliceState !== undefined) {
    nextState[REDUX_SLICES.FIRST_SLICE] = ensureFirstSliceRequests(
      firstSliceState,
    );
  }

  return nextState as unknown as PersistedState;
};

const persistConfig: PersistConfig<RootReducerState> = {
  key: REDUX_SLICES.ROOT,
  storage,
  migrate: applyMigrations,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type AppStore = typeof store;
export type AppDispatch = AppStore['dispatch'];
export type RootState = ReturnType<AppStore['getState']>;
