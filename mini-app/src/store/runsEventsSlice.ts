// src/store/runsEventsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type RunsEventsState = {
  updatedAt: number | null;   // метка последнего обновления
  deletedId: number | null;   // id пробежки, если удалили
};

const initialState: RunsEventsState = {
  updatedAt: null,
  deletedId: null,
};

const runsEventsSlice = createSlice({
  name: 'runsEvents',
  initialState,
  reducers: {
    runsUpdated(state) {
      state.updatedAt = Date.now();
    },
    runDeleted(state, action: PayloadAction<number>) {
      state.deletedId = action.payload;
      state.updatedAt = Date.now();
    },
    reset(state) {
      state.updatedAt = null;
      state.deletedId = null;
    },
  },
});

export const { runsUpdated, runDeleted, reset } = runsEventsSlice.actions;
export default runsEventsSlice.reducer;
