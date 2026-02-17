import { render, screen } from '@testing-library/react-native';
import { useScheduleStore } from '../../../src/store/schedule-store';
import type { DaySchedule } from '../../../src/types';

import ScheduleScreen from '../schedule';

const daysWithPeriods: DaySchedule[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  periods:
    i === 1
      ? [
          { id: 'p-1', label: 'Period 1', startTime: '08:00', endTime: '08:50', sortOrder: 0, bellAtStart: true, bellAtEnd: true, bellBeforeEnd: true },
          { id: 'p-2', label: 'Period 2', startTime: '09:00', endTime: '09:50', sortOrder: 1, bellAtStart: true, bellAtEnd: true, bellBeforeEnd: false },
        ]
      : i === 3
        ? [
            { id: 'p-3', label: 'Assembly', startTime: '09:00', endTime: '10:00', sortOrder: 0, bellAtStart: true, bellAtEnd: false, bellBeforeEnd: false },
          ]
        : [],
}));

afterEach(() => {
  useScheduleStore.setState({
    days: Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, periods: [] })),
    isLoaded: true,
  });
});

describe('ScheduleScreen', () => {
  it('renders all 5 weekdays', () => {
    useScheduleStore.setState({ days: daysWithPeriods, isLoaded: true });

    render(<ScheduleScreen />);

    expect(screen.getByText('Monday')).toBeTruthy();
    expect(screen.getByText('Tuesday')).toBeTruthy();
    expect(screen.getByText('Wednesday')).toBeTruthy();
    expect(screen.getByText('Thursday')).toBeTruthy();
    expect(screen.getByText('Friday')).toBeTruthy();
  });

  it('shows period counts', () => {
    useScheduleStore.setState({ days: daysWithPeriods, isLoaded: true });

    render(<ScheduleScreen />);

    expect(screen.getByText('2 periods')).toBeTruthy();
    expect(screen.getByText('1 period')).toBeTruthy();
  });

  it('shows period preview labels', () => {
    useScheduleStore.setState({ days: daysWithPeriods, isLoaded: true });

    render(<ScheduleScreen />);

    expect(screen.getByText('Period 1')).toBeTruthy();
    expect(screen.getByText('Period 2')).toBeTruthy();
    expect(screen.getByText('Assembly')).toBeTruthy();
  });

  it('shows empty text for days with no periods', () => {
    useScheduleStore.setState({ days: daysWithPeriods, isLoaded: true });

    render(<ScheduleScreen />);

    const emptyTexts = screen.getAllByText(/No periods/);
    expect(emptyTexts.length).toBe(3);
  });
});
