import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

export const ChartTooltipAnchorContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

type TooltipCoordinate = { x: number; y: number };

type ScrubState = {
  scrubbing: boolean;
  pinned: boolean;
  activeIndex: number | null;
};

type ChartScrubApi = ScrubState & {
  isVisible: boolean;
  coordinate: TooltipCoordinate | null;
  label: unknown;
  chartHandlers: {
    onMouseMove: (state: ChartPointerState | null) => void;
    onMouseLeave: () => void;
  };
  surfaceHandlers: {
    onPointerDown: (event: ReactPointerEvent) => void;
  };
  onTooltipPress: () => void;
  setActiveFromChart: (state: ChartPointerState | null) => void;
};

export type ChartPointerState = {
  isTooltipActive?: boolean;
  activeTooltipIndex?: number | string | null;
  activeCoordinate?: { x?: number; y?: number };
  activePayload?: unknown[];
  activeLabel?: unknown;
};

const ChartScrubContext = createContext<ChartScrubApi | null>(null);

const MOVE_THRESHOLD_PX = 12;
/** Stay on the current point until the finger clearly crosses into the next band. */
const INDEX_HYSTERESIS = 0.45;

function readDockTopPx(): number {
  const nav = document.querySelector(".bottom-nav");
  if (nav instanceof HTMLElement) {
    const top = nav.getBoundingClientRect().top;
    if (Number.isFinite(top) && top > 0) return top;
  }
  return window.innerHeight - 112;
}

function getPlotRect(anchor: HTMLElement): DOMRect | null {
  const plot =
    (anchor.querySelector(".recharts-cartesian-grid") as SVGElement | null) ??
    (anchor.querySelector(".recharts-surface") as SVGElement | null) ??
    (anchor.querySelector(".recharts-wrapper") as HTMLElement | null);
  if (!plot) return null;
  const rect = plot.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? rect : null;
}

function continuousIndexFromClientX(
  plot: DOMRect,
  clientX: number,
  pointCount: number,
): number {
  if (pointCount <= 1) return 0;
  const ratio = (clientX - plot.left) / plot.width;
  return Math.min(pointCount - 1, Math.max(0, ratio * (pointCount - 1)));
}

function resolveIndexWithHysteresis(
  continuous: number,
  previous: number | null,
  pointCount: number,
): number {
  if (pointCount <= 1) return 0;
  if (previous == null) return Math.round(continuous);
  if (Math.abs(continuous - previous) < INDEX_HYSTERESIS) return previous;
  return Math.round(continuous);
}

/** Stable chart-local coordinate: X on the category band, Y fixed near the plot top. */
function coordinateForIndex(
  anchor: HTMLElement,
  plot: DOMRect,
  index: number,
  pointCount: number,
): TooltipCoordinate {
  const anchorRect = anchor.getBoundingClientRect();
  const t = pointCount <= 1 ? 0.5 : index / (pointCount - 1);
  return {
    x: plot.left + t * plot.width - anchorRect.left,
    y: plot.top + 12 - anchorRect.top,
  };
}

export function useChartScrub(): ChartScrubApi {
  const api = useContext(ChartScrubContext);
  if (!api) {
    throw new Error("useChartScrub must be used inside ChartTooltipAnchor");
  }
  return api;
}

function useOptionalChartScrub(): ChartScrubApi | null {
  return useContext(ChartScrubContext);
}

export function ChartTooltipAnchor({
  children,
  className,
  pointCount = 0,
}: {
  children: ReactNode;
  className?: string;
  pointCount?: number;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [coordinate, setCoordinate] = useState<TooltipCoordinate | null>(null);

  const pointerIdRef = useRef<number | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);
  const indexAtPointerDownRef = useRef<number | null>(null);
  const pinnedRef = useRef(pinned);
  const activeIndexRef = useRef(activeIndex);
  const pointCountRef = useRef(pointCount);
  const moveRafRef = useRef<number | null>(null);
  const pendingClientXRef = useRef<number | null>(null);
  const detachWindowListenersRef = useRef<(() => void) | null>(null);

  pinnedRef.current = pinned;
  activeIndexRef.current = activeIndex;
  pointCountRef.current = pointCount;

  const clearTransient = useCallback(() => {
    setActiveIndex(null);
    setCoordinate(null);
    setScrubbing(false);
  }, []);

  const applyClientX = useCallback((clientX: number): number | null => {
    const anchor = anchorRef.current;
    if (!anchor) return null;
    const count = pointCountRef.current;
    if (count <= 0) return null;
    const plot = getPlotRect(anchor);
    if (!plot) return null;

    const continuous = continuousIndexFromClientX(plot, clientX, count);
    const idx = resolveIndexWithHysteresis(continuous, activeIndexRef.current, count);
    const nextCoord = coordinateForIndex(anchor, plot, idx, count);

    if (activeIndexRef.current !== idx) {
      activeIndexRef.current = idx;
      setActiveIndex(idx);
    }
    setCoordinate((prev) => {
      if (prev && Math.abs(prev.x - nextCoord.x) < 0.5 && Math.abs(prev.y - nextCoord.y) < 0.5) {
        return prev;
      }
      return nextCoord;
    });
    return idx;
  }, []);

  const scheduleApplyClientX = useCallback(
    (clientX: number) => {
      pendingClientXRef.current = clientX;
      if (moveRafRef.current != null) return;
      moveRafRef.current = requestAnimationFrame(() => {
        moveRafRef.current = null;
        const x = pendingClientXRef.current;
        pendingClientXRef.current = null;
        if (x != null) applyClientX(x);
      });
    },
    [applyClientX],
  );

  const setActiveFromChart = useCallback((_state: ChartPointerState | null) => {
    // Intentionally ignored: dual updates from Recharts caused tip jitter.
  }, []);

  const chartHandlers = useMemo(
    () => ({
      onMouseMove: (_state: ChartPointerState | null) => {},
      onMouseLeave: () => {
        if (!pinnedRef.current && pointerIdRef.current == null) {
          clearTransient();
        }
      },
    }),
    [clearTransient],
  );

  const surfaceHandlers = useMemo(
    () => ({
      onPointerDown: (event: ReactPointerEvent) => {
        if (event.button !== 0 && event.pointerType === "mouse") return;

        detachWindowListenersRef.current?.();
        if (moveRafRef.current != null) {
          cancelAnimationFrame(moveRafRef.current);
          moveRafRef.current = null;
        }

        pointerIdRef.current = event.pointerId;
        startRef.current = { x: event.clientX, y: event.clientY };
        movedRef.current = false;
        indexAtPointerDownRef.current = activeIndexRef.current;
        setScrubbing(true);
        applyClientX(event.clientX);

        const onMove = (moveEvent: PointerEvent) => {
          if (pointerIdRef.current !== moveEvent.pointerId || !startRef.current) return;
          const dx = moveEvent.clientX - startRef.current.x;
          const dy = moveEvent.clientY - startRef.current.y;
          if (Math.hypot(dx, dy) >= MOVE_THRESHOLD_PX) {
            movedRef.current = true;
          }
          scheduleApplyClientX(moveEvent.clientX);
        };

        const onUp = (upEvent: PointerEvent) => {
          if (pointerIdRef.current !== upEvent.pointerId) return;
          const wasMoved = movedRef.current;
          const indexAtStart = indexAtPointerDownRef.current;

          if (moveRafRef.current != null) {
            cancelAnimationFrame(moveRafRef.current);
            moveRafRef.current = null;
          }
          pendingClientXRef.current = null;

          pointerIdRef.current = null;
          startRef.current = null;
          movedRef.current = false;
          indexAtPointerDownRef.current = null;
          detachWindowListenersRef.current?.();
          detachWindowListenersRef.current = null;

          if (wasMoved) {
            setScrubbing(false);
            if (!pinnedRef.current) {
              clearTransient();
            }
            return;
          }

          // Tap on a point/period → pin until the tip is tapped again.
          const indexToPin = applyClientX(upEvent.clientX) ?? activeIndexRef.current ?? indexAtStart;
          if (indexToPin == null) {
            setScrubbing(false);
            return;
          }
          pinnedRef.current = true;
          setPinned(true);
          setScrubbing(false);
          activeIndexRef.current = indexToPin;
          setActiveIndex(indexToPin);
        };

        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
        detachWindowListenersRef.current = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
        };
      },
    }),
    [applyClientX, scheduleApplyClientX, clearTransient],
  );

  const onTooltipPress = useCallback(() => {
    if (!pinnedRef.current) return;
    pinnedRef.current = false;
    setPinned(false);
    clearTransient();
  }, [clearTransient]);

  const api = useMemo<ChartScrubApi>(
    () => ({
      scrubbing,
      pinned,
      activeIndex,
      coordinate,
      label: null,
      isVisible: activeIndex != null && (scrubbing || pinned),
      chartHandlers,
      surfaceHandlers,
      onTooltipPress,
      setActiveFromChart,
    }),
    [
      scrubbing,
      pinned,
      activeIndex,
      coordinate,
      chartHandlers,
      surfaceHandlers,
      onTooltipPress,
      setActiveFromChart,
    ],
  );

  return (
    <ChartTooltipAnchorContext.Provider value={anchorRef}>
      <ChartScrubContext.Provider value={api}>
        <div
          ref={anchorRef}
          className={className}
          data-point-count={pointCount}
          style={{ touchAction: "none", WebkitUserSelect: "none", userSelect: "none" }}
          {...surfaceHandlers}
        >
          {children}
        </div>
      </ChartScrubContext.Provider>
    </ChartTooltipAnchorContext.Provider>
  );
}

export function ChartGlassTooltipShell({
  active,
  coordinate,
  children,
  contentKey,
}: {
  active?: boolean;
  coordinate?: TooltipCoordinate | null;
  children: ReactNode;
  /** Stable key for the selected point — drives content crossfade. */
  contentKey?: string | number | null;
  offsetY?: number;
}) {
  const anchorRef = useContext(ChartTooltipAnchorContext);
  const scrub = useOptionalChartScrub();
  const shellRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const measuredSizeRef = useRef({ w: 168, h: 96 });
  const [rendered, setRendered] = useState(false);
  const [shown, setShown] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [displayKey, setDisplayKey] = useState(contentKey);
  const [bodyOpaque, setBodyOpaque] = useState(true);

  const pinned = scrub?.pinned ?? false;
  const wantVisible = scrub ? scrub.isVisible && Boolean(active) : Boolean(active);

  useEffect(() => {
    if (wantVisible) {
      setRendered(true);
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = window.setTimeout(() => setRendered(false), 180);
    return () => window.clearTimeout(t);
  }, [wantVisible]);

  useEffect(() => {
    if (!wantVisible) return;
    if (contentKey === displayKey) {
      setDisplayChildren(children);
      return;
    }
    setBodyOpaque(false);
    const t = window.setTimeout(() => {
      setDisplayKey(contentKey);
      setDisplayChildren(children);
      setBodyOpaque(true);
    }, 90);
    return () => window.clearTimeout(t);
  }, [children, contentKey, displayKey, wantVisible]);

  useLayoutEffect(() => {
    if (!rendered || !anchorRef?.current || coordinate == null) {
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      const shell = shellRef.current;
      if (!anchor) return;

      if (shell) {
        measuredSizeRef.current = {
          w: shell.offsetWidth || measuredSizeRef.current.w,
          h: shell.offsetHeight || measuredSizeRef.current.h,
        };
      }

      const rect = anchor.getBoundingClientRect();
      const tipW = measuredSizeRef.current.w;
      const tipH = measuredSizeRef.current.h;
      const margin = 8;
      const dockTop = readDockTopPx();

      let left = rect.left + coordinate.x;
      left = Math.min(window.innerWidth - margin - tipW / 2, Math.max(margin + tipW / 2, left));

      let top = rect.top + 6;
      const maxTop = dockTop - tipH - margin;
      top = Math.max(margin, Math.min(top, maxTop));

      setPosition({ left, top });
    };

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [rendered, anchorRef, coordinate?.x, coordinate?.y, pinned]);

  if (!rendered) return null;

  return createPortal(
    <div
      ref={shellRef}
      className={`chart-tooltip-glass px-3 py-2 text-xs shadow-lg${shown && position ? " is-shown" : ""}`}
      role={pinned ? "button" : undefined}
      tabIndex={pinned ? 0 : undefined}
      aria-label={pinned ? "Закрыть подсказку" : undefined}
      onPointerDown={
        pinned
          ? (event) => {
              event.stopPropagation();
              event.preventDefault();
            }
          : undefined
      }
      onClick={
        pinned
          ? (event) => {
              event.stopPropagation();
              scrub?.onTooltipPress();
            }
          : undefined
      }
      onKeyDown={
        pinned
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                scrub?.onTooltipPress();
              }
            }
          : undefined
      }
      style={{
        position: "fixed",
        left: position?.left ?? 0,
        top: position?.top ?? 0,
        transform: "translate(-50%, 0)",
        zIndex: 40,
        pointerEvents: pinned && shown ? "auto" : "none",
        cursor: pinned ? "pointer" : "default",
        minWidth: 156,
      }}
    >
      <div
        className="chart-tooltip-body"
        style={{
          opacity: bodyOpaque ? 1 : 0,
          transition: "opacity 90ms ease",
        }}
      >
        {displayChildren}
      </div>
      <p
        className="chart-tooltip-hint"
        style={{ opacity: pinned ? 1 : 0 }}
        aria-hidden={!pinned}
      >
        Нажмите, чтобы закрыть
      </p>
    </div>,
    document.body,
  );
}

/** Bind Recharts chart mouse handlers + controlled Tooltip visibility. */
export function chartTooltipProps(scrub: ChartScrubApi): {
  active: boolean;
  wrapperStyle: CSSProperties;
  contentStyle: CSSProperties;
} {
  return {
    active: scrub.isVisible,
    wrapperStyle: { outline: "none" },
    contentStyle: {
      background: "transparent",
      border: "none",
      boxShadow: "none",
      padding: 0,
    },
  };
}
