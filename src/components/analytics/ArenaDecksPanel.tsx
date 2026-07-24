import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "@/api/client";
import { cacheGet, cacheHas } from "@/api/cache";
import { Card, Button, Loader } from "@/components/ui";
import type { ArenaDecksData, Deck } from "@/types";

const ARENA_DECKS_CACHE = "arena-decks-v7";

function formatArenaSubtitle(arenaName: string, trophies: number, source?: string): string {
  const base =
    arenaName && trophies > 0 && !arenaName.replace(/\s/g, "").includes(String(trophies))
      ? `${arenaName} · ${trophies.toLocaleString("ru-RU")} 🏆`
      : arenaName || (trophies > 0 ? `${trophies.toLocaleString("ru-RU")} 🏆` : "Ваша арена");
  if (source === "tv_royale" || source === "tv_royale_arena") {
    return `${base} · колоды игроков TV Royale на вашей арене`;
  }
  return base;
}

export function buildArenaComparePath(deck: Deck): string {
  const names = deck.cards.map((c) => c.name);
  if (names.length !== 8) return "";
  const ref = names.map(encodeURIComponent).join("|");
  const name = encodeURIComponent(deck.name ?? "Колода");
  return `/decks/compare?ref=${ref}&name=${name}&from=arena`;
}

type ArenaDecksPanelProps = {
  renderDeck: (deck: Deck, index: number, onCompare: () => void) => ReactNode;
};

export function ArenaDecksPanel({ renderDeck }: ArenaDecksPanelProps) {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>(() => cacheGet<ArenaDecksData>(ARENA_DECKS_CACHE)?.decks ?? []);
  const [arenaName, setArenaName] = useState(
    () => cacheGet<ArenaDecksData>(ARENA_DECKS_CACHE)?.arena_name ?? "",
  );
  const [trophies, setTrophies] = useState(() => cacheGet<ArenaDecksData>(ARENA_DECKS_CACHE)?.trophies ?? 0);
  const [source, setSource] = useState(() => cacheGet<ArenaDecksData>(ARENA_DECKS_CACHE)?.source ?? "");
  const [loading, setLoading] = useState(() => !cacheHas(ARENA_DECKS_CACHE));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const hasCache = cacheHas(ARENA_DECKS_CACHE);
    if (!hasCache) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await api.getArenaDecks();
      const liveDecks = (data.decks ?? []).filter((d) => (d.cards?.length ?? 0) === 8);
      setDecks(liveDecks);
      setArenaName(data.arena_name ?? "");
      setTrophies(data.trophies ?? 0);
      setSource(data.source ?? "");
    } catch (e) {
      if (!hasCache) {
        setDecks([]);
      }
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить колоды арены");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loader />;

  if (error) {
    return (
      <Card className="text-center space-y-3">
        <p className="text-cr-loss text-sm">{error}</p>
        <Button onClick={() => void load()}>Попробовать снова</Button>
      </Card>
    );
  }

  if (!decks.length) {
    return (
      <Card className="text-center">
        <p className="text-cr-muted">Нет колод TV Royale для вашей арены</p>
        <p className="text-xs text-cr-muted mt-1">
          Не удалось найти игроков с той же ареной в рейтинге. Попробуйте обновить позже.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-cr-muted text-center">{formatArenaSubtitle(arenaName, trophies, source)}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full overflow-x-hidden">
        {decks.map((deck, i) => (
          <div key={`${deck.id}-${deck.name}`} className="w-full">
            {renderDeck(deck, i, () => {
              const path = buildArenaComparePath(deck);
              if (path) navigate(path);
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export { ARENA_DECKS_CACHE };
