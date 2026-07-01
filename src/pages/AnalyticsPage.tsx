import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { TrendingUp, Flame, Target, Clock } from "lucide-react";
import { StatsOverview } from "@/types";
import { Card, Loader, Skeleton } from "@/components/ui";
import { api } from "@/api/client";
import { usePageRefresh } from "@/hooks";

const COLORS = ["#fbbf24", "#60a5fa", "#22c55e", "#ef4444", "#8b5cf6", "#ec4899"];

export function AnalyticsPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getStats();
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  const lastResults = useMemo(
    () =>
      (stats?.last_results ?? []).slice(-14).map((r, i) => ({
        name: `Бой ${i + 1}`,
        rate: r.trophy_change,
        won: r.won,
      })),
    [stats?.last_results],
  );

  const winrateByDay = useMemo(() => stats?.winrate_by_day ?? [], [stats?.winrate_by_day]);
  const mostUsedCards = useMemo(() => stats?.most_used_cards ?? [], [stats?.most_used_cards]);
  const archetypes = useMemo(() => stats?.archetypes ?? [], [stats?.archetypes]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Loader />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-[220px]">
            <Skeleton className="h-full w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="text-center">
        <p className="text-cr-loss mb-2">{error ?? "Нет данных"}</p>
        <button type="button" onClick={() => void load()} className="text-cr-gold text-sm">
          Повторить
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Аналитика</h1>
        <p className="text-sm text-cr-muted mt-1">Подробная статистика по вашим боям</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Всего боёв", value: stats.total_battles, icon: Flame, color: "text-cr-gold" },
          { label: "Победы", value: stats.wins, icon: TrendingUp, color: "text-cr-win" },
          { label: "Поражения", value: stats.losses, icon: Target, color: "text-cr-loss" },
          { label: "Винрейт", value: `${stats.winrate.toFixed(1)}%`, icon: Clock, color: "text-cr-blue" },
        ].map((item, i) => (
          <Card key={i} className="text-center">
            <item.icon className={"w-6 h-6 mx-auto mb-2 " + item.color} />
            <p className="text-2xl font-bold text-cr-text">{item.value}</p>
            <p className="text-xs text-cr-muted">{item.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h3 className="text-sm font-semibold text-cr-text mb-4">Рост трофеев</h3>
          <div className="h-[220px]">
            {lastResults.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lastResults}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#181830", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    itemStyle={{ color: "#f3f4f6" }}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#fbbf24" strokeWidth={3} dot={{ fill: "#fbbf24", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-cr-muted text-sm text-center pt-16">Недостаточно боёв</p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-cr-text mb-4">Winrate по дням</h3>
          <div className="h-[220px]">
            {winrateByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={winrateByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#181830", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  />
                  <Bar dataKey="wins" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="losses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-cr-muted text-sm text-center pt-16">Нет данных по дням</p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-cr-text mb-4">Любимые карты</h3>
          <div className="h-[280px]">
            {mostUsedCards.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mostUsedCards.slice(0, 6)}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                  >
                    {mostUsedCards.slice(0, 6).map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#181830", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-cr-muted text-sm text-center pt-24">Нет данных по картам</p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-cr-text mb-4">Сводка</h3>
          <div className="h-[280px]">
            {archetypes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={archetypes}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <PolarRadiusAxis stroke="#9ca3af" fontSize={12} />
                  <Radar name="Значение" dataKey="value" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-cr-muted text-sm text-center pt-24">Нет данных</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export { AnalyticsPage as default };
