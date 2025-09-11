import { createSlice } from '@reduxjs/toolkit';

type UIState = {
  popout: boolean;
};

const initialState: UIState = {
  popout: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showSpinner(state) { state.popout = true; },
    hideSpinner(state) { state.popout = false; },
  },
});

export const { showSpinner, hideSpinner } = uiSlice.actions;
export default uiSlice.reducer;
