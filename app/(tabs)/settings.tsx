import { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import Constants from 'expo-constants';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../src/store/settings-store';
import { requestNotificationPermissions } from '../../src/lib/bell-engine';
import { colors, spacing, borderRadius, fontSize } from '../../src/theme';
import type { BellSound, BellSounds } from '../../src/types';

const SOUND_ASSETS: Record<BellSound, ReturnType<typeof require>> = {
  'school-bell': require('../../assets/sounds/school-bell.wav'),
  'dinner-bell': require('../../assets/sounds/dinner-bell.wav'),
  'chime': require('../../assets/sounds/chime.wav'),
  'sonar-alarm': require('../../assets/sounds/sonar-alarm.wav'),
  'classic-alarm': require('../../assets/sounds/classic-alarm.wav'),
  'melodic-alarm': require('../../assets/sounds/melodic-alarm.wav'),
  'double-beep': require('../../assets/sounds/double-beep.wav'),
  'up-and-down': require('../../assets/sounds/up-and-down.wav'),
  'retro-sms': require('../../assets/sounds/retro-sms.wav'),
  'soft-triple': require('../../assets/sounds/soft-triple.wav'),
  'whistle': require('../../assets/sounds/whistle.wav'),
  'eight-bit': require('../../assets/sounds/eight-bit.wav'),
};

const BELL_SOUNDS: Array<{ id: BellSound; label: string }> = [
  { id: 'school-bell', label: 'School Bell' },
  { id: 'dinner-bell', label: 'Dinner Bell' },
  { id: 'chime', label: 'Chime' },
  { id: 'sonar-alarm', label: 'Sonar Alarm' },
  { id: 'classic-alarm', label: 'Classic Alarm' },
  { id: 'melodic-alarm', label: 'Melodic Alarm' },
  { id: 'double-beep', label: 'Double Beep' },
  { id: 'up-and-down', label: 'Up and Down' },
  { id: 'retro-sms', label: 'Retro SMS' },
  { id: 'soft-triple', label: 'Soft Triple' },
  { id: 'whistle', label: 'Whistle' },
  { id: 'eight-bit', label: '8-Bit' },
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
  const router = useRouter();
  const {
    bellSounds,
    warningMinutes,
    timeBetweenPeriods,
    notificationsEnabled,
    setBellSound,
    setWarningMinutes,
    setTimeBetweenPeriods,
    setNotificationsEnabled,
  } = useSettingsStore();

  const playerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => () => playerRef.current?.release(), []);

  const previewSound = useCallback((id: BellSound) => {
    playerRef.current?.release();
    const player = createAudioPlayer(SOUND_ASSETS[id]);
    playerRef.current = player;
    player.play();
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
        <Text style={styles.sectionTitle}>Time Between Periods</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Ionicons name="swap-horizontal-outline" size={20} color={colors.text} />
              <Text style={styles.rowLabel}>Minutes between periods</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => {
                  if (timeBetweenPeriods > 0) setTimeBetweenPeriods(timeBetweenPeriods - 1);
                }}
              >
                <Ionicons name="remove" size={18} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{timeBetweenPeriods}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => {
                  if (timeBetweenPeriods < 30) setTimeBetweenPeriods(timeBetweenPeriods + 1);
                }}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Text style={styles.hint}>
          When adding a new period, {timeBetweenPeriods === 0 ? 'it will start immediately after the previous period ends' : `${timeBetweenPeriods} minute${timeBetweenPeriods === 1 ? '' : 's'} will be added between the end of the last period and the start of the next`}.
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
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/history')}
            activeOpacity={0.6}
          >
            <View style={styles.rowContent}>
              <Ionicons name="time-outline" size={20} color={colors.text} />
              <Text style={styles.rowLabel}>Schedule History</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>CourseBell</Text>
            <Text style={styles.versionText}>v{Constants.expoConfig?.version ?? '—'}</Text>
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
