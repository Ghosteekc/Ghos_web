import type { Archetype } from "@/services/deckBuilder/types";

export type PlayStyle =
  | "Агрессивная"
  | "Контроль"
  | "Оборонительная"
  | "Контрпуш"
  | "Сплит-пуш"
  | "Быстрый цикл"
  | "Осадная"
  | "Гибридная";

export const ARCHETYPE_PLAY_STYLE: Record<string, PlayStyle> = {
  Cycle: "Быстрый цикл",
  "Log Bait": "Сплит-пуш",
  Beatdown: "Контрпуш",
  Control: "Контроль",
  "Bridge Spam": "Агрессивная",
  Lava: "Контрпуш",
  "Royal Giant": "Оборонительная",
  Graveyard: "Контроль",
  Siege: "Осадная",
  "Fireball Bait": "Сплит-пуш",
  "Split Lane": "Сплит-пуш",
  Meta: "Гибридная",
};

export const DECK_TYPE_LABELS: Record<string, string> = {
  Cycle: "Цикл",
  "Log Bait": "Log Bait",
  Beatdown: "Beatdown",
  Control: "Control",
  "Bridge Spam": "Bridge Spam",
  Lava: "Lava",
  "Royal Giant": "Royal Giant",
  Graveyard: "Graveyard",
  Siege: "Siege",
  "Fireball Bait": "Fireball Bait",
  "Split Lane": "Split Lane",
  Meta: "Универсальная",
};

export const COMPLEX_ARCHETYPES = new Set<string>([
  "Graveyard",
  "Siege",
  "Control",
  "Lava",
  "Beatdown",
]);

export const PREDICTION_HEAVY_CARDS = new Set([
  "Princess",
  "Goblin Barrel",
  "X-Bow",
  "Mortar",
  "Graveyard",
  "Miner",
  "Sparky",
]);

export function archetypeDisplayName(archetype: string): Archetype | string {
  return archetype || "Meta";
}
