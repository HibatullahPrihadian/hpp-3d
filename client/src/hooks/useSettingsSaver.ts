import { useEffect, useRef, useState } from "react";
import type { SettingsPayload } from "@hpp/shared";
import { api } from "../api";

export type SaveState = "idle" | "saving" | "saved" | "error";

export function useSettingsSaver(
  payload: SettingsPayload | null,
  signature: string,
  ready: boolean,
  enabled: boolean,
) {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSaved = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !payload) return;
    if (lastSaved.current === null) {
      lastSaved.current = signature;
      return;
    }
    if (signature === lastSaved.current) return;
    if (!enabled) {
      setSaveState("idle");
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setSaveState("saving");
      api
        .saveSettings(payload)
        .then(() => {
          if (!active) return;
          lastSaved.current = signature;
          setSaveState("saved");
          setSaveError(null);
        })
        .catch((error: unknown) => {
          if (!active) return;
          setSaveState("error");
          setSaveError(
            error instanceof Error ? error.message : "Gagal menyimpan pengaturan",
          );
        });
    }, 600);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [enabled, payload, ready, signature]);

  return { saveState, saveError };
}
