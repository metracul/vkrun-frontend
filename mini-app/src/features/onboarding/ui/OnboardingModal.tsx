import { useEffect, useState } from 'react';
import { ModalRoot, ModalPage, Gallery, Title, Text, Button } from '@vkontakte/vkui';
import vkBridge from '@vkontakte/vk-bridge';

export type OnbSlide = { url: string; title: string; subtitle?: string };

export function OnboardingModal({ slides, onClose }: { slides: OnbSlide[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [appearance, setAppearance] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // узнаём текущую тему из bridge
    vkBridge.send('VKWebAppGetConfig')
      .then((data: any) => {
        if (data?.appearance === 'dark' || data?.scheme?.includes('dark')) {
          setAppearance('dark');
        } else {
          setAppearance('light');
        }
      })
      .catch(() => {});
  }, []);

  const bullets = appearance === 'dark' ? 'light' : 'dark';

  return (
    <ModalRoot activeModal="onboarding">
      <ModalPage id="onboarding" settlingHeight={100}>
        <div style={{ padding: 16 }}>
          <Gallery
            slideWidth="100%"
            bullets={bullets}
            slideIndex={index}
            onChange={setIndex}
            style={{ marginBottom: 16 }}
          >
            {slides.map((s, i) => (
              <div key={i} style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
                <img src={s.url} alt="" style={{ maxWidth: '100%', borderRadius: 12 }} />
                <Title level="2" style={{ textAlign: 'center' }}>{s.title}</Title>
                {s.subtitle && <Text style={{ textAlign: 'center' }}>{s.subtitle}</Text>}
              </div>
            ))}
          </Gallery>

          <Button size="l" stretched onClick={onClose}>
            Понятно
          </Button>
        </div>
      </ModalPage>
    </ModalRoot>
  );
}
