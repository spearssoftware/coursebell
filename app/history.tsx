import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useScheduleStore } from '../src/store/schedule-store';
import { colors, spacing, borderRadius, fontSize } from '../src/theme';
import type { DaySchedule, ScheduleSnapshot } from '../src/types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function snapshotSummary(days: DaySchedule[]): string {
  const parts = days
    .filter((d) => d.periods.length > 0)
    .map((d) => `${DAY_NAMES[d.dayOfWeek]}: ${d.periods.length}`);
  return parts.length > 0 ? parts.join(', ') + ' periods' : 'No periods';
}

function SnapshotRow({
  snapshot,
  onRestore,
  showBorder,
}: {
  snapshot: ScheduleSnapshot;
  onRestore: () => void;
  showBorder: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.snapshotRow, showBorder && styles.snapshotRowBorder]}
      onPress={onRestore}
      activeOpacity={0.6}
    >
      <View style={styles.snapshotContent}>
        <Text style={styles.snapshotLabel}>{snapshot.label}</Text>
        <Text style={styles.snapshotMeta}>{relativeTime(snapshot.timestamp)}</Text>
        <Text style={styles.snapshotSummary}>{snapshotSummary(snapshot.days)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const history = useScheduleStore((s) => s.history);
  const restoreSnapshot = useScheduleStore((s) => s.restoreSnapshot);
  const clearHistory = useScheduleStore((s) => s.clearHistory);

  const handleRestore = (snapshot: ScheduleSnapshot) => {
    Alert.alert(
      'Restore Snapshot',
      `Restore your schedule to the state from ${relativeTime(snapshot.timestamp)}? Your current schedule will be saved to history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            await restoreSnapshot(snapshot.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleClear = () => {
    Alert.alert(
      'Clear History',
      'Delete all saved snapshots? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearHistory,
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptySubtitle}>
            Snapshots are saved automatically before any changes to your schedule.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Snapshots</Text>
            <View style={styles.card}>
              {history.map((snapshot, index) => (
                <SnapshotRow
                  key={snapshot.id}
                  snapshot={snapshot}
                  onRestore={() => handleRestore(snapshot)}
                  showBorder={index < history.length - 1}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.clearButton} onPress={handleClear} activeOpacity={0.7}>
            <Text style={styles.clearButtonText}>Clear History</Text>
          </TouchableOpacity>
        </>
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  snapshotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  snapshotRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  snapshotContent: {
    flex: 1,
  },
  snapshotLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  snapshotMeta: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  snapshotSummary: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  clearButtonText: {
    fontSize: fontSize.md,
    color: colors.danger,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xl * 2,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
