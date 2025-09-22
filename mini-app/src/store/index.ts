// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import vkParams from './vkParamsSlice';
import { runnersApi } from './runnersApi';
import user from './userSlice';
import bannerAd from './bannerAdSlice';

export const store = configureStore({
  reducer: {
    user,
    vkParams,
    bannerAd,
    [runnersApi.reducerPath]: runnersApi.reducer,
  },
  middleware: (gDM) => gDM().concat(runnersApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
