import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  theme: 'light' | 'dark';
  hasHydrated: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light';
  }

  try {
    const stored = window.localStorage.getItem('stylehub-theme');
    const theme = stored ? JSON.parse(stored)?.state?.theme : null;
    return theme === 'dark' || theme === 'light' ? theme : 'light';
  } catch {
    return 'light';
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: getInitialTheme(),
      hasHydrated: false,
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'stylehub-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
