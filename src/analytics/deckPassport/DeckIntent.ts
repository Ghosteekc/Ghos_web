/**
 * Re-export DeckIntentEngine for passport analysis.
 * Source of truth: services/deckBuilder/deckIntent.ts (зеркало bot/services/deck_intent.py).
 */
export { DeckIntentEngine, inferDeckIntent } from "@/services/deckBuilder/deckIntent";
export type { DeckIntent } from "@/services/deckBuilder/deckIntent";
