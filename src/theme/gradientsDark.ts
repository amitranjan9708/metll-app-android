export const gradientsDark = {
  primary: {
    colors: ['#7A8FC4', '#9BB0E0'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  primaryVertical: {
    colors: ['#7A8FC4', '#9BB0E0'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  secondary: {
    colors: ['#7A8FC4', '#9BB0E0'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  background: {
    colors: ['#0F1419', '#1A1F28', '#1F2530'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  romantic: {
    colors: ['#7A8FC4', '#9BB0E0'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  card: {
    colors: ['rgba(122, 143, 196, 0.1)', 'rgba(232, 164, 184, 0.05)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  accent: {
    colors: ['#E8A4B8', '#F0B8C8'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  love: {
    colors: ['#F08080', '#E8A4B8'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

export type GradientConfig = (typeof gradientsDark)[keyof typeof gradientsDark];
