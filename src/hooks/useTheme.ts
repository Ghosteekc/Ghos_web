export type AppTheme = "dark" | "light" | "auto";

const STORAGE_KEY = "ghosteek-theme";

type ApplyThemeOptions = {
  /** Crossfade root when resolved theme changes. Default true. */
  animate?: boolean;
};

export function resolveTheme(theme: AppTheme): "dark" | "light" {
  if (theme === "auto") {
    const tgScheme = window.Telegram?.WebApp?.colorScheme;
    if (tgScheme === "light" || tgScheme === "dark") return tgScheme;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return theme;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setThemeAttributes(resolved: "dark" | "light", stored: AppTheme) {
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  localStorage.setItem(STORAGE_KEY, stored);
}

export function applyTheme(theme: AppTheme, options: ApplyThemeOptions = {}) {
  const { animate = true } = options;
  const resolved = resolveTheme(theme);
  const previous = document.documentElement.dataset.theme;
  const run = () => setThemeAttributes(resolved, theme);

  const canAnimate =
    animate &&
    previous != null &&
    previous !== resolved &&
    !prefersReducedMotion() &&
    typeof document.startViewTransition === "function";

  if (canAnimate) {
    document.startViewTransition(run);
    return;
  }

  run();
}

export function loadStoredTheme(): AppTheme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light" || stored === "auto") return stored;
  return "dark";
}

export function initTheme() {
  applyTheme(loadStoredTheme(), { animate: false });
}
