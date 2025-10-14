import { setAuthHeadersProvider } from '@/scripts/requestCloud/requestCloud';
import { store } from '@/lib/redux/store';
import { REDUX_SLICES } from '@/types/types';

/**
 * Setup auth headers provider to automatically include JWT token in API requests
 * Should be called once during app initialization
 */
export function setupAuthHeaders() {
  setAuthHeadersProvider(() => {
    const state = store.getState();
    const authTokens = state[REDUX_SLICES.USER]?.authTokens;
    
    if (authTokens?.token) {
      return {
        'Authorization': `Bearer ${authTokens.token}`,
      };
    }
    
    return {};
  });
}

