import type { TextStyle } from 'react-native';

export const typography = {
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
  } satisfies TextStyle,
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
  } satisfies TextStyle,
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  } satisfies TextStyle,
  caption: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  } satisfies TextStyle,
} as const;
