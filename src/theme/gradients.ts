export const gradients = {
    primary: {
        colors: ['#5A6FA3', '#A4B8E7'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },
    primaryVertical: {
        colors: ['#5A6FA3', '#A4B8E7'],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
    },
    secondary: {
        colors: ['#5A6FA3', '#A4B8E7'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },
    background: {
        colors: ['#A4B8E7', '#DDE5F8', '#EEF2FC'],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
    },
    romantic: {
        colors: ['#5A6FA3', '#A4B8E7'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },
    card: {
        colors: ['rgba(138, 163, 232, 0.08)', 'rgba(232, 164, 184, 0.04)'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },
    accent: {
        colors: ['#E8A4B8', '#F5D0DC'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
    },
    love: {
        colors: ['#E05C5C', '#E8A4B8'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },
};

export type GradientConfig = (typeof gradients)[keyof typeof gradients];
