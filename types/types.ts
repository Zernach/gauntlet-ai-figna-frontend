export enum REDUX_SLICES {
  ROOT = 'root',
  CANVAS = 'canvas',
  USER = 'user',
  PRESENCE = 'presence',
  WEBSOCKET = 'websocket',
}

export type AsyncRequestState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
};
