import { createRoot } from 'react-dom/client';
import vkBridge from '@vkontakte/vk-bridge';
import { AppConfig } from './AppConfig';
import { ensureLaunchQueryString } from './shared/vkParams';

async function bootstrap() {
  // 1) Инициализация VK Bridge
  await vkBridge.send('VKWebAppInit');

  // 2) Гарантируем наличие launch QS (с vk_user_id, vk_app_id и т.п.)
  await ensureLaunchQueryString(vkBridge);

  // 3) Рендер приложения
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    throw new Error('Root element not found');
  }
  createRoot(rootEl).render(<AppConfig />);

  // 4) Подключение dev-инструментов
  if (import.meta.env.MODE === 'development') {
    await import('./eruda');
  }
}

bootstrap().catch((e) => {
  // Явно показываем ошибку, если инициализация не удалась
  console.error('Bootstrap failed:', e);
  const el = document.getElementById('root');
  if (el) {
    el.innerHTML = `<div style="padding:16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
      <b>Ошибка инициализации</b><br/>
      ${e?.message ?? e}
    </div>`;
  }
});

