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

export type BellSound = 'school-bell' | 'dinner-bell' | 'chime' | 'sonar-alarm' | 'classic-alarm' | 'melodic-alarm' | 'double-beep' | 'up-and-down' | 'retro-sms' | 'soft-triple' | 'whistle' | 'eight-bit';

export interface BellSounds {
  start: BellSound;
  warning: BellSound;
  end: BellSound;
}

export interface ScheduleSnapshot {
  id: string;
  timestamp: number;
  label: string;
  days: DaySchedule[];
}

export interface UserSettings {
  bellSounds: BellSounds;
  warningMinutes: number;
  timeBetweenPeriods: number;
  notificationsEnabled: boolean;
}

