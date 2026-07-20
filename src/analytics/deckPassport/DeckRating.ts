import { balanceIssues } from "@/services/deckBuilder/builder";
import { avgElixir, cardRoles } from "@/services/deckBuilder/database";
import { deckSynergyScore } from "@/services/deckBuilder/synergy";
import { isSpellCard, isWinCard } from "@/services/deckBuilder/balance";
import { clampMetric, METRIC_WEIGHTS, scoreToStars } from "./constants/ratings";
import { evaluateRoleBalance } from "./DeckRoles";
import { getCardMeta } from "@/services/deckBuilder/database";

export interface DeckMetrics {
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
}

function countRole(cardNames: string[], role: string): number {
  return cardNames.filter((c) => cardRoles(c).has(role)).length;
}

function metricFromRatio(ratio: number, scale = 10): number {
  return clampMetric(ratio * scale);
}

export function computeDeckMetrics(cardNames: string[], archetype: string): DeckMetrics {
  const avg = avgElixir(cardNames);
  const wins = cardNames.filter(isWinCard).length;
  const spells = cardNames.filter(isSpellCard).length;
  const buildings =
    countRole(cardNames, "building") + countRole(cardNames, "defensive");
  const airDef = countRole(cardNames, "air_defense");
  const splash = countRole(cardNames, "splash");
  const antiTank = countRole(cardNames, "anti_tank");
  const antiSwarm = countRole(cardNames, "anti_swarm");
  const counterpush =
    countRole(cardNames, "counterpush") + countRole(cardNames, "mini_tank");
  const cycleCards = cardNames.filter(
    (c) => cardRoles(c).has("cycle") || (getCardMeta(c)?.elixir ?? 4) <= 2,
  ).length;
  const issues = balanceIssues(cardNames, archetype);
  const roles = evaluateRoleBalance(cardNames);
  const roleCoverage = roles.filter((r) => r.present).length / roles.length;

  const attackBase =
    (wins > 0 ? 4 : 0) +
    Math.min(3, countRole(cardNames, "dps") * 1.2) +
    Math.min(2, spells * 0.8) +
    (avg <= 3.5 ? 1.5 : avg <= 4 ? 0.5 : 0);

  const defenseBase =
    Math.min(4, buildings * 1.5) +
    Math.min(3, countRole(cardNames, "defensive")) +
    Math.min(2, countRole(cardNames, "mini_tank"));

  const controlBase =
    Math.min(3, spells * 1.2) +
    Math.min(3, buildings * 1) +
    (cardNames.some((c) => ["Tesla", "Inferno Tower", "Cannon"].includes(c)) ? 2 : 0);

  const cycleSpeedBase =
    (avg <= 3.0 ? 4 : avg <= 3.5 ? 3 : avg <= 4 ? 2 : 1) +
    Math.min(3, cycleCards * 0.8);

  return {
    attack: clampMetric(attackBase),
    defense: clampMetric(defenseBase),
    control: clampMetric(controlBase),
    counterpush: clampMetric(Math.min(10, counterpush * 2 + (wins > 0 ? 2 : 0))),
    cycleSpeed: clampMetric(cycleSpeedBase),
    antiAir: metricFromRatio(Math.min(1, airDef / 2.5)),
    antiGround: clampMetric(
      Math.min(10, splash * 1.5 + buildings * 1.2 + countRole(cardNames, "defensive")),
    ),
    antiTank: metricFromRatio(Math.min(1, antiTank / 2)),
    swarmDefense: clampMetric(
      Math.min(10, splash * 1.2 + antiSwarm * 2 + (spells >= 2 ? 1.5 : 0)),
    ),
    versatility: clampMetric(roleCoverage * 10),
    stability: clampMetric(
      Math.max(0, 10 - issues.length * 1.4 + (airDef >= 2 ? 1 : -0.5) + deckSynergyScore(cardNames) / 25),
    ),
  };
}

export function computeGhosteekScore(metrics: DeckMetrics): number {
  const entries = Object.entries(METRIC_WEIGHTS) as [keyof DeckMetrics, number][];
  let weighted = 0;
  let totalWeight = 0;
  for (const [key, weight] of entries) {
    weighted += metrics[key] * weight;
    totalWeight += weight * 10;
  }
  return Math.round((weighted / totalWeight) * 100);
}

export { scoreToStars as computeStars };
