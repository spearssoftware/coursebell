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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RootLayout', () => {
  it('puts the audio session in a category that ignores the silent switch', () => {
    render(<RootLayout />);

    expect(setAudioModeAsync).toHaveBeenCalledWith({ playsInSilentMode: true });
  });

  it('reschedules bells when the app returns to the foreground', () => {
    const listeners: ((state: string) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      listeners.push(listener as (state: string) => void);
      return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
    });
    useScheduleStore.setState({ loadData: jest.fn(), loadHistory: jest.fn(), isLoaded: true });
    useSettingsStore.setState({ loadSettings: jest.fn(), isLoaded: true, hasCompletedOnboarding: true });

    render(<RootLayout />);
    expect(mockSchedule).toHaveBeenCalledTimes(1);

    act(() => listeners.forEach((l) => l('active')));
    expect(mockSchedule).toHaveBeenCalledTimes(2);
  });

  it('does not schedule before onboarding finishes', () => {
    useScheduleStore.setState({ loadData: jest.fn(), loadHistory: jest.fn(), isLoaded: true });
    useSettingsStore.setState({ loadSettings: jest.fn(), isLoaded: true, hasCompletedOnboarding: false });

    render(<RootLayout />);

    expect(mockSchedule).not.toHaveBeenCalled();
  });
});
