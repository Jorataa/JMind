import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Wisdom } from "@/features/wisdom/types/wisdom";
import { useActivityStore } from "./use-activity-store";

interface WisdomState {
  favorites: Wisdom[];
  reflections: Record<string, string>; // date string -> reflection content
  actions: {
    toggleFavorite: (wisdom: Wisdom) => void;
    saveReflection: (date: string, content: string) => void;
  };
}

export const useWisdomStore = create<WisdomState>()(
  persist(
    (set) => ({
      favorites: [],
      reflections: {},
      actions: {
        toggleFavorite: (wisdom) =>
          set((state) => {
            const isFavorite = state.favorites.some((f) => f.id === wisdom.id);
            if (isFavorite) {
              return { favorites: state.favorites.filter((f) => f.id !== wisdom.id) };
            }
            return { favorites: [wisdom, ...state.favorites] };
          }),
        saveReflection: (date, content) =>
          set((state) => {
            if (content.trim().length > 0) {
              useActivityStore.getState().actions.logActivity(
                'mindset_reflection',
                `Captured a daily reflection`,
                { date }
              );
            }
            return {
              reflections: { ...state.reflections, [date]: content },
            };
          }),
      },
    }),
    {
      name: "jmind:wisdom",
      partialize: (state) => ({
        favorites: state.favorites,
        reflections: state.reflections,
      }),
    }
  )
);

export const useWisdomActions = () => useWisdomStore((state) => state.actions);
export const useWisdomFavorites = () => useWisdomStore((state) => state.favorites);
export const useWisdomReflections = () => useWisdomStore((state) => state.reflections);
