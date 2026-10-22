import { useCallback, useEffect, useState } from "react";
import type { HistoryEntry } from "@hpp/shared";
import { api } from "../api";

export function useHistory() {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listHistory();
      setItems(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat riwayat");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = useCallback(async (id: number) => {
    setBusyId(id);
    try {
      await api.deleteHistory(id);
      setItems((current) => current.filter((item) => item.id !== id));
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus riwayat");
      return false;
    } finally {
      setBusyId(null);
    }
  }, []);

  return { items, loading, error, busyId, refresh, remove, setItems };
}
