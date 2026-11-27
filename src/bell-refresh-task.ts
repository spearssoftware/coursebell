import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { scheduleBellNotifications } from './lib/bell-engine';
import { useScheduleStore } from './store/schedule-store';
import { useSettingsStore } from './store/settings-store';

export const BELL_REFRESH_TASK = 'bell-refresh';

// iOS treats this as a lower bound and runs the task when it sees fit, often
// overnight; asking more often than the ~3 school days of booked bells is
// what keeps the window from running dry when the app isn't opened.
const REFRESH_INTERVAL_MINUTES = 6 * 60;

// The task can run in a process iOS launched just for it, before the root
// layout has loaded the stores, so load them here when that hasn't happened.
// When the app was already running, the stores already match storage.
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

  await scheduleBellNotifications({ days, warningMinutes, notificationsEnabled, bellSounds, mutedDate });
}

// Must run at module load so the task exists when iOS launches the app for it.
TaskManager.defineTask(BELL_REFRESH_TASK, async () => {
  try {
    await refreshBellsFromStorage();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    console.warn('Background bell refresh failed', e);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBellRefreshTask(): Promise<void> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) return;
    if (await TaskManager.isTaskRegisteredAsync(BELL_REFRESH_TASK)) return;
    await BackgroundTask.registerTaskAsync(BELL_REFRESH_TASK, {
      minimumInterval: REFRESH_INTERVAL_MINUTES,
    });
  } catch (e) {
    console.warn('Failed to register background bell refresh; bells roll forward only when the app opens', e);
  }
}
