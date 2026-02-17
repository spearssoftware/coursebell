import { render, screen, fireEvent } from '@testing-library/react-native';
import { useScheduleStore } from '../../../src/store/schedule-store';
import type { ScheduleTemplate } from '../../../src/types';

import TemplatesScreen from '../templates';

const templates: ScheduleTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Regular',
    periods: [
      { id: 'p-1', label: 'Period 1', startTime: '08:00', endTime: '08:50', bellEnabled: true },
      { id: 'p-2', label: 'Period 2', startTime: '09:00', endTime: '09:50', bellEnabled: true },
    ],
  },
  {
    id: 'tpl-2',
    name: 'Assembly',
    periods: [
      { id: 'p-3', label: 'Assembly', startTime: '09:00', endTime: '10:00', bellEnabled: true },
    ],
  },
];

afterEach(() => {
  useScheduleStore.setState({
    templates: [],
    dayAssignments: Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, templateId: null })),
    isLoaded: true,
  });
});

describe('TemplatesScreen', () => {
  it('renders list of existing templates', () => {
    useScheduleStore.setState({ templates, isLoaded: true });

    render(<TemplatesScreen />);

    expect(screen.getByText('Regular')).toBeTruthy();
    expect(screen.getByText('2 periods')).toBeTruthy();
    expect(screen.getByText('Assembly')).toBeTruthy();
    expect(screen.getByText('1 period')).toBeTruthy();
  });

  it('shows empty state when no templates', () => {
    useScheduleStore.setState({ templates: [], isLoaded: true });

    render(<TemplatesScreen />);

    expect(screen.getByText('No templates yet')).toBeTruthy();
  });

  it('opens new template modal on FAB press', () => {
    useScheduleStore.setState({ templates: [], isLoaded: true });

    render(<TemplatesScreen />);

    const fab = screen.getByText('add');
    fireEvent.press(fab);

    expect(screen.getByText('New Template')).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g. Regular, Assembly, Half Day')).toBeTruthy();
  });
});
