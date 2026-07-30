import {
  GENERIC_CARDS,
  WEIGHT_ARCHETYPE,
  WEIGHT_CARD_MATCH,
  WEIGHT_ELIXIR,
  WEIGHT_POPULARITY,
  WEIGHT_SYNERGY,
  WIN_CONDITIONS,
} from "./constants";
import {
  balanceIssues,
  computeScoreBreakdown,
  finalizeDeck,
  fillersFromTemplate,
  hardConstraintIssues,
  isPlayableBalanced,
  meaningfulOverlap,
  templateIsUsable,
} from "./balance";
import {
  avgElixir,
  candidateDeckIndices,
  getAllCards,
  getAllDecks,
} from "./database";
import { detectArchetypeFromCards } from "./archetypeDetect";
import {
  prepareConstructorDecision,
  resultDecisionBonus,
  templateDecisionBonus,
  type ConstructorDecision,
} from "./constructorDecision";
import { deckSynergyScore, pairSynergy } from "./synergy";
import type { BuildResult, DeckRecord, ScoredDeck } from "./types";

function detectArchetype(core: string[]): string {
  /** Публичный API без смены сигнатуры — мультифакторный скоринг. */
  return detectArchetypeFromCards(core);
}

function overlapScore(core: string[], templateCards: string[]): number {
  const coreSet = new Set(core);
  let score = 0;
  for (const card of templateCards) {
    if (!coreSet.has(card)) continue;
    score += GENERIC_CARDS.has(card) ? 0.5 : 4.0;
    if (WIN_CONDITIONS.has(card)) score += 6.0;
  }
  return score;
}

function coreSynergyWithDeck(core: string[], deckCards: string[]): number {
  let total = 0;
  let n = 0;
  for (const c of core) {
    for (const d of deckCards) {
      if (c !== d) {
        total += pairSynergy(c, d);
        n++;
      }
    }
  }
  return n ? total / n : 0;
}

function scoreDeckMatch(core: string[], archetype: string, record: DeckRecord): ScoredDeck | null {
  if (!templateIsUsable(core, record)) return null;

  const weightedOverlap = overlapScore(core, record.cards);
  const cardScore = weightedOverlap * (WEIGHT_CARD_MATCH / 4);
  const archScore = record.archetype === archetype ? WEIGHT_ARCHETYPE : 0;
  const coreAvg = avgElixir(core);
  const elixirDiff = Math.abs(record.avgElixir - coreAvg);
  const elixirPenalty = coreAvg <= 3.0 ? elixirDiff * 8 : elixirDiff * 5;
  const elixirScore = Math.max(0, WEIGHT_ELIXIR - elixirPenalty);
  const synScore = (coreSynergyWithDeck(core, record.cards) / 100) * WEIGHT_SYNERGY;
  const popScore = ((record.popularity ?? 50) / 100) * WEIGHT_POPULARITY;

  const raw = cardScore + archScore + elixirScore + synScore + popScore;
  const maxPossible =
    4 * WEIGHT_CARD_MATCH + WEIGHT_ARCHETYPE + WEIGHT_ELIXIR + WEIGHT_SYNERGY + WEIGHT_POPULARITY;
  const confidence = Math.min(100, (raw / maxPossible) * 100);
  const overlap = meaningfulOverlap(core, record.cards).length;

  return { record, score: raw, confidence, overlap };
}

function rankSimilar(
  core: string[],
  archetype: string,
  limit: number,
  decision?: ConstructorDecision,
): ScoredDeck[] {
  const decks = getAllDecks();
  const indices = candidateDeckIndices(core);
  const scored: ScoredDeck[] = [];

  const push = (sd: ScoredDeck | null) => {
    if (!sd) return;
    if (decision) {
      const extra = templateDecisionBonus(sd.record, decision);
      scored.push({
        ...sd,
        score: sd.score + extra,
        confidence: Math.min(100, sd.confidence + extra * 0.35),
      });
    } else {
      scored.push(sd);
    }
  };

  for (const idx of indices) {
    push(scoreDeckMatch(core, archetype, decks[idx]));
  }
  if (!scored.length) {
    for (const d of decks) {
      push(scoreDeckMatch(core, archetype, d));
    }
  }
  scored.sort((a, b) => b.score - a.score || b.confidence - a.confidence || b.overlap - a.overlap);
  return scored.slice(0, limit);
}

function resultBalanced(deck: string[], core: string[], archetype: string): boolean {
  const breakdown = computeScoreBreakdown(deck, core, archetype);
  return isPlayableBalanced(breakdown, coreSynergyAvg(deck, core));
}

function coreSynergyAvg(deck: string[], core: string[]): number {
  let total = 0;
  let n = 0;
  for (const c of core) {
    for (const d of deck) {
      if (c !== d) {
        total += pairSynergy(c, d);
        n += 1;
      }
    }
  }
  return n ? total / n : 0;
}

function rankScore(r: BuildResult, decision?: ConstructorDecision): number {
  const total = r.scoreBreakdown?.total ?? 0;
  const fit = decision ? resultDecisionBonus(r.deck, decision) : 0;
  return total * 0.45 + r.synergyScore * 0.25 + r.confidence * 0.15 + fit * 0.15;
}

function buildOneVariant(
  core: string[],
  pool: Set<string>,
  archetype: string,
  template?: DeckRecord,
  fillerSkip = 0,
): string[] {
  let fillers = template ? fillersFromTemplate(core, template) : [];
  if (fillerSkip > 0) fillers = fillers.slice(fillerSkip);
  let deck = [...core];
  for (const card of fillers) {
    if (deck.length >= 8) break;
    if (!deck.includes(card)) deck.push(card);
  }
  return finalizeDeck(deck, core, pool, template?.archetype ?? archetype);
}

export function buildDeckFromCore(core: string[], pool?: Set<string>): BuildResult {
  /**
   * Порядок: 1 Intent → 2 GamePlan → 3 шаблон → 4–6 кандидаты / оценка / finalize.
   * Существующий finalize сохранён.
   */
  if (core.length !== 4 || new Set(core).size !== 4) {
    throw new Error("Нужно ровно 4 уникальные карты");
  }

  const allCards = getAllCards();
  const cardPool = pool ?? new Set(Object.keys(allCards));
  for (const c of core) cardPool.add(c);

  const decision = prepareConstructorDecision(core, detectArchetype);
  const archetype = decision.archetype;
  const ranked = rankSimilar(core, archetype, 6, decision);
  const best = ranked[0];

  const deck = buildOneVariant(core, cardPool, archetype, best?.record);
  const breakdown = computeScoreBreakdown(deck, core, archetype);
  const conf = Math.min(
    100,
    (best?.confidence ?? 40) + resultDecisionBonus(deck, decision) * 0.4,
  );

  return {
    deck,
    archetype,
    averageElixir: avgElixir(deck),
    synergyScore: deckSynergyScore(deck),
    confidence: Math.round(conf * 10) / 10,
    sourceDeckId: best?.record.id,
    sourceDeckName: undefined,
    balanced: resultBalanced(deck, core, archetype),
    scoreBreakdown: breakdown,
  };
}

function deckKey(deck: string[]): string {
  return [...deck].sort().join("|");
}

function dedupeBuildResults(results: BuildResult[]): BuildResult[] {
  const out: BuildResult[] = [];
  const seen = new Set<string>();
  for (const item of results) {
    const key = deckKey(item.deck);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function buildMultipleDecks(core: string[], limit = 6): BuildResult[] {
  const decision = prepareConstructorDecision(core, detectArchetype);
  const archetype = decision.archetype;
  const ranked = rankSimilar(core, archetype, limit * 5, decision);
  const allCards = getAllCards();
  const pool = new Set(Object.keys(allCards));
  for (const c of core) pool.add(c);

  const results: BuildResult[] = [];
  const seen = new Set<string>();

  for (const sd of ranked) {
    if (results.length >= limit) break;
    for (const fillerSkip of [0, 1, 2]) {
      const deck = buildOneVariant(core, pool, archetype, sd.record, fillerSkip);
      const arch = sd.record.archetype || archetype;
      if (deck.length !== 8 || hardConstraintIssues(deck, core).length) {
        continue;
      }
      const key = deckKey(deck);
      if (seen.has(key)) continue;
      seen.add(key);
      const breakdown = computeScoreBreakdown(deck, core, arch);
      const conf = Math.min(
        100,
        sd.confidence + resultDecisionBonus(deck, decision) * 0.4,
      );

      results.push({
        deck,
        archetype: arch,
        averageElixir: avgElixir(deck),
        synergyScore: deckSynergyScore(deck),
        confidence: Math.round(conf * 10) / 10,
        sourceDeckId: sd.record.id,
        sourceDeckName: undefined,
        balanced: resultBalanced(deck, core, arch),
        scoreBreakdown: breakdown,
      });
      break;
    }
  }

  if (!results.length) {
    const fallback = buildOneVariant(core, pool, archetype);
    seen.add(deckKey(fallback));
    const breakdown = computeScoreBreakdown(fallback, core, archetype);
    const conf = Math.min(100, 35 + resultDecisionBonus(fallback, decision) * 0.4);
    results.push({
      deck: fallback,
      archetype,
      averageElixir: avgElixir(fallback),
      synergyScore: deckSynergyScore(fallback),
      confidence: Math.round(conf * 10) / 10,
      balanced: resultBalanced(fallback, core, archetype),
      scoreBreakdown: breakdown,
    });
  }

  const genericFallback = finalizeDeck(core, core, pool, archetype);
  const gKey = deckKey(genericFallback);
  if (!seen.has(gKey) && results.length < limit) {
    const breakdown = computeScoreBreakdown(genericFallback, core, archetype);
    const conf = Math.min(
      100,
      30 + resultDecisionBonus(genericFallback, decision) * 0.4,
    );
    results.push({
      deck: genericFallback,
      archetype,
      averageElixir: avgElixir(genericFallback),
      synergyScore: deckSynergyScore(genericFallback),
      confidence: Math.round(conf * 10) / 10,
      balanced: resultBalanced(genericFallback, core, archetype),
      scoreBreakdown: breakdown,
    });
  }

  results.sort((a, b) => rankScore(b, decision) - rankScore(a, decision));
  return dedupeBuildResults(results).slice(0, limit);
}

export { detectArchetype, balanceIssues };
