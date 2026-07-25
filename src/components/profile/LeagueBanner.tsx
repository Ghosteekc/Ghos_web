import { useState } from "react";
import { Trophy } from "lucide-react";
import type { LeagueInfo } from "@/types";
import { formatNumber } from "@/utils";

/** Current Jul–Aug 2026 Ranked gate; API usually overrides this. */
export const DEFAULT_LEAGUE_UNLOCK_TROPHIES = 13_000;
const ENTRY_LEAGUE_NAME = "Мастер I";
const ENTRY_LEAGUE_ICON = "https://royaleapi.github.io/cr-api-assets/arenas/league4.png";

export function lockedLeagueFallback(unlockTrophies = DEFAULT_LEAGUE_UNLOCK_TROPHIES): LeagueInfo {
  return {
    unlocked: false,
    unlock_trophies: unlockTrophies,
    current_league_number: null,
    current_league_name: null,
    current_league_icon: null,
    best_league_number: null,
    best_league_name: null,
    best_league_icon: null,
    is_absolute_champion: false,
    absolute_trophies: null,
  };
}

/** Cups below gate → unlock text; cups at/above gate (or API unlocked) → league strip. */
export function resolveLeagueInfo(
  league: LeagueInfo | null | undefined,
  trophies: number | null | undefined,
): LeagueInfo {
  const unlock = league?.unlock_trophies ?? DEFAULT_LEAGUE_UNLOCK_TROPHIES;
  const cups = trophies ?? 0;
  const hasLeagueNums =
    league?.current_league_number != null || league?.best_league_number != null;
  const unlocked = Boolean(league?.unlocked) || cups >= unlock || hasLeagueNums;

  if (!unlocked) {
    return lockedLeagueFallback(unlock);
  }

  if (league && (league.current_league_name || league.best_league_name || league.is_absolute_champion)) {
    return { ...league, unlocked: true };
  }

  return {
    unlocked: true,
    unlock_trophies: unlock,
    current_league_number: league?.current_league_number ?? 4,
    current_league_name: league?.current_league_name ?? ENTRY_LEAGUE_NAME,
    current_league_icon: league?.current_league_icon ?? ENTRY_LEAGUE_ICON,
    best_league_number: league?.best_league_number ?? 4,
    best_league_name: league?.best_league_name ?? ENTRY_LEAGUE_NAME,
    best_league_icon: league?.best_league_icon ?? ENTRY_LEAGUE_ICON,
    is_absolute_champion: false,
    absolute_trophies: null,
  };
}

interface LeagueBannerProps {
  league: LeagueInfo;
}

function LeagueIcon({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="w-10 h-10 shrink-0 rounded-lg bg-cr-surface border border-cr-border flex items-center justify-center">
        <Trophy className="w-5 h-5 text-cr-gold" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-10 h-10 shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function LeagueSide({
  label,
  name,
  icon,
  align = "left",
}: {
  label: string;
  name: string;
  icon: string | null;
  align?: "left" | "right";
}) {
  return (
    <div
      className={
        "flex items-center gap-2.5 min-w-0 flex-1 " +
        (align === "right" ? "justify-end text-right" : "")
      }
    >
      {align === "left" ? <LeagueIcon src={icon} alt={name} /> : null}
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-cr-muted font-semibold">{label}</p>
        <p className="text-sm font-bold text-cr-text truncate">{name}</p>
      </div>
      {align === "right" ? <LeagueIcon src={icon} alt={name} /> : null}
    </div>
  );
}

export function LeagueBanner({ league }: LeagueBannerProps) {
  if (!league.unlocked) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 shrink-0 rounded-lg bg-cr-surface border border-cr-border flex items-center justify-center">
          <Trophy className="w-5 h-5 text-cr-muted" />
        </div>
        <p className="text-sm text-cr-muted font-medium leading-snug">
          Лига открывается с{" "}
          <span className="text-cr-text font-bold tabular-nums">
            {formatNumber(league.unlock_trophies)}
          </span>{" "}
          кубков
        </p>
      </div>
    );
  }

  if (league.is_absolute_champion) {
    const name = league.current_league_name ?? "Абсолютный чемпион";
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <LeagueIcon src={league.current_league_icon} alt={name} />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-cr-muted font-semibold">Текущая лига</p>
            <p className="text-sm font-bold text-cr-text truncate">{name}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] uppercase tracking-wide text-violet-400 font-semibold">Кубки лиги</p>
          <p className="text-lg font-extrabold tabular-nums text-violet-400 leading-none mt-0.5">
            {formatNumber(league.absolute_trophies ?? 0)}
          </p>
        </div>
      </div>
    );
  }

  const bestName = league.best_league_name ?? league.current_league_name ?? "—";
  const bestIcon = league.best_league_icon ?? league.current_league_icon;
  const currentName = league.current_league_name ?? "—";

  return (
    <div className="flex items-center gap-2">
      <LeagueSide label="Лучшая" name={bestName} icon={bestIcon} />
      <div className="w-px self-stretch bg-cr-border shrink-0" aria-hidden />
      <LeagueSide label="Текущая" name={currentName} icon={league.current_league_icon} align="right" />
    </div>
  );
}
