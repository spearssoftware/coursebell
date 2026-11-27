import * as Notifications from 'expo-notifications';
import { computeBellTimes, computeUpcomingBells, scheduleBellNotifications } from '../bell-engine';
import type { DaySchedule, Period } from '../../types';

const mockSchedule = Notifications.scheduleNotificationAsync as jest.Mock;
const mockCancel = Notifications.cancelAllScheduledNotificationsAsync as jest.Mock;
const mockGetPerms = Notifications.getPermissionsAsync as jest.Mock;
const mockRequestPerms = Notifications.requestPermissionsAsync as jest.Mock;

afterEach(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPerms.mockResolvedValue({ status: 'granted' });
  mockRequestPerms.mockResolvedValue({ status: 'granted' });
});

const periods: Period[] = [
  { id: 'p-1', label: 'Period 1', startTime: '08:00', endTime: '08:50', sortOrder: 0, bellAtStart: true, bellAtEnd: true, bellBeforeEnd: true },
  { id: 'p-2', label: 'Lunch', startTime: '08:50', endTime: '09:10', sortOrder: 1, bellAtStart: false, bellAtEnd: false, bellBeforeEnd: false },
  { id: 'p-3', label: 'Period 2', startTime: '09:10', endTime: '10:00', sortOrder: 2, bellAtStart: true, bellAtEnd: true, bellBeforeEnd: false },
  { id: 'p-4', label: 'Period 3', startTime: '13:00', endTime: '13:50', sortOrder: 3, bellAtStart: true, bellAtEnd: false, bellBeforeEnd: true },
];

function makeDays(todayPeriods: Period[]): DaySchedule[] {
  const today = new Date().getDay();
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    periods: i === today ? todayPeriods : [],
  }));
}

describe('computeBellTimes', () => {
  it('generates start, warning, and end notifications for a period', () => {
    const now = new Date(2026, 1, 16, 7, 0, 0);
    const bells = computeBellTimes([periods[0]], 2, now);

    expect(bells).toHaveLength(3);
    expect(bells[0].body).toBe('Period 1 starting');
    expect(bells[1].body).toBe('2 minutes left in Period 1');
    expect(bells[2].body).toBe('Period 1 ended');
  });

  it('skips bells for periods with all bells disabled', () => {
    const now = new Date(2026, 1, 16, 7, 0, 0);
    const bells = computeBellTimes([periods[1]], 2, now);

    expect(bells).toHaveLength(0);
  });

  it('only generates enabled bell types', () => {
    const now = new Date(2026, 1, 16, 7, 0, 0);
    const bells = computeBellTimes([periods[2]], 2, now);

    expect(bells).toHaveLength(2);
    expect(bells[0].body).toBe('Period 2 starting');
    expect(bells[1].body).toBe('Period 2 ended');
  });

  it('skips notifications in the past', () => {
    const now = new Date(2026, 1, 16, 10, 1, 0);
    const bells = computeBellTimes(periods, 2, now);

    const labels = bells.map((b) => b.body);
    expect(labels.every((l) => !l.includes('Period 1'))).toBe(true);
    expect(labels.every((l) => !l.includes('Period 2'))).toBe(true);
    expect(labels.some((l) => l.includes('Period 3'))).toBe(true);
  });

  it('sorts notifications by time', () => {
    const now = new Date(2026, 1, 16, 7, 0, 0);
    const bells = computeBellTimes(periods, 2, now);

    for (let i = 1; i < bells.length; i++) {
      expect(bells[i].triggerDate.getTime()).toBeGreaterThanOrEqual(
        bells[i - 1].triggerDate.getTime(),
      );
    }
  });

  it('handles warningMinutes longer than period', () => {
    const shortPeriod: Period = {
      id: 'x', label: 'Short', startTime: '08:00', endTime: '08:01',
      sortOrder: 0, bellAtStart: false, bellAtEnd: false, bellBeforeEnd: true,
    };
    const now = new Date(2026, 1, 16, 7, 0, 0);
    const bells = computeBellTimes([shortPeriod], 5, now);

    expect(bells).toHaveLength(0);
  });

  it('uses singular "minute" for warningMinutes=1', () => {
    const now = new Date(2026, 1, 16, 7, 0, 0);
    const bells = computeBellTimes([periods[0]], 1, now);
    const warning = bells.find((b) => b.body.includes('left'));
    expect(warning?.body).toBe('1 minute left in Period 1');
  });
});

describe('scheduleBellNotifications', () => {
  it('cancels all existing notifications first', async () => {
    await scheduleBellNotifications({ days: makeDays(periods), warningMinutes: 2 });
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  it('schedules notifications for future bell-enabled periods', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 1, 16, 7, 0, 0));

    await scheduleBellNotifications({ days: makeDays(periods), warningMinutes: 2 });

    expect(mockSchedule.mock.calls.length).toBeGreaterThan(0);

    const bodies = mockSchedule.mock.calls.map(
      (call: [{ content: { body: string } }]) => call[0].content.body,
    );
    expect(bodies).toContain('Period 1 starting');
    expect(bodies).toContain('Period 1 ended');
    expect(bodies).toContain('2 minutes left in Period 1');

    jest.useRealTimers();
  });

  it('does nothing when no day has periods', async () => {
    const emptyDays = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      periods: [] as Period[],
    }));

    await scheduleBellNotifications({ days: emptyDays, warningMinutes: 2 });

    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('does nothing when permission denied', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 1, 16, 7, 0, 0));

    mockGetPerms.mockResolvedValue({ status: 'denied' });
    mockRequestPerms.mockResolvedValue({ status: 'denied' });

    await scheduleBellNotifications({ days: makeDays(periods), warningMinutes: 2 });

    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});

describe('scheduleBellNotifications — muted', () => {
  it('cancels existing notifications but schedules nothing when muted', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 1, 16, 7, 0, 0));

    await scheduleBellNotifications({ days: makeDays(periods), warningMinutes: 2, notificationsEnabled: false });

    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockSchedule).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});

describe('scheduleBellNotifications — custom sounds', () => {
  it('uses the specified bell sound for each notification type', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 1, 16, 7, 0, 0));

    await scheduleBellNotifications({
      days: makeDays([periods[0]]),
      warningMinutes: 2,
      bellSounds: { start: 'dinner-bell', warning: 'double-beep', end: 'chime' },
    });

    const sounds = mockSchedule.mock.calls.map(
      (call: [{ content: { sound: string } }]) => call[0].content.sound,
    );
    expect(sounds).toContain('dinner-bell.wav');
    expect(sounds).toContain('double-beep.wav');
    expect(sounds).toContain('chime.wav');

    jest.useRealTimers();
  });

  it('marks bells time sensitive so a Focus does not swallow them', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 1, 16, 7, 0, 0));

    await scheduleBellNotifications({ days: makeDays([periods[0]]), warningMinutes: 2 });

    const levels = mockSchedule.mock.calls.map(
      (call: [{ content: { interruptionLevel?: string } }]) => call[0].content.interruptionLevel,
    );
    expect(levels.length).toBeGreaterThan(0);
    expect(levels.every((l) => l === 'timeSensitive')).toBe(true);

    jest.useRealTimers();
  });
});

describe('computeUpcomingBells', () => {
  // Monday 2026-02-16, after the last bell of the day.
  const mondayEvening = new Date(2026, 1, 16, 18, 0, 0);
  const weekdays: DaySchedule[] = Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    periods: i >= 1 && i <= 5 ? [periods[0]] : [],
  }));

  it('books following days when today has no bells left', () => {
    const bells = computeUpcomingBells(weekdays, 2, mondayEvening);

    const dates = new Set(bells.map((b) => b.triggerDate.getDate()));
    expect([...dates]).toEqual([17, 18, 19, 20]);
    expect(bells[0].triggerDate).toEqual(new Date(2026, 1, 17, 8, 0, 0));
  });

  it('skips only the muted date', () => {
    const bells = computeUpcomingBells(weekdays, 2, mondayEvening, '2026-02-17');

    const dates = new Set(bells.map((b) => b.triggerDate.getDate()));
    expect(dates.has(17)).toBe(false);
    expect(dates.has(18)).toBe(true);
  });

  it('keeps only the soonest 64 bells', () => {
    const busy: Period[] = Array.from({ length: 12 }, (_, i) => {
      const hh = String(8 + i).padStart(2, '0');
      return { ...periods[0], id: `b-${i}`, label: `P${i}`, startTime: `${hh}:00`, endTime: `${hh}:50`, sortOrder: i };
    });
    const everyDay = Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, periods: busy }));

    const bells = computeUpcomingBells(everyDay, 2, new Date(2026, 1, 16, 0, 0, 0));

    expect(bells).toHaveLength(64);
    const times = bells.map((b) => b.triggerDate.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});

describe('scheduleBellNotifications — overlapping calls', () => {
  it('collapses calls made during a rebuild into one rebuild with the latest arguments', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 1, 16, 7, 0, 0));

    scheduleBellNotifications({ days: makeDays(periods), warningMinutes: 2 });
    scheduleBellNotifications({ days: makeDays(periods), warningMinutes: 3 });
    await scheduleBellNotifications({ days: makeDays([periods[0]]), warningMinutes: 5 });

    expect(mockCancel).toHaveBeenCalledTimes(2);
    const bodies = mockSchedule.mock.calls.map(
      (call: [{ content: { body: string } }]) => call[0].content.body,
    );
    expect(bodies.some((b) => b.startsWith('3 minutes'))).toBe(false);
    expect(bodies).toContain('5 minutes left in Period 1');

    jest.useRealTimers();
  });

  it('keeps working after a failed rebuild', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockCancel.mockRejectedValueOnce(new Error('boom'));

    await scheduleBellNotifications({ days: makeDays(periods), warningMinutes: 2 });
    await scheduleBellNotifications({ days: makeDays(periods), warningMinutes: 2 });

    expect(mockCancel).toHaveBeenCalledTimes(2);
  });
});
