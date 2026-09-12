import { Image, StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <View
      style={[
        styles.shell,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Image
        source={require('../../assets/brand/angelbird-mark.png')}
        resizeMode="contain"
        style={{ width: size * 0.54, height: size * 0.64 }}
        accessibilityLabel="AngelBird"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.card,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
});
