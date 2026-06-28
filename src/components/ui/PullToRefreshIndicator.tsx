export function PullToRefreshIndicator({
  refreshing,
  pullDistance,
}: {
  refreshing: boolean;
  pullDistance: number;
}) {
  if (pullDistance < 8 && !refreshing) return null;

  const progress = Math.min(pullDistance / 60, 1);

  return (
    <div
      className="fixed left-1/2 z-30 flex -translate-x-1/2 pointer-events-none"
      style={{
        top: "calc(var(--mobile-header-offset) - 0.25rem)",
        opacity: refreshing ? 1 : progress,
      }}
      aria-hidden
    >
      <div
        className={
          "w-8 h-8 rounded-full border-2 border-cr-gold/30 border-t-cr-gold bg-cr-card/90 " +
          (refreshing ? "animate-spin" : "")
        }
        style={!refreshing ? { transform: `rotate(${progress * 360}deg)` } : undefined}
      />
    </div>
  );
}
