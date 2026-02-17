import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../src/store/settings-store';
import { requestNotificationPermissions } from '../../src/lib/bell-engine';
import { colors, spacing, borderRadius, fontSize } from '../../src/theme';
import type { BellSound } from '../../src/types';

const BELL_SOUNDS: Array<{ id: BellSound; label: string; icon: string }> = [
  { id: 'classic', label: 'Classic Bell', icon: 'notifications' },
  { id: 'chime', label: 'Single Chime', icon: 'musical-note' },
  { id: 'double-tone', label: 'Double Tone', icon: 'musical-notes' },
  { id: 'buzzer', label: 'Buzzer', icon: 'megaphone' },
  { id: 'gentle', label: 'Gentle Melody', icon: 'flower' },
];

export default function SettingsScreen() {
  const {
    selectedBellSound,
    warningMinutes,
    notificationsEnabled,
    setBellSound,
    setWarningMinutes,
    setNotificationsEnabled,
  } = useSettingsStore();

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'Enable notifications in your device Settings to receive bell alerts.',
        );
        return;
      }
    }
    setNotificationsEnabled(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              <Text style={styles.rowLabel}>Bell Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={colors.white}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Warning Bell</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Ionicons name="timer-outline" size={20} color={colors.text} />
              <Text style={styles.rowLabel}>Minutes before end</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => {
                  if (warningMinutes > 1) setWarningMinutes(warningMinutes - 1);
                }}
              >
                <Ionicons name="remove" size={18} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{warningMinutes}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => {
                  if (warningMinutes < 15) setWarningMinutes(warningMinutes + 1);
                }}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Text style={styles.hint}>
          Periods with "warning before end" enabled will ring {warningMinutes} minute{warningMinutes === 1 ? '' : 's'} before they end.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bell Sound</Text>
        <View style={styles.card}>
          {BELL_SOUNDS.map((sound, index) => (
            <TouchableOpacity
              key={sound.id}
              style={[styles.soundRow, index < BELL_SOUNDS.length - 1 && styles.soundRowBorder]}
              onPress={() => setBellSound(sound.id)}
              activeOpacity={0.6}
            >
              <View style={styles.rowContent}>
                <Ionicons
                  name={sound.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={selectedBellSound === sound.id ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.soundLabel,
                    selectedBellSound === sound.id && styles.selectedSound,
                  ]}
                >
                  {sound.label}
                </Text>
              </View>
              {selectedBellSound === sound.id && (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.hint}>
          Custom sounds will play when bell notifications fire. Using default system sound for now.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>ClassHop</Text>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
    minWidth: 24,
    textAlign: 'center',
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  soundRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  soundLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  selectedSound: {
    color: colors.primary,
    fontWeight: '600',
  },
  versionText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
});
