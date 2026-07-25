import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DEFAULT_LOADING_ITEMS = [
  "колод",
  "матчапов",
  "боёв",
  "статистики",
  "соперников",
  "рекомендаций",
  "карт",
] as const;

interface LoaderProps {
  compact?: boolean;
  showLabel?: boolean;
  className?: string;
  /** Что загружается — слова по очереди под «Загрузка» */
  items?: string[];
  /** Интервал смены подписи, мс */
  intervalMs?: number;
}

const LABEL_EASE = [0.22, 0.08, 0.24, 1] as const;

const Loader = ({
  compact = false,
  showLabel = true,
  className = "",
  items = [...DEFAULT_LOADING_ITEMS],
  intervalMs = 1200,
}: LoaderProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!showLabel || items.length <= 1) return;

    const tick = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, intervalMs);

    return () => clearInterval(tick);
  }, [showLabel, items, intervalMs]);

  const current = items[index] ?? items[0];

  return (
    <div
      className={`flex flex-col items-center justify-center ${compact ? "py-2" : "py-12"} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={showLabel ? `Загрузка ${current}` : "Загрузка"}
    >
      <img
        src="/pekka-butterfly.gif"
        alt=""
        aria-hidden
        className={`object-contain ${compact ? "w-10 h-10" : "w-36 h-36"}`}
      />
      {showLabel && (
        <div className={`text-center ${compact ? "mt-2" : "mt-4"}`}>
          <p className={`text-cr-muted loader-title ${compact ? "text-xs" : "text-sm"}`}>Загрузка</p>
          <div
            className={`relative overflow-hidden ${
              compact ? "mt-0.5 min-h-[1.05rem]" : "mt-1 min-h-[1.35rem]"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={current}
                className={`text-cr-gold/90 font-medium origin-center loader-item ${
                  compact ? "text-[11px]" : "text-xs"
                }`}
                initial={{ opacity: 0, scaleY: 0.12, scaleX: 0.78 }}
                animate={{ opacity: 1, scaleY: 1, scaleX: 1 }}
                exit={{ opacity: 0, scaleY: 0.08, scaleX: 0.82 }}
                transition={{ duration: 0.32, ease: LABEL_EASE }}
              >
                {current}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export { Loader, DEFAULT_LOADING_ITEMS };
export default Loader;
