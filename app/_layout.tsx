import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
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

export default function RootLayout() {
  const loadData = useScheduleStore((s) => s.loadData);
  const isScheduleLoaded = useScheduleStore((s) => s.isLoaded);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const isSettingsLoaded = useSettingsStore((s) => s.isLoaded);
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    loadData();
    loadSettings();
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
            }}
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
