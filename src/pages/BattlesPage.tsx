import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  RefreshCw,
} from "lucide-react";
import { Card, Button, Loader, ScrollToTopButton, ErrorState, EmptyState } from "@/components/ui";
import { BattleCardSimple } from "@/components/battles/BattleCard";
import { api, ApiError } from "@/api/client";
import { BattleSummary } from "@/types";
import { battleDetailPath, cn } from "@/utils";
import { usePageRefresh } from "@/hooks";

export function BattlesPage() {
  const navigate = useNavigate();
  const [battles, setBattles] = useState<BattleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "wins" | "losses">("all");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getBattles();
      setBattles(res.battles ?? []);
    } catch (e) {
      setBattles([]);
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки боёв");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await api.syncData();
      const res = await api.getBattles();
      setBattles(res.battles ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось синхронизировать");
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = useMemo(
    () =>
      battles.filter((b) => {
        if (filter === "wins") return b.won;
        if (filter === "losses") return !b.won;
        return true;
      }),
    [battles, filter],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">История боёв</h1>
        <Button variant="ghost" onClick={() => void onRefresh()} className="!p-2" disabled={refreshing} aria-label="Синхронизировать">
          <RefreshCw className={"w-5 h-5 " + (refreshing ? "animate-spin" : "")} />
        </Button>
      </div>

      <p className="wallpaper-plain-text text-xs -mt-4">Кнопка обновления подтягивает свежие бои из Clash Royale</p>

      <div className="filter-tab-row">
        {(["all", "wins", "losses"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn("filter-tab", filter === f && "filter-tab--active")}
            aria-pressed={filter === f}
          >
            {f === "all" ? "Все" : f === "wins" ? "Победы" : "Поражения"}
          </button>
        ))}
      </div>

      {error && <ErrorState title={error} />}

      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-4">
          {filtered.map((battle) => (
            <BattleCardSimple
              key={`${battle.timestamp}-${battle.index}`}
              summary={battle}
              onOpen={() => navigate(battleDetailPath(battle.timestamp, battle.index))}
            />
          ))}
          {filtered.length === 0 && (
            <EmptyState
              icon={<Trophy className="h-12 w-12 opacity-50" />}
              title="Бои не найдены"
            />
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && <ScrollToTopButton />}
    </div>
  );
}

export { BattlesPage as default };
