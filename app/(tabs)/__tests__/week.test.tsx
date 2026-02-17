import { render, screen } from '@testing-library/react-native';
import { useScheduleStore } from '../../../src/store/schedule-store';
import type { ScheduleTemplate, DayAssignment } from '../../../src/types';

import WeekScreen from '../week';

const templates: ScheduleTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Regular',
    periods: [
      { id: 'p-1', label: 'Period 1', startTime: '08:00', endTime: '08:50', bellEnabled: true },
    ],
  },
  {
    id: 'tpl-2',
    name: 'Assembly',
    periods: [
      { id: 'p-2', label: 'Assembly', startTime: '09:00', endTime: '10:00', bellEnabled: true },
    ],
  },
];

const assignments: DayAssignment[] = [
  { dayOfWeek: 0, templateId: null },
  { dayOfWeek: 1, templateId: 'tpl-1' },
  { dayOfWeek: 2, templateId: 'tpl-1' },
  { dayOfWeek: 3, templateId: 'tpl-2' },
  { dayOfWeek: 4, templateId: 'tpl-1' },
  { dayOfWeek: 5, templateId: 'tpl-1' },
  { dayOfWeek: 6, templateId: null },
];

afterEach(() => {
  useScheduleStore.setState({
    templates: [],
    dayAssignments: Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, templateId: null })),
    isLoaded: true,
  });
});

describe('WeekScreen', () => {
  it('renders all 7 days', () => {
    useScheduleStore.setState({ templates, dayAssignments: assignments, isLoaded: true });

    render(<WeekScreen />);

    expect(screen.getByText('Sunday')).toBeTruthy();
    expect(screen.getByText('Monday')).toBeTruthy();
    expect(screen.getByText('Tuesday')).toBeTruthy();
    expect(screen.getByText('Wednesday')).toBeTruthy();
    expect(screen.getByText('Thursday')).toBeTruthy();
    expect(screen.getByText('Friday')).toBeTruthy();
    expect(screen.getByText('Saturday')).toBeTruthy();
  });

  it('shows assigned template name for each day', () => {
    useScheduleStore.setState({ templates, dayAssignments: assignments, isLoaded: true });

    render(<WeekScreen />);

    const regularTexts = screen.getAllByText('Regular');
    expect(regularTexts.length).toBe(4);

    expect(screen.getByText('Assembly')).toBeTruthy();
  });

  it('shows "Off" for unassigned days', () => {
    useScheduleStore.setState({ templates, dayAssignments: assignments, isLoaded: true });

    render(<WeekScreen />);

    const offTexts = screen.getAllByText('Off');
    expect(offTexts.length).toBe(2);
  });

  it('shows all days as "Off" when no assignments', () => {
    const emptyAssignments: DayAssignment[] = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      templateId: null,
    }));
    useScheduleStore.setState({ templates, dayAssignments: emptyAssignments, isLoaded: true });

    render(<WeekScreen />);

    const offTexts = screen.getAllByText('Off');
    expect(offTexts.length).toBe(7);
  });
});
