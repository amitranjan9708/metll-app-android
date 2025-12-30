import { fontFamily } from './fonts';

export const typography = {
  heading: {
    fontFamily: fontFamily.novaklasse,
    fontSize: 26,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  subheading: {
    fontFamily: fontFamily.novaklasse,
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: fontFamily.system,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodyBold: {
    fontFamily: fontFamily.novaklasse,
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontFamily: fontFamily.novaklasse,
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  small: {
    fontFamily: fontFamily.system,
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 14,
  },
};
