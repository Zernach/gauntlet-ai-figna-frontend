import { AsyncRequestState } from '@/types/types';

export const createAsyncInitialState = <T>(): AsyncRequestState<T> => ({
  data: null,
  isLoading: false,
  error: null,
});

export const setPending = ({
  state,
}: {
  state: AsyncRequestState<unknown>;
}) => {
  state.isLoading = true;
  state.error = null;
};

export const setFulfilled = <T>({
  state,
  payload,
}: {
  state: AsyncRequestState<T>;
  payload: T;
}) => {
  state.data = payload;
  state.isLoading = false;
  state.error = null;
};

export const setRejected = ({
  state,
  errorMessage,
}: {
  state: AsyncRequestState<unknown>;
  errorMessage?: string;
}) => {
  state.isLoading = false;
  state.error = errorMessage ?? 'Unknown error';
};
