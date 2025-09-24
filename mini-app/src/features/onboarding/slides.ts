// features/onboarding/slides.ts
import { blobs } from './blobs';

export const SLIDES_SHEETS = [
  {
    media: { type: 'image' as const, blob: blobs[0] },
    title: 'Совместные пробежки',
    subtitle: 'Выбирай дистанцию, темп и время. Присоединяйся к пробежкам рядом.',
  },
  {
    media: { type: 'image' as const, blob: blobs[1] },
    title: 'Создавай и зови друзей',
    subtitle: 'Укажи город, район и темп — мы покажем желающим.',
  },
];
