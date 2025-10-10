import 'dotenv/config';

const PROD = 'prod' as const;
const DEV = 'dev' as const;
const LOCAL = 'local' as const;

type ENV_TYPE = typeof PROD | typeof DEV | typeof LOCAL;

const getEnvironment = (): ENV_TYPE => {
  const environment: ENV_TYPE = (process.env.ENVIRONMENT as ENV_TYPE) || DEV;
  return environment;
};

export const ENVIRONMENT = getEnvironment();
export const IS_PRODUCTION = ENVIRONMENT === PROD;

const API_PATH = '/api/gauntlet';

export const CONFIG = {
  [LOCAL]: {
    CLOUD_BASE_URL: `http://localhost:3000${API_PATH}`,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
  [DEV]: {
    CLOUD_BASE_URL: `https://api-dev.archlife.org${API_PATH}`,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
  [PROD]: {
    CLOUD_BASE_URL: `https://api.archlife.org${API_PATH}`,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
}[ENVIRONMENT];
