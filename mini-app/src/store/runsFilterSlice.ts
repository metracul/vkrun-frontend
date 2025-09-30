import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type RunsFilterState = {
  runDate: string;           // ISO-only date: 'YYYY-MM-DD' или ''
  districtName: string;
  distanceFromStr: string;   // ввод пользователя как строка
  distanceToStr: string;     // ввод пользователя как строка
  paceFrom: string;          // значение из PACE_OPTIONS или ''
  paceTo: string;            // значение из PACE_OPTIONS или ''
  joinedFilter: 'any' | 'only' | 'exclude';
};

const initialState: RunsFilterState = {
  runDate: '',
  districtName: '',
  distanceFromStr: '',
  distanceToStr: '',
  paceFrom: '',
  paceTo: '',
  joinedFilter: 'any',
};

const runsFilterSlice = createSlice({
  name: 'runsFilter',
  initialState,
  reducers: {
    setRunDate: (state, action: PayloadAction<string>) => {
      state.runDate = action.payload;
    },
    setDistrictName: (state, action: PayloadAction<string>) => {
      state.districtName = action.payload;
    },
    setDistanceFromStr: (state, action: PayloadAction<string>) => {
      state.distanceFromStr = action.payload;
    },
    setDistanceToStr: (state, action: PayloadAction<string>) => {
      state.distanceToStr = action.payload;
    },
    setPaceFrom: (state, action: PayloadAction<string>) => {
      state.paceFrom = action.payload;
    },
    setPaceTo: (state, action: PayloadAction<string>) => {
      state.paceTo = action.payload;
    },
    setJoinedFilter: (state, action: PayloadAction<'any' | 'only' | 'exclude'>) => {
      state.joinedFilter = action.payload;
    },
    resetFilters: () => initialState,
  },
});

export const {
  setRunDate,
  setDistrictName,
  setDistanceFromStr,
  setDistanceToStr,
  setPaceFrom,
  setPaceTo,
  setJoinedFilter,
  resetFilters,
} = runsFilterSlice.actions;

export default runsFilterSlice.reducer;
