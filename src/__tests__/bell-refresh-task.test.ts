import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { scheduleBellNotifications } from '../lib/bell-engine';
import { useScheduleStore } from '../store/schedule-store';
import { useSettingsStore } from '../store/settings-store';
import type { DaySchedule } from '../types';

jest.mock('../lib/bell-engine', () => ({
  scheduleBellNotifications: jest.fn(() => Promise.resolve()),
}));

import { refreshBellsFromStorage, registerBellRefreshTask } from '../bell-refresh-task';

const mockSchedule = scheduleBellNotifications as jest.Mock;
const mockDefineTask = TaskManager.defineTask as jest.Mock;
const mockGetPerms = Notifications.getPermissionsAsync as jest.Mock;
const mockRequestPerms = Notifications.requestPermissionsAsync as jest.Mock;
const mockRegister = BackgroundTask.registerTaskAsync as jest.Mock;
// Captured before any beforeEach clears the mock's call history.
const [taskName, taskExecutor] = mockDefineTask.mock.calls[0] as [
  string,
  () => Promise<BackgroundTask.BackgroundTaskResult>,
];

const initialSchedule = useScheduleStore.getState();
const initialSettings = useSettingsStore.getState();

const storedDays: DaySchedule[] = [
  {
    dayOfWeek: 1,
    periods: [
      { id: 'p-1', label: 'Period 1', startTime: '08:00', endTime: '08:50', sortOrder: 0, bellAtStart: true, bellAtEnd: true, bellBeforeEnd: false },
    ],
  },
];

async function persist(onboarded: boolean) {
  await AsyncStorage.setItem('@classhop/days', JSON.stringify(storedDays));
  await AsyncStorage.setItem(
    '@classhop/settings',
    JSON.stringify({ warningMinutes: 3, notificationsEnabled: true, selectedBellSound: 'chime' }),
  );
  await AsyncStorage.setItem('@classhop/mutedDate', '2026-02-16');
  if (onboarded) await AsyncStorage.setItem('@classhop/hasCompletedOnboarding', 'true');
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

afterEach(() => {
  useScheduleStore.setState(initialSchedule, true);
  useSettingsStore.setState(initialSettings, true);
});

describe('bell refresh task', () => {
  it('is defined at module load', () => {
    expect(taskName).toBe('bell-refresh');
    expect(taskExecutor).toBeInstanceOf(Function);
  });

  it('books bells from persisted data when launched cold', async () => {
    await persist(true);

    await expect(taskExecutor()).resolves.toBe(BackgroundTask.BackgroundTaskResult.Success);

    expect(mockSchedule).toHaveBeenCalledWith({
      days: storedDays,
      warningMinutes: 3,
      notificationsEnabled: true,
      bellSounds: { start: 'chime', warning: 'chime', end: 'chime' },
      mutedDate: '2026-02-16',
    });
  });

  it('uses the in-memory stores when the app is already running', async () => {
    await persist(true);
    const liveDays: DaySchedule[] = [{ dayOfWeek: 2, periods: [] }];
    useScheduleStore.setState({ days: liveDays, isLoaded: true });
    useSettingsStore.setState({ isLoaded: true, hasCompletedOnboarding: true });

    await refreshBellsFromStorage();

    expect(mockSchedule).toHaveBeenCalledWith(expect.objectContaining({ days: liveDays }));
  });

  it('books nothing before onboarding finishes', async () => {
    await persist(false);

    await refreshBellsFromStorage();

    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('never prompts for permission from the background', async () => {
    await persist(true);
    mockGetPerms.mockResolvedValueOnce({ status: 'undetermined' });

    await refreshBellsFromStorage();

    expect(mockRequestPerms).not.toHaveBeenCalled();
    expect(mockSchedule).not.toHaveBeenCalled();
  });
});

describe('registerBellRefreshTask', () => {
  it('registers with a six-hour minimum interval', async () => {
    await registerBellRefreshTask();

    expect(mockRegister).toHaveBeenCalledWith('bell-refresh', { minimumInterval: 360 });
  });

  it('swallows registration errors', async () => {
    mockRegister.mockRejectedValueOnce(new Error('not permitted'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(registerBellRefreshTask()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});
