import { ChevronRight, Trophy, Swords, Flame } from "lucide-react";
import { ElixirIcon, Card } from "@/components/ui";
import { CircularProgress } from "@/components/ui/Progress";
import { UI } from "@/constants/labels";
import type { Profile, StatsOverview } from "@/types";
import { formatNumber, getTrophyChangeColor, cn } from "@/utils";

interface HomeStatsCardProps {
  stats: StatsOverview;
  profile: Profile;
  onOpenAnalytics: () => void;
}

function formatAvgTime(seconds?: number): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function HomeStatsCard({ stats, profile, onOpenAnalytics }: HomeStatsCardProps) {
  const total = stats.total_battles || stats.wins + stats.losses;
  const dailyTrophies = profile.daily_trophy_change;

  return (
    <Card className="cursor-pointer group" onClick={onOpenAnalytics}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-cr-text">Статистика</h3>
        <div className="flex items-center gap-1 text-xs text-cr-muted group-hover:text-cr-gold transition-colors">
          <span>Подробная аналитика</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <CircularProgress
          value={stats.winrate}
          size={96}
          strokeWidth={6}
          label={`${stats.winrate.toFixed(1)}%`}
          sublabel={UI.winrate}
          color={stats.winrate >= 50 ? "#22c55e" : "#ef4444"}
        />

        <div className="flex-1 w-full grid grid-cols-2 gap-3">
          <StatChip icon={Swords} label="Всего боёв" value={String(total)} />
          <StatChip icon={Trophy} label="Победы" value={String(stats.wins)} valueClass="text-cr-win" />
          <StatChip icon={Flame} label="Поражения" value={String(stats.losses)} valueClass="text-cr-loss" />
          <StatChip
            icon={Trophy}
            label="Трофеи"
            value={profile.trophies != null ? formatNumber(profile.trophies) : "—"}
            valueClass="text-cr-gold"
          />
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-cr-bg/50">
            <ElixirIcon size={22} />
            <div className="min-w-0">
              <p className="text-[11px] text-cr-muted">Ср. эликсир</p>
              <p className="text-sm font-bold text-cr-text">
                {stats.avg_elixir > 0 ? stats.avg_elixir.toFixed(1) : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-cr-bg/50">
            <div className="min-w-0">
              <p className="text-[11px] text-cr-muted">Ср. время боя</p>
              <p className="text-sm font-bold text-cr-text">{formatAvgTime(stats.avg_time)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-cr-border flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-cr-muted">
          {stats.wins} побед и {stats.losses} поражений в последних боях
        </p>
        {dailyTrophies != null && (
          <p className={cn("text-xs font-semibold", getTrophyChangeColor(dailyTrophies))}>
            Кубки за сегодня: {dailyTrophies > 0 ? "+" : ""}{dailyTrophies}
          </p>
        )}
      </div>
    </Card>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: typeof Swords;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-cr-bg/50">
      <Icon className="w-5 h-5 text-cr-blue shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-cr-muted">{label}</p>
        <p className={cn("text-sm font-bold text-cr-text", valueClass)}>{value}</p>
      </div>
    </div>
  );
}

export { HomeStatsCard as default };
