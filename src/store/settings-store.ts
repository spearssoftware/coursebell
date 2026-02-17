import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BellSound, BellSounds, UserSettings } from '../types';

const SETTINGS_KEY = '@classhop/settings';
const MUTED_DATE_KEY = '@classhop/mutedDate';
const ONBOARDING_KEY = '@classhop/hasCompletedOnboarding';

const VALID_SOUNDS: BellSound[] = ['school-bell', 'school-bell2', 'old-school-bell', 'bike-bell', 'ping', 'light-alert', 'quiet-alert', 'up-and-down'];

const DEFAULT_BELL_SOUNDS: BellSounds = {
  start: 'school-bell',
  warning: 'quiet-alert',
  end: 'school-bell',
};

const DEFAULT_SETTINGS: UserSettings = {
  bellSounds: DEFAULT_BELL_SOUNDS,
  warningMinutes: 2,
  notificationsEnabled: true,
};

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type BellType = keyof BellSounds;

interface SettingsState extends UserSettings {
  isLoaded: boolean;
  hasCompletedOnboarding: boolean;
  mutedDate: string | null;
  loadSettings: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setBellSound: (bellType: BellType, sound: BellSound) => Promise<void>;
  setWarningMinutes: (minutes: number) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  toggleMuteToday: () => Promise<void>;
  isMutedToday: () => boolean;
}

function getSettings(state: SettingsState): UserSettings {
  return {
    bellSounds: state.bellSounds,
    warningMinutes: state.warningMinutes,
    notificationsEnabled: state.notificationsEnabled,
  };
}

async function persistSettings(settings: UserSettings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  isLoaded: false,
  hasCompletedOnboarding: false,
  mutedDate: null,

  loadSettings: async () => {
    try {
      const [json, mutedJson, onboardingJson] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(MUTED_DATE_KEY),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);
      const saved = json ? (JSON.parse(json) as Partial<UserSettings> & { selectedBellSound?: string }) : {};
      // Migrate from single selectedBellSound to per-type bellSounds
      if (!saved.bellSounds && saved.selectedBellSound) {
        const sound = VALID_SOUNDS.includes(saved.selectedBellSound as BellSound)
          ? (saved.selectedBellSound as BellSound)
          : DEFAULT_BELL_SOUNDS.start;
        saved.bellSounds = { start: sound, warning: sound, end: sound };
        delete saved.selectedBellSound;
      }
      if (saved.bellSounds) {
        for (const key of ['start', 'warning', 'end'] as const) {
          if (!VALID_SOUNDS.includes(saved.bellSounds[key])) {
            saved.bellSounds[key] = DEFAULT_BELL_SOUNDS[key];
          }
        }
      }
      set({
        ...DEFAULT_SETTINGS,
        ...saved,
        mutedDate: mutedJson ?? null,
        hasCompletedOnboarding: onboardingJson === 'true',
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },

  completeOnboarding: async () => {
    set({ hasCompletedOnboarding: true });
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  },

  setBellSound: async (bellType: BellType, sound: BellSound) => {
    const bellSounds = { ...get().bellSounds, [bellType]: sound };
    set({ bellSounds });
    await persistSettings({ ...getSettings(get()), bellSounds });
  },

  setWarningMinutes: async (minutes: number) => {
    set({ warningMinutes: minutes });
    await persistSettings({ ...getSettings(get()), warningMinutes: minutes });
  },

  setNotificationsEnabled: async (enabled: boolean) => {
    set({ notificationsEnabled: enabled });
    await persistSettings({ ...getSettings(get()), notificationsEnabled: enabled });
  },

  toggleMuteToday: async () => {
    const today = todayDateStr();
    const newValue = get().mutedDate === today ? null : today;
    set({ mutedDate: newValue });
    if (newValue) {
      await AsyncStorage.setItem(MUTED_DATE_KEY, newValue);
    } else {
      await AsyncStorage.removeItem(MUTED_DATE_KEY);
    }
  },

  isMutedToday: () => get().mutedDate === todayDateStr(),
}));
