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
  it('produces compact format with version 2', () => {
    const encoded = encodeSchedule(makeDays(), 2);
    expect(encoded.startsWith('2|')).toBe(true);
  });

  it('only includes days with periods', () => {
    const encoded = encodeSchedule(makeDays(), 3);
    const parts = encoded.split('|');
    // version + warningMinutes + 2 day segments
    expect(parts).toHaveLength(4);
  });

  it('encodes bell flags as bitmask', () => {
    const encoded = encodeSchedule(makeDays(), 2);
    // Period 1: all bells on = 4+2+1 = 7
    expect(encoded).toContain('Period 1,08:00,08:50,7');
    // Lunch: all bells off = 0
    expect(encoded).toContain('Lunch,12:00,12:30,0');
    // Assembly: bellAtStart only = 4
    expect(encoded).toContain('Assembly,09:00,10:00,4');
  });

  it('is significantly smaller than JSON', () => {
    const days = makeDays();
    const compact = encodeSchedule(days, 2);
    const json = JSON.stringify({ v: 1, warningMinutes: 2, days: {} });
    expect(compact.length).toBeLessThan(json.length + 200);
  });
});

describe('decodeSchedule', () => {
  it('round-trips encode then decode', () => {
    const days = makeDays();
    const encoded = encodeSchedule(days, 2);
    const result = decodeSchedule(encoded);

    expect(result).not.toBeNull();
    expect(result!.warningMinutes).toBe(2);
    expect(result!.days).toHaveLength(2);

    const monday = result!.days.find((d) => d.dayOfWeek === 1);
    expect(monday).toBeDefined();
    expect(monday!.periods).toHaveLength(2);
    expect(monday!.periods[0].label).toBe('Period 1');
    expect(monday!.periods[0].startTime).toBe('08:00');
    expect(monday!.periods[0].endTime).toBe('08:50');
    expect(monday!.periods[0].bellAtStart).toBe(true);
    expect(monday!.periods[0].bellAtEnd).toBe(true);
    expect(monday!.periods[0].bellBeforeEnd).toBe(true);

    expect(monday!.periods[1].label).toBe('Lunch');
    expect(monday!.periods[1].bellAtStart).toBe(false);
    expect(monday!.periods[1].bellAtEnd).toBe(false);
    expect(monday!.periods[1].bellBeforeEnd).toBe(false);
  });

  it('returns null for malformed data', () => {
    expect(decodeSchedule('not valid')).toBeNull();
    expect(decodeSchedule('')).toBeNull();
  });

  it('returns null for wrong version', () => {
    expect(decodeSchedule('1|2|1:P,08:00,08:50,7')).toBeNull();
    expect(decodeSchedule('3|2|1:P,08:00,08:50,7')).toBeNull();
  });

  it('returns null for missing warningMinutes', () => {
    expect(decodeSchedule('2|')).toBeNull();
  });

  it('handles empty schedule', () => {
    const emptyDays: DaySchedule[] = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      periods: [],
    }));
    const encoded = encodeSchedule(emptyDays, 2);
    const result = decodeSchedule(encoded);

    expect(result).not.toBeNull();
    expect(result!.days).toHaveLength(0);
    expect(result!.warningMinutes).toBe(2);
  });
});
