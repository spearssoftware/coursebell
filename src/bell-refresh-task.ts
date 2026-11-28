import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { scheduleBellNotifications } from './lib/bell-engine';
import { useScheduleStore } from './store/schedule-store';
import { useSettingsStore } from './store/settings-store';

const BELL_REFRESH_TASK = 'bell-refresh';

// Only a lower bound: iOS runs processing tasks when it sees fit (usually idle,
// on power and network, and less for rarely used apps), so this is a best-effort
// top-up of the booked window, not a guarantee. Changing it does not reach
// installs that already registered the task.
const REFRESH_INTERVAL_MINUTES = 6 * 60;

// The task can run in a process iOS launched just for it, before the root
// layout has loaded the stores, so load them here when that hasn't happened.
export async function refreshBellsFromStorage(): Promise<void> {
  const schedule = useScheduleStore.getState();
  const settings = useSettingsStore.getState();
  await Promise.all([
    schedule.isLoaded ? null : schedule.loadData(),
    settings.isLoaded ? null : settings.loadSettings(),
  ]);

  const { days } = useScheduleStore.getState();
  const { hasCompletedOnboarding, warningMinutes, notificationsEnabled, bellSounds, mutedDate } =
    useSettingsStore.getState();
  if (!hasCompletedOnboarding) return;
  // A permission prompt can't be answered from the background; leave asking to
  // the foreground scheduler.
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  await scheduleBellNotifications({ days, warningMinutes, notificationsEnabled, bellSounds, mutedDate });
}

// Must run at module load so the task exists when iOS launches the app for it.
// scheduleBellNotifications logs and swallows its own failures.
TaskManager.defineTask(BELL_REFRESH_TASK, async () => {
  await refreshBellsFromStorage();
  return BackgroundTask.BackgroundTaskResult.Success;
});

// registerTaskAsync itself skips simulators and already-registered tasks.
export async function registerBellRefreshTask(): Promise<void> {
  try {
    await BackgroundTask.registerTaskAsync(BELL_REFRESH_TASK, {
      minimumInterval: REFRESH_INTERVAL_MINUTES,
    });
  } catch (e) {
    console.warn('Failed to register background bell refresh; bells roll forward only when the app opens', e);
  }
}
