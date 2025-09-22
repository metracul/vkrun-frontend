// src/hooks/useBannerAdEvents.ts
import { useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';
import { useAppDispatch } from '../store/hooks';
import { bannerClosedByUser, bannerUpdated } from '../store/bannerAdSlice';

/**
 * Подписка на:
 *  - VKWebAppBannerAdUpdated
 *  - VKWebAppBannerAdClosedByUser
 *
 * Тип обработчика берём из bridge.subscribe, чтобы не завязываться на версии типов.
 */
export function useBannerAdEvents() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    type BridgeEventHandler = Parameters<typeof bridge.subscribe>[0];

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

    bridge.subscribe(handler);
    return () => {
      try { bridge.unsubscribe(handler); } catch {}
    };
  }, [dispatch]);
}
