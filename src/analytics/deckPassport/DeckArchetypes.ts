import { detectArchetype } from "@/services/deckBuilder";
import { avgElixir } from "@/services/deckBuilder/database";
import {
  ARCHETYPE_PLAY_STYLE,
  COMPLEX_ARCHETYPES,
  DECK_TYPE_LABELS,
  type PlayStyle,
} from "./constants/archetypes";

export type { PlayStyle };

export function detectDeckArchetype(cardNames: string[]): string {
  return detectArchetype(cardNames);
}

export function detectPlayStyle(cardNames: string[], archetype: string): PlayStyle {
  const mapped = ARCHETYPE_PLAY_STYLE[archetype];
  if (mapped) return mapped;

  const avg = avgElixir(cardNames);
  if (avg <= 3.2) return "Быстрый цикл";
  if (avg >= 4.2) return "Контрпуш";
  return "Гибридная";
}

export function deckTypeLabel(archetype: string): string {
  return DECK_TYPE_LABELS[archetype] ?? archetype;
}

export function isComplexArchetype(archetype: string): boolean {
  return COMPLEX_ARCHETYPES.has(archetype);
}
