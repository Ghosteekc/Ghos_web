import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FavoritesPanel } from "@/components/decks/FavoritesPanel";
import { PageHeader } from "@/components/ui";
import { DeckPassport } from "@/analytics/deckPassport";
import type { Deck } from "@/types";
import { deckToComparePath } from "@/utils/deckActions";

export function FavoritesPage() {
  const navigate = useNavigate();
  const [passportDeck, setPassportDeck] = useState<Deck | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader title="Любимые колоды" />
      <FavoritesPanel
        onAnalyze={setPassportDeck}
        onCompare={(deck) => {
          const path = deckToComparePath(deck, "favorites");
          if (path) navigate(path);
        }}
      />
      <DeckPassport deck={passportDeck} onClose={() => setPassportDeck(null)} />
    </div>
  );
}

export { FavoritesPage as default };
