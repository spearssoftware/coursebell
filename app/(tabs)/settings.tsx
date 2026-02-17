import { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../src/store/settings-store';
import { requestNotificationPermissions } from '../../src/lib/bell-engine';
import { colors, spacing, borderRadius, fontSize } from '../../src/theme';
import type { BellSound, BellSounds } from '../../src/types';

const SOUND_ASSETS: Record<BellSound, ReturnType<typeof require>> = {
  'school-bell': require('../../assets/sounds/school-bell.wav'),
  'school-bell2': require('../../assets/sounds/school-bell2.wav'),
  'old-school-bell': require('../../assets/sounds/old-school-bell.wav'),
  'bike-bell': require('../../assets/sounds/bike-bell.wav'),
  'ping': require('../../assets/sounds/ping.wav'),
  'light-alert': require('../../assets/sounds/light-alert.wav'),
  'quiet-alert': require('../../assets/sounds/quiet-alert.wav'),
  'up-and-down': require('../../assets/sounds/up-and-down.wav'),
};

const BELL_SOUNDS: Array<{ id: BellSound; label: string }> = [
  { id: 'school-bell', label: 'School Bell' },
  { id: 'school-bell2', label: 'School Bell 2' },
  { id: 'old-school-bell', label: 'Old School Bell' },
  { id: 'bike-bell', label: 'Bike Bell' },
  { id: 'ping', label: 'Ping' },
  { id: 'light-alert', label: 'Light Alert' },
  { id: 'quiet-alert', label: 'Quiet Alert' },
  { id: 'up-and-down', label: 'Up and Down' },
];

function SoundPicker({
  selected,
  onSelect,
}: {
  selected: BellSound;
  onSelect: (id: BellSound) => void;
}) {
  return (
    <View style={styles.card}>
      {BELL_SOUNDS.map((sound, index) => (
        <TouchableOpacity
          key={sound.id}
          style={[styles.soundRow, index < BELL_SOUNDS.length - 1 && styles.soundRowBorder]}
          onPress={() => onSelect(sound.id)}
          activeOpacity={0.6}
        >
          <Text
            style={[
              styles.soundLabel,
              selected === sound.id && styles.selectedSound,
            ]}
          >
            {sound.label}
          </Text>
          {selected === sound.id && (
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const {
    bellSounds,
    warningMinutes,
    notificationsEnabled,
    setBellSound,
    setWarningMinutes,
    setNotificationsEnabled,
  } = useSettingsStore();

  const soundRef = useRef<Audio.Sound | null>(null);

  const previewSound = useCallback(async (id: BellSound) => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    const { sound } = await Audio.Sound.createAsync(SOUND_ASSETS[id]);
    soundRef.current = sound;
    await sound.playAsync();
  }, []);

  const handleSelectSound = useCallback((bellType: keyof BellSounds, id: BellSound) => {
    setBellSound(bellType, id);
    previewSound(id);
  }, [setBellSound, previewSound]);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        <Text style={styles.sectionTitle}>Period Start Sound</Text>
        <SoundPicker
          selected={bellSounds.start}
          onSelect={(id) => handleSelectSound('start', id)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Warning Sound</Text>
        <SoundPicker
          selected={bellSounds.warning}
          onSelect={(id) => handleSelectSound('warning', id)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Period End Sound</Text>
        <SoundPicker
          selected={bellSounds.end}
          onSelect={(id) => handleSelectSound('end', id)}
        />
        <Text style={styles.hint}>
          Tap any sound to preview it.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>CourseBell</Text>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </View>
      </View>
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
