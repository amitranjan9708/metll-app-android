// Minimal gradients - mostly flat with subtle depth

export const gradients = {
    primary: {
        colors: ['#1F1F1F', '#2D2D2D'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },
    primaryVertical: {
        colors: ['#1F1F1F', '#2D2D2D'],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
    },
    secondary: {
        colors: ['#F5F5F5', '#FFFFFF'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },
    background: {
        colors: ['#FFFFFF', '#FAFAFA', '#F5F5F5'],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
    },
    romantic: {
        colors: ['#E07A5F', '#E8967E'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },
    card: {
        colors: ['rgba(255, 255, 255, 1)', 'rgba(250, 250, 250, 1)'],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
    },
    accent: {
        colors: ['#E07A5F', '#E8967E'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
    },
    love: {
        colors: ['#E07A5F', '#D96A50'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },
};

export type GradientConfig = (typeof gradients)[keyof typeof gradients];
