import type { DaySchedule } from '../types';

// Compact format: "2|{warnMin}|{day}:{label},{start},{end},{bells};...| ..."
// bells = 3-bit bitmask: bellAtStart=4, bellAtEnd=2, bellBeforeEnd=1

function bellsToNum(bs: boolean, be: boolean, bw: boolean): number {
  return (bs ? 4 : 0) | (be ? 2 : 0) | (bw ? 1 : 0);
}

function numToBells(n: number): { bellAtStart: boolean; bellAtEnd: boolean; bellBeforeEnd: boolean } {
  return { bellAtStart: (n & 4) !== 0, bellAtEnd: (n & 2) !== 0, bellBeforeEnd: (n & 1) !== 0 };
}

export function encodeSchedule(days: DaySchedule[], warningMinutes: number): string {
  const parts: string[] = ['2', String(warningMinutes)];

  for (const day of days) {
    if (day.periods.length === 0) continue;
    const periods = day.periods
      .map((p) => `${p.label},${p.startTime},${p.endTime},${bellsToNum(p.bellAtStart, p.bellAtEnd, p.bellBeforeEnd)}`)
      .join(';');
    parts.push(`${day.dayOfWeek}:${periods}`);
  }

  return parts.join('|');
}

export function decodeSchedule(data: string): { days: DaySchedule[]; warningMinutes: number } | null {
  try {
    const { generateId } = require('./id');
    const parts = data.split('|');
    if (parts[0] !== '2') return null;

    const warningMinutes = parseInt(parts[1], 10);
    if (isNaN(warningMinutes)) return null;

    const dayParts = parts.slice(2);
    for (const dp of dayParts) {
      if (!dp.includes(':')) return null;
    }

    const days: DaySchedule[] = dayParts.map((dayPart) => {
      const colonIdx = dayPart.indexOf(':');
      const dayStr = dayPart.substring(0, colonIdx);
      const periodsStr = dayPart.substring(colonIdx + 1);
      const periods = periodsStr.split(';').map((seg, i) => {
        const [label, start, end, bellStr] = seg.split(',');
        const bells = numToBells(parseInt(bellStr, 10));
        return {
          id: generateId() as string,
          label: label ?? '',
          startTime: start ?? '08:00',
          endTime: end ?? '08:50',
          sortOrder: i,
          ...bells,
        };
      });
      return { dayOfWeek: parseInt(dayStr, 10), periods };
    });

    return { days, warningMinutes };
  } catch {
    return null;
  }
}
