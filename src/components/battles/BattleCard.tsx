import {
  Trophy,
  ChevronRight,
  Flame,
} from "lucide-react";
import { formatTime, getTrophyChangeColor, cn, formatBattlePlayedAt, formatOpponentHeadline } from "@/utils";
import { BattleSummary } from "@/types";
import { Card, ElixirIcon } from "@/components/ui";
import { PlayerDeckGrid } from "@/components/cards";

interface BattleCardSimpleProps {
  summary: BattleSummary;
  onOpen: () => void;
  index: number;
}

export function BattleCardSimple({ summary, onOpen, index }: BattleCardSimpleProps) {
  const opponent = formatOpponentHeadline(summary.opponent_name, summary.opponent_tag);

  return (
    <Card delay={index * 0.04} className="cursor-pointer relative overflow-hidden" onClick={onOpen}>
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          summary.won ? "bg-cr-win" : "bg-cr-loss",
        )}
      />
      <div className="pl-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {summary.won ? (
              <Trophy className="w-5 h-5 text-cr-win" />
            ) : (
              <Flame className="w-5 h-5 text-cr-loss" />
            )}
            <span className={cn("font-semibold text-sm", summary.won ? "text-cr-win" : "text-cr-loss")}>
              {summary.won ? "Победа" : "Поражение"}
            </span>
          </div>
          <span className={cn("text-sm font-bold", getTrophyChangeColor(summary.trophy_change))}>
            {summary.trophy_change >= 0 ? "+" : ""}{summary.trophy_change} 🏆
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-cr-text">против {opponent.title}</p>
            {opponent.tagLine ? (
              <p className="text-xs text-cr-muted">{opponent.tagLine}</p>
            ) : null}
          </div>
          <div className="text-right">
            {formatBattlePlayedAt(summary.timestamp, summary.played_at) ? (
              <p className="text-xs font-semibold text-cr-accent">
                {formatBattlePlayedAt(summary.timestamp, summary.played_at)}
              </p>
            ) : null}
            {(summary.duration ?? 0) > 0 ? (
              <p className="text-xs text-cr-muted">{formatTime(summary.duration)}</p>
            ) : null}
            <p className="text-xs text-cr-muted flex items-center gap-1 justify-end">
              <ElixirIcon size={12} />
              {(summary.avg_elixir ?? 0).toFixed(1)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex-1 min-w-0">
            <PlayerDeckGrid
              cards={summary.user_deck_cards?.length ? summary.user_deck_cards : summary.user_deck}
              size="xs"
            />
          </div>
          <span
            className="shrink-0 px-0.5 text-[10px] sm:text-xs font-cr font-extrabold tracking-wide text-cr-gold"
            aria-hidden
          >
            VS
          </span>
          <div className="flex-1 min-w-0">
            <PlayerDeckGrid
              cards={
                summary.opponent_deck_cards?.length
                  ? summary.opponent_deck_cards
                  : summary.opponent_deck
              }
              size="xs"
            />
          </div>
          <div className="text-cr-muted shrink-0 pl-0.5">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>

        {summary.top_reason ? (
          <p className="text-xs text-cr-muted mt-3 leading-snug line-clamp-2">{summary.top_reason}</p>
        ) : null}
      </div>
    </Card>
  );
}
