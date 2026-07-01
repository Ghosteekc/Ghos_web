import { cn } from "@/utils";
import { useCardCatalog } from "@/hooks/CardCatalogProvider";

type CardTileSize = "xs" | "sm" | "md" | "lg";

const sizeClasses: Record<CardTileSize, string> = {
  xs: "w-9 h-11",
  sm: "w-11 h-[3.25rem] min-w-[2.75rem]",
  md: "w-14 h-16",
  lg: "w-full aspect-square",
};

interface CardTileProps {
  name: string;
  icon?: string;
  size?: CardTileSize;
  showLabel?: boolean;
  labelOverride?: string;
  className?: string;
  badge?: string | number;
}

export function CardTile({
  name,
  icon,
  size = "md",
  showLabel = false,
  labelOverride,
  className,
  badge,
}: CardTileProps) {
  const { nameRu, iconUrl } = useCardCatalog();
  const src = icon || iconUrl(name);
  const label = labelOverride ?? nameRu(name);

  return (
    <div className={cn("flex flex-col items-center gap-1 min-w-0", className)}>
      <div
        className={cn(
          "relative rounded-lg overflow-hidden border border-cr-border/80 bg-cr-bg shadow-sm",
          sizeClasses[size],
        )}
        title={label}
      >
        {src ? (
          <img
            src={src}
            alt={label}
            className="w-full h-full object-cover object-center scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cr-blue/30 to-cr-gold/20 text-xs font-bold text-cr-text">
            {name.charAt(0)}
          </div>
        )}
        {badge != null && (
          <span className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded text-[10px] font-bold bg-cr-bg/90 text-cr-gold border border-cr-gold/30">
            {badge}
          </span>
        )}
      </div>
      {showLabel && (
        <span className="text-[10px] leading-tight text-cr-muted text-center line-clamp-2 max-w-full px-0.5">
          {label}
        </span>
      )}
    </div>
  );
}

interface CardDeckGridProps {
  cards: string[];
  icons?: string[];
  size?: CardTileSize;
  showLabels?: boolean;
  maxVisible?: number;
  className?: string;
}

export function CardDeckGrid({
  cards,
  icons,
  size = "sm",
  showLabels = false,
  maxVisible = 8,
  className,
}: CardDeckGridProps) {
  const visible = cards.slice(0, maxVisible);
  const hidden = cards.length - visible.length;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {visible.map((name, i) => (
        <CardTile
          key={`${name}-${i}`}
          name={name}
          icon={icons?.[i]}
          size={size}
          showLabel={showLabels}
        />
      ))}
      {hidden > 0 && (
        <div
          className={cn(
            "rounded-lg border border-cr-border bg-cr-surface flex items-center justify-center text-xs font-semibold text-cr-muted",
            sizeClasses[size],
          )}
        >
          +{hidden}
        </div>
      )}
    </div>
  );
}

interface CardUsageItem {
  name: string;
  count: number;
  winrate?: number;
}

export function CardUsageList({ items }: { items: CardUsageItem[] }) {
  const { nameRu } = useCardCatalog();
  const maxCount = items[0]?.count ?? 1;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="text-xs text-cr-muted w-5 shrink-0">#{i + 1}</span>
          <CardTile name={item.name} size="sm" showLabel />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="text-sm font-medium text-cr-text truncate">{nameRu(item.name)}</span>
              <span className="text-xs text-cr-muted shrink-0">
                {item.count} игр
                {item.winrate != null ? ` · ${item.winrate.toFixed(1)}%` : ""}
              </span>
            </div>
            <div className="h-1.5 bg-cr-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cr-blue to-cr-gold"
                style={{ width: `${Math.min((item.count / maxCount) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardUsageGrid({ items }: { items: CardUsageItem[] }) {
  const maxCount = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.name}
          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-cr-bg/50 border border-cr-border"
        >
          <CardTile name={item.name} size="md" badge={item.count} />
          <p className="text-xs font-medium text-cr-text text-center line-clamp-2">
            <CardNameRu name={item.name} />
          </p>
          <div className="w-full h-1.5 bg-cr-border rounded-full overflow-hidden">
            <div
              className="h-full bg-cr-gold rounded-full"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
          {item.winrate != null && (
            <p className="text-[10px] text-cr-muted">WR {item.winrate.toFixed(1)}%</p>
          )}
        </div>
      ))}
    </div>
  );
}

function CardNameRu({ name }: { name: string }) {
  const { nameRu } = useCardCatalog();
  return <>{nameRu(name)}</>;
}
