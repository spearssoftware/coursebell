import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={colors.textTertiary} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
