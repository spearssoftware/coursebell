import type { DaySchedule, SharePayload } from '../types';

export function encodeSchedule(days: DaySchedule[], warningMinutes: number): string {
  const daysMap: SharePayload['days'] = {};

  for (const day of days) {
    if (day.periods.length === 0) continue;
    daysMap[String(day.dayOfWeek)] = day.periods.map((p) => ({
      label: p.label,
      start: p.startTime,
      end: p.endTime,
      bs: p.bellAtStart,
      be: p.bellAtEnd,
      bw: p.bellBeforeEnd,
    }));
  }

  const payload: SharePayload = {
    v: 1,
    warningMinutes,
    days: daysMap,
  };

  return JSON.stringify(payload);
}

export function decodeSchedule(json: string): { days: DaySchedule[]; warningMinutes: number } | null {
  try {
    const payload = JSON.parse(json) as SharePayload;
    if (payload.v !== 1) return null;
    if (typeof payload.warningMinutes !== 'number') return null;
    if (!payload.days || typeof payload.days !== 'object') return null;

    const { generateId } = require('./id');

    const days: DaySchedule[] = Object.entries(payload.days).map(([dayStr, periods]) => ({
      dayOfWeek: parseInt(dayStr, 10),
      periods: (periods ?? []).map((p, i) => ({
        id: generateId() as string,
        label: (p.label as string) ?? '',
        startTime: (p.start as string) ?? '08:00',
        endTime: (p.end as string) ?? '08:50',
        sortOrder: i,
        bellAtStart: (p.bs as boolean) ?? true,
        bellAtEnd: (p.be as boolean) ?? true,
        bellBeforeEnd: (p.bw as boolean) ?? false,
      })),
    }));

    return { days, warningMinutes: payload.warningMinutes };
  } catch {
    return null;
  }
}
