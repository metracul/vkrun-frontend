import { createRoot } from 'react-dom/client';
import vkBridge from '@vkontakte/vk-bridge';
import { AppConfig } from './AppConfig';
import { ensureLaunchQueryString } from './shared/vkParams';

async function bootstrap() {
  // 1) Инициализируем bridge
  await vkBridge.send('VKWebAppInit');

  // 2) Гарантируем наличие launch QS (sessionStorage)
  const qs = await ensureLaunchQueryString(vkBridge);
  // На время отладки:
  // console.debug('Launch QS:', qs);

  // 3) Рендерим приложение
  createRoot(document.getElementById('root')!).render(<AppConfig />);

  // 4) Dev-инструменты (как было)
  if (import.meta.env.MODE === 'development') {
    import('./eruda');
  }
}

bootstrap().catch((e) => {
  // Падать явно, чтобы не отправлять пустые заголовки
  console.error(e);
  const el = document.getElementById('root');
  if (el) el.innerText = 'Ошибка инициализации: ' + (e?.message || e);
});
