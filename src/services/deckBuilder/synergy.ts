import {
  KNOWN_SYNERGY,
  SYNERGY_PARTIAL,
  SYNERGY_STRONG,
  SYNERGY_WEAK,
} from "./constants";
import { cardRoles, getCardMeta, getSynergyPairScore } from "./database";

const SPIRIT_CARDS = new Set([
  "Ice Spirit",
  "Fire Spirit",
  "Electro Spirit",
  "Heal Spirit",
]);

function isSpiritCard(name: string): boolean {
  return SPIRIT_CARDS.has(name);
}

function isSpellCard(name: string): boolean {
  const roles = cardRoles(name);
  return roles.has("spell") || roles.has("small_spell") || roles.has("big_spell");
}

function isBuildingCard(name: string): boolean {
  const meta = getCardMeta(name);
  return meta?.type === "building" || cardRoles(name).has("building");
}

/** Полезная карта (юнит), с которой показываем синергию — не дух, не здание, не заклинание. */
function isUsefulTroopForSynergy(name: string): boolean {
  if (isSpiritCard(name) || isSpellCard(name) || isBuildingCard(name)) return false;
  return getCardMeta(name)?.type === "troop";
}

/** Синергия только между заклинанием и полезным юнитом (Hog + Earthquake, P.E.K.K.A + Zap). */
export function isValidSynergyPair(a: string, b: string): boolean {
  const aSpell = isSpellCard(a);
  const bSpell = isSpellCard(b);
  if (aSpell === bSpell) return false;
  const troop = aSpell ? b : a;
  return isUsefulTroopForSynergy(troop);
}

export function pairSynergy(a: string, b: string): number {
  if (!isValidSynergyPair(a, b)) return SYNERGY_WEAK;
  const sorted = [a, b].sort();
  const key = `${sorted[0]}|${sorted[1]}`;
  if (KNOWN_SYNERGY[key]) return KNOWN_SYNERGY[key];
  const fromDb = getSynergyPairScore(a, b);
  if (fromDb !== undefined) return fromDb;
  return SYNERGY_WEAK;
}

export function deckSynergyScore(cards: string[]): number {
  if (cards.length < 2) return 50;
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (!isValidSynergyPair(cards[i], cards[j])) continue;
      const s = pairSynergy(cards[i], cards[j]);
      total += s >= SYNERGY_STRONG ? s : s >= SYNERGY_PARTIAL ? s : SYNERGY_WEAK;
      pairs++;
    }
  }
  if (pairs === 0) return 50;
  return Math.round((total / pairs) * 10) / 10;
}

export function synergyNotes(cards: string[], limit = 4): string[] {
  const notes: string[] = [];
  for (let i = 0; i < cards.length && notes.length < limit; i++) {
    for (let j = i + 1; j < cards.length && notes.length < limit; j++) {
      if (!isValidSynergyPair(cards[i], cards[j])) continue;
      const s = pairSynergy(cards[i], cards[j]);
      if (s >= SYNERGY_STRONG) {
        notes.push(`${cards[i]} + ${cards[j]}`);
      }
    }
  }
  return notes;
}
