import Constants from 'expo-constants';

const PROD = 'prod' as const;
const DEV = 'dev' as const;
const LOCAL = 'local' as const;

type ENV_TYPE = typeof PROD | typeof DEV | typeof LOCAL;

const getEnvironment = (): ENV_TYPE => {
  const environment: ENV_TYPE = (Constants.expoConfig?.extra?.ENVIRONMENT as ENV_TYPE) || DEV;
  return LOCAL;
};

export const ENVIRONMENT = getEnvironment();
export const IS_PRODUCTION = ENVIRONMENT === PROD;

const API_PATH = '/api/gauntlet';

const extra = Constants.expoConfig?.extra || {};

export const CONFIG = {
  [LOCAL]: {
    CLOUD_BASE_URL: `http://localhost:3001${API_PATH}`,
    GOOGLE_CLIENT_ID: extra.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: extra.GOOGLE_CLIENT_SECRET,
  },
  [DEV]: {
    CLOUD_BASE_URL: `https://api-dev.archlife.org${API_PATH}`,
    GOOGLE_CLIENT_ID: extra.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: extra.GOOGLE_CLIENT_SECRET,
  },
  [PROD]: {
    CLOUD_BASE_URL: `https://api.archlife.org${API_PATH}`,
    GOOGLE_CLIENT_ID: extra.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: extra.GOOGLE_CLIENT_SECRET,
  },
}[ENVIRONMENT];
