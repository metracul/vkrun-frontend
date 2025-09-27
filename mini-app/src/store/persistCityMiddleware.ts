import { Middleware } from '@reduxjs/toolkit';
import { setSelectedCity, STORAGE_KEY_CITY } from './cityFilterSlice';

export const persistCityMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);

  if (setSelectedCity.match(action)) {
    try {
      const value: string | null = action.payload ?? null;
      if (value && value.trim()) {
        localStorage.setItem(STORAGE_KEY_CITY, value);
      } else {
        localStorage.removeItem(STORAGE_KEY_CITY);
      }
    } catch {
      // noop
    }
  }

  return result;
};
