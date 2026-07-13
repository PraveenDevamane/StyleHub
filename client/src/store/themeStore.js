import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function getInitialTheme() {
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

export const useThemeStore = create()(
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
