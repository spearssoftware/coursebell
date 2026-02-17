import { render, screen } from '@testing-library/react-native';
import { useSettingsStore } from '../../../src/store/settings-store';

jest.mock('../../../src/lib/bell-engine', () => ({
  scheduleBellNotifications: jest.fn(),
  requestNotificationPermissions: jest.fn(() => Promise.resolve(true)),
}));

import SettingsScreen from '../settings';

afterEach(() => {
  useSettingsStore.setState({
    selectedBellSound: 'school-bell',
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

  it('renders all bell sound options', () => {
    useSettingsStore.setState({ selectedBellSound: 'school-bell', isLoaded: true });

    render(<SettingsScreen />);

    expect(screen.getByText('School Bell')).toBeTruthy();
    expect(screen.getByText('School Bell 2')).toBeTruthy();
    expect(screen.getByText('Old School Bell')).toBeTruthy();
    expect(screen.getByText('Bike Bell')).toBeTruthy();
    expect(screen.getByText('Ping')).toBeTruthy();
    expect(screen.getByText('Light Alert')).toBeTruthy();
    expect(screen.getByText('Quiet Alert')).toBeTruthy();
    expect(screen.getByText('Up and Down')).toBeTruthy();
  });

  it('shows checkmark on selected bell sound', () => {
    useSettingsStore.setState({ selectedBellSound: 'ping', isLoaded: true });

    render(<SettingsScreen />);

    const checkmarks = screen.getAllByText('checkmark-circle');
    expect(checkmarks.length).toBe(1);
  });

  it('shows app version', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('v1.0.0')).toBeTruthy();
  });
});
