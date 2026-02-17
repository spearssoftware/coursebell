import {
  parseTime,
  toMinutes,
  isTimeBefore,
  isTimeAfterOrEqual,
  formatTimeDisplay,
  formatCountdown,
  isValidTime,
} from '../time-utils';

describe('parseTime', () => {
  it('parses a normal time', () => {
    expect(parseTime('08:30')).toEqual({ hours: 8, minutes: 30 });
  });

  it('parses midnight', () => {
    expect(parseTime('00:00')).toEqual({ hours: 0, minutes: 0 });
  });

  it('parses noon', () => {
    expect(parseTime('12:00')).toEqual({ hours: 12, minutes: 0 });
  });

  it('parses end of day', () => {
    expect(parseTime('23:59')).toEqual({ hours: 23, minutes: 59 });
  });
});

describe('toMinutes', () => {
  it('returns 0 for midnight', () => {
    expect(toMinutes('00:00')).toBe(0);
  });

  it('returns 750 for 12:30', () => {
    expect(toMinutes('12:30')).toBe(750);
  });

  it('returns 1439 for 23:59', () => {
    expect(toMinutes('23:59')).toBe(1439);
  });

  it('returns 510 for 08:30', () => {
    expect(toMinutes('08:30')).toBe(510);
  });
});

describe('isTimeBefore', () => {
  it('returns true when first time is earlier', () => {
    expect(isTimeBefore('08:00', '09:00')).toBe(true);
  });

  it('returns false when first time is later', () => {
    expect(isTimeBefore('09:00', '08:00')).toBe(false);
  });

  it('returns false when times are equal', () => {
    expect(isTimeBefore('08:00', '08:00')).toBe(false);
  });
});

describe('isTimeAfterOrEqual', () => {
  it('returns true when first time is later', () => {
    expect(isTimeAfterOrEqual('09:00', '08:00')).toBe(true);
  });

  it('returns true when times are equal', () => {
    expect(isTimeAfterOrEqual('08:00', '08:00')).toBe(true);
  });

  it('returns false when first time is earlier', () => {
    expect(isTimeAfterOrEqual('08:00', '09:00')).toBe(false);
  });
});

describe('formatTimeDisplay', () => {
  it('formats morning time', () => {
    expect(formatTimeDisplay('08:30')).toBe('8:30 AM');
  });

  it('formats afternoon time', () => {
    expect(formatTimeDisplay('14:15')).toBe('2:15 PM');
  });

  it('formats midnight as 12:00 AM', () => {
    expect(formatTimeDisplay('00:00')).toBe('12:00 AM');
  });

  it('formats noon as 12:00 PM', () => {
    expect(formatTimeDisplay('12:00')).toBe('12:00 PM');
  });

  it('pads single-digit minutes', () => {
    expect(formatTimeDisplay('09:05')).toBe('9:05 AM');
  });
});

describe('formatCountdown', () => {
  it('returns 0:00 for zero seconds', () => {
    expect(formatCountdown(0)).toBe('0:00');
  });

  it('returns 0:00 for negative seconds', () => {
    expect(formatCountdown(-5)).toBe('0:00');
  });

  it('formats seconds only', () => {
    expect(formatCountdown(45)).toBe('0:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatCountdown(754)).toBe('12:34');
  });

  it('formats hours and minutes', () => {
    expect(formatCountdown(4980)).toBe('1h 23m');
  });

  it('pads minutes in hour format', () => {
    expect(formatCountdown(3660)).toBe('1h 01m');
  });
});

describe('isValidTime', () => {
  it('accepts valid times', () => {
    expect(isValidTime('00:00')).toBe(true);
    expect(isValidTime('08:30')).toBe(true);
    expect(isValidTime('12:00')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
  });

  it('accepts single-digit hours', () => {
    expect(isValidTime('8:30')).toBe(true);
  });

  it('rejects hour out of range', () => {
    expect(isValidTime('25:00')).toBe(false);
    expect(isValidTime('24:00')).toBe(false);
  });

  it('rejects minute out of range', () => {
    expect(isValidTime('12:60')).toBe(false);
  });

  it('rejects non-time strings', () => {
    expect(isValidTime('abc')).toBe(false);
    expect(isValidTime('')).toBe(false);
    expect(isValidTime('12')).toBe(false);
    expect(isValidTime('12:5')).toBe(false);
  });
});
