/**
 * Centralized Telegram Mini App haptic feedback.
 * Never throws; silently skips when disabled or unsupported.
 * All UI haptics must go through this module — never call Telegram.WebApp.HapticFeedback directly.
 */

export type HapticImpact = "light" | "medium" | "heavy" | "rigid" | "soft";
export type HapticNotify = "error" | "success" | "warning";
export type HapticIntensity = "weak" | "standard" | "strong";

/** Semantic haptic events used across the app. */
export type HapticEvent =
  | "lightTap"
  | "mediumTap"
  | "heavyTap"
  | "selection"
  | "success"
  | "warning"
  | "error"
  | "confirm"
  | "double"
  | "button"
  | "toggle"
  /** @deprecated Use `double` */
  | "important";

let userHapticEnabled = true;
let userHapticIntensity: HapticIntensity = "standard";

export function setHapticEnabled(enabled: boolean): void {
  userHapticEnabled = enabled;
}

export function isHapticEnabled(): boolean {
  return userHapticEnabled;
}

export function setHapticIntensity(intensity: HapticIntensity): void {
  userHapticIntensity = intensity;
}

export function getHapticIntensity(): HapticIntensity {
  return userHapticIntensity;
}

function tgHaptic() {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp?.HapticFeedback;
}

function canPlayHaptic(): boolean {
  return userHapticEnabled && Boolean(tgHaptic());
}

/** Map a logical impact style through the selected intensity (never uses rigid = max). */
function resolveImpact(base: HapticImpact): HapticImpact {
  switch (userHapticIntensity) {
    case "weak":
      if (base === "soft" || base === "light") return "soft";
      return "light";
    case "strong":
      // ~80–85% of max: upgrade toward heavy, never rigid
      if (base === "soft") return "medium";
      if (base === "light") return "medium";
      if (base === "medium") return "heavy";
      return "heavy";
    default:
      return base === "rigid" ? "heavy" : base;
  }
}

function safeImpact(style: HapticImpact): void {
  if (!canPlayHaptic()) return;
  try {
    tgHaptic()?.impactOccurred?.(resolveImpact(style));
  } catch {
    /* ignore */
  }
}

function safeSelection(): void {
  if (!canPlayHaptic()) return;
  try {
    tgHaptic()?.selectionChanged?.();
  } catch {
    /* ignore */
  }
}

function safeNotification(type: HapticNotify): void {
  if (!canPlayHaptic()) return;
  try {
    tgHaptic()?.notificationOccurred?.(type);
  } catch {
    /* ignore */
  }
}

function scheduleImpact(style: HapticImpact, delayMs: number): void {
  if (!canPlayHaptic()) return;
  window.setTimeout(() => {
    if (!canPlayHaptic()) return;
    safeImpact(style);
  }, delayMs);
}

function playNotify(type: HapticNotify): void {
  switch (userHapticIntensity) {
    case "weak":
      // Short soft pulse instead of full notification
      safeImpact("soft");
      break;
    case "strong":
      // Confident but not max: notification + brief medium accent
      safeNotification(type);
      scheduleImpact("medium", 50);
      break;
    default:
      safeNotification(type);
      break;
  }
}

/**
 * Trigger a semantic haptic event.
 * Respects user setting, intensity, and Telegram API availability.
 */
export function triggerHaptic(event: HapticEvent): void {
  if (!canPlayHaptic()) return;

  switch (event) {
    case "lightTap":
    case "button":
      safeImpact("light");
      break;
    case "mediumTap":
      safeImpact("medium");
      break;
    case "heavyTap":
      safeImpact("heavy");
      break;
    case "selection":
    case "toggle":
      if (userHapticIntensity === "weak") {
        safeImpact("soft");
      } else if (userHapticIntensity === "strong") {
        safeSelection();
        scheduleImpact("light", 40);
      } else {
        safeSelection();
      }
      break;
    case "success":
      playNotify("success");
      break;
    case "warning":
      playNotify("warning");
      break;
    case "error":
      playNotify("error");
      break;
    case "confirm":
      if (userHapticIntensity === "weak") {
        safeImpact("light");
      } else if (userHapticIntensity === "strong") {
        safeImpact("heavy");
      } else {
        safeImpact("medium");
      }
      break;
    case "double":
    case "important":
      if (userHapticIntensity === "weak") {
        safeImpact("soft");
        scheduleImpact("soft", 70);
      } else if (userHapticIntensity === "strong") {
        safeImpact("heavy");
        scheduleImpact("medium", 75);
      } else {
        safeImpact("medium");
        scheduleImpact("light", 90);
      }
      break;
    default:
      break;
  }
}

/** Primary haptic API for the Mini App. */
export const haptic = {
  setEnabled: setHapticEnabled,
  isEnabled: isHapticEnabled,
  setIntensity: setHapticIntensity,
  getIntensity: getHapticIntensity,
  light: () => triggerHaptic("lightTap"),
  medium: () => triggerHaptic("mediumTap"),
  heavy: () => triggerHaptic("heavyTap"),
  success: () => triggerHaptic("success"),
  warning: () => triggerHaptic("warning"),
  error: () => triggerHaptic("error"),
  selection: () => triggerHaptic("selection"),
  double: () => triggerHaptic("double"),
  confirm: () => triggerHaptic("confirm"),
  button: () => triggerHaptic("button"),
  toggle: () => triggerHaptic("toggle"),
};

/** @deprecated Prefer `haptic.light()` / `triggerHaptic()` */
export function hapticImpact(style: HapticImpact = "light"): void {
  const map: Record<HapticImpact, HapticEvent> = {
    light: "lightTap",
    soft: "lightTap",
    rigid: "mediumTap",
    medium: "mediumTap",
    heavy: "heavyTap",
  };
  triggerHaptic(map[style]);
}

/** @deprecated Prefer `haptic.selection()` */
export function hapticSelection(): void {
  triggerHaptic("selection");
}

/** @deprecated Prefer `haptic.success()` / `haptic.warning()` / `haptic.error()` */
export function hapticNotify(type: HapticNotify): void {
  triggerHaptic(type);
}

export function withHaptic<T extends (...args: never[]) => void>(
  fn: T | undefined,
  event: HapticEvent = "lightTap",
): T | undefined {
  if (!fn) return undefined;
  return ((...args: Parameters<T>) => {
    triggerHaptic(event);
    fn(...args);
  }) as T;
}

/** Back-compat facade; prefer `haptic`. */
export const hapticManager = {
  setEnabled: haptic.setEnabled,
  isEnabled: haptic.isEnabled,
  setIntensity: haptic.setIntensity,
  getIntensity: haptic.getIntensity,
  trigger: triggerHaptic,
  lightTap: haptic.light,
  mediumTap: haptic.medium,
  heavyTap: haptic.heavy,
  selection: haptic.selection,
  success: haptic.success,
  warning: haptic.warning,
  error: haptic.error,
  confirm: haptic.confirm,
  double: haptic.double,
  important: haptic.double,
  button: haptic.button,
  toggle: haptic.toggle,
};
