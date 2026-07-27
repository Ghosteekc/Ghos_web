import type { LucideIcon } from "lucide-react";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Crown,
  Swords,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ui";
import { Profile } from "@/types";
import { formatFullNumber, getWinColor, getTrophyChangeColor } from "@/utils";
import { UI } from "@/constants/labels";

interface ProfileStatGridProps {
  profile: Profile;
}

interface StatItem {
  label: string;
  value: string;
  valueClass: string;
  icon: LucideIcon;
  iconClass: string;
}

export function ProfileStatGrid({ profile }: ProfileStatGridProps) {
  const dailyTrophies = profile.daily_trophy_change;
  const dailyUp = dailyTrophies != null && dailyTrophies >= 0;

  const items: StatItem[] = [
    {
      label: "Кубки за день",
      value:
        dailyTrophies != null
          ? `${dailyTrophies > 0 ? "+" : ""}${dailyTrophies}`
          : "—",
      valueClass: getTrophyChangeColor(dailyTrophies ?? 0),
      icon: dailyUp ? TrendingUp : TrendingDown,
      iconClass: dailyUp ? "text-cr-win" : "text-cr-loss",
    },
    {
      label: "Трофеи",
      value: profile.trophies != null ? formatFullNumber(profile.trophies) : "—",
      valueClass: "text-cr-text",
      icon: Trophy,
      iconClass: "text-cr-blue",
    },
    {
      label: UI.winrate,
      value: profile.winrate != null ? `${profile.winrate.toFixed(1)}%` : "—",
      valueClass: getWinColor(profile.winrate ?? 50),
      icon: TrendingUp,
      iconClass: getWinColor(profile.winrate ?? 50),
    },
    {
      label: "Победы",
      value: profile.total_wins != null ? formatFullNumber(profile.total_wins) : "—",
      valueClass: "text-cr-text",
      icon: Swords,
      iconClass: "text-cr-win",
    },
    {
      label: "3 короны",
      value:
        profile.three_crown_wins != null
          ? formatFullNumber(profile.three_crown_wins)
          : "—",
      valueClass: "text-cr-text",
      icon: Crown,
      iconClass: "text-cr-gold",
    },
    {
      label: "Коллекция",
      value:
        profile.collection_level != null
          ? formatFullNumber(profile.collection_level)
          : "—",
      valueClass: "text-cr-gold profile-stat-collection",
      icon: Layers,
      iconClass: "text-cr-blue",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item, index) => (
        <Card
          key={item.label}
          delay={index * 0.04}
          className="!py-2.5 !px-2.5 text-center flex flex-col items-center justify-center gap-1 min-h-[4.25rem] min-w-0"
        >
          <item.icon className={`w-4 h-4 shrink-0 opacity-90 ${item.iconClass}`} />
          <p className={`stat-value ${item.valueClass}`}>
            {item.value}
          </p>
          <p className="stat-caption px-0.5 profile-stat-label">{item.label}</p>
        </Card>
      ))}
    </div>
  );
}

export { ProfileStatGrid as default };
