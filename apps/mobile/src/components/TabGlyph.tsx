import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

type Props = {
  kind: 'tickets' | 'satisfaction' | 'rma';
  focused: boolean;
};

const glyphs = { tickets: '▤', satisfaction: '★', rma: '↺' } as const;

export function TabGlyph({ kind, focused }: Props) {
  return (
    <View style={[styles.glyph, focused && styles.glyphFocused]}>
      <Text style={[styles.label, focused && styles.labelFocused]}>{glyphs[kind]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: {
    width: 34,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  glyphFocused: {
    backgroundColor: colors.brand.accent,
  },
  label: {
    color: colors.text.muted,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '900',
  },
  labelFocused: {
    color: colors.brand.ink,
  },
});
