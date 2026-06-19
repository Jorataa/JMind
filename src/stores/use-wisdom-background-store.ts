import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_BACKGROUND_ID,
  type WisdomBackgroundId,
} from "@/features/wisdom/data/backgrounds";

/** "custom" is stored alongside the preset ids once a user uploads an image. */
export type WisdomBackgroundSelection = WisdomBackgroundId | "custom";

interface WisdomBackgroundState {
  /** Selected preset id, or "custom" when a user image is in use. */
  selection: WisdomBackgroundSelection;
  /** Data URL of the user's uploaded image (null until one is uploaded). */
  customImage: string | null;
  /** Overlay darkness, 0–100 (%). Higher = darker = more readable. */
  darkness: number;
  /** Background blur, 0–20 (px). Gentle dreamy softening. */
  blur: number;
  actions: {
    setBackground: (selection: WisdomBackgroundSelection) => void;
    setCustomImage: (dataUrl: string) => void;
    clearCustomImage: () => void;
    setDarkness: (value: number) => void;
    setBlur: (value: number) => void;
    reset: () => void;
  };
}

const DEFAULTS = {
  selection: DEFAULT_BACKGROUND_ID as WisdomBackgroundSelection,
  customImage: null as string | null,
  darkness: 45,
  blur: 0,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const useWisdomBackgroundStore = create<WisdomBackgroundState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      actions: {
        setBackground: (selection) => set({ selection }),
        setCustomImage: (dataUrl) =>
          set({ customImage: dataUrl, selection: "custom" }),
        clearCustomImage: () =>
          set((state) => ({
            customImage: null,
            // Fall back to the default preset if the custom image was active.
            selection:
              state.selection === "custom"
                ? DEFAULT_BACKGROUND_ID
                : state.selection,
          })),
        setDarkness: (value) => set({ darkness: clamp(value, 0, 100) }),
        setBlur: (value) => set({ blur: clamp(value, 0, 20) }),
        reset: () => set({ ...DEFAULTS }),
      },
    }),
    {
      name: "jmind:wisdom-bg",
      partialize: (state) => ({
        selection: state.selection,
        customImage: state.customImage,
        darkness: state.darkness,
        blur: state.blur,
      }),
    }
  )
);

export const useWisdomBackgroundActions = () =>
  useWisdomBackgroundStore((s) => s.actions);
