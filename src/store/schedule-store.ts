import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../lib/id';
import type { DaySchedule, Period } from '../types';

const DAYS_KEY = '@classhop/days';

function emptyWeek(): DaySchedule[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    periods: [],
  }));
}

interface ScheduleState {
  days: DaySchedule[];
  isLoaded: boolean;

  loadData: () => Promise<void>;
  addPeriod: (dayOfWeek: number, period: Omit<Period, 'id' | 'sortOrder'>) => Promise<void>;
  updatePeriod: (dayOfWeek: number, periodId: string, updates: Partial<Period>) => Promise<void>;
  deletePeriod: (dayOfWeek: number, periodId: string) => Promise<void>;
  copyDay: (fromDay: number, toDay: number) => Promise<void>;
  importSchedule: (days: DaySchedule[]) => Promise<void>;
}

async function persistDays(days: DaySchedule[]) {
  await AsyncStorage.setItem(DAYS_KEY, JSON.stringify(days));
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  days: emptyWeek(),
  isLoaded: false,

  loadData: async () => {
    try {
      const json = await AsyncStorage.getItem(DAYS_KEY);
      const days: DaySchedule[] = json ? JSON.parse(json) : emptyWeek();
      set({ days, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  addPeriod: async (dayOfWeek: number, period: Omit<Period, 'id' | 'sortOrder'>) => {
    const days = get().days.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      const sortOrder = d.periods.length;
      const newPeriod: Period = { ...period, id: generateId(), sortOrder };
      return { ...d, periods: [...d.periods, newPeriod] };
    });
    set({ days });
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
    const days = get().days.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      const filtered = d.periods
        .filter((p) => p.id !== periodId)
        .map((p, i) => ({ ...p, sortOrder: i }));
      return { ...d, periods: filtered };
    });
    set({ days });
    await persistDays(days);
  },

  copyDay: async (fromDay: number, toDay: number) => {
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
    set({ days });
    await persistDays(days);
  },

  importSchedule: async (days: DaySchedule[]) => {
    const merged = emptyWeek().map((empty) => {
      const imported = days.find((d) => d.dayOfWeek === empty.dayOfWeek);
      return imported ?? empty;
    });
    set({ days: merged });
    await persistDays(merged);
  },
}));
