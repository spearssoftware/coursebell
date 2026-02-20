import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useScheduleStore } from '../../src/store/schedule-store';
import { useSettingsStore } from '../../src/store/settings-store';
import { CountdownTimer } from '../../src/components/CountdownTimer';
import { PeriodRow } from '../../src/components/PeriodRow';
import { EmptyState } from '../../src/components/EmptyState';
import { scheduleBellNotifications } from '../../src/lib/bell-engine';
import { getCurrentTime, isTimeBefore, isTimeAfterOrEqual, formatTimeDisplay } from '../../src/lib/time-utils';
import { colors, spacing, borderRadius, fontSize } from '../../src/theme';
import type { Period } from '../../src/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getActivePeriodIndex(periods: Period[], now: string): number {
  return periods.findIndex(
    (p) => isTimeAfterOrEqual(now, p.startTime) && isTimeBefore(now, p.endTime),
  );
}

function getNextBellTime(periods: Period[], now: string): { period: Period; time: string } | undefined {
  for (const p of periods) {
    if (p.bellAtStart && isTimeBefore(now, p.startTime)) {
      return { period: p, time: p.startTime };
    }
    if (p.bellAtEnd && isTimeBefore(now, p.endTime)) {
      return { period: p, time: p.endTime };
    }
  }
  return undefined;
}

export default function TodayScreen() {
  const { days, isLoaded } = useScheduleStore();
  const warningMinutes = useSettingsStore((s) => s.warningMinutes);
  const bellSounds = useSettingsStore((s) => s.bellSounds);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const mutedDate = useSettingsStore((s) => s.mutedDate);
  const isMutedToday = useSettingsStore((s) => s.isMutedToday);
  const toggleMuteToday = useSettingsStore((s) => s.toggleMuteToday);
  const muted = !notificationsEnabled || isMutedToday();
  const [now, setNow] = useState(getCurrentTime);

  useEffect(() => {
    const interval = setInterval(() => setNow(getCurrentTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isLoaded) {
        scheduleBellNotifications(days, warningMinutes, muted, bellSounds);
      }
    }, [isLoaded, days, warningMinutes, muted, bellSounds]),
  );

  const today = new Date().getDay();
  const daySchedule = days.find((d) => d.dayOfWeek === today);
  const periods = daySchedule?.periods ?? [];

  const activePeriodIndex = getActivePeriodIndex(periods, now);
  const nextBell = getNextBellTime(periods, now);
  const allDone =
    periods.length > 0 &&
    isTimeAfterOrEqual(now, periods[periods.length - 1].endTime);

  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (!isLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.dayName}>{DAY_NAMES[today]}</Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>

      {periods.length > 0 && (
        <TouchableOpacity
          style={[styles.muteButton, muted && styles.muteButtonActive]}
          onPress={toggleMuteToday}
          activeOpacity={0.7}
        >
          <Ionicons
            name={muted ? 'notifications-off' : 'notifications-off-outline'}
            size={18}
            color={muted ? colors.white : colors.textSecondary}
          />
          <Text style={[styles.muteButtonText, muted && styles.muteButtonTextActive]}>
            {muted ? 'Bells Muted Today' : 'Mute Today'}
          </Text>
        </TouchableOpacity>
      )}

      {!muted && nextBell ? (
        <View style={styles.countdownCard}>
          <Text style={styles.countdownLabel}>Next Bell</Text>
          <CountdownTimer targetTime={nextBell.time} />
          <Text style={styles.nextPeriodLabel}>
            {nextBell.period.label} at {formatTimeDisplay(nextBell.time)}
          </Text>
        </View>
      ) : allDone ? (
        <View style={[styles.countdownCard, styles.doneCard]}>
          <Text style={styles.doneEmoji}>{'\uD83C\uDF89'}</Text>
          <Text style={styles.doneText}>All done for today!</Text>
        </View>
      ) : null}

      {periods.length > 0 ? (
        <View style={styles.periodsSection}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          {periods.map((period, index) => (
            <PeriodRow
              key={period.id}
              period={period}
              isActive={index === activePeriodIndex}
              isPast={isTimeAfterOrEqual(now, period.endTime)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="calendar-outline"
          title="No schedule today"
          subtitle="Add periods for this day in the Schedule tab"
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  dayName: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  muteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: spacing.lg,
  },
  muteButtonActive: {
    backgroundColor: colors.accent,
  },
  muteButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  muteButtonTextActive: {
    color: colors.white,
  },
  countdownCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  countdownLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  nextPeriodLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  doneCard: {
    backgroundColor: colors.successLight,
  },
  doneEmoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  doneText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.success,
  },
  periodsSection: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
});
