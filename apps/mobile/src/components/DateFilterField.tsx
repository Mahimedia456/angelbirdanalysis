import { useMemo, useState } from 'react';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type DateFilterFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimumValue?: string;
  maximumValue?: string;
};

function parseDateValue(value?: string) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toFilterValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDisplayValue(value: string) {
  const parsed = parseDateValue(value);
  if (!parsed) return 'Select date';
  return parsed.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function CalendarGlyph() {
  return (
    <View style={styles.calendarIcon}>
      <View style={styles.calendarTop} />
      <View style={styles.calendarDotRow}>
        <View style={styles.calendarDot} />
        <View style={styles.calendarDot} />
      </View>
    </View>
  );
}

export function DateFilterField({
  label,
  value,
  onChange,
  minimumValue,
  maximumValue,
}: DateFilterFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(() => parseDateValue(value) ?? new Date());
  const minimumDate = useMemo(() => parseDateValue(minimumValue), [minimumValue]);
  const maximumDate = useMemo(() => parseDateValue(maximumValue), [maximumValue]);

  function showPicker() {
    setDraft(parseDateValue(value) ?? maximumDate ?? minimumDate ?? new Date());
    setOpen(true);
  }

  function commit(date: Date) {
    onChange(toFilterValue(date));
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controlRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} calendar`}
          onPress={showPicker}
          style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}
        >
          <CalendarGlyph />
          <Text numberOfLines={1} style={[styles.dateText, !value && styles.placeholderText]}>
            {toDisplayValue(value)}
          </Text>
        </Pressable>
        {value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label.toLowerCase()}`}
            hitSlop={8}
            onPress={() => onChange('')}
            style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
          >
            <Text style={styles.clearText}>×</Text>
          </Pressable>
        ) : null}
      </View>

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draft}
          mode="date"
          presentation="dialog"
          display="calendar"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          accentColor={colors.brand.ink}
          onValueChange={(_event, selectedDate) => {
            setDraft(selectedDate);
            commit(selectedDate);
            setOpen(false);
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal animationType="fade" transparent visible={open} onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalEyebrow}>DATE FILTER</Text>
                  <Text style={styles.modalTitle}>{label}</Text>
                </View>
                <Pressable onPress={() => setOpen(false)} style={styles.modalClose}>
                  <Text style={styles.modalCloseText}>×</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={draft}
                mode="date"
                display="inline"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                accentColor={colors.brand.ink}
                themeVariant="light"
                onValueChange={(_event, selectedDate) => setDraft(selectedDate)}
                style={styles.iosPicker}
              />
              <View style={styles.modalActions}>
                {value ? (
                  <Pressable onPress={() => { onChange(''); setOpen(false); }} style={styles.secondaryAction}>
                    <Text style={styles.secondaryActionText}>Clear</Text>
                  </Pressable>
                ) : <View />}
                <Pressable onPress={() => { commit(draft); setOpen(false); }} style={styles.primaryAction}>
                  <Text style={styles.primaryActionText}>Apply date</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, gap: 6 },
  label: { color: colors.text.secondary, fontSize: 10, fontWeight: '900', letterSpacing: 0.35, textTransform: 'uppercase' },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateButton: { minHeight: 44, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.soft },
  dateText: { flex: 1, color: colors.text.primary, fontSize: 11, fontWeight: '800' },
  placeholderText: { color: colors.text.muted, fontWeight: '700' },
  clearButton: { width: 32, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.card },
  clearText: { color: colors.text.secondary, fontSize: 20, lineHeight: 22, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  calendarIcon: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: colors.brand.ink, overflow: 'hidden' },
  calendarTop: { height: 5, borderBottomWidth: 1.5, borderBottomColor: colors.brand.ink, backgroundColor: colors.surface.card },
  calendarDotRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  calendarDot: { width: 3, height: 3, borderRadius: 99, backgroundColor: colors.brand.ink },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', padding: spacing.md, backgroundColor: 'rgba(15, 23, 42, 0.42)' },
  modalCard: { width: '100%', borderRadius: radius.xl, padding: spacing.md, backgroundColor: colors.surface.card, borderWidth: 1, borderColor: colors.border.default },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  modalEyebrow: { color: colors.text.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  modalTitle: { marginTop: 2, color: colors.text.primary, fontSize: 18, fontWeight: '900' },
  modalClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.surface.soft },
  modalCloseText: { color: colors.text.primary, fontSize: 22, lineHeight: 24, fontWeight: '700' },
  iosPicker: { width: '100%' },
  modalActions: { marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  secondaryAction: { minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.surface.soft },
  secondaryActionText: { color: colors.text.primary, fontSize: 12, fontWeight: '900' },
  primaryAction: { minHeight: 44, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.brand.ink },
  primaryActionText: { color: colors.text.inverse, fontSize: 12, fontWeight: '900' },
});
