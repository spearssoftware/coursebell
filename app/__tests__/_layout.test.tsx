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

import RootLayout from '../_layout';

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
    expect(mockSchedule).toHaveBeenCalledWith(days, 4, true, bellSounds, '2026-02-16');
  });

  it('reschedules when the app returns to the foreground, not when it leaves', () => {
    loadStores(true);
    render(<RootLayout />);
    expect(mockSchedule).toHaveBeenCalledTimes(1);

    emitAppState('background');
    expect(mockSchedule).toHaveBeenCalledTimes(1);

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
      [{ dayOfWeek: 1, periods: [] }], expect.any(Number), expect.any(Boolean), expect.anything(), '2026-02-17',
    );
  });

  it('does not schedule before onboarding finishes', () => {
    loadStores(false);

    render(<RootLayout />);

    expect(mockSchedule).not.toHaveBeenCalled();
  });
});
