import { configureStore } from '@reduxjs/toolkit';
import vkParams from './vkParamsSlice';
import { runnersApi } from './runnersApi';
import user from './userSlice';
import bannerAd from './bannerAdSlice';
import cityFilter from './cityFilterSlice';
import { persistCityMiddleware } from './persistCityMiddleware';
import runsFilter from './runsFilterSlice';
import runsEvents from './runsEventsSlice';

export const store = configureStore({
  reducer: {
    user,
    vkParams,
    bannerAd,
    cityFilter,
    runsFilter,
    runsEvents,
    [runnersApi.reducerPath]: runnersApi.reducer,
  },
  middleware: (gDM) =>
    gDM().concat(runnersApi.middleware, persistCityMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
