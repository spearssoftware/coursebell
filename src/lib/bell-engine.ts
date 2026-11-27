import * as Notifications from 'expo-notifications';
import { dateKey, parseTime, toMinutes } from './time-utils';
import { DEFAULT_BELL_SOUNDS } from '../types';
import type { BellSound, BellSounds, DaySchedule, Period } from '../types';

const bellSoundFile = (sound: BellSound): string => `${sound}.wav`;

// Bells are booked days ahead so they still ring when the app isn't opened.
// A full school day uses ~20 slots, so MAX_PENDING usually binds first and
// coverage is closer to 3 school days. The window rolls on with each return to
// the foreground, each local midnight, and background refreshes.
const DAYS_AHEAD = 7;
// iOS keeps only the 64 soonest pending local notifications and drops the rest.
const MAX_PENDING = 64;

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

type BellType = keyof BellSounds;

interface BellNotification {
  label: string;
  body: string;
  triggerDate: Date;
  bellType: BellType;
}

export function computeBellTimes(
  periods: Period[],
  warningMinutes: number,
  now: Date,
  day: Date = now,
): BellNotification[] {
  const notifications: BellNotification[] = [];
  const nowMs = now.getTime();

  for (const period of periods) {
    if (period.bellAtStart) {
      const { hours, minutes } = parseTime(period.startTime);
      const d = new Date(day);
      d.setHours(hours, minutes, 0, 0);
      if (d.getTime() > nowMs) {
        notifications.push({
          label: period.label,
          body: `${period.label} starting`,
          triggerDate: d,
          bellType: 'start',
        });
      }
    }

    if (period.bellBeforeEnd) {
      const startMins = toMinutes(period.startTime);
      const endMins = toMinutes(period.endTime);
      const warnMins = endMins - warningMinutes;
      if (warnMins > startMins) {
        const d = new Date(day);
        d.setHours(Math.floor(warnMins / 60), warnMins % 60, 0, 0);
        if (d.getTime() > nowMs) {
          notifications.push({
            label: period.label,
            body: `${warningMinutes} minute${warningMinutes === 1 ? '' : 's'} left in ${period.label}`,
            triggerDate: d,
            bellType: 'warning',
          });
        }
      }
    }

    if (period.bellAtEnd) {
      const { hours, minutes } = parseTime(period.endTime);
      const d = new Date(day);
      d.setHours(hours, minutes, 0, 0);
      if (d.getTime() > nowMs) {
        notifications.push({
          label: period.label,
          body: `${period.label} ended`,
          triggerDate: d,
          bellType: 'end',
        });
      }
    }
  }

  return notifications.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());
}

export function computeUpcomingBells(
  days: DaySchedule[],
  warningMinutes: number,
  now: Date,
  mutedDate: string | null = null,
): BellNotification[] {
  const bells: BellNotification[] = [];
  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    if (dateKey(day) === mutedDate) continue;
    const schedule = days.find((d) => d.dayOfWeek === day.getDay());
    if (!schedule) continue;
    bells.push(...computeBellTimes(schedule.periods, warningMinutes, now, day));
  }
  return bells.slice(0, MAX_PENDING);
}

export interface BellScheduleInput {
  days: DaySchedule[];
  warningMinutes: number;
  notificationsEnabled?: boolean;
  bellSounds?: BellSounds;
  mutedDate?: string | null;
}

// Each rebuild cancels every pending bell before rebooking, so two must never
// interleave. One runs at a time; calls made meanwhile collapse into a single
// follow-up rebuild with the latest input.
let running: Promise<void> | null = null;
let latest: BellScheduleInput | null = null;

export function scheduleBellNotifications(input: BellScheduleInput): Promise<void> {
  latest = input;
  running ??= drain();
  return running;
}

async function drain(): Promise<void> {
  while (latest) {
    const input = latest;
    latest = null;
    try {
      await rescheduleBells(input);
    } catch (e) {
      console.warn('Failed to schedule bell notifications', e);
    }
  }
  running = null;
}

async function rescheduleBells({
  days,
  warningMinutes,
  notificationsEnabled = true,
  bellSounds = DEFAULT_BELL_SOUNDS,
  mutedDate = null,
}: BellScheduleInput): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!notificationsEnabled) return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const bells = computeUpcomingBells(days, warningMinutes, new Date(), mutedDate);

  // allSettled, not all: a rebuild must not finish while its bookings are still
  // in flight, or the next rebuild's cancel could land before them.
  const results = await Promise.allSettled(
    bells.map((bell) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: '\uD83D\uDD14 School Bell',
          body: bell.body,
          sound: bellSoundFile(bellSounds[bell.bellType]),
          // A bell is useless if a Focus swallows it until after the period ends.
          interruptionLevel: 'timeSensitive',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: bell.triggerDate,
        },
      }),
    ),
  );
  const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failed) throw failed.reason;
}
