export interface Period {
  id: string;
  label: string;
  startTime: string; // "HH:MM" format
  endTime: string; // "HH:MM" format
  sortOrder: number;
  bellAtStart: boolean;
  bellAtEnd: boolean;
  bellBeforeEnd: boolean;
}

export interface DaySchedule {
  dayOfWeek: number; // 0=Sun, 1=Mon ... 6=Sat
  periods: Period[];
}

export type BellSound = 'school-bell' | 'school-bell2' | 'old-school-bell' | 'bike-bell' | 'ping' | 'light-alert' | 'quiet-alert' | 'up-and-down';

export interface BellSounds {
  start: BellSound;
  warning: BellSound;
  end: BellSound;
}

export interface UserSettings {
  bellSounds: BellSounds;
  warningMinutes: number;
  notificationsEnabled: boolean;
}

export interface SharePayload {
  v: 1;
  warningMinutes: number;
  days: Record<
    string,
    Array<{
      label: string;
      start: string;
      end: string;
      bs: boolean;
      be: boolean;
      bw: boolean;
    }>
  >;
}
