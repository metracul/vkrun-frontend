import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import bridge from '@vkontakte/vk-bridge';

type BannerState = {
  isShown: boolean;          // фактический статус баннера по нашему состоянию
  lastShownAt: number | null; // отметка времени последней успешной команды показа
  isLoading: boolean;        // идёт команда показа/скрытия
  error?: string;
  // полезная мета от VKWebAppBannerAdUpdated (если придёт)
  placement?: string | null;
  size?: string | null;
};

// Частотный колпак по умолчанию (мс)
const DEFAULT_MIN_INTERVAL = 180_000;

const initialState: BannerState = {
  isShown: false,
  lastShownAt: null,
  isLoading: false,
  error: undefined,
  placement: null,
  size: null,
};

export type ShowBannerArgs = {
  /** Минимальный интервал между показами, мс */
  minIntervalMs?: number;
  /**
   * Параметры показа баннера для вашей версии SDK.
   * Пример (проверьте в своей версии): { banner_location: 'bottom', layout_type: 'overlay' }
   */
  params?: Record<string, any>;
};

/**
 * Показ баннера с проверкой частоты.
 * Если «слишком рано» — просто возвращаем успешный результат без вызова Bridge.
 */
export const showBannerAd = createAsyncThunk<boolean, ShowBannerArgs | undefined, { state: any }>(
  'bannerAd/show',
  async (args, thunkApi) => {
    const state = thunkApi.getState() as { bannerAd: BannerState };
    const { lastShownAt } = state.bannerAd;

    const minInterval = args?.minIntervalMs ?? DEFAULT_MIN_INTERVAL;
    const now = Date.now();
    if (lastShownAt != null && now - lastShownAt < minInterval) {
      // Частотный колпак: считаем «успешно, но без вызова Bridge»
      return true;
    }

    // В некоторых версиях параметры не обязательны — минимальный вызов может быть без них.
    const params = args?.params ?? {};

    try {
      const res = await bridge.send('VKWebAppShowBannerAd', params as any);
      // По договорённости Bridge вернёт result=true, если баннер показан/актуализирован
      return Boolean((res as any)?.result ?? true);
    } catch (e: any) {
      // пробрасываем в reject для слайса
      throw new Error(e?.message || 'VKWebAppShowBannerAd failed');
    }
  }
);

export const checkBannerAd = createAsyncThunk<boolean>(
  'bannerAd/check',
  async () => {
    try {
      const res = await bridge.send('VKWebAppCheckBannerAd');
      // ожидаем флаг, например { result: true } — проверьте в своей версии
      return Boolean((res as any)?.result);
    } catch (e: any) {
      throw new Error(e?.message || 'VKWebAppCheckBannerAd failed');
    }
  }
);

export const hideBannerAd = createAsyncThunk<boolean>(
  'bannerAd/hide',
  async () => {
    try {
      const res = await bridge.send('VKWebAppHideBannerAd');
      return Boolean((res as any)?.result ?? true);
    } catch (e: any) {
      throw new Error(e?.message || 'VKWebAppHideBannerAd failed');
    }
  }
);

const bannerAdSlice = createSlice({
  name: 'bannerAd',
  initialState,
  reducers: {
    // Системные события от Bridge
    bannerUpdated(state, { payload }: PayloadAction<{ placement?: string | null; size?: string | null }>) {
      state.placement = payload.placement ?? state.placement ?? null;
      state.size = payload.size ?? state.size ?? null;
      // факт показа не меняем — только метаданные
    },
    bannerClosedByUser(state) {
      state.isShown = false;
    },
    // Можно вручную сбросить частотный колпак (например, по кнопке для тестов)
    resetBannerFrequency(state) {
      state.lastShownAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(showBannerAd.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(showBannerAd.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.isShown = true;
          state.lastShownAt = Date.now();
        }
      })
      .addCase(showBannerAd.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(checkBannerAd.fulfilled, (state, action) => {
        state.isShown = action.payload;
      })
      .addCase(hideBannerAd.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(hideBannerAd.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.isShown = false;
        }
      })
      .addCase(hideBannerAd.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});

export const { bannerUpdated, bannerClosedByUser, resetBannerFrequency } = bannerAdSlice.actions;
export default bannerAdSlice.reducer;
