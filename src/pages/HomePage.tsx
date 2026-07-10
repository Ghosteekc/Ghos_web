import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "@/api/client";
import { BattleSummary, Profile, StatsOverview } from "@/types";
import { usePageRefresh } from "@/hooks";
import { PlayerCard, HomeServicePanel, SupercellDisclaimer } from "@/components/home";
import { Card, Button, Loader } from "@/components/ui";
import { BattleCardSimple } from "@/components/battles/BattleCard";
import { battleDetailPath } from "@/utils";
import { cacheHas } from "@/api/cache";

export function HomePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lastBattle, setLastBattle] = useState<BattleSummary | null>(null);
  const [todayStats, setTodayStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(() => !cacheHas("home"));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getHome();
      setProfile(data.profile);
      setLastBattle(data.battles[0] ?? null);
      setTodayStats(data.stats);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
    api.prefetchDeckTabs();
  }, [load]);

  if (loading) {
    return <Loader />;
  }

  if (error || !profile) {
    return (
      <Card className="text-center">
        <p className="text-cr-loss mb-2">{error ?? "Ошибка загрузки"}</p>
        <p className="text-xs text-cr-muted mb-4">
          Нет связи с сервером. Потяните вниз для обновления.
        </p>
        <Button onClick={() => void load()}>Повторить</Button>
      </Card>
    );
  }

  const todayRow = todayStats?.winrate_by_day?.slice(-1)[0];

  return (
    <div className="space-y-6">
      <PlayerCard profile={profile} />

      {todayRow && todayRow.wins + todayRow.losses > 0 && (
        <Card className="border-cr-blue/20">
          <p className="text-xs text-cr-muted uppercase tracking-wide mb-2">Сегодня</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-cr-text">
              {todayRow.wins}П / {todayRow.losses}П
            </span>
            <span className={`font-bold ${todayRow.winrate >= 50 ? "text-cr-win" : "text-cr-loss"}`}>
              WR {todayRow.winrate.toFixed(0)}%
            </span>
          </div>
        </Card>
      )}

      {lastBattle && (
        <div>
          <h3 className="text-sm font-semibold text-cr-text mb-3 px-1">Последний бой</h3>
          <BattleCardSimple
            summary={lastBattle}
            index={0}
            onOpen={() => navigate(battleDetailPath(lastBattle.timestamp, lastBattle.index))}
          />
        </div>
      )}

      <HomeServicePanel profile={profile} onNavigate={navigate} />
      <SupercellDisclaimer />
    </div>
  );
}

export { HomePage as default };
