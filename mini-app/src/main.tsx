// src/main.tsx
import { createRoot } from 'react-dom/client';
import vkBridge from '@vkontakte/vk-bridge';
import { AppConfig } from './AppConfig';
import { ensureLaunchQueryString } from './shared/vkParams';

async function bootstrap() {
  await vkBridge.send('VKWebAppInit');
  await ensureLaunchQueryString(vkBridge);

  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('Root element not found');
  createRoot(rootEl).render(<AppConfig />);

  if (import.meta.env.MODE === 'development') {
    await import('./eruda');
  }
}

bootstrap().catch((e) => {
  console.error('Bootstrap failed:', e);
  const el = document.getElementById('root');
  if (el) {
    el.innerHTML = `<div style="padding:16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
      <b>Ошибка инициализации</b><br/>${e?.message ?? e}
    </div>`;
  }
});
