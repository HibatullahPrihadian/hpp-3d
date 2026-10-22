import type { HistoryEntry, SettingsPayload } from "@hpp/shared";

export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string[] | undefined>;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fields?: Record<string, string[] | undefined>;

  constructor(status: number, payload: ApiErrorPayload | null) {
    super(payload?.error?.message ?? "Gagal menghubungi server");
    this.name = "ApiError";
    this.status = status;
    this.code = payload?.error?.code;
    this.fields = payload?.error?.fields;
  }
}

const baseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}/api${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, payload as ApiErrorPayload | null);
  }

  return payload as T;
}

export const api = {
  getSettings: () => request<SettingsPayload>("/settings"),

  saveSettings: (settings: SettingsPayload) =>
    request<SettingsPayload>("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),

  listHistory: (query?: string) => {
    const params = new URLSearchParams({ limit: "100" });
    if (query?.trim()) params.set("q", query.trim());
    return request<{ items: HistoryEntry[] }>(`/calculations?${params.toString()}`);
  },

  createHistory: (payload: {
    label: string;
    weightG: number;
    printHours: number;
    paintCost: number;
    settings: SettingsPayload;
    totalHpp: number;
  }) =>
    request<HistoryEntry>("/calculations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteHistory: (id: number) =>
    request<void>(`/calculations/${id}`, {
      method: "DELETE",
    }),
};
