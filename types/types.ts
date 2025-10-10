export enum REDUX_SLICES {
  ROOT = 'root',
  FIRST_SLICE = 'firstSlice',
  SECOND_SLICE = 'secondSlice',
}

export type AsyncRequestState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
};
