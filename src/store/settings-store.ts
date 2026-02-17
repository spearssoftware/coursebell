import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BellSound, UserSettings } from '../types';

const SETTINGS_KEY = '@classhop/settings';
const MUTED_DATE_KEY = '@classhop/mutedDate';
const ONBOARDING_KEY = '@classhop/hasCompletedOnboarding';

const DEFAULT_SETTINGS: UserSettings = {
  selectedBellSound: 'school-bell',
  warningMinutes: 2,
  notificationsEnabled: true,
};

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface SettingsState extends UserSettings {
  isLoaded: boolean;
  hasCompletedOnboarding: boolean;
  mutedDate: string | null;
  loadSettings: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setBellSound: (sound: BellSound) => Promise<void>;
  setWarningMinutes: (minutes: number) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  toggleMuteToday: () => Promise<void>;
  isMutedToday: () => boolean;
}

function getSettings(state: SettingsState): UserSettings {
  return {
    selectedBellSound: state.selectedBellSound,
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
      const saved = json ? (JSON.parse(json) as Partial<UserSettings>) : {};
      const validSounds: BellSound[] = ['school-bell', 'school-bell2', 'old-school-bell', 'bike-bell', 'ping', 'light-alert', 'quiet-alert', 'up-and-down'];
      if (saved.selectedBellSound && !validSounds.includes(saved.selectedBellSound)) {
        saved.selectedBellSound = DEFAULT_SETTINGS.selectedBellSound;
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

  setBellSound: async (sound: BellSound) => {
    set({ selectedBellSound: sound });
    await persistSettings({ ...getSettings(get()), selectedBellSound: sound });
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
