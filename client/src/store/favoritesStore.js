import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFavoritesStore = create()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (product) => {
        const current = get().favorites;
        if (!current.some((item) => item.id === product.id)) {
          set({ favorites: [...current, product] });
        }
      },
      removeFavorite: (productId) => {
        const current = get().favorites;
        set({ favorites: current.filter((item) => item.id !== productId) });
      },
      isFavorite: (productId) => {
        return get().favorites.some((item) => item.id === productId);
      },
      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: 'stylehub-favorites',
    }
  )
);
