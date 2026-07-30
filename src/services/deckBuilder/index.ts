export type {
  Archetype,
  BuildResult,
  CardMeta,
  CardRole,
  DeckRecord,
  ScoreBreakdown,
  ScoredDeck,
} from "./types";

export {
  ARCHETYPE_ANCHORS,
  ARCHETYPE_ELIXIR,
  KNOWN_SYNERGY,
  WIN_CONDITIONS,
} from "./constants";

export { avgElixir, cardRoles, cardHasRole, getAllCards, getAllDecks } from "./database";
export { deckSynergyScore, pairSynergy, synergyNotes } from "./synergy";
export {
  balanceIssues,
  buildDeckFromCore,
  buildMultipleDecks,
  detectArchetype,
} from "./builder";
export { detectArchetypeFromCards, scoreArchetype } from "./archetypeDetect";
export {
  computeScoreBreakdown,
  hardConstraintIssues,
  softBalanceIssues,
} from "./balance";
export { DeckIntentEngine, inferDeckIntent } from "./deckIntent";
export type { DeckIntent } from "./deckIntent";
