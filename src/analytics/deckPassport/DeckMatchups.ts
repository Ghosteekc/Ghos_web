import { ARCHETYPE_MATCHUPS } from "./constants/matchups";

export interface DeckMatchupResult {
  strongAgainst: string[];
  weakAgainst: string[];
}

export function getArchetypeMatchups(archetype: string): DeckMatchupResult {
  const row = ARCHETYPE_MATCHUPS[archetype] ?? ARCHETYPE_MATCHUPS.Meta;
  return {
    strongAgainst: row.strong,
    weakAgainst: row.weak,
  };
}
