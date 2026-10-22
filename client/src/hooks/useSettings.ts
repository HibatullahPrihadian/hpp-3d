import { useEffect, useState } from "react";
import type { SettingsPayload } from "@hpp/shared";
import { api } from "../api";

export function useSettingsLoader() {
  const [loaded, setLoaded] = useState<SettingsPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .getSettings()
      .then((settings) => {
        if (!cancelled) {
          setLoaded(settings);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? `${error.message}. Menggunakan nilai default.`
              : "Gagal memuat pengaturan. Menggunakan nilai default.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSettled(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { loaded, loadError, settled };
}
