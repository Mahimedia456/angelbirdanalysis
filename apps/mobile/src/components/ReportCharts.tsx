import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { colors, effects, radius, spacing, typography } from '@/theme';

export type ChartMetric = {
  name: string;
  value: number;
};

const PIE_COLORS = [
  colors.brand.accent,
  '#2F3D46',
  '#64748B',
  '#94A3B8',
  '#CBD5E1',
  '#E2E8F0',
];


function chartColor(index: number) {
  return PIE_COLORS[index % PIE_COLORS.length] ?? colors.brand.ink;
}

function compactPieData(items: ChartMetric[], limit = 5) {
  const positive = items.filter((item) => item.value > 0);
  if (positive.length <= limit + 1) return positive;

  const top = positive.slice(0, limit);
  const other = positive.slice(limit).reduce((sum, item) => sum + item.value, 0);
  return [...top, { name: 'Others', value: other }];
}

function CardHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

export function HorizontalBarChart({
  title,
  items,
  maxItems = 7,
}: {
  title: string;
  items: ChartMetric[];
  maxItems?: number;
}) {
  const visible = items.slice(0, maxItems);
  const max = Math.max(1, ...visible.map((item) => item.value));

  return (
    <View style={styles.card}>
      <CardHeader eyebrow="BREAKDOWN" title={title} />
      {visible.length === 0 ? (
        <Text style={styles.empty}>No values available.</Text>
      ) : (
        <View style={styles.barList}>
          {visible.map((item) => (
            <View key={`${title}-${item.name}`} style={styles.barItem}>
              <View style={styles.barLabelRow}>
                <Text numberOfLines={1} style={styles.barLabel}>{item.name}</Text>
                <Text style={styles.barValue}>{item.value.toLocaleString()}</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.max(4, (item.value / max) * 100)}%` },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function DonutChart({
  title,
  items,
  centerLabel = 'Total',
}: {
  title: string;
  items: ChartMetric[];
  centerLabel?: string;
}) {
  const data = useMemo(() => compactPieData(items), [items]);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const size = 184;
  const strokeWidth = 28;
  const radiusValue = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusValue;
  let cumulative = 0;

  return (
    <View style={styles.card}>
      <CardHeader eyebrow="DISTRIBUTION" title={title} />
      {total <= 0 ? (
        <Text style={styles.empty}>No values available.</Text>
      ) : (
        <View style={styles.donutLayout}>
          <View style={{ width: size, height: size }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radiusValue}
                fill="none"
                stroke={colors.surface.soft}
                strokeWidth={strokeWidth}
              />
              {data.map((item, index) => {
                const segment = (item.value / total) * circumference;
                const dashOffset = -cumulative;
                cumulative += segment;
                return (
                  <Circle
                    key={`${title}-${item.name}`}
                    cx={size / 2}
                    cy={size / 2}
                    r={radiusValue}
                    fill="none"
                    stroke={chartColor(index)}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${segment} ${Math.max(0, circumference - segment)}`}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="butt"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  />
                );
              })}
            </Svg>
            <View pointerEvents="none" style={styles.donutCenter}>
              <Text style={styles.donutTotal}>{total.toLocaleString()}</Text>
              <Text style={styles.donutLabel}>{centerLabel}</Text>
            </View>
          </View>

          <View style={styles.legend}>
            {data.map((item, index) => (
              <View key={`${title}-legend-${item.name}`} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: chartColor(index) }]} />
                <Text numberOfLines={1} style={styles.legendName}>{item.name}</Text>
                <Text style={styles.legendValue}>{item.value.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function shortLabel(value: string) {
  const raw = String(value || '');
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}/${iso[2]}`;
  const month = raw.match(/^(\d{4})-(\d{2})$/);
  const monthYear = month?.[1];
  const monthValue = month?.[2];
  if (monthYear && monthValue) return `${monthValue}/${monthYear.slice(2)}`;
  return raw.length > 10 ? raw.slice(0, 10) : raw;
}

export function LineTrendChart({
  title,
  items,
  maxPoints = 90,
}: {
  title: string;
  items: ChartMetric[];
  maxPoints?: number;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const data = items.slice(-maxPoints);
  const chartWidth = Math.max(250, Math.min(620, screenWidth - 64));
  const chartHeight = 176;
  const horizontalPadding = 12;
  const verticalPadding = 18;
  const usableWidth = chartWidth - horizontalPadding * 2;
  const usableHeight = chartHeight - verticalPadding * 2;
  const max = Math.max(1, ...data.map((item) => item.value));
  const points = data.map((item, index) => {
    const x = data.length <= 1
      ? chartWidth / 2
      : horizontalPadding + (index / (data.length - 1)) * usableWidth;
    const y = verticalPadding + usableHeight - (item.value / max) * usableHeight;
    return { x, y, item };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');
  const peak = data.reduce<ChartMetric | null>((best, item) => (!best || item.value > best.value ? item : best), null);

  return (
    <View style={styles.card}>
      <CardHeader eyebrow="TREND" title={title} />
      {data.length === 0 ? (
        <Text style={styles.empty}>No trend data available.</Text>
      ) : (
        <>
          <View style={styles.lineMetaRow}>
            <Text style={styles.lineMeta}>Peak: {peak?.value.toLocaleString() ?? '0'}</Text>
            <Text style={styles.lineMeta}>{data.length} periods</Text>
          </View>
          <View style={styles.svgWrap}>
            <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = verticalPadding + ratio * usableHeight;
                return (
                  <Line
                    key={`grid-${ratio}`}
                    x1={horizontalPadding}
                    x2={chartWidth - horizontalPadding}
                    y1={y}
                    y2={y}
                    stroke={colors.border.soft}
                    strokeWidth={1}
                  />
                );
              })}
              {points.length > 1 ? (
                <Polyline
                  points={polyline}
                  fill="none"
                  stroke={colors.brand.ink}
                  strokeWidth={3}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null}
              {points.map((point, index) => (
                <Circle
                  key={`point-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={points.length > 24 ? 2.3 : 3.5}
                  fill={colors.brand.accent}
                  stroke={colors.brand.ink}
                  strokeWidth={1.5}
                />
              ))}
            </Svg>
          </View>
          <View style={styles.axisRow}>
            <Text style={styles.axisLabel}>{shortLabel(data[0]?.name || '')}</Text>
            {data.length > 2 ? (
              <Text style={styles.axisLabel}>{shortLabel(data[Math.floor((data.length - 1) / 2)]?.name || '')}</Text>
            ) : null}
            <Text style={styles.axisLabel}>{shortLabel(data[data.length - 1]?.name || '')}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.card,
    overflow: 'hidden',
    ...effects.soft,
  },
  eyebrow: {
    color: colors.text.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.25,
  },
  title: {
    marginTop: 5,
    color: colors.text.primary,
    ...typography.sectionTitle,
  },
  empty: {
    marginTop: spacing.md,
    color: colors.text.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  barList: { marginTop: spacing.md, gap: 12 },
  barItem: { gap: 6 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  barLabel: { flex: 1, color: colors.text.secondary, fontSize: 11, fontWeight: '800' },
  barValue: { color: colors.text.primary, fontSize: 11, fontWeight: '900' },
  barTrack: { height: 9, overflow: 'hidden', borderRadius: radius.pill, backgroundColor: colors.surface.soft },
  barFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.brand.accent },
  donutLayout: { marginTop: spacing.md, alignItems: 'center', gap: spacing.md },
  donutCenter: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  donutTotal: { color: colors.text.primary, fontSize: 25, fontWeight: '900' },
  donutLabel: { marginTop: 2, color: colors.text.muted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  legend: { width: '100%', gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 9, height: 9, borderRadius: 99 },
  legendName: { flex: 1, color: colors.text.secondary, fontSize: 10, fontWeight: '800' },
  legendValue: { color: colors.text.primary, fontSize: 10, fontWeight: '900' },
  lineMetaRow: { marginTop: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  lineMeta: { color: colors.text.muted, fontSize: 9, fontWeight: '800' },
  svgWrap: { marginTop: spacing.xs, alignItems: 'center' },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  axisLabel: { color: colors.text.muted, fontSize: 8, fontWeight: '700' },
});
