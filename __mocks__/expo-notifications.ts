export const SchedulableTriggerInputTypes = {
  DATE: 'date',
  TIME_INTERVAL: 'timeInterval',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  CALENDAR: 'calendar',
} as const;

export const setNotificationHandler = jest.fn();
export const getPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted' }),
);
export const requestPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted' }),
);
export const cancelAllScheduledNotificationsAsync = jest.fn(() =>
  Promise.resolve(),
);
export const scheduleNotificationAsync = jest.fn(() =>
  Promise.resolve('mock-notification-id'),
);
export const getAllScheduledNotificationsAsync = jest.fn(() =>
  Promise.resolve([]),
);
