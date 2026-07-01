import { useCallback, useEffect, useState } from "react";
import { Star, ExternalLink } from "lucide-react";
import { Card, Button, Loader } from "@/components/ui";
import { CardDeckGrid } from "@/components/cards";
import { api, ApiError } from "@/api/client";
import { usePageRefresh, useTelegram } from "@/hooks";

interface FavoriteEntry {
  cards: string[];
  deck_link?: string | null;
}

export function FavoritesPage() {
  const { openLink } = useTelegram();
  const [entries, setEntries] = useState<FavoriteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getFavorites();
      setEntries(res.entries ?? res.decks.map((deck) => ({ cards: deck })));
    } catch (e) {
      setEntries([]);
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <h1 className="page-title">Любимые колоды</h1>

      {error && <Card className="text-center text-cr-loss text-sm">{error}</Card>}

      {entries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((entry, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-cr-gold shrink-0" />
                  <p className="text-sm font-medium text-cr-text">Колода #{i + 1}</p>
                </div>
                {entry.deck_link && (
                  <Button
                    variant="ghost"
                    className="!p-2 shrink-0"
                    onClick={() => openLink(entry.deck_link!)}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <CardDeckGrid cards={entry.cards} size="sm" showLabels maxVisible={8} />
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center">
          <Star className="w-12 h-12 text-cr-muted mx-auto mb-3 opacity-50" />
          <p className="text-cr-muted">Нет избранных колод</p>
          <p className="text-xs text-cr-muted mt-1">Добавляйте колоды из раздела «Колоды»</p>
        </Card>
      )}
    </div>
  );
}

export { FavoritesPage as default };
