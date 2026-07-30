/**
 * DeckIntentEngine — стратегия колоды для passport / soft-balance.
 * Зеркало bot/services/deck_intent.py. Не меняет API анализа, только критерии soft-пробелов.
 */

import { WIN_CONDITIONS } from "./constants";
import { cardHasRole } from "./database";

export interface DeckIntent {
  archetype: string;
  playStyle: string;
  primaryWin: string | null;
  requiredSoftChecks: ReadonlySet<string>;
  minAirDefense: number;
  requireBuilding: boolean;
  minCycleCards: number;
  requiredRoleIds: ReadonlySet<string>;
  attackBias: number;
}

interface ArchetypePolicy {
  playStyle: string;
  requiredSoftChecks: ReadonlySet<string>;
  minAirDefense: number;
  requireBuilding: boolean;
  minCycleCards: number;
  requiredRoleIds: ReadonlySet<string>;
  attackBias: number;
}

const POLICIES: Record<string, ArchetypePolicy> = {
  Cycle: {
    playStyle: "Быстрый цикл",
    requiredSoftChecks: new Set([
      "big_spell",
      "small_spell",
      "air_defense",
      "anti_tank",
      "anti_swarm",
      "cycle",
    ]),
    minAirDefense: 1,
    requireBuilding: false,
    minCycleCards: 2,
    requiredRoleIds: new Set([
      "win_condition",
      "big_spell",
      "small_spell",
      "anti_air",
      "dps",
      "splash",
    ]),
    attackBias: 0.65,
  },
  "Log Bait": {
    playStyle: "Сплит-пуш",
    requiredSoftChecks: new Set(["big_spell", "small_spell", "air_defense", "anti_swarm"]),
    minAirDefense: 1,
    requireBuilding: false,
    minCycleCards: 1,
    requiredRoleIds: new Set([
      "win_condition",
      "big_spell",
      "small_spell",
      "anti_air",
      "splash",
      "dps",
    ]),
    attackBias: 0.6,
  },
  "Fireball Bait": {
    playStyle: "Сплит-пуш",
    requiredSoftChecks: new Set(["big_spell", "small_spell", "air_defense", "anti_swarm"]),
    minAirDefense: 1,
    requireBuilding: false,
    minCycleCards: 1,
    requiredRoleIds: new Set([
      "win_condition",
      "big_spell",
      "small_spell",
      "anti_air",
      "splash",
    ]),
    attackBias: 0.6,
  },
  Beatdown: {
    playStyle: "Контрпуш",
    requiredSoftChecks: new Set(["big_spell", "small_spell", "air_defense", "anti_swarm"]),
    minAirDefense: 1,
    requireBuilding: false,
    minCycleCards: 0,
    requiredRoleIds: new Set([
      "win_condition",
      "big_spell",
      "small_spell",
      "tank",
      "anti_air",
      "splash",
    ]),
    attackBias: 0.7,
  },
  Lava: {
    playStyle: "Контрпуш",
    requiredSoftChecks: new Set(["big_spell", "small_spell", "anti_swarm", "anti_tank"]),
    minAirDefense: 0,
    requireBuilding: false,
    minCycleCards: 0,
    requiredRoleIds: new Set([
      "win_condition",
      "big_spell",
      "small_spell",
      "splash",
      "dps",
    ]),
    attackBias: 0.7,
  },
  "Bridge Spam": {
    playStyle: "Агрессивная",
    requiredSoftChecks: new Set(["small_spell", "air_defense", "anti_swarm", "anti_tank"]),
    minAirDefense: 1,
    requireBuilding: false,
    minCycleCards: 0,
    requiredRoleIds: new Set([
      "win_condition",
      "small_spell",
      "mini_tank",
      "anti_air",
      "splash",
      "dps",
    ]),
    attackBias: 0.75,
  },
  Siege: {
    playStyle: "Осадная",
    requiredSoftChecks: new Set([
      "big_spell",
      "small_spell",
      "air_defense",
      "building",
      "anti_swarm",
    ]),
    minAirDefense: 1,
    requireBuilding: true,
    minCycleCards: 1,
    requiredRoleIds: new Set([
      "win_condition",
      "big_spell",
      "small_spell",
      "building",
      "anti_air",
      "splash",
    ]),
    attackBias: 0.45,
  },
  Control: {
    playStyle: "Контроль",
    requiredSoftChecks: new Set([
      "big_spell",
      "small_spell",
      "air_defense",
      "building",
      "anti_swarm",
    ]),
    minAirDefense: 1,
    requireBuilding: true,
    minCycleCards: 1,
    requiredRoleIds: new Set([
      "win_condition",
      "big_spell",
      "small_spell",
      "building",
      "anti_air",
      "splash",
    ]),
    attackBias: 0.4,
  },
  Graveyard: {
    playStyle: "Контроль",
    requiredSoftChecks: new Set([
      "big_spell",
      "small_spell",
      "air_defense",
      "anti_swarm",
      "anti_tank",
    ]),
    minAirDefense: 1,
    requireBuilding: false,
    minCycleCards: 0,
    requiredRoleIds: new Set([
      "win_condition",
      "big_spell",
      "small_spell",
      "anti_air",
      "splash",
      "mini_tank",
    ]),
    attackBias: 0.5,
  },
  "Royal Giant": {
    playStyle: "Оборонительная",
    requiredSoftChecks: new Set([
      "big_spell",
      "small_spell",
      "air_defense",
      "anti_swarm",
      "anti_tank",
    ]),
    minAirDefense: 1,
    requireBuilding: false,
    minCycleCards: 0,
    requiredRoleIds: new Set([
      "win_condition",
      "big_spell",
      "small_spell",
      "anti_air",
      "splash",
      "dps",
    ]),
    attackBias: 0.55,
  },
  "Split Lane": {
    playStyle: "Сплит-пуш",
    requiredSoftChecks: new Set(["small_spell", "air_defense", "anti_swarm", "cycle"]),
    minAirDefense: 1,
    requireBuilding: false,
    minCycleCards: 2,
    requiredRoleIds: new Set([
      "win_condition",
      "small_spell",
      "anti_air",
      "splash",
      "dps",
    ]),
    attackBias: 0.65,
  },
};

const DEFAULT_POLICY: ArchetypePolicy = {
  playStyle: "Гибридная",
  requiredSoftChecks: new Set([
    "big_spell",
    "small_spell",
    "air_defense",
    "anti_tank",
    "anti_swarm",
  ]),
  minAirDefense: 1,
  requireBuilding: false,
  minCycleCards: 0,
  requiredRoleIds: new Set([
    "win_condition",
    "big_spell",
    "small_spell",
    "anti_air",
    "splash",
    "dps",
  ]),
  attackBias: 0.55,
};

export function detectPrimaryWin(cards: string[]): string | null {
  const wins = cards.filter(
    (c) => WIN_CONDITIONS.has(c) || cardHasRole(c, "win_condition"),
  );
  return wins[0] ?? null;
}

export function inferDeckIntent(cards: string[], archetype = "Meta"): DeckIntent {
  const policy = POLICIES[archetype] ?? DEFAULT_POLICY;
  const required = new Set(policy.requiredSoftChecks);
  if (policy.requireBuilding) required.add("building");
  if (policy.minCycleCards > 0) required.add("cycle");
  if (policy.minAirDefense > 0) required.add("air_defense");

  return {
    archetype,
    playStyle: policy.playStyle,
    primaryWin: detectPrimaryWin(cards),
    requiredSoftChecks: required,
    minAirDefense: policy.minAirDefense,
    requireBuilding: policy.requireBuilding,
    minCycleCards: policy.minCycleCards,
    requiredRoleIds: policy.requiredRoleIds,
    attackBias: policy.attackBias,
  };
}

export const DeckIntentEngine = {
  infer: inferDeckIntent,
};
