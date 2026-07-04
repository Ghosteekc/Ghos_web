import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, Button, Loader } from "@/components/ui";
import { CardTile } from "@/components/cards";
import { usePlayerCollection } from "@/hooks/usePlayerCollection";
import { usePageRefresh } from "@/hooks";

export function ProfileCardsPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = usePlayerCollection();
  const [showLockedCards, setShowLockedCards] = useState(true);

  usePageRefresh(reload);

  if (loading) return <Loader />;

  if (error || !data) {
    return (
      <div className="space-y-4">
        <PageHeader title="Коллекция карт" onBack={() => navigate("/profile")} />
        <Card className="text-center space-y-3">
          <p className="text-cr-loss text-sm">{error ?? "Нет данных"}</p>
          <Button onClick={() => void reload()}>Повторить</Button>
        </Card>
      </div>
    );
  }

  const visibleCards = showLockedCards ? data.cards : data.cards.filter((c) => c.owned);

  return (
    <div className="space-y-4">
      <PageHeader title="Коллекция карт" onBack={() => navigate("/profile")} />

      <Card>
        <div className="flex items-center justify-between gap-2 mb-4">
          <p className="text-sm text-cr-text font-semibold">
            {data.cards_owned} / {data.cards_total} карт
          </p>
          <button
            type="button"
            className="text-xs text-cr-accent underline"
            onClick={() => setShowLockedCards((v) => !v)}
          >
            {showLockedCards ? "Только мои" : "Показать все"}
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {visibleCards.map((card) => (
            <div
              key={card.name}
              className={cnCardCell(card.owned)}
              title={card.name_ru}
            >
              <CardTile
                name={card.name}
                icon={card.icon}
                iconBase={card.icon_base}
                iconEvo={card.icon_evo}
                iconHero={card.icon_hero}
                displayMode={card.display_mode}
                size="collection"
                levelBadge={card.owned && card.level != null && card.level > 0 ? card.level : undefined}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function cnCardCell(owned: boolean) {
  return owned ? "min-w-0" : "min-w-0 opacity-45 grayscale";
}

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" onClick={onBack} className="!p-2 shrink-0">
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <h1 className="page-title !mb-0">{title}</h1>
    </div>
  );
}

export { ProfileCardsPage as default };
