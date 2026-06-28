import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Menu, X } from "lucide-react";
import { cn } from "@/utils";
import { PageRefreshProvider } from "@/hooks";

function applyTelegramSafeArea() {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  const root = document.documentElement;
  const inset = webApp.safeAreaInset;
  const contentInset = webApp.contentSafeAreaInset;

  if (inset) {
    root.style.setProperty("--tg-safe-top", `${inset.top}px`);
    root.style.setProperty("--tg-safe-bottom", `${inset.bottom}px`);
    root.style.setProperty("--tg-safe-left", `${inset.left}px`);
    root.style.setProperty("--tg-safe-right", `${inset.right}px`);
  }

  if (contentInset) {
    const top = Math.max(inset?.top ?? 0, contentInset.top);
    const bottom = Math.max(inset?.bottom ?? 0, contentInset.bottom);
    const left = Math.max(inset?.left ?? 0, contentInset.left);
    const right = Math.max(inset?.right ?? 0, contentInset.right);
    root.style.setProperty("--tg-safe-top", `${top}px`);
    root.style.setProperty("--tg-safe-bottom", `${bottom}px`);
    root.style.setProperty("--tg-safe-left", `${left}px`);
    root.style.setProperty("--tg-safe-right", `${right}px`);
  }
}

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      webApp.ready();
      webApp.expand();
    }
    applyTelegramSafeArea();
    if (!webApp) return;

    webApp.onEvent?.("safeAreaChanged", applyTelegramSafeArea);
    webApp.onEvent?.("contentSafeAreaChanged", applyTelegramSafeArea);
    return () => {
      webApp.offEvent?.("safeAreaChanged", applyTelegramSafeArea);
      webApp.offEvent?.("contentSafeAreaChanged", applyTelegramSafeArea);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen && !isDesktop ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, isDesktop]);

  const sidebarOpen = isDesktop || mobileOpen;

  return (
    <div className="min-h-screen flex overflow-x-hidden">
      <div
        className={cn("sidebar-overlay", mobileOpen && !isDesktop && "open")}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen || isDesktop}
      />

      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="mobile-burger lg:hidden"
        aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? (
          <X className="w-6 h-6 text-cr-text" />
        ) : (
          <Menu className="w-6 h-6 text-cr-text" />
        )}
      </button>

      <Sidebar isOpen={sidebarOpen} onClose={() => setMobileOpen(false)} />

      <main className="app-main">
        <PageRefreshProvider>
          <div className="page-shell">
            <Outlet />
          </div>
        </PageRefreshProvider>
      </main>
    </div>
  );
}
