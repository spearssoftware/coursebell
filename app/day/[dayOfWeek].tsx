import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useScheduleStore } from '../../src/store/schedule-store';
import { useSettingsStore } from '../../src/store/settings-store';
import { EmptyState } from '../../src/components/EmptyState';
import { parseTime } from '../../src/lib/time-utils';
import { colors, spacing, borderRadius, fontSize } from '../../src/theme';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DayEditorScreen() {
  const { dayOfWeek: dayParam } = useLocalSearchParams<{ dayOfWeek: string }>();
  const dayOfWeek = Math.max(0, Math.min(6, parseInt(dayParam ?? '1', 10) || 0));
  const router = useRouter();
  const { days, addPeriod, updatePeriod, deletePeriod, copyDay } = useScheduleStore();
  const { timeBetweenPeriods } = useSettingsStore();
  const [showCopyModal, setShowCopyModal] = useState(false);

  const daySchedule = days.find((d) => d.dayOfWeek === dayOfWeek);
  const periods = daySchedule?.periods ?? [];

  const handleAddPeriod = () => {
    const lastPeriod = periods[periods.length - 1];
    const baseTime = lastPeriod ? lastPeriod.endTime : '08:00';
    const baseMins = parseInt(baseTime.split(':')[0]) * 60 + parseInt(baseTime.split(':')[1]);
    const startMins = lastPeriod ? baseMins + timeBetweenPeriods : baseMins;
    const defaultStart = `${String(Math.floor(startMins / 60)).padStart(2, '0')}:${String(startMins % 60).padStart(2, '0')}`;
    const endMins = startMins + 50;
    const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

    addPeriod(dayOfWeek, {
      label: `Period ${periods.length + 1}`,
      startTime: defaultStart,
      endTime,
      bellAtStart: true,
      bellAtEnd: true,
      bellBeforeEnd: true,
    });
  };

  const handleDeletePeriod = (periodId: string, label: string) => {
    Alert.alert('Delete Period', `Remove "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deletePeriod(dayOfWeek, periodId),
      },
    ]);
  };

  const handleCopyFrom = (fromDay: number) => {
    const source = days.find((d) => d.dayOfWeek === fromDay);
    if (!source || source.periods.length === 0) {
      Alert.alert('Nothing to copy', `${DAY_NAMES[fromDay]} has no periods.`);
      setShowCopyModal(false);
      return;
    }

    Alert.alert(
      'Copy Schedule',
      `Replace ${DAY_NAMES[dayOfWeek]}'s periods with ${DAY_NAMES[fromDay]}'s ${source.periods.length} period(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: () => {
            copyDay(fromDay, dayOfWeek);
            setShowCopyModal(false);
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerTitle: DAY_NAMES[dayOfWeek],
          headerBackTitle: 'Schedule',
          headerTintColor: colors.primary,
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowCopyModal(true)}>
              <Ionicons name="copy-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>
          Periods ({periods.length})
        </Text>

        {periods.length === 0 && (
          <EmptyState
            icon="add-circle-outline"
            title="No periods yet"
            subtitle="Tap the button below to add your first period"
          />
        )}

        {periods.map((period) => (
          <View key={period.id} style={styles.periodCard}>
            <View style={styles.periodHeader}>
              <TextInput
                style={styles.periodLabel}
                value={period.label}
                onChangeText={(text) => updatePeriod(dayOfWeek, period.id, { label: text })}
                placeholder="Period name"
                placeholderTextColor={colors.textTertiary}
              />
              <TouchableOpacity
                onPress={() => handleDeletePeriod(period.id, period.label)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={22} color={colors.danger} />
              </TouchableOpacity>
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.timeLabel}>Start</Text>
                <TimeInput
                  value={period.startTime}
                  onChange={(time) => updatePeriod(dayOfWeek, period.id, { startTime: time })}
                />
              </View>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={colors.textTertiary}
                style={styles.timeArrow}
              />
              <View style={styles.timeField}>
                <Text style={styles.timeLabel}>End</Text>
                <TimeInput
                  value={period.endTime}
                  onChange={(time) => updatePeriod(dayOfWeek, period.id, { endTime: time })}
                />
              </View>
            </View>

            <View style={styles.bellSection}>
              <BellToggle
                label="Bell at start"
                value={period.bellAtStart}
                onChange={(val) => updatePeriod(dayOfWeek, period.id, { bellAtStart: val })}
              />
              <BellToggle
                label="Warning before end"
                value={period.bellBeforeEnd}
                onChange={(val) => updatePeriod(dayOfWeek, period.id, { bellBeforeEnd: val })}
              />
              <BellToggle
                label="Bell at end"
                value={period.bellAtEnd}
                onChange={(val) => updatePeriod(dayOfWeek, period.id, { bellAtEnd: val })}
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={handleAddPeriod} activeOpacity={0.7}>
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.addButtonText}>Add Period</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showCopyModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCopyModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Copy from...</Text>
            {DAY_NAMES.map((name, i) => {
              if (i === dayOfWeek) return null;
              const source = days.find((d) => d.dayOfWeek === i);
              const count = source?.periods.length ?? 0;
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.copyOption}
                  onPress={() => handleCopyFrom(i)}
                >
                  <Text style={styles.copyOptionText}>{name}</Text>
                  <Text style={styles.copyOptionMeta}>
                    {count === 0 ? 'No periods' : `${count} period${count === 1 ? '' : 's'}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function BellToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <View style={styles.bellRow}>
      <View style={styles.bellInfo}>
        <Ionicons
          name={value ? 'notifications' : 'notifications-off-outline'}
          size={16}
          color={value ? colors.primary : colors.textTertiary}
        />
        <Text style={styles.bellLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={colors.white}
      />
    </View>
  );
}

function timeToDate(time: string): Date {
  const { hours, minutes } = parseTime(time);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function TimeInput({ value, onChange }: { value: string; onChange: (time: string) => void }) {
  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (!selected) return;
    const h = String(selected.getHours()).padStart(2, '0');
    const m = String(selected.getMinutes()).padStart(2, '0');
    onChange(`${h}:${m}`);
  };

  return (
    <DateTimePicker
      value={timeToDate(value)}
      mode="time"
      display="compact"
      onChange={handleChange}
      accentColor={colors.primary}
      style={styles.timePicker}
    />
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  periodCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  periodLabel: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    padding: 0,
    marginRight: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timeField: {
    flex: 1,
  },
  timeLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  timePicker: {
    alignSelf: 'flex-start',
  },
  timeArrow: {
    marginHorizontal: spacing.sm,
    marginTop: spacing.md,
  },
  bellSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  bellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  bellInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bellLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    marginTop: spacing.sm,
  },
  addButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  copyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  copyOptionText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  copyOptionMeta: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
});
