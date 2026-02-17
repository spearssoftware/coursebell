import { render, screen } from '@testing-library/react-native';
import { useSettingsStore } from '../../../src/store/settings-store';

jest.mock('../../../src/lib/bell-engine', () => ({
  scheduleBellNotifications: jest.fn(),
  requestNotificationPermissions: jest.fn(() => Promise.resolve(true)),
}));

import SettingsScreen from '../settings';

const defaultBellSounds = {
  start: 'school-bell' as const,
  warning: 'quiet-alert' as const,
  end: 'school-bell' as const,
};

afterEach(() => {
  useSettingsStore.setState({
    bellSounds: defaultBellSounds,
    warningMinutes: 2,
    notificationsEnabled: true,
    isLoaded: true,
  });
});

describe('SettingsScreen', () => {
  it('renders notification toggle', () => {
    useSettingsStore.setState({ notificationsEnabled: true, isLoaded: true });

    render(<SettingsScreen />);

    expect(screen.getByText('Bell Notifications')).toBeTruthy();
  });

  it('renders warning minutes control', () => {
    useSettingsStore.setState({ warningMinutes: 2, isLoaded: true });

    render(<SettingsScreen />);

    expect(screen.getByText('Minutes before end')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('renders all three sound picker sections', () => {
    useSettingsStore.setState({ bellSounds: defaultBellSounds, isLoaded: true });

    render(<SettingsScreen />);

    expect(screen.getByText('Period Start Sound')).toBeTruthy();
    expect(screen.getByText('Warning Sound')).toBeTruthy();
    expect(screen.getByText('Period End Sound')).toBeTruthy();
  });

  it('renders sound options in each picker', () => {
    useSettingsStore.setState({ bellSounds: defaultBellSounds, isLoaded: true });

    render(<SettingsScreen />);

    const schoolBells = screen.getAllByText('School Bell');
    expect(schoolBells.length).toBe(3);
  });

  it('shows checkmarks on selected bell sounds', () => {
    useSettingsStore.setState({
      bellSounds: { start: 'ping', warning: 'ping', end: 'ping' },
      isLoaded: true,
    });

    render(<SettingsScreen />);

    const checkmarks = screen.getAllByText('checkmark-circle');
    expect(checkmarks.length).toBe(3);
  });

  it('shows app version', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('v1.0.0')).toBeTruthy();
  });
});
