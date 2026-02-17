jest.mock('../id');

import { encodeSchedule, decodeSchedule } from '../qr-codec';
import { resetIdCounter } from '../__mocks__/id';
import type { DaySchedule } from '../../types';

beforeEach(() => {
  resetIdCounter();
});

const makeDays = (): DaySchedule[] => [
  { dayOfWeek: 0, periods: [] },
  {
    dayOfWeek: 1,
    periods: [
      { id: 'p-1', label: 'Period 1', startTime: '08:00', endTime: '08:50', sortOrder: 0, bellAtStart: true, bellAtEnd: true, bellBeforeEnd: true },
      { id: 'p-2', label: 'Lunch', startTime: '12:00', endTime: '12:30', sortOrder: 1, bellAtStart: false, bellAtEnd: false, bellBeforeEnd: false },
    ],
  },
  {
    dayOfWeek: 2,
    periods: [
      { id: 'p-3', label: 'Assembly', startTime: '09:00', endTime: '10:00', sortOrder: 0, bellAtStart: true, bellAtEnd: false, bellBeforeEnd: false },
    ],
  },
  { dayOfWeek: 3, periods: [] },
  { dayOfWeek: 4, periods: [] },
  { dayOfWeek: 5, periods: [] },
  { dayOfWeek: 6, periods: [] },
];

describe('encodeSchedule', () => {
  it('produces valid JSON with version and warningMinutes', () => {
    const json = encodeSchedule(makeDays(), 2);
    const payload = JSON.parse(json);
    expect(payload.v).toBe(1);
    expect(payload.warningMinutes).toBe(2);
  });

  it('only includes days with periods', () => {
    const json = encodeSchedule(makeDays(), 3);
    const payload = JSON.parse(json);
    expect(Object.keys(payload.days)).toEqual(['1', '2']);
  });

  it('maps bell flags correctly', () => {
    const json = encodeSchedule(makeDays(), 2);
    const payload = JSON.parse(json);
    expect(payload.days['1'][0]).toEqual({
      label: 'Period 1',
      start: '08:00',
      end: '08:50',
      bs: true,
      be: true,
      bw: true,
    });
    expect(payload.days['1'][1]).toEqual({
      label: 'Lunch',
      start: '12:00',
      end: '12:30',
      bs: false,
      be: false,
      bw: false,
    });
  });
});

describe('decodeSchedule', () => {
  it('round-trips encode then decode', () => {
    const days = makeDays();
    const json = encodeSchedule(days, 2);
    const result = decodeSchedule(json);

    expect(result).not.toBeNull();
    expect(result!.warningMinutes).toBe(2);
    expect(result!.days).toHaveLength(2);

    const monday = result!.days.find((d) => d.dayOfWeek === 1);
    expect(monday).toBeDefined();
    expect(monday!.periods).toHaveLength(2);
    expect(monday!.periods[0].label).toBe('Period 1');
    expect(monday!.periods[0].bellAtStart).toBe(true);
    expect(monday!.periods[0].bellAtEnd).toBe(true);
    expect(monday!.periods[0].bellBeforeEnd).toBe(true);

    expect(monday!.periods[1].label).toBe('Lunch');
    expect(monday!.periods[1].bellAtStart).toBe(false);
  });

  it('returns null for malformed JSON', () => {
    expect(decodeSchedule('not json')).toBeNull();
    expect(decodeSchedule('{{')).toBeNull();
  });

  it('returns null for missing version field', () => {
    const payload = { warningMinutes: 2, days: {} };
    expect(decodeSchedule(JSON.stringify(payload))).toBeNull();
  });

  it('returns null for unsupported version', () => {
    const payload = { v: 2, warningMinutes: 2, days: {} };
    expect(decodeSchedule(JSON.stringify(payload))).toBeNull();
  });

  it('returns null for missing warningMinutes', () => {
    const payload = { v: 1, days: {} };
    expect(decodeSchedule(JSON.stringify(payload))).toBeNull();
  });

  it('handles empty schedule', () => {
    const emptyDays: DaySchedule[] = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      periods: [],
    }));
    const json = encodeSchedule(emptyDays, 2);
    const result = decodeSchedule(json);

    expect(result).not.toBeNull();
    expect(result!.days).toHaveLength(0);
    expect(result!.warningMinutes).toBe(2);
  });
});
