import { createSlice } from '@reduxjs/toolkit';
import { REDUX_SLICES } from '@/types/types';

export type SecondSliceState = {
  isEnabled: boolean;
};

const initialState: SecondSliceState = {
  isEnabled: false,
};

const secondSlice = createSlice({
  name: REDUX_SLICES.SECOND_SLICE,
  initialState,
  reducers: {
    enable(state) {
      state.isEnabled = true;
    },
    disable(state) {
      state.isEnabled = false;
    },
    toggle(state) {
      state.isEnabled = !state.isEnabled;
    },
  },
});

export const { enable, disable, toggle } = secondSlice.actions;
export const secondSliceReducer = secondSlice.reducer;
