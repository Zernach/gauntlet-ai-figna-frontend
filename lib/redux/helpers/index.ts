import { AsyncRequestState } from '@/types/types';

export const createAsyncInitialState = <T>(): AsyncRequestState<T> => ({
  data: null,
  isLoading: false,
  error: null,
});

export const setPending = (requestState: AsyncRequestState<unknown>) => {
  requestState.isLoading = true;
  requestState.error = null;
};

export const setFulfilled = <T>(
  requestState: AsyncRequestState<T>,
  payload: T,
) => {
  requestState.data = payload;
  requestState.isLoading = false;
  requestState.error = null;
};

export const setRejected = (
  requestState: AsyncRequestState<unknown>,
  errorMessage?: string,
) => {
  requestState.isLoading = false;
  requestState.error = errorMessage ?? 'Unknown error';
};
