import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../lib/id';
import type { DaySchedule, Period, ScheduleSnapshot } from '../types';

const DAYS_KEY = '@classhop/days';
const HISTORY_KEY = '@classhop/schedule-history';
const MAX_HISTORY = 20;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function emptyWeek(): DaySchedule[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    periods: [],
  }));
}

async function persistDays(days: DaySchedule[]) {
  await AsyncStorage.setItem(DAYS_KEY, JSON.stringify(days));
}

async function takeSnapshot(
  label: string,
  days: DaySchedule[],
  currentHistory: ScheduleSnapshot[],
): Promise<ScheduleSnapshot[]> {
  const snapshot: ScheduleSnapshot = {
    id: generateId(),
    timestamp: Date.now(),
    label,
    days: days.map((d) => ({ ...d, periods: [...d.periods] })),
  };
  const updated = [snapshot, ...currentHistory].slice(0, MAX_HISTORY);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

interface ScheduleState {
  days: DaySchedule[];
  isLoaded: boolean;
  history: ScheduleSnapshot[];

  loadData: () => Promise<void>;
  loadHistory: () => Promise<void>;
  addPeriod: (dayOfWeek: number, period: Omit<Period, 'id' | 'sortOrder'>) => Promise<void>;
  updatePeriod: (dayOfWeek: number, periodId: string, updates: Partial<Period>) => Promise<void>;
  deletePeriod: (dayOfWeek: number, periodId: string) => Promise<void>;
  copyDay: (fromDay: number, toDay: number) => Promise<void>;
  importSchedule: (days: DaySchedule[]) => Promise<void>;
  restoreSnapshot: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  days: emptyWeek(),
  isLoaded: false,
  history: [],

  loadData: async () => {
    try {
      const json = await AsyncStorage.getItem(DAYS_KEY);
      const days: DaySchedule[] = json ? JSON.parse(json) : emptyWeek();
      set({ days, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  loadHistory: async () => {
    try {
      const json = await AsyncStorage.getItem(HISTORY_KEY);
      const history: ScheduleSnapshot[] = json ? JSON.parse(json) : [];
      set({ history });
    } catch {
      // silently fail
    }
  },

  addPeriod: async (dayOfWeek: number, period: Omit<Period, 'id' | 'sortOrder'>) => {
    const history = await takeSnapshot('Before adding period', get().days, get().history);
    const days = get().days.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      const sortOrder = d.periods.length;
      const newPeriod: Period = { ...period, id: generateId(), sortOrder };
      return { ...d, periods: [...d.periods, newPeriod] };
    });
    set({ days, history });
    await persistDays(days);
  },

  updatePeriod: async (dayOfWeek: number, periodId: string, updates: Partial<Period>) => {
    const days = get().days.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      return {
        ...d,
        periods: d.periods.map((p) => (p.id === periodId ? { ...p, ...updates } : p)),
      };
    });
    set({ days });
    await persistDays(days);
  },

  deletePeriod: async (dayOfWeek: number, periodId: string) => {
    const currentPeriod = get()
      .days.find((d) => d.dayOfWeek === dayOfWeek)
      ?.periods.find((p) => p.id === periodId);
    const label = currentPeriod ? `Before deleting ${currentPeriod.label}` : 'Before deleting period';
    const history = await takeSnapshot(label, get().days, get().history);
    const days = get().days.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      const filtered = d.periods
        .filter((p) => p.id !== periodId)
        .map((p, i) => ({ ...p, sortOrder: i }));
      return { ...d, periods: filtered };
    });
    set({ days, history });
    await persistDays(days);
  },

  copyDay: async (fromDay: number, toDay: number) => {
    const fromName = DAY_NAMES[fromDay] ?? fromDay;
    const toName = DAY_NAMES[toDay] ?? toDay;
    const history = await takeSnapshot(
      `Before copying ${fromName} to ${toName}`,
      get().days,
      get().history,
    );
    const source = get().days.find((d) => d.dayOfWeek === fromDay);
    if (!source) return;

    const copiedPeriods = source.periods.map((p, i) => ({
      ...p,
      id: generateId(),
      sortOrder: i,
    }));

    const days = get().days.map((d) =>
      d.dayOfWeek === toDay ? { ...d, periods: copiedPeriods } : d,
    );
    set({ days, history });
    await persistDays(days);
  },

  importSchedule: async (days: DaySchedule[]) => {
    const history = await takeSnapshot('Before importing schedule', get().days, get().history);
    const merged = emptyWeek().map((empty) => {
      const imported = days.find((d) => d.dayOfWeek === empty.dayOfWeek);
      return imported ?? empty;
    });
    set({ days: merged, history });
    await persistDays(merged);
  },

  restoreSnapshot: async (id: string) => {
    const snapshot = get().history.find((s) => s.id === id);
    if (!snapshot) return;
    const history = await takeSnapshot('Before restoring snapshot', get().days, get().history);
    set({ days: snapshot.days, history });
    await persistDays(snapshot.days);
  },

  clearHistory: async () => {
    await AsyncStorage.removeItem(HISTORY_KEY);
    set({ history: [] });
  },
}));
