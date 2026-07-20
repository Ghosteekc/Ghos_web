import type { Deck } from "@/types";
import { balanceIssues } from "@/services/deckBuilder/builder";
import { avgElixir } from "@/services/deckBuilder/database";
import {
  detectDeckArchetype,
  detectPlayStyle,
  deckTypeLabel,
  type PlayStyle,
} from "./DeckArchetypes";
import { computeDifficulty, type DifficultyLevel } from "./DeckDifficulty";
import { getArchetypeMatchups } from "./DeckMatchups";
import { computePracticality } from "./DeckPracticality";
import {
  computeDeckMetrics,
  computeGhosteekScore,
  computeStars,
  type DeckMetrics,
} from "./DeckRating";
import { evaluateRoleBalance, type RoleBalanceEntry } from "./DeckRoles";
import { starsDisplay } from "./constants/ratings";
import { collectCardNames, computeBasicInfo, type DeckBasicInfo } from "./DeckStatistics";

export interface DeckPassportResult {
  score: number;
  stars: number;
  starsDisplay: string;
  metrics: DeckMetrics;
  attack: number;
  defense: number;
  control: number;
  counterpush: number;
  cycleSpeed: number;
  antiAir: number;
  antiGround: number;
  antiTank: number;
  swarmDefense: number;
  versatility: number;
  stability: number;
  archetype: string;
  playStyle: PlayStyle;
  basicInfo: DeckBasicInfo;
  roleBalance: RoleBalanceEntry[];
  practicality: number;
  practicalityReasons: { positive: string[]; negative: string[] };
  difficulty: DifficultyLevel;
  strengths: string[];
  weaknesses: string[];
  matchups: { strong: string[]; weak: string[] };
  summary: string;
}

const METRIC_LABELS: { key: keyof DeckMetrics; label: string }[] = [
  { key: "attack", label: "Атака" },
  { key: "defense", label: "Защита" },
  { key: "control", label: "Контроль" },
  { key: "counterpush", label: "Контрпуш" },
  { key: "cycleSpeed", label: "Скорость цикла" },
  { key: "antiAir", label: "Защита воздуха" },
  { key: "antiGround", label: "Защита земли" },
  { key: "antiTank", label: "Против танков" },
  { key: "swarmDefense", label: "Против роя" },
  { key: "versatility", label: "Универсальность" },
  { key: "stability", label: "Стабильность" },
];

function buildStrengths(metrics: DeckMetrics, roleBalance: RoleBalanceEntry[]): string[] {
  const out: string[] = [];
  if (metrics.counterpush >= 7.5) out.push("сильный контрпуш");
  if (metrics.cycleSpeed >= 7.5) out.push("отличный цикл");
  if (metrics.antiTank >= 7) out.push("надёжная защита против танков");
  if (metrics.attack >= 7.5) out.push("высокий потенциал давления");
  if (metrics.defense >= 7.5) out.push("крепкая оборона");
  if (metrics.control >= 7) out.push("хороший контроль поля");
  if (metrics.antiAir >= 7) out.push("уверенная защита воздуха");
  if (roleBalance.filter((r) => r.present).length >= 7) out.push("полный набор ролей");
  return out.slice(0, 5);
}

function buildWeaknesses(
  metrics: DeckMetrics,
  cardNames: string[],
  archetype: string,
): string[] {
  const out: string[] = [];
  const issues = balanceIssues(cardNames, archetype);
  if (metrics.antiAir < 5) out.push("слабая защита воздуха");
  if (issues.includes("defensive") || issues.includes("building")) out.push("нет здания");
  if (avgElixir(cardNames) >= 4.1) out.push("дорогая ротация");
  if (issues.includes("small_spell") || issues.includes("big_spell")) {
    out.push("отсутствует второе заклинание");
  }
  if (metrics.swarmDefense < 5) out.push("плохо играет против спама");
  if (metrics.antiTank < 5) out.push("слабый ответ на тяжёлые юниты");
  return out.slice(0, 5);
}

function buildSummary(
  score: number,
  archetype: string,
  playStyle: PlayStyle,
  strengths: string[],
  matchups: { strong: string[]; weak: string[] },
  metrics: DeckMetrics,
): string {
  const parts: string[] = [];

  if (score >= 75) {
    parts.push("Эта колода отлично подходит для рейтинговых боёв.");
  } else if (score >= 55) {
    parts.push("Колода имеет потенциал в рейтинге при грамотной игре.");
  } else {
    parts.push("Колода требует доработки состава или высокого мастерства.");
  }

  if (metrics.attack >= 7 && metrics.defense >= 7) {
    parts.push("Имеет хороший баланс атаки и защиты.");
  } else if (metrics.attack >= metrics.defense + 2) {
    parts.push("Ориентирована на постоянное давление.");
  } else if (metrics.defense >= metrics.attack + 2) {
    parts.push("Строится вокруг надёжной обороны.");
  }

  if (matchups.strong.length > 0) {
    parts.push(`Лучше всего показывает себя против ${matchups.strong.slice(0, 2).join(" и ")}.`);
  }

  if (playStyle === "Контрпуш" || playStyle === "Оборонительная") {
    parts.push("Основой игры является защита с последующим контрпушем.");
  } else if (playStyle === "Быстрый цикл") {
    parts.push("Ключ к успеху — быстрый цикл и постоянный давление.");
  } else if (playStyle === "Агрессивная") {
    parts.push("Требует активной игры и инициативы с первых секунд.");
  }

  if (strengths.length === 0) {
    parts.push(`Архетип ${archetype} — универсальный, но требует практики.`);
  }

  return parts.join(" ");
}

export function analyzeDeckPassport(deck: Deck): DeckPassportResult | null {
  const cards = deck.cards ?? [];
  if (cards.length !== 8) return null;

  const cardNames = collectCardNames(cards);
  const archetype = detectDeckArchetype(cardNames);
  const playStyle = detectPlayStyle(cardNames, archetype);
  const metrics = computeDeckMetrics(cardNames, archetype);
  const score = computeGhosteekScore(metrics);
  const stars = computeStars(score);
  const difficulty = computeDifficulty(cardNames, archetype, metrics);
  const practicality = computePracticality(
    cardNames,
    cards,
    archetype,
    metrics,
    difficulty,
  );
  const roleBalance = evaluateRoleBalance(cardNames);
  const matchupsRaw = getArchetypeMatchups(archetype);
  const strengths = buildStrengths(metrics, roleBalance);
  const weaknesses = buildWeaknesses(metrics, cardNames, archetype);
  const summary = buildSummary(
    score,
    archetype,
    playStyle,
    strengths,
    { strong: matchupsRaw.strongAgainst, weak: matchupsRaw.weakAgainst },
    metrics,
  );

  return {
    score,
    stars,
    starsDisplay: starsDisplay(stars),
    metrics,
    attack: metrics.attack,
    defense: metrics.defense,
    control: metrics.control,
    counterpush: metrics.counterpush,
    cycleSpeed: metrics.cycleSpeed,
    antiAir: metrics.antiAir,
    antiGround: metrics.antiGround,
    antiTank: metrics.antiTank,
    swarmDefense: metrics.swarmDefense,
    versatility: metrics.versatility,
    stability: metrics.stability,
    archetype,
    playStyle,
    basicInfo: computeBasicInfo(cardNames, deckTypeLabel(archetype)),
    roleBalance,
    practicality: practicality.score,
    practicalityReasons: {
      positive: practicality.positives,
      negative: practicality.negatives,
    },
    difficulty: difficulty.level,
    strengths,
    weaknesses,
    matchups: {
      strong: matchupsRaw.strongAgainst,
      weak: matchupsRaw.weakAgainst,
    },
    summary,
  };
}

export function getMetricDisplayList(metrics: DeckMetrics) {
  return METRIC_LABELS.map(({ key, label }) => ({
    key,
    label,
    value: metrics[key],
  }));
}

export type { DeckMetrics, RoleBalanceEntry, DeckBasicInfo, PlayStyle, DifficultyLevel };
