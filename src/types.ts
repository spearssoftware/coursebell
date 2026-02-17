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

export type BellSound = 'classic' | 'chime' | 'double-tone' | 'buzzer' | 'gentle';

export interface UserSettings {
  selectedBellSound: BellSound;
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
