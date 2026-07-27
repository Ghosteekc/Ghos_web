import { motion } from "framer-motion";
import { cn } from "@/utils";
import { haptic } from "@/utils/hapticManager";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
  /** Skip framer entrance — use for long scrollable lists. */
  noMotion?: boolean;
}

export function Card({ children, className = "", delay = 0, onClick, noMotion = false }: CardProps) {
  const handleClick = onClick
    ? () => {
        haptic.light();
        onClick();
      }
    : undefined;

  const classes = cn("glass-card p-4 w-full min-w-0 overflow-hidden", onClick && "cursor-pointer", className);

  if (noMotion) {
    return (
      <div className={classes} onClick={handleClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: 12 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={handleClick}
      className={classes}
    >
      {children}
    </motion.div>
  );
}
