/**
 * Centralized Telegram Mini App haptic feedback.
 * Never throws; silently skips when disabled or unsupported.
 * All UI haptics must go through this module — never call Telegram.WebApp.HapticFeedback directly.
 *
 * Intensity is one soft→light→medium family: same character, only saturation changes.
 * Never stacks pulses, never mixes selection/notification styles into everyday UI ticks.
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

/**
 * Single tactile family for the whole app.
 * soft → light → medium = gentle density steps, never heavy/rigid.
 */
const INTENSITY_STYLE: Record<HapticIntensity, HapticImpact> = {
  weak: "soft",
  standard: "light",
  strong: "medium",
};

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

/** One soft tick for the current intensity — same character for every UI event. */
function playTick(): void {
  if (!canPlayHaptic()) return;
  try {
    tgHaptic()?.impactOccurred?.(INTENSITY_STYLE[userHapticIntensity]);
  } catch {
    /* ignore */
  }
}

/**
 * Trigger a semantic haptic event.
 * Every event is a single family tick; intensity only changes saturation.
 */
export function triggerHaptic(event: HapticEvent): void {
  if (!canPlayHaptic()) return;

  switch (event) {
    case "lightTap":
    case "mediumTap":
    case "heavyTap":
    case "selection":
    case "toggle":
    case "button":
    case "confirm":
    case "success":
    case "warning":
    case "error":
    case "double":
    case "important":
      playTick();
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
