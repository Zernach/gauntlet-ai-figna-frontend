import { GAUNTLET_AUTH_HEADERS } from '@/@landscapesupply/types/gauntletai';
import { RootState, store } from '@/lib/redux/store';
import { REDUX_SLICES } from '@/types/types';

export const setAuthHeaders = () => {
  const state = store.getState() as RootState;
  const user = state[REDUX_SLICES.USER]?.currentUser;
  const authTokens = state[REDUX_SLICES.USER]?.authTokens;
  const headers: Record<string, string> = {};

  // Include JWT token for authentication
  if (authTokens?.token) {
    headers['Authorization'] = `Bearer ${authTokens.token}`;
  }

  // Legacy headers (keep for backward compatibility)
  if (user?.id) {
    headers[GAUNTLET_AUTH_HEADERS.USER_ID] = user.id;
  }
  if (user?.email) {
    headers[GAUNTLET_AUTH_HEADERS.GOOGLE_UUID] = user.email;
  }

  return headers;
};
