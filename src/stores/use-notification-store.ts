import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationType = "system" | "prompt" | "tip" | "activity";

export interface JorataNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: NotificationType;
  action?: {
    label: string;
    isFeedbackPrompt?: boolean;
    href?: string;
  };
}

interface NotificationState {
  notifications: JorataNotification[];
  feedbackPromptDismissedAt: string | null;
  unreadCount: () => number;
  actions: {
    addNotification: (notification: Omit<JorataNotification, "id" | "timestamp" | "read">) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    dismissFeedbackPrompt: () => void;
  };
}

const DEFAULT_NOTIFICATIONS: JorataNotification[] = [
  {
    id: "welcome-local-first",
    title: "Local-first storage active",
    message: "Your workspace is saved safely inside your browser. No cloud account required.",
    timestamp: new Date().toISOString(),
    read: false,
    type: "system",
  },
  {
    id: "feedback-prompt-init",
    title: "Help shape Jorata",
    message: "We're continuously improving Jorata. If you've noticed something that could be better, we'd love your feedback.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    type: "prompt",
    action: {
      label: "Share feedback",
      isFeedbackPrompt: true,
    },
  },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: DEFAULT_NOTIFICATIONS,
      feedbackPromptDismissedAt: null,
      unreadCount: () => get().notifications.filter((n) => !n.read).length,
      actions: {
        addNotification: (item) => {
          const newNotif: JorataNotification = {
            ...item,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            read: false,
          };
          set((state) => ({
            notifications: [newNotif, ...state.notifications].slice(0, 30),
          }));
        },
        markAsRead: (id) =>
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
          })),
        markAllAsRead: () =>
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
          })),
        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          })),
        dismissFeedbackPrompt: () =>
          set((state) => ({
            feedbackPromptDismissedAt: new Date().toISOString(),
            notifications: state.notifications.filter((n) => n.type !== "prompt"),
          })),
      },
    }),
    {
      name: "jmind:notifications",
      partialize: (state) => ({
        notifications: state.notifications,
        feedbackPromptDismissedAt: state.feedbackPromptDismissedAt,
      }),
    }
  )
);

export const useNotifications = () => useNotificationStore((state) => state.notifications);
export const useNotificationActions = () => useNotificationStore((state) => state.actions);
