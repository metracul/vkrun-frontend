import { createRoot } from 'react-dom/client';
import vkBridge from '@vkontakte/vk-bridge';
import { AppConfig } from './AppConfig';
import { getFrozenLaunchQueryString, setLaunchQueryString } from './shared/vkParams';

if (import.meta.env.DEV && !window.location.search && import.meta.env.VITE_VK_LAUNCH_QS) {
  setLaunchQueryString(import.meta.env.VITE_VK_LAUNCH_QS as string);
} else {
  getFrozenLaunchQueryString();
}

vkBridge.send('VKWebAppInit');

createRoot(document.getElementById('root')!).render(<AppConfig />);

if (import.meta.env.MODE === 'development') {
  import('./eruda');
}
