import { fontFamily } from './fonts';

export const typography = {
  heading: {
    fontFamily: fontFamily.system,
    fontSize: 26,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  subheading: {
    fontFamily: fontFamily.system,
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamily.system,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodyBold: {
    fontFamily: fontFamily.system,
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
    fontFamily: fontFamily.system,
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
