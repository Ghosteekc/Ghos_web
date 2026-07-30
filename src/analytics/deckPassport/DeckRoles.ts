import { ROLE_BALANCE_CHECKS } from "./constants/roles";
import { cardHasRole } from "@/services/deckBuilder/database";
import { isWinCard } from "@/services/deckBuilder/balance";
import type { DeckIntent } from "./DeckIntent";

export interface RoleBalanceEntry {
  id: string;
  label: string;
  present: boolean;
}

/**
 * Баланс ролей относительно DeckIntent.requiredRoleIds.
 * Каждая карта проверяется по всем roles[] (не только primary).
 */
export function evaluateRoleBalance(
  cardNames: string[],
  intent?: DeckIntent,
): RoleBalanceEntry[] {
  const nameSet = new Set(cardNames);
  const required = intent?.requiredRoleIds;

  const checks = required
    ? ROLE_BALANCE_CHECKS.filter((check) => required.has(check.id))
    : ROLE_BALANCE_CHECKS;

  return checks.map((check) => {
    let present = cardNames.some((name) =>
      check.roles.some((r) => cardHasRole(name, r)),
    );

    if (!present && check.id === "win_condition") {
      present = cardNames.some(isWinCard);
    }

    if (!present && check.cards) {
      present = check.cards.some((c) => nameSet.has(c));
    }

    return { id: check.id, label: check.label, present };
  });
}
