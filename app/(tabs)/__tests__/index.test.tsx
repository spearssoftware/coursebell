import { render, screen } from '@testing-library/react-native';
import { useScheduleStore } from '../../../src/store/schedule-store';
import { useSettingsStore } from '../../../src/store/settings-store';
import type { DaySchedule, Period } from '../../../src/types';

jest.mock('../../../src/lib/bell-engine', () => ({
  scheduleBellNotifications: jest.fn(),
  requestNotificationPermissions: jest.fn(() => Promise.resolve(true)),
}));

import TodayScreen from '../index';

const mondayPeriods: Period[] = [
  { id: 'p-1', label: 'Period 1', startTime: '08:00', endTime: '08:50', sortOrder: 0, bellAtStart: true, bellAtEnd: true, bellBeforeEnd: true },
  { id: 'p-2', label: 'Lunch', startTime: '12:00', endTime: '12:30', sortOrder: 1, bellAtStart: false, bellAtEnd: false, bellBeforeEnd: false },
  { id: 'p-3', label: 'Period 5', startTime: '14:00', endTime: '14:50', sortOrder: 2, bellAtStart: true, bellAtEnd: true, bellBeforeEnd: false },
];

function setStoreForDay(dayOfWeek: number, periods: Period[]) {
  const days: DaySchedule[] = Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    periods: i === dayOfWeek ? periods : [],
  }));

  useScheduleStore.setState({ days, isLoaded: true });
}

beforeEach(() => {
  jest.useFakeTimers();
  useSettingsStore.setState({ warningMinutes: 2, mutedDate: null, isLoaded: true });
});

afterEach(() => {
  jest.useRealTimers();
  useScheduleStore.setState({
    days: Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, periods: [] })),
    isLoaded: false,
  });
});

describe('TodayScreen', () => {
  it('renders period list for assigned day', () => {
    jest.setSystemTime(new Date(2026, 1, 16, 7, 30, 0)); // Monday = day 1
    setStoreForDay(1, mondayPeriods);

    render(<TodayScreen />);

    expect(screen.getByText('Period 1')).toBeTruthy();
    expect(screen.getByText('Lunch')).toBeTruthy();
    expect(screen.getByText('Period 5')).toBeTruthy();
  });

  it('shows empty state when no periods', () => {
    jest.setSystemTime(new Date(2026, 1, 16, 7, 30, 0));
    setStoreForDay(1, []);

    render(<TodayScreen />);

    expect(screen.getByText('No schedule today')).toBeTruthy();
  });

  it('shows "All done for today!" when past last period', () => {
    jest.setSystemTime(new Date(2026, 1, 16, 15, 0, 0));
    setStoreForDay(1, mondayPeriods);

    render(<TodayScreen />);

    expect(screen.getByText('All done for today!')).toBeTruthy();
  });

  it('shows next bell countdown when future periods exist', () => {
    jest.setSystemTime(new Date(2026, 1, 16, 7, 30, 0));
    setStoreForDay(1, mondayPeriods);

    render(<TodayScreen />);

    expect(screen.getByText('Next Bell')).toBeTruthy();
    expect(screen.getByText(/Period 1 at/)).toBeTruthy();
  });

  it('shows mute button when periods exist', () => {
    jest.setSystemTime(new Date(2026, 1, 16, 7, 30, 0));
    setStoreForDay(1, mondayPeriods);

    render(<TodayScreen />);

    expect(screen.getByText('Mute Today')).toBeTruthy();
  });

  it('shows muted state when mutedDate matches today', () => {
    jest.setSystemTime(new Date(2026, 1, 16, 7, 30, 0));
    setStoreForDay(1, mondayPeriods);
    useSettingsStore.setState({ mutedDate: '2026-02-16' });

    render(<TodayScreen />);

    expect(screen.getByText('Bells Muted Today')).toBeTruthy();
  });

  it('hides countdown when muted', () => {
    jest.setSystemTime(new Date(2026, 1, 16, 7, 30, 0));
    setStoreForDay(1, mondayPeriods);
    useSettingsStore.setState({ mutedDate: '2026-02-16' });

    render(<TodayScreen />);

    expect(screen.queryByText('Next Bell')).toBeNull();
  });
});
