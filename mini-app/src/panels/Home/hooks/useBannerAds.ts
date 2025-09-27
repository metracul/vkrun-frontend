import { useEffect } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { showBannerAd, hideBannerAd, bannerClosedByUser, bannerUpdated } from '../../../store/bannerAdSlice';
import vkBridge, { parseURLSearchParamsForGetLaunchParams } from '@vkontakte/vk-bridge';

/**
 * Универсальный хук для баннеров:
 * - Без аргументов: только подписка на события баннера (аналог useBannerAdEvents).
 * - С аргументами (activePanel, panelId): дополнительно управляет показом/скрытием баннера,
 *   когда текущая панель активна и запуск внутри WebView (не desktop_web).
 */
export function useBannerAds(activePanel?: string, panelId?: string) {
  const dispatch = useAppDispatch();

  // 1) Подписка на события VKWebAppBannerAdUpdated / VKWebAppBannerAdClosedByUser
  useEffect(() => {
    type BridgeEventHandler = Parameters<typeof vkBridge.subscribe>[0];

    const handler: BridgeEventHandler = (e) => {
      const detail: any = (e as any)?.detail;
      const type = detail?.type as string | undefined;

      switch (type) {
        case 'VKWebAppBannerAdUpdated': {
          const placement = detail?.data?.placement ?? null;
          const size = detail?.data?.size ?? null;
          dispatch(bannerUpdated({ placement, size }));
          break;
        }
        case 'VKWebAppBannerAdClosedByUser': {
          dispatch(bannerClosedByUser());
          break;
        }
        default:
          break;
      }
    };

    vkBridge.subscribe(handler);
    return () => {
      try {
        vkBridge.unsubscribe(handler);
      } catch {}
    };
  }, [dispatch]);

  // 2) Управление показом/скрытием баннера (опционально)
  useEffect(() => {
    // Если хук вызван без аргументов — ничего не показываем/прячем, только подписка на события.
    if (!activePanel || !panelId) return;
    if (activePanel !== panelId) return;

    const { vk_platform } = parseURLSearchParamsForGetLaunchParams(window.location.search);
    const inWebView = vkBridge.isWebView();
    if (!inWebView || vk_platform === 'desktop_web') return;

    dispatch(
      showBannerAd({
        minIntervalMs: 180_000,
        params: { banner_location: 'bottom', layout_type: 'resize' },
      }),
    );

    return () => {
      dispatch(hideBannerAd());
    };
  }, [dispatch, activePanel, panelId]);
}
