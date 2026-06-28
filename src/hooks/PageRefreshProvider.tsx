import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { PullToRefreshIndicator } from "@/components/ui/PullToRefreshIndicator";
import { usePullToRefresh } from "./usePullToRefresh";

type PageRefreshRegister = (fn: (() => Promise<void>) | null) => void;
const PageRefreshContext = createContext<PageRefreshRegister>(() => {});

export function PageRefreshProvider({ children }: { children: ReactNode }) {
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  const handleRefresh = useCallback(async () => {
    if (refreshRef.current) {
      await refreshRef.current();
    }
  }, []);

  const { refreshing, pullDistance } = usePullToRefresh(handleRefresh);

  const registerRefresh = useCallback<PageRefreshRegister>((fn) => {
    refreshRef.current = fn;
  }, []);

  return (
    <PageRefreshContext.Provider value={registerRefresh}>
      <PullToRefreshIndicator refreshing={refreshing} pullDistance={pullDistance} />
      {children}
    </PageRefreshContext.Provider>
  );
}

export function usePageRefresh(onRefresh: () => Promise<void>) {
  const register = useContext(PageRefreshContext);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    register(async () => {
      await onRefreshRef.current();
    });
    return () => register(null);
  }, [register]);
}
