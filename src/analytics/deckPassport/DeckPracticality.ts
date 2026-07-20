import { balanceIssues } from "@/services/deckBuilder/builder";
import { avgElixir } from "@/services/deckBuilder/database";
import { CHAMPION_CARDS, clampPercent, LEGENDARY_CARDS } from "./constants/ratings";
import type { DeckMetrics } from "./DeckRating";
import type { DifficultyResult } from "./DeckDifficulty";
import type { DeckCard } from "@/types";

export interface PracticalityResult {
  score: number;
  positives: string[];
  negatives: string[];
}

function countLegendaries(cardNames: string[], cards: DeckCard[]): number {
  const fromRarity = cards.filter(
    (c) => c.rarity === "legendary" || c.rarity === "champion",
  ).length;
  if (fromRarity > 0) return fromRarity;
  return cardNames.filter((n) => LEGENDARY_CARDS.has(n)).length;
}

function countChampions(cardNames: string[], cards: DeckCard[]): number {
  const fromRarity = cards.filter((c) => c.rarity === "champion").length;
  if (fromRarity > 0) return fromRarity;
  return cardNames.filter((n) => CHAMPION_CARDS.has(n)).length;
}

function countEvolutions(cards: DeckCard[]): number {
  return cards.filter((c) => (c.evolution_level ?? 0) >= 1).length;
}

export function computePracticality(
  cardNames: string[],
  cards: DeckCard[],
  archetype: string,
  metrics: DeckMetrics,
  difficulty: DifficultyResult,
): PracticalityResult {
  let score = 72;
  const positives: string[] = [];
  const negatives: string[] = [];

  const avg = avgElixir(cardNames);
  const legends = countLegendaries(cardNames, cards);
  const champions = countChampions(cardNames, cards);
  const evos = countEvolutions(cards);
  const issues = balanceIssues(cardNames, archetype);

  if (avg <= 3.6) {
    score += 8;
    positives.push("умеренная стоимость ротации");
  } else if (avg >= 4.2) {
    score -= 12;
    negatives.push("дорогая ротация");
  }

  if (legends === 0) {
    score += 10;
    positives.push("легко прокачать");
  } else if (legends >= 2) {
    score -= legends * 5;
    negatives.push("несколько легендарных карт");
  }

  if (champions > 0) {
    score -= champions * 12;
    negatives.push(champions > 1 ? "несколько чемпионов" : "требуется чемпион");
  }

  if (evos >= 3) {
    score -= (evos - 2) * 6;
    negatives.push("требуется несколько эволюций");
  } else if (evos <= 1) {
    score += 4;
    positives.push("минимум эволюций");
  }

  if (issues.length === 0) {
    score += 8;
    positives.push("сбалансированный состав");
  } else if (issues.length >= 3) {
    score -= 10;
    negatives.push("несбалансированные роли");
  }

  if (metrics.versatility >= 7) {
    score += 6;
    positives.push("подходит большинству игроков");
  }

  if (metrics.stability >= 7.5) {
    score += 5;
    positives.push("стабильна в мете");
  }

  if (difficulty.level === "Очень легкая" || difficulty.level === "Легкая") {
    score += 6;
    positives.push("простая в освоении");
  } else if (difficulty.level === "Профессиональная") {
    score -= 10;
    negatives.push("высокая сложность освоения");
  }

  if (positives.length === 0) positives.push("универсальный архетип");
  if (negatives.length === 0 && score < 70) negatives.push("требует точной игры");

  return {
    score: clampPercent(score),
    positives: positives.slice(0, 4),
    negatives: negatives.slice(0, 4),
  };
}
