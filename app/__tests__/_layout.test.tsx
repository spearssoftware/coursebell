import { act, render } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { setAudioModeAsync } from 'expo-audio';
import { scheduleBellNotifications } from '../../src/lib/bell-engine';
import { useScheduleStore } from '../../src/store/schedule-store';
import { useSettingsStore } from '../../src/store/settings-store';

jest.mock('../../src/lib/bell-engine', () => ({
  scheduleBellNotifications: jest.fn(() => Promise.resolve()),
  requestNotificationPermissions: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../../src/bell-refresh-task', () => ({
  registerBellRefreshTask: jest.fn(() => Promise.resolve()),
}));

import RootLayout from '../_layout';
import { registerBellRefreshTask } from '../../src/bell-refresh-task';

const mockSchedule = scheduleBellNotifications as jest.Mock;
const initialSchedule = useScheduleStore.getState();
const initialSettings = useSettingsStore.getState();

let appStateListeners: ((state: string) => void)[];
const emitAppState = (state: string) => act(() => appStateListeners.forEach((l) => l(state)));

function loadStores(hasCompletedOnboarding: boolean) {
  useScheduleStore.setState({ loadData: jest.fn(), loadHistory: jest.fn(), isLoaded: true });
  useSettingsStore.setState({ loadSettings: jest.fn(), isLoaded: true, hasCompletedOnboarding });
}

beforeEach(() => {
  jest.clearAllMocks();
  appStateListeners = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    appStateListeners.push(listener as (state: string) => void);
    return {
      remove: () => {
        appStateListeners = appStateListeners.filter((l) => l !== listener);
      },
    } as ReturnType<typeof AppState.addEventListener>;
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  useScheduleStore.setState(initialSchedule, true);
  useSettingsStore.setState(initialSettings, true);
});

describe('RootLayout', () => {
  it('puts the audio session in a category that ignores the silent switch', () => {
    loadStores(true);
    render(<RootLayout />);

    expect(setAudioModeAsync).toHaveBeenCalledWith({ playsInSilentMode: true });
  });

  it('schedules with the stored settings', () => {
    loadStores(true);
    useSettingsStore.setState({ warningMinutes: 4, notificationsEnabled: false, mutedDate: '2026-02-16' });

    render(<RootLayout />);

    const { days } = useScheduleStore.getState();
    const { bellSounds } = useSettingsStore.getState();
    expect(mockSchedule).toHaveBeenCalledWith({
      days, warningMinutes: 4, notificationsEnabled: false, bellSounds, mutedDate: '2026-02-16',
    });
  });

  it('reschedules only when the app returns from the background', () => {
    loadStores(true);
    render(<RootLayout />);
    expect(mockSchedule).toHaveBeenCalledTimes(1);

    emitAppState('inactive');
    emitAppState('active');
    expect(mockSchedule).toHaveBeenCalledTimes(1);

    emitAppState('background');
    emitAppState('active');
    expect(mockSchedule).toHaveBeenCalledTimes(2);
  });

  it('reschedules when the schedule or mute date changes', () => {
    loadStores(true);
    render(<RootLayout />);

    act(() => useScheduleStore.setState({ days: [{ dayOfWeek: 1, periods: [] }] }));
    act(() => useSettingsStore.setState({ mutedDate: '2026-02-17' }));

    expect(mockSchedule).toHaveBeenCalledTimes(3);
    expect(mockSchedule).toHaveBeenLastCalledWith(
      expect.objectContaining({ days: [{ dayOfWeek: 1, periods: [] }], mutedDate: '2026-02-17' }),
    );
  });

  it('reschedules at each local midnight while the app stays open', () => {
    jest.useFakeTimers({ now: new Date(2026, 1, 16, 23, 0, 0) });
    loadStores(true);
    render(<RootLayout />);
    expect(mockSchedule).toHaveBeenCalledTimes(1);

    act(() => jest.advanceTimersByTime(60 * 60 * 1000 - 1));
    expect(mockSchedule).toHaveBeenCalledTimes(1);

    act(() => jest.advanceTimersByTime(1));
    expect(mockSchedule).toHaveBeenCalledTimes(2);

    act(() => jest.advanceTimersByTime(24 * 60 * 60 * 1000));
    expect(mockSchedule).toHaveBeenCalledTimes(3);
  });

  it('re-arms the midnight timer when the schedule changes', () => {
    jest.useFakeTimers({ now: new Date(2026, 1, 16, 12, 0, 0) });
    loadStores(true);
    render(<RootLayout />);

    act(() => useScheduleStore.setState({ days: [{ dayOfWeek: 1, periods: [] }] }));
    expect(mockSchedule).toHaveBeenCalledTimes(2);

    act(() => jest.advanceTimersByTime(12 * 60 * 60 * 1000));
    expect(mockSchedule).toHaveBeenCalledTimes(3);
  });

  it('registers the background refresh task once onboarded', () => {
    loadStores(true);
    render(<RootLayout />);

    expect(registerBellRefreshTask).toHaveBeenCalledTimes(1);
  });

  it('does not schedule before onboarding finishes', () => {
    loadStores(false);

    render(<RootLayout />);

    expect(mockSchedule).not.toHaveBeenCalled();
    expect(registerBellRefreshTask).not.toHaveBeenCalled();
  });
});
