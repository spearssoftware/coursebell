import { useEffect } from 'react';
import { AppState, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { setAudioModeAsync } from 'expo-audio';
import { scheduleBellNotifications } from '../src/lib/bell-engine';
import { msUntilNextMidnight } from '../src/lib/time-utils';
import { registerBellRefreshTask } from '../src/bell-refresh-task';
import { useScheduleStore } from '../src/store/schedule-store';
import { useSettingsStore } from '../src/store/settings-store';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { colors } from '../src/theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Rebooks on every change, whenever the app returns to the foreground, and at
// each local midnight while it stays open (a classroom display may never
// leave the foreground), so the window of booked bells keeps rolling forward.
// A background task rolls it forward while the app isn't opened at all.
// A separate component so schedule edits don't re-render the whole Stack.
function BellScheduler() {
  const days = useScheduleStore((s) => s.days);
  const warningMinutes = useSettingsStore((s) => s.warningMinutes);
  const bellSounds = useSettingsStore((s) => s.bellSounds);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const mutedDate = useSettingsStore((s) => s.mutedDate);

  useEffect(() => {
    registerBellRefreshTask();
  }, []);

  useEffect(() => {
    const reschedule = () =>
      scheduleBellNotifications({ days, warningMinutes, notificationsEnabled, bellSounds, mutedDate });
    reschedule();
    // Only a real return from background: inactive -> active also fires when
    // Notification Center or a system alert closes, and nothing changed then.
    let previous = AppState.currentState;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && previous === 'background') reschedule();
      previous = state;
    });
    // Timers pause while the app is suspended; a late fire just rebooks again.
    let midnight: ReturnType<typeof setTimeout>;
    const armMidnight = () => {
      midnight = setTimeout(() => {
        reschedule();
        armMidnight();
      }, msUntilNextMidnight());
    };
    armMidnight();
    return () => {
      sub.remove();
      clearTimeout(midnight);
    };
  }, [days, warningMinutes, bellSounds, notificationsEnabled, mutedDate]);

  return null;
}

export default function RootLayout() {
  const loadData = useScheduleStore((s) => s.loadData);
  const loadHistory = useScheduleStore((s) => s.loadHistory);
  const isScheduleLoaded = useScheduleStore((s) => s.isLoaded);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const isSettingsLoaded = useSettingsStore((s) => s.isLoaded);
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    loadData();
    loadHistory();
    loadSettings();
    // Otherwise the audio session keeps iOS's default soloAmbient category and
    // sound previews are muted by the ring/silent switch. Only sets the
    // category — the session is activated on playback, and the default
    // mixWithOthers interruption mode leaves other apps' audio alone.
    setAudioModeAsync({ playsInSilentMode: true }).catch((e) =>
      console.warn('Failed to set audio mode; sound previews may be silent', e),
    );
  }, []);

  if (!isScheduleLoaded || !isSettingsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      {hasCompletedOnboarding && <BellScheduler />}
      <ErrorBoundary>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.text, fontWeight: '600' },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
            redirect={!hasCompletedOnboarding}
          />
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false }}
            redirect={hasCompletedOnboarding}
          />
          <Stack.Screen
            name="day/[dayOfWeek]"
            options={{
              presentation: 'card',
              headerTitle: 'Edit Day',
              headerBackTitle: 'Schedule',
            }}
          />
          <Stack.Screen
            name="history"
            options={{
              presentation: 'card',
              headerTitle: 'Schedule History',
              headerBackTitle: 'Settings',
            }}
          />
          <Stack.Screen
            name="import"
            options={{ headerShown: false }}
          />
        </Stack>
      </ErrorBoundary>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
