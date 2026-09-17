import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { colors, effects, radius, spacing, typography } from '@/theme';

export type ChartMetric = { name: string; value: number };

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

function Tooltip({ item }: { item: ChartMetric | null }) {
  if (!item) return null;
  return (
    <View style={styles.tooltip}>
      <Text numberOfLines={1} style={styles.tooltipName}>{item.name}</Text>
      <Text style={styles.tooltipValue}>{item.value.toLocaleString()}</Text>
    </View>
  );
}

export function HorizontalBarChart({
  title,
  items,
  maxItems,
}: {
  title: string;
  items: ChartMetric[];
  maxItems?: number;
}) {
  const [active, setActive] = useState<ChartMetric | null>(null);
  const visible = typeof maxItems === 'number' ? items.slice(0, maxItems) : items;
  const max = Math.max(1, ...visible.map((item) => item.value));

  return (
    <View style={styles.card}>
      <CardHeader eyebrow="BREAKDOWN" title={title} />
      <Tooltip item={active} />
      {visible.length === 0 ? (
        <Text style={styles.empty}>No values available.</Text>
      ) : (
        <View style={styles.barList}>
          {visible.map((item) => (
            <Pressable
              key={`${title}-${item.name}`}
              onPress={() => setActive(item)}
              onPressIn={() => setActive(item)}
              onHoverIn={() => setActive(item)}
              onHoverOut={() => setActive((current) => (current?.name === item.name ? null : current))}
              style={({ pressed }) => [styles.barItem, pressed && styles.metricPressed]}
            >
              <View style={styles.barLabelRow}>
                <Text numberOfLines={2} style={styles.barLabel}>{item.name}</Text>
                <Text style={styles.barValue}>{item.value.toLocaleString()}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.max(4, (item.value / max) * 100)}%` }]} />
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}


export function VerticalBarChart({
  title,
  items,
  maxItems,
}: {
  title: string;
  items: ChartMetric[];
  maxItems?: number;
}) {
  const [active, setActive] = useState<ChartMetric | null>(null);
  const visible = typeof maxItems === 'number' ? items.slice(0, maxItems) : items;
  const max = Math.max(1, ...visible.map((item) => item.value));
  const barWidth = 54;
  const barHeight = 150;

  return (
    <View style={styles.card}>
      <CardHeader eyebrow="BREAKDOWN" title={title} />
      <Tooltip item={active} />
      {visible.length === 0 ? (
        <Text style={styles.empty}>No values available.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.verticalBarScroll}
        >
          {visible.map((item) => {
            const fillHeight = Math.max(6, (item.value / max) * barHeight);
            return (
              <Pressable
                key={`${title}-${item.name}`}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}: ${item.value}`}
                onPress={() => setActive(item)}
                onPressIn={() => setActive(item)}
                onHoverIn={() => setActive(item)}
                onHoverOut={() => setActive((current) => (current?.name === item.name ? null : current))}
                style={({ pressed }) => [styles.verticalBarItem, { width: barWidth }, pressed && styles.metricPressed]}
              >
                <Text style={styles.verticalBarValue}>{item.value.toLocaleString()}</Text>
                <View style={[styles.verticalBarTrack, { height: barHeight }]}>
                  <View style={[styles.verticalBarFill, { height: fillHeight }]} />
                </View>
                <Text numberOfLines={2} style={styles.verticalBarLabel}>{item.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
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
  const [active, setActive] = useState<ChartMetric | null>(null);
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
      <Tooltip item={active} />
      {total <= 0 ? (
        <Text style={styles.empty}>No values available.</Text>
      ) : (
        <View style={styles.donutLayout}>
          <View style={{ width: size, height: size }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <Circle cx={size / 2} cy={size / 2} r={radiusValue} fill="none" stroke={colors.surface.soft} strokeWidth={strokeWidth} />
              {data.map((item, index) => {
                const segment = (item.value / total) * circumference;
                const dashOffset = -cumulative;
                cumulative += segment;
                const isActive = active?.name === item.name;
                return (
                  <Circle
                    key={`${title}-${item.name}`}
                    cx={size / 2}
                    cy={size / 2}
                    r={radiusValue}
                    fill="none"
                    stroke={chartColor(index)}
                    strokeWidth={isActive ? strokeWidth + 5 : strokeWidth}
                    strokeDasharray={`${segment} ${Math.max(0, circumference - segment)}`}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="butt"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    onPress={() => setActive(item)}
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
              <Pressable
                key={`${title}-legend-${item.name}`}
                onPress={() => setActive(item)}
                onPressIn={() => setActive(item)}
                onHoverIn={() => setActive(item)}
                onHoverOut={() => setActive((current) => (current?.name === item.name ? null : current))}
                style={({ pressed }) => [styles.legendRow, pressed && styles.metricPressed]}
              >
                <View style={[styles.legendDot, { backgroundColor: chartColor(index) }]} />
                <Text numberOfLines={1} style={styles.legendName}>{item.name}</Text>
                <Text style={styles.legendValue}>{item.value.toLocaleString()}</Text>
              </Pressable>
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
  if (iso?.[2] && iso?.[3]) return `${iso[3]}/${iso[2]}`;
  const month = raw.match(/^(\d{4})-(\d{2})$/);
  if (month?.[1] && month?.[2]) return `${month[2]}/${month[1].slice(2)}`;
  return raw.length > 10 ? raw.slice(0, 10) : raw;
}

export function LineTrendChart({
  title,
  items,
  maxPoints,
  enablePinchZoom = false,
}: {
  title: string;
  items: ChartMetric[];
  maxPoints?: number;
  enablePinchZoom?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const sourceData = typeof maxPoints === 'number' ? items.slice(-maxPoints) : items;
  const [viewport, setViewport] = useState<{ start: number; end: number } | null>(null);
  const pinchStartRef = useRef<{ start: number; end: number; focusIndex: number; focalRatio: number } | null>(null);
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.max(250, Math.min(620, screenWidth - 64));
  const totalPoints = sourceData.length;
  const minVisiblePoints = Math.min(4, Math.max(2, totalPoints));
  const normalizedViewport = useMemo(() => {
    if (!viewport || totalPoints <= minVisiblePoints) return { start: 0, end: totalPoints };
    const start = Math.max(0, Math.min(viewport.start, Math.max(0, totalPoints - minVisiblePoints)));
    const end = Math.max(start + minVisiblePoints, Math.min(viewport.end, totalPoints));
    return { start, end };
  }, [viewport, totalPoints, minVisiblePoints]);
  const data = sourceData.slice(normalizedViewport.start, normalizedViewport.end);
  const isZoomed = normalizedViewport.start > 0 || normalizedViewport.end < totalPoints;
  const chartHeight = 176;
  const horizontalPadding = 12;
  const verticalPadding = 18;
  const usableWidth = chartWidth - horizontalPadding * 2;
  const usableHeight = chartHeight - verticalPadding * 2;
  const max = Math.max(1, ...data.map((item) => item.value));
  const points = data.map((item, index) => {
    const x = data.length <= 1 ? chartWidth / 2 : horizontalPadding + (index / (data.length - 1)) * usableWidth;
    const y = verticalPadding + usableHeight - (item.value / max) * usableHeight;
    return { x, y, item };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');
  const peak = data.reduce<ChartMetric | null>((best, item) => (!best || item.value > best.value ? item : best), null);
  const active = activeIndex === null ? null : points[activeIndex]?.item ?? null;

  const pinchGesture = useMemo(() =>
    Gesture.Pinch()
      .enabled(enablePinchZoom && totalPoints > minVisiblePoints)
      .runOnJS(true)
      .onStart((event) => {
        const currentStart = normalizedViewport.start;
        const currentEnd = normalizedViewport.end;
        const currentCount = Math.max(1, currentEnd - currentStart);
        const focalRatio = Math.max(0, Math.min(1, (event.focalX - horizontalPadding) / Math.max(1, usableWidth)));
        const focusIndex = currentStart + focalRatio * Math.max(0, currentCount - 1);
        pinchStartRef.current = { start: currentStart, end: currentEnd, focusIndex, focalRatio };
      })
      .onUpdate((event) => {
        const startState = pinchStartRef.current;
        if (!startState || totalPoints <= minVisiblePoints) return;
        const initialCount = Math.max(minVisiblePoints, startState.end - startState.start);
        const targetCount = Math.max(
          minVisiblePoints,
          Math.min(totalPoints, Math.round(initialCount / Math.max(0.25, event.scale))),
        );
        if (targetCount >= totalPoints) {
          setViewport(null);
          setActiveIndex(null);
          return;
        }
        const rawStart = Math.round(startState.focusIndex - startState.focalRatio * Math.max(0, targetCount - 1));
        const nextStart = Math.max(0, Math.min(rawStart, totalPoints - targetCount));
        setViewport({ start: nextStart, end: nextStart + targetCount });
        setActiveIndex(null);
      })
      .onEnd(() => {
        pinchStartRef.current = null;
      }),
    [enablePinchZoom, totalPoints, minVisiblePoints, normalizedViewport.start, normalizedViewport.end, horizontalPadding, usableWidth],
  );

  const resetZoom = () => {
    setViewport(null);
    setActiveIndex(null);
  };

  const chartBody = (
    <View style={[styles.svgWrap, { width: chartWidth, height: chartHeight }]}>
      <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = verticalPadding + ratio * usableHeight;
          return <Line key={`grid-${ratio}`} x1={horizontalPadding} x2={chartWidth - horizontalPadding} y1={y} y2={y} stroke={colors.border.soft} strokeWidth={1} />;
        })}
        {points.length > 1 ? <Polyline points={polyline} fill="none" stroke={colors.brand.ink} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" /> : null}
        {points.map((point, index) => (
          <Circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r={activeIndex === index ? 5.5 : points.length > 24 ? 2.8 : 4}
            fill={colors.brand.accent}
            stroke={colors.brand.ink}
            strokeWidth={activeIndex === index ? 2.3 : 1.5}
          />
        ))}
      </Svg>
      {points.map((point, index) => (
        <Pressable
          key={`hit-${title}-${index}`}
          accessibilityRole="button"
          accessibilityLabel={`${point.item.name}: ${point.item.value}`}
          hitSlop={6}
          onPress={() => setActiveIndex(index)}
          onPressIn={() => setActiveIndex(index)}
          onHoverIn={() => setActiveIndex(index)}
          onHoverOut={() => setActiveIndex((current) => (current === index ? null : current))}
          style={[styles.pointHit, { left: point.x - 14, top: point.y - 14 }]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.card}>
      <CardHeader eyebrow="TREND" title={title} />
      <Tooltip item={active} />
      {data.length === 0 ? (
        <Text style={styles.empty}>No trend data available.</Text>
      ) : (
        <>
          <View style={styles.lineMetaRow}>
            <Text style={styles.lineMeta}>Peak: {peak?.value.toLocaleString() ?? '0'}</Text>
            <Text style={styles.lineMeta}>{data.length} points</Text>
          </View>
          {enablePinchZoom ? <GestureDetector gesture={pinchGesture}>{chartBody}</GestureDetector> : chartBody}
          {enablePinchZoom ? (
            <View style={styles.zoomHintRow}>
              <Text style={styles.zoomHint}>Two-finger pinch to zoom</Text>
              {isZoomed ? (
                <Pressable accessibilityRole="button" onPress={resetZoom} hitSlop={8}>
                  <Text style={styles.zoomReset}>Reset zoom</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <View style={styles.axisRow}>
            <Text style={styles.axisLabel}>{shortLabel(data[0]?.name || '')}</Text>
            {data.length > 2 ? <Text style={styles.axisLabel}>{shortLabel(data[Math.floor((data.length - 1) / 2)]?.name || '')}</Text> : null}
            <Text style={styles.axisLabel}>{shortLabel(data[data.length - 1]?.name || '')}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card, overflow: 'hidden', ...effects.soft },
  eyebrow: { color: colors.text.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.25 },
  title: { marginTop: 5, color: colors.text.primary, ...typography.sectionTitle },
  empty: { marginTop: spacing.md, color: colors.text.muted, fontSize: 11, fontWeight: '600' },
  tooltip: { alignSelf: 'flex-start', maxWidth: '100%', marginTop: spacing.sm, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.pill, backgroundColor: colors.brand.ink },
  tooltipName: { maxWidth: 220, color: colors.text.inverse, fontSize: 10, fontWeight: '800' },
  tooltipValue: { color: colors.brand.accent, fontSize: 11, fontWeight: '900' },
  metricPressed: { opacity: 0.76 },
  barList: { marginTop: spacing.md, gap: 12 },
  barItem: { gap: 6, borderRadius: radius.md },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  barLabel: { flex: 1, color: colors.text.secondary, fontSize: 11, fontWeight: '800' },
  barValue: { color: colors.text.primary, fontSize: 11, fontWeight: '900' },
  barTrack: { height: 9, overflow: 'hidden', borderRadius: radius.pill, backgroundColor: colors.surface.soft },
  barFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.brand.accent },
  verticalBarScroll: { minHeight: 214, alignItems: 'flex-end', gap: 12, paddingTop: spacing.md, paddingRight: spacing.sm },
  verticalBarItem: { alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  verticalBarValue: { color: colors.text.primary, fontSize: 9, fontWeight: '900' },
  verticalBarTrack: { width: 34, justifyContent: 'flex-end', overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.surface.soft },
  verticalBarFill: { width: '100%', borderRadius: radius.md, backgroundColor: colors.brand.accent },
  verticalBarLabel: { minHeight: 28, width: 58, color: colors.text.secondary, fontSize: 8, lineHeight: 12, fontWeight: '800', textAlign: 'center' },
  donutLayout: { marginTop: spacing.md, alignItems: 'center', gap: spacing.md },
  donutCenter: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  donutTotal: { color: colors.text.primary, fontSize: 25, fontWeight: '900' },
  donutLabel: { marginTop: 2, color: colors.text.muted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  legend: { width: '100%', gap: 8 },
  legendRow: { minHeight: 32, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.sm },
  legendDot: { width: 9, height: 9, borderRadius: 99 },
  legendName: { flex: 1, color: colors.text.secondary, fontSize: 10, fontWeight: '800' },
  legendValue: { color: colors.text.primary, fontSize: 10, fontWeight: '900' },
  lineMetaRow: { marginTop: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  lineMeta: { color: colors.text.muted, fontSize: 9, fontWeight: '800' },
  svgWrap: { marginTop: spacing.xs, alignSelf: 'center', position: 'relative' },
  pointHit: { position: 'absolute', width: 28, height: 28, borderRadius: 14 },
  zoomHintRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  zoomHint: { color: colors.text.muted, fontSize: 8, fontWeight: '700' },
  zoomReset: { color: colors.brand.ink, fontSize: 9, fontWeight: '900', textDecorationLine: 'underline' },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  axisLabel: { color: colors.text.muted, fontSize: 8, fontWeight: '700' },
});
