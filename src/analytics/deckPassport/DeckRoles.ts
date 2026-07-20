import { ROLE_BALANCE_CHECKS } from "./constants/roles";
import { cardRoles } from "@/services/deckBuilder/database";
import { isWinCard } from "@/services/deckBuilder/balance";

export interface RoleBalanceEntry {
  id: string;
  label: string;
  present: boolean;
}

export function evaluateRoleBalance(cardNames: string[]): RoleBalanceEntry[] {
  const nameSet = new Set(cardNames);

  return ROLE_BALANCE_CHECKS.map((check) => {
    let present = cardNames.some((name) => {
      const roles = cardRoles(name);
      return check.roles.some((r) => roles.has(r));
    });

    if (!present && check.id === "win_condition") {
      present = cardNames.some(isWinCard);
    }

    if (!present && check.cards) {
      present = check.cards.some((c) => nameSet.has(c));
    }

    return { id: check.id, label: check.label, present };
  });
}
