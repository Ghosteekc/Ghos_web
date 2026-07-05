interface CollectionStatsGridProps {
  stats: {
    collection_level: number;
    evolution_count: number;
    hero_count: number;
    champion_count: number;
    legendary_count: number;
    epic_count: number;
    rare_count: number;
    common_count: number;
  };
}

const STAT_ITEMS = [
  { key: "evolution_count", label: "Эволюции", tone: "collection-stat-evo" },
  { key: "hero_count", label: "Герои", tone: "collection-stat-hero" },
  { key: "champion_count", label: "Чемпионы", tone: "collection-stat-champion" },
  { key: "legendary_count", label: "Легендарные", tone: "collection-stat-legendary" },
  { key: "epic_count", label: "Эпические", tone: "collection-stat-epic" },
  { key: "rare_count", label: "Редкие", tone: "collection-stat-rare" },
  { key: "common_count", label: "Обычные", tone: "collection-stat-common" },
] as const;

export function CollectionStatsGrid({ stats }: CollectionStatsGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-cr-muted uppercase tracking-wide">Уровень коллекции</p>
        <p className="text-lg font-bold text-cr-gold tabular-nums">{stats.collection_level}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {STAT_ITEMS.map(({ key, label, tone }) => (
          <div key={key} className="rounded-xl bg-cr-bg/50 px-3 py-2">
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${tone}`}>{label}</p>
            <p className={`text-sm font-bold tabular-nums mt-0.5 ${tone}`}>{stats[key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export { CollectionStatsGrid as default };
