import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface InboxItem {
  id: string;
  content: string;
  createdAt: string;
}

interface InboxState {
  items: InboxItem[];
  actions: {
    capture: (content: string) => void;
    removeItem: (id: string) => void;
    clearInbox: () => void;
  };
}

export const useInboxStore = create<InboxState>()(
  persist(
    (set) => ({
      items: [],
      actions: {
        capture: (content) => {
          const newItem: InboxItem = {
            id: crypto.randomUUID(),
            content: content.trim(),
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ items: [newItem, ...state.items] }));
        },
        removeItem: (id) => set((state) => ({
          items: state.items.filter(item => item.id !== id)
        })),
        clearInbox: () => set({ items: [] }),
      },
    }),
    {
      name: 'jmind:inbox',
      // Persist only the items — never the actions (see use-focus-store for why
      // a serialized actions object wipes the real ones on reload).
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<InboxState>),
        actions: current.actions,
      }),
    }
  )
);

export const useInbox = () => useInboxStore((state) => state.items);
export const useInboxActions = () => useInboxStore((state) => state.actions);
