import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { REDUX_SLICES } from '@/types/types';

export type FirstSliceState = {
  count: number;
};

const initialState: FirstSliceState = {
  count: 0,
};

const firstSlice = createSlice({
  name: REDUX_SLICES.FIRST_SLICE,
  initialState,
  reducers: {
    increment(state) {
      state.count += 1;
    },
    incrementByAmount(state, action: PayloadAction<number>) {
      state.count += action.payload;
    },
    reset(state) {
      state.count = initialState.count;
    },
  },
});

export const { increment, incrementByAmount, reset } = firstSlice.actions;
export const firstSliceReducer = firstSlice.reducer;
