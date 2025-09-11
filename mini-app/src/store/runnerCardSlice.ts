import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export type RunnerCard = {
  fullName: string;
  cityDistrict: string;
  pace: string;
  avatarUrl?: string;
};

type State = {
  data?: RunnerCard;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
};

const initialState: State = {
  status: 'idle',
};

// Заменить URL/логику под бэкенд Артема:
export const loadRunnerCard = createAsyncThunk<RunnerCard, { userId: number }>(
  'runnerCard/load',
  async ({ userId }) => {
    const res = await fetch(`/api/runner-card?user_id=${userId}`, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    // ожидаем от бэкенда схему; при необходимости — трансформируйте тут
    return {
      fullName: json.fullName,
      cityDistrict: json.cityDistrict,
      pace: json.pace,
      avatarUrl: json.avatarUrl,
    };
  }
);

const slice = createSlice({
  name: 'runnerCard',
  initialState,
  reducers: {
    setRunnerCard(state, action: { payload: RunnerCard }) {
      state.data = action.payload;
      state.status = 'succeeded';
      state.error = undefined;
    },
    resetRunnerCard(state) {
      state.data = undefined;
      state.status = 'idle';
      state.error = undefined;
    },
  },
  extraReducers: (b) => {
    b.addCase(loadRunnerCard.pending, (s) => { s.status = 'loading'; s.error = undefined; });
    b.addCase(loadRunnerCard.fulfilled, (s, a) => { s.status = 'succeeded'; s.data = a.payload; });
    b.addCase(loadRunnerCard.rejected, (s, a) => {
      s.status = 'failed';
      s.error = a.error?.message || 'Failed to load runner card';
    });
  },
});

export const { setRunnerCard, resetRunnerCard } = slice.actions;
export default slice.reducer;
