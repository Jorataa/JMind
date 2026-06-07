export type WisdomCategory = "discipline" | "focus" | "faith" | "growth" | "mindset";

export interface Wisdom {
  id: string;
  quote: string;
  author?: string;
  category: WisdomCategory;
}
