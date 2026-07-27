import { memo, useMemo } from "react";
import {
  Trophy,
  ChevronRight,
  Flame,
} from "lucide-react";
import { formatTime, getTrophyChangeColor, cn, formatBattlePlayedAt, formatOpponentHeadline } from "@/utils";
import type { BattleSummary, DeckCard } from "@/types";
import { Card, ElixirIcon } from "@/components/ui";
import { toDeckCards } from "@/components/cards/PlayerDeckGrid";
import { useCardCatalog } from "@/hooks/CardCatalogProvider";

interface BattleCardSimpleProps {
  summary: BattleSummary;
  onOpen: () => void;
}

/** Lightweight 4×2 deck for battle list — plain images, no CardTile tree. */
function LightBattleDeckStrip({
  cards,
}: {
  cards: Array<DeckCard | string> | null | undefined;
}) {
  const { iconUrl } = useCardCatalog();
  const items = useMemo(() => toDeckCards(cards).slice(0, 8), [cards]);

  return (
    <div className="battle-light-deck grid grid-cols-4 gap-0.5">
      {items.map((card, index) => {
        const src = card.icon || iconUrl(card.name) || "";
        const evo = (card.evolution_level ?? 0) >= 1 && !card.is_hero;
        const hero = Boolean(card.is_hero);
        return (
          <div
            key={`${card.id}-${index}`}
            className={cn(
              "battle-light-deck-slot relative aspect-[4/5] overflow-hidden rounded-[0.2rem] bg-cr-bg/40",
              evo && "battle-light-deck-slot--evo",
              hero && "battle-light-deck-slot--hero",
            )}
          >
            {src ? (
              <img
                src={src}
                alt=""
                width={40}
                height={50}
                className="h-full w-full object-contain"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            ) : (
              <span className="flex h-full items-center justify-center text-[8px] font-bold text-cr-muted">
                {card.name.charAt(0)}
              </span>
            )}
            {card.level != null && card.level > 0 ? (
              <span
                className="battle-light-deck-level card-level-chip pointer-events-none absolute left-0 top-0 z-10"
                aria-hidden
              >
                {card.level}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

const LightBattleDeckStripMemo = memo(LightBattleDeckStrip);

function BattleCardSimpleInner({ summary, onOpen }: BattleCardSimpleProps) {
  const opponent = useMemo(
    () => formatOpponentHeadline(summary.opponent_name, summary.opponent_tag),
    [summary.opponent_name, summary.opponent_tag],
  );
  const playedAt = useMemo(
    () => formatBattlePlayedAt(summary.timestamp, summary.played_at),
    [summary.timestamp, summary.played_at],
  );
  const userCards = summary.user_deck_cards?.length
    ? summary.user_deck_cards
    : summary.user_deck;
  const opponentCards = summary.opponent_deck_cards?.length
    ? summary.opponent_deck_cards
    : summary.opponent_deck;

  return (
    <Card
      noMotion
      className="battle-history-card cursor-pointer relative overflow-hidden !shadow-none"
      onClick={onOpen}
    >
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          summary.won ? "bg-cr-win" : "bg-cr-loss",
        )}
      />
      <div className="pl-4">
        <div className="flex items-center justify-between mb-2">
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

        <div className="flex items-center justify-between mb-2">
          <div className="min-w-0 pr-2">
            <p className="text-sm font-medium text-cr-text truncate">против {opponent.title}</p>
            {opponent.tagLine ? (
              <p className="text-xs text-cr-muted truncate">{opponent.tagLine}</p>
            ) : null}
          </div>
          <div className="text-right shrink-0">
            {playedAt ? (
              <p className="text-xs font-semibold text-cr-accent">{playedAt}</p>
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
            <LightBattleDeckStripMemo cards={userCards} />
          </div>
          <span
            className="shrink-0 px-0.5 text-[10px] sm:text-xs font-cr font-extrabold tracking-wide text-cr-gold"
            aria-hidden
          >
            VS
          </span>
          <div className="flex-1 min-w-0">
            <LightBattleDeckStripMemo cards={opponentCards} />
          </div>
          <div className="text-cr-muted shrink-0 pl-0.5">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>

        {summary.top_reason ? (
          <p className="text-xs text-cr-muted mt-2 leading-snug line-clamp-2">{summary.top_reason}</p>
        ) : null}
      </div>
    </Card>
  );
}

export const BattleCardSimple = memo(BattleCardSimpleInner);
