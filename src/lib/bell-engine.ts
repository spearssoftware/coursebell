import * as Notifications from 'expo-notifications';
import { parseTime, toMinutes } from './time-utils';
import type { DaySchedule, Period } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

interface BellNotification {
  label: string;
  body: string;
  triggerDate: Date;
}

export function computeBellTimes(
  periods: Period[],
  warningMinutes: number,
  now: Date,
): BellNotification[] {
  const notifications: BellNotification[] = [];
  const nowMs = now.getTime();

  for (const period of periods) {
    if (period.bellAtStart) {
      const { hours, minutes } = parseTime(period.startTime);
      const d = new Date(now);
      d.setHours(hours, minutes, 0, 0);
      if (d.getTime() > nowMs) {
        notifications.push({
          label: period.label,
          body: `${period.label} starting`,
          triggerDate: d,
        });
      }
    }

    if (period.bellBeforeEnd) {
      const startMins = toMinutes(period.startTime);
      const endMins = toMinutes(period.endTime);
      const warnMins = endMins - warningMinutes;
      if (warnMins > startMins) {
        const d = new Date(now);
        d.setHours(Math.floor(warnMins / 60), warnMins % 60, 0, 0);
        if (d.getTime() > nowMs) {
          notifications.push({
            label: period.label,
            body: `${warningMinutes} minute${warningMinutes === 1 ? '' : 's'} left in ${period.label}`,
            triggerDate: d,
          });
        }
      }
    }

    if (period.bellAtEnd) {
      const { hours, minutes } = parseTime(period.endTime);
      const d = new Date(now);
      d.setHours(hours, minutes, 0, 0);
      if (d.getTime() > nowMs) {
        notifications.push({
          label: period.label,
          body: `${period.label} ended`,
          triggerDate: d,
        });
      }
    }
  }

  return notifications.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());
}

export async function scheduleBellNotifications(
  days: DaySchedule[],
  warningMinutes: number,
  muted?: boolean,
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (muted) return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const now = new Date();
  const today = now.getDay();
  const daySchedule = days.find((d) => d.dayOfWeek === today);
  if (!daySchedule || daySchedule.periods.length === 0) return;

  const bells = computeBellTimes(daySchedule.periods, warningMinutes, now);

  for (const bell of bells) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '\uD83D\uDD14 School Bell',
        body: bell.body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: bell.triggerDate,
      },
    });
  }
}
