import { cn } from "@/utils";

export interface CardLevelRow {
  level: number;
  count: number;
}

interface CardLevelScaleProps {
  rows: CardLevelRow[];
  className?: string;
}

export function CardLevelScale({ rows, className }: CardLevelScaleProps) {
  if (rows.length === 0) {
    return <p className="text-xs text-cr-muted">Нет прокачанных карт</p>;
  }

  const maxCount = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className={cn("space-y-1.5", className)}>
      {rows.map((row) => {
        const width = Math.max(6, Math.round((row.count / maxCount) * 100));
        return (
          <div key={row.level} className="grid grid-cols-[2.5rem_1fr_2.75rem] items-center gap-2 text-xs">
            <span className="text-cr-muted font-semibold tabular-nums">{row.level}</span>
            <div className="h-2 rounded-full bg-cr-bg/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cr-blue to-cr-gold"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="text-cr-text font-semibold tabular-nums text-right">{row.count}</span>
          </div>
        );
      })}
    </div>
  );
}

export { CardLevelScale as default };
