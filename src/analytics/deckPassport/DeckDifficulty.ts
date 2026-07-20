import { avgElixir } from "@/services/deckBuilder/database";
import { balanceIssues } from "@/services/deckBuilder/builder";
import { PREDICTION_HEAVY_CARDS } from "./constants/archetypes";
import { isComplexArchetype } from "./DeckArchetypes";
import type { DeckMetrics } from "./DeckRating";

export type DifficultyLevel =
  | "Очень легкая"
  | "Легкая"
  | "Средняя"
  | "Сложная"
  | "Профессиональная";

export interface DifficultyResult {
  level: DifficultyLevel;
  score: number;
}

export function computeDifficulty(
  cardNames: string[],
  archetype: string,
  metrics: DeckMetrics,
): DifficultyResult {
  let score = 20;

  const avg = avgElixir(cardNames);
  if (avg >= 4.2) score += 18;
  else if (avg >= 3.8) score += 10;
  else if (avg <= 3.0) score += 8;

  if (isComplexArchetype(archetype)) score += 22;

  const predictions = cardNames.filter((c) => PREDICTION_HEAVY_CARDS.has(c)).length;
  score += predictions * 8;

  const issues = balanceIssues(cardNames, archetype).length;
  score += issues * 4;

  if (metrics.cycleSpeed >= 8) score += 6;
  if (metrics.control >= 8) score += 5;

  score = Math.min(100, Math.max(0, score));

  let level: DifficultyLevel = "Средняя";
  if (score < 25) level = "Очень легкая";
  else if (score < 45) level = "Легкая";
  else if (score < 65) level = "Средняя";
  else if (score < 82) level = "Сложная";
  else level = "Профессиональная";

  return { level, score };
}
