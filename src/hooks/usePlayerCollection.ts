import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/api/client";
import type { PlayerCollectionData } from "@/types";

export function usePlayerCollection() {
  const [data, setData] = useState<PlayerCollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPlayerCollection();
      setData(res);
    } catch (e) {
      setData(null);
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить коллекцию");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
