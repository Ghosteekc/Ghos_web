import { cn } from "@/utils";
import { haptic } from "@/utils/hapticManager";
import type { CSSProperties } from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in seconds (converted to CSS animation-delay). */
  delay?: number;
  onClick?: () => void;
  /** Skip entrance animation — use for long scrollable lists. */
  noMotion?: boolean;
}

export function Card({ children, className = "", delay = 0, onClick, noMotion = false }: CardProps) {
  const handleClick = onClick
    ? () => {
        haptic.light();
        onClick();
      }
    : undefined;

  const classes = cn(
    "glass-card p-4 w-full min-w-0 overflow-hidden",
    onClick && "cursor-pointer",
    !noMotion && "ui-enter",
    className,
  );

  const style: CSSProperties | undefined =
    !noMotion && delay > 0 ? { animationDelay: `${Math.round(delay * 1000)}ms` } : undefined;

  return (
    <div className={classes} style={style} onClick={handleClick}>
      {children}
    </div>
  );
}
