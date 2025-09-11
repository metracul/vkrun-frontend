import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import uiReducer from './uiSlice';
import runnerCardReducer from './runnerCardSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    ui: uiReducer,
    runnerCard: runnerCardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
