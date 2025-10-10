import { combineReducers, configureStore } from '@reduxjs/toolkit';
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
import { firstSliceReducer } from './slices/firstSlice';
import { secondSliceReducer } from './slices/secondSlice';

const rootReducer = combineReducers({
  [REDUX_SLICES.FIRST_SLICE]: firstSliceReducer,
  [REDUX_SLICES.SECOND_SLICE]: secondSliceReducer,
});

const persistConfig = {
  key: REDUX_SLICES.ROOT,
  storage,
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
