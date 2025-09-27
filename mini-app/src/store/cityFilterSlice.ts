import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const STORAGE_KEY_CITY = 'city.selected';

type CityFilterState = {
  selectedCity: string | null;
};

const initialState: CityFilterState = {
  selectedCity: null,
};

const cityFilterSlice = createSlice({
  name: 'cityFilter',
  initialState,
  reducers: {
    setSelectedCity(state, action: PayloadAction<string | null>) {
      state.selectedCity = action.payload;
    },
    hydrateCityFromStorage(state) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_CITY);
        state.selectedCity = saved && saved.trim() ? saved : state.selectedCity;
      } catch {
      }
    },
  },
});

export const { setSelectedCity, hydrateCityFromStorage } = cityFilterSlice.actions;
export default cityFilterSlice.reducer;
