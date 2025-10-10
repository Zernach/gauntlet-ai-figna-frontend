import { GAUNTLET_AUTH_HEADERS } from '@/@landscapesupply/types/gauntletai';
import { RootState, store } from '@/lib/redux/store';

export const setAuthHeaders = () => {
  const state = store.getState() as RootState;
  const user = state.firstSlice.user;
  const headers: Record<string, string> = {};
  const userId = user?.userId;
  const appleUuid = user?.appleUuid;
  const googleUuid = user?.googleUuid;
  if (userId) {
    headers[GAUNTLET_AUTH_HEADERS.USER_ID] = userId;
  }
  if (appleUuid) {
    headers[GAUNTLET_AUTH_HEADERS.APPLE_UUID] = appleUuid;
  }
  if (googleUuid) {
    headers[GAUNTLET_AUTH_HEADERS.GOOGLE_UUID] = googleUuid;
  }
  return headers;
};
