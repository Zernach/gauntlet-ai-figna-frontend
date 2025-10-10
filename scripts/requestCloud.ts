import { CONFIG } from '@/constants/config';

type HeaderProvider = () => HeadersInit | Promise<HeadersInit>;

let authHeadersProvider: HeaderProvider | null = null;

export const setAuthHeadersProvider = (provider: HeaderProvider) => {
  authHeadersProvider = provider;
};

export const requestCloud = async <T>({
  endpoint,
  method = 'GET',
  params,
  headers,
}: {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: BodyInit | Record<string, unknown>;
  headers?: HeadersInit;
}): Promise<T> => {
  try {
    const url = `${CONFIG.CLOUD_BASE_URL}${endpoint}`;
    const dynamicHeaders = authHeadersProvider
      ? await authHeadersProvider()
      : {};
    const response = await fetch(url, {
      method,
      headers: {
        ...(dynamicHeaders ?? {}),
        ...(headers ?? {}),
        'Content-Type': 'application/json',
        Accept: 'image/png, application/json',
      },
      body: method !== 'GET' && params ? JSON.stringify(params) : undefined,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    const contentType = response.headers.get('Content-Type') ?? '';
    if (contentType.includes('image/png')) {
      const blob = await response.blob();
      return blob as T;
    }
    const json = await response.json();
    if (
      json?.errors?.length ||
      json?.error?.length ||
      json?.error?.message?.length
    ) {
      throw new Error(JSON.stringify(json, null, 2));
    }
    return json as T;
  } catch (error) {
    const message = JSON.stringify(
      {
        endpoint,
        method,
        params,
      },
      null,
      2,
    );
    console.error('Error requesting cloud:', error, message);
    throw error;
  }
};
