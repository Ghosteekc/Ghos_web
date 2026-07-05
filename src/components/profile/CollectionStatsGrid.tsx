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
  { key: "evolution_count", label: "Эволюции" },
  { key: "hero_count", label: "Герои" },
  { key: "champion_count", label: "Чемпионы" },
  { key: "legendary_count", label: "Легендарные" },
  { key: "epic_count", label: "Эпические" },
  { key: "rare_count", label: "Редкие" },
  { key: "common_count", label: "Обычные" },
] as const;

export function CollectionStatsGrid({ stats }: CollectionStatsGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-cr-muted uppercase tracking-wide">Уровень коллекции</p>
        <p className="text-lg font-bold text-cr-gold tabular-nums">{stats.collection_level}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {STAT_ITEMS.map(({ key, label }) => (
          <div key={key} className="rounded-xl bg-cr-bg/50 px-3 py-2">
            <p className="text-[11px] text-cr-muted">{label}</p>
            <p className="text-sm font-bold text-cr-text tabular-nums">{stats[key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export { CollectionStatsGrid as default };
