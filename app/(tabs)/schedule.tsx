import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useScheduleStore } from '../../src/store/schedule-store';
import { EmptyState } from '../../src/components/EmptyState';
import { formatTimeDisplay } from '../../src/lib/time-utils';
import { colors, spacing, borderRadius, fontSize } from '../../src/theme';

const WEEKDAYS = [
  { dayOfWeek: 1, name: 'Monday', abbrev: 'Mon' },
  { dayOfWeek: 2, name: 'Tuesday', abbrev: 'Tue' },
  { dayOfWeek: 3, name: 'Wednesday', abbrev: 'Wed' },
  { dayOfWeek: 4, name: 'Thursday', abbrev: 'Thu' },
  { dayOfWeek: 5, name: 'Friday', abbrev: 'Fri' },
];

export default function ScheduleScreen() {
  const { days, isLoaded } = useScheduleStore();
  const router = useRouter();
  const today = new Date().getDay();

  if (!isLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {WEEKDAYS.map(({ dayOfWeek, name, abbrev }) => {
        const daySchedule = days.find((d) => d.dayOfWeek === dayOfWeek);
        const periods = daySchedule?.periods ?? [];
        const isToday = dayOfWeek === today;

        return (
          <TouchableOpacity
            key={dayOfWeek}
            style={[styles.card, isToday && styles.todayCard]}
            onPress={() => router.push(`/day/${dayOfWeek}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.dayInfo}>
                <Text style={[styles.dayAbbrev, isToday && styles.todayText]}>{abbrev}</Text>
                <Text style={[styles.dayName, isToday && styles.todayText]}>{name}</Text>
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.periodCount}>
                  {periods.length} {periods.length === 1 ? 'period' : 'periods'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </View>
            </View>

            {periods.length > 0 ? (
              <View style={styles.periodsList}>
                {periods.slice(0, 4).map((p) => (
                  <View key={p.id} style={styles.periodPreview}>
                    <Text style={styles.periodTime} numberOfLines={1}>
                      {formatTimeDisplay(p.startTime)}
                    </Text>
                    <Text style={styles.periodLabel} numberOfLines={1}>
                      {p.label}
                    </Text>
                  </View>
                ))}
                {periods.length > 4 && (
                  <Text style={styles.moreText}>+{periods.length - 4} more</Text>
                )}
              </View>
            ) : (
              <EmptyState
                icon="calendar-outline"
                title="No periods"
                subtitle="Tap to add your first period"
              />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  card: {
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
  todayCard: {
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayAbbrev: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    width: 36,
  },
  dayName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  todayText: {
    color: colors.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  periodCount: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  periodsList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  periodPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  periodTime: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    width: 72,
    fontVariant: ['tabular-nums'],
  },
  periodLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  moreText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
