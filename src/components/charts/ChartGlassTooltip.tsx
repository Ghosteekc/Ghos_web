import {
  createContext,
  useCallback,
  useContext,
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

type TooltipCoordinate = { x?: number; y?: number };

type ScrubState = {
  /** Finger is dragging across the chart — tooltip follows and hides on release. */
  scrubbing: boolean;
  /** Tooltip stays open until the bubble is tapped again. */
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
  activeCoordinate?: TooltipCoordinate;
  activePayload?: unknown[];
  activeLabel?: unknown;
};

const ChartScrubContext = createContext<ChartScrubApi | null>(null);

const MOVE_THRESHOLD_PX = 8;

function readDockTopPx(): number {
  const nav = document.querySelector(".bottom-nav");
  if (nav instanceof HTMLElement) {
    const top = nav.getBoundingClientRect().top;
    if (Number.isFinite(top) && top > 0) return top;
  }
  return window.innerHeight - 112;
}

function resolveIndexFromClientX(
  anchor: HTMLElement,
  clientX: number,
  pointCount: number,
): number | null {
  if (pointCount <= 0) return null;
  const plot =
    (anchor.querySelector(".recharts-cartesian-grid") as SVGElement | null) ??
    (anchor.querySelector(".recharts-wrapper") as HTMLElement | null);
  if (!plot) return null;
  const rect = plot.getBoundingClientRect();
  if (rect.width <= 0) return null;
  const ratio = (clientX - rect.left) / rect.width;
  const clamped = Math.min(1, Math.max(0, ratio));
  if (pointCount === 1) return 0;
  return Math.round(clamped * (pointCount - 1));
}

function coordinateForIndex(
  anchor: HTMLElement,
  index: number,
  fallbackX: number,
): TooltipCoordinate {
  const anchorRect = anchor.getBoundingClientRect();
  const dots = anchor.querySelectorAll<SVGElement>(".recharts-dot, .recharts-active-dot");
  const dot = dots[index];
  if (dot) {
    const r = dot.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - anchorRect.left,
      y: r.top + r.height / 2 - anchorRect.top,
    };
  }

  const bars = anchor.querySelectorAll<SVGElement>(".recharts-bar-rectangle");
  // Composed chart: wins+losses bars per category → two rects per index
  const barGroupSize = bars.length > 0 && index * 2 < bars.length ? 2 : 1;
  const bar = bars[index * barGroupSize] ?? bars[index];
  if (bar) {
    const r = bar.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - anchorRect.left,
      y: r.top - anchorRect.top,
    };
  }

  const plot =
    (anchor.querySelector(".recharts-cartesian-grid") as SVGElement | null) ??
    (anchor.querySelector(".recharts-wrapper") as HTMLElement | null);
  if (plot) {
    const rect = plot.getBoundingClientRect();
    const count = Math.max(1, Number(anchor.dataset.pointCount) || 1);
    const t = count === 1 ? 0.5 : index / (count - 1);
    return {
      x: rect.left + t * rect.width - anchorRect.left,
      y: rect.top + rect.height * 0.35 - anchorRect.top,
    };
  }

  return { x: fallbackX - anchorRect.left, y: anchorRect.height * 0.35 };
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
  const [label, setLabel] = useState<unknown>(null);

  const pointerIdRef = useRef<number | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);
  const indexAtPointerDownRef = useRef<number | null>(null);
  const pinnedRef = useRef(pinned);
  const activeIndexRef = useRef(activeIndex);
  const pointCountRef = useRef(pointCount);
  pinnedRef.current = pinned;
  activeIndexRef.current = activeIndex;
  pointCountRef.current = pointCount;

  const detachWindowListenersRef = useRef<(() => void) | null>(null);

  const clearTransient = useCallback(() => {
    setActiveIndex(null);
    setCoordinate(null);
    setLabel(null);
    setScrubbing(false);
  }, []);

  const applyPointerPosition = useCallback(
    (clientX: number, clientY: number, fromChart?: ChartPointerState | null): number | null => {
      const anchor = anchorRef.current;
      if (!anchor) return null;

      if (fromChart?.isTooltipActive && fromChart.activeTooltipIndex != null) {
        const next = Number(fromChart.activeTooltipIndex);
        if (Number.isFinite(next)) {
          activeIndexRef.current = next;
          setActiveIndex(next);
          if (fromChart.activeCoordinate) setCoordinate(fromChart.activeCoordinate);
          if (fromChart.activeLabel !== undefined) setLabel(fromChart.activeLabel);
          return next;
        }
      }

      const idx = resolveIndexFromClientX(anchor, clientX, pointCountRef.current);
      if (idx == null) return null;
      activeIndexRef.current = idx;
      setActiveIndex(idx);
      setCoordinate(coordinateForIndex(anchor, idx, clientY));
      return idx;
    },
    [],
  );

  const setActiveFromChart = useCallback((state: ChartPointerState | null) => {
    // Only follow Recharts while a finger/mouse button interaction is active or already pinned.
    // Ignore leftover hover/ghost mouse events after touch — they caused sticky tooltips.
    if (pointerIdRef.current == null && !pinnedRef.current) return;
    if (!state?.isTooltipActive || state.activeTooltipIndex == null) return;
    const next = Number(state.activeTooltipIndex);
    if (!Number.isFinite(next)) return;
    activeIndexRef.current = next;
    setActiveIndex(next);
    if (state.activeCoordinate) setCoordinate(state.activeCoordinate);
    if (state.activeLabel !== undefined) setLabel(state.activeLabel);
  }, []);

  const chartHandlers = useMemo(
    () => ({
      onMouseMove: (state: ChartPointerState | null) => {
        setActiveFromChart(state);
      },
      onMouseLeave: () => {
        // Desktop mouse leave: hide unless pinned or still scrubbing via pointer capture.
        if (!pinnedRef.current && pointerIdRef.current == null) {
          clearTransient();
        }
      },
    }),
    [setActiveFromChart, clearTransient],
  );

  const surfaceHandlers = useMemo(
    () => ({
      onPointerDown: (event: ReactPointerEvent) => {
        if (event.button !== 0 && event.pointerType === "mouse") return;

        detachWindowListenersRef.current?.();

        pointerIdRef.current = event.pointerId;
        startRef.current = { x: event.clientX, y: event.clientY };
        movedRef.current = false;
        indexAtPointerDownRef.current = activeIndexRef.current;
        setScrubbing(true);
        applyPointerPosition(event.clientX, event.clientY);

        const onMove = (moveEvent: PointerEvent) => {
          if (pointerIdRef.current !== moveEvent.pointerId || !startRef.current) return;
          const dx = moveEvent.clientX - startRef.current.x;
          const dy = moveEvent.clientY - startRef.current.y;
          if (Math.hypot(dx, dy) >= MOVE_THRESHOLD_PX) {
            movedRef.current = true;
            if (pinnedRef.current) {
              // Temporary scrub while pinned: unpin visually follows finger; release keeps last point pinned.
            }
            setScrubbing(true);
          }
          applyPointerPosition(moveEvent.clientX, moveEvent.clientY);
        };

        const onUp = (upEvent: PointerEvent) => {
          if (pointerIdRef.current !== upEvent.pointerId) return;
          const wasMoved = movedRef.current;
          const indexAtStart = indexAtPointerDownRef.current;

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

          // Tap: pin current point; close only by tapping the tooltip bubble again.
          const indexToPin =
            applyPointerPosition(upEvent.clientX, upEvent.clientY) ??
            activeIndexRef.current ??
            indexAtStart;
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
    [applyPointerPosition, clearTransient],
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
      label,
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
      label,
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
          style={{ touchAction: "none" }}
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
  offsetY = 10,
}: {
  active?: boolean;
  coordinate?: TooltipCoordinate | null;
  children: ReactNode;
  offsetY?: number;
}) {
  const anchorRef = useContext(ChartTooltipAnchorContext);
  const scrub = useOptionalChartScrub();
  const shellRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  const pinned = scrub?.pinned ?? false;
  const visible = scrub ? scrub.isVisible && Boolean(active) : Boolean(active);

  useLayoutEffect(() => {
    if (!visible || !anchorRef?.current || coordinate?.x == null || coordinate?.y == null) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      const shell = shellRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const pointX = rect.left + coordinate.x!;
      const pointY = rect.top + coordinate.y!;
      const tipW = shell?.offsetWidth ?? 160;
      const tipH = shell?.offsetHeight ?? 72;
      const margin = 8;
      const dockTop = readDockTopPx();

      let left = pointX;
      left = Math.min(window.innerWidth - margin - tipW / 2, Math.max(margin + tipW / 2, left));

      // Keep the bubble fully above the bottom dock.
      let top = pointY - tipH - offsetY;
      const maxTop = dockTop - tipH - margin;
      if (top > maxTop) top = maxTop;
      if (top < margin) {
        top = Math.min(pointY + offsetY, maxTop);
      }
      top = Math.max(margin, Math.min(top, maxTop));

      setPosition({ left, top });
    };

    updatePosition();
    // Second pass after tip mounts with real size.
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [visible, anchorRef, coordinate?.x, coordinate?.y, offsetY, children]);

  // Always mount while visible so we can measure tip size; hide via opacity until positioned.
  if (!visible) return null;

  return createPortal(
    <div
      ref={shellRef}
      className="chart-tooltip-glass px-3 py-2 text-xs shadow-lg"
      role={pinned ? "button" : undefined}
      tabIndex={pinned ? 0 : undefined}
      aria-label={pinned ? "Закрыть подсказку" : undefined}
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
        pointerEvents: pinned ? "auto" : "none",
        cursor: pinned ? "pointer" : "default",
        visibility: position ? "visible" : "hidden",
      }}
    >
      {children}
      {pinned ? (
        <p className="text-[10px] text-cr-muted mt-1.5 text-center">Нажмите, чтобы закрыть</p>
      ) : null}
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
