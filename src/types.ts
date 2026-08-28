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

export const BELL_SOUND_IDS = ['school-bell', 'dinner-bell', 'chime', 'sonar-alarm', 'classic-alarm', 'melodic-alarm', 'double-beep', 'up-and-down', 'retro-sms', 'soft-triple', 'whistle', 'eight-bit'] as const;

export type BellSound = (typeof BELL_SOUND_IDS)[number];

export interface BellSounds {
  start: BellSound;
  warning: BellSound;
  end: BellSound;
}

export const DEFAULT_BELL_SOUNDS: BellSounds = {
  start: 'school-bell',
  warning: 'double-beep',
  end: 'school-bell',
};

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

