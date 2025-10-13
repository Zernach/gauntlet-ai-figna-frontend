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
import { canvasSliceReducer } from './slices/canvasSlice';
import { userSliceReducer } from './slices/userSlice';
import { presenceSliceReducer } from './slices/presenceSlice';
import { websocketSliceReducer } from './slices/websocketSlice';
import { websocketMiddleware } from './middleware/websocketMiddleware';

export const resetReduxState = createAction('root/resetReduxState');

const combinedReducer = combineReducers({
  [REDUX_SLICES.CANVAS]: canvasSliceReducer,
  [REDUX_SLICES.USER]: userSliceReducer,
  [REDUX_SLICES.PRESENCE]: presenceSliceReducer,
  [REDUX_SLICES.WEBSOCKET]: websocketSliceReducer,
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

const applyMigrations: PersistConfig<
  RootReducerState
>['migrate'] = async (persistedState) => {
  if (!persistedState) {
    return persistedState;
  }

  // No migrations needed for now
  return persistedState;
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
    }).concat(websocketMiddleware),
});

export const persistor = persistStore(store);

export type AppStore = typeof store;
export type AppDispatch = AppStore['dispatch'];
export type RootState = ReturnType<AppStore['getState']>;
