import { render, screen, fireEvent } from '@testing-library/react-native';
import { createAudioPlayer } from 'expo-audio';
import { useSettingsStore } from '../../../src/store/settings-store';

jest.mock('../../../src/lib/bell-engine', () => ({
  scheduleBellNotifications: jest.fn(),
  requestNotificationPermissions: jest.fn(() => Promise.resolve(true)),
}));

import SettingsScreen from '../settings';

const defaultBellSounds = {
  start: 'school-bell' as const,
  warning: 'double-beep' as const,
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
      bellSounds: { start: 'whistle', warning: 'whistle', end: 'whistle' },
      isLoaded: true,
    });

    render(<SettingsScreen />);

    const checkmarks = screen.getAllByText('checkmark-circle');
    expect(checkmarks.length).toBe(3);
  });

  it('previews the sound on selection, releasing the previous player', () => {
    render(<SettingsScreen />);

    fireEvent.press(screen.getAllByText('Dinner Bell')[0]);

    const player = jest.mocked(createAudioPlayer).mock.results[0].value;
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    expect(player.play).toHaveBeenCalledTimes(1);
    expect(player.release).not.toHaveBeenCalled();

    fireEvent.press(screen.getAllByText('Chime')[0]);

    expect(createAudioPlayer).toHaveBeenCalledTimes(2);
    expect(player.release).toHaveBeenCalledTimes(1);
  });

  it('shows app version', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('v1.0.0')).toBeTruthy();
  });
});
