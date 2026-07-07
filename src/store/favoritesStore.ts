import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@/types';

interface FavoritesState {
  favorites: Product[];
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
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
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
