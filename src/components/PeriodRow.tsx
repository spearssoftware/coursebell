import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeDisplay } from '../lib/time-utils';
import { colors, spacing, borderRadius, fontSize } from '../theme';
import type { Period } from '../types';

interface PeriodRowProps {
  period: Period;
  isActive?: boolean;
  isPast?: boolean;
}

export function PeriodRow({ period, isActive = false, isPast = false }: PeriodRowProps) {
  const hasBell = period.bellAtStart || period.bellAtEnd || period.bellBeforeEnd;
  const iconColor = isActive ? colors.primary : isPast ? colors.textTertiary : colors.textSecondary;

  return (
    <View
      style={[
        styles.container,
        isActive && styles.activeContainer,
        isPast && styles.pastContainer,
      ]}
    >
      <View style={[styles.indicator, isActive && styles.activeIndicator]} />
      <View style={styles.content}>
        <Text style={[styles.label, isPast && styles.pastText, isActive && styles.activeLabel]}>
          {period.label}
        </Text>
        <Text style={[styles.time, isPast && styles.pastText]}>
          {formatTimeDisplay(period.startTime)} – {formatTimeDisplay(period.endTime)}
        </Text>
      </View>
      {hasBell && (
        <Ionicons name="notifications" size={16} color={iconColor} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  activeContainer: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  pastContainer: {
    opacity: 0.5,
  },
  indicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginRight: spacing.md,
  },
  activeIndicator: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  activeLabel: {
    color: colors.primary,
  },
  time: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  pastText: {
    color: colors.textTertiary,
  },
});
