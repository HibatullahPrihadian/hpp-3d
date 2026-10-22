import { useMemo, useState } from "react";
import { formatNumber, formatRupiah, type HistoryEntry } from "@hpp/shared";

interface HistoryListProps {
  items: HistoryEntry[];
  loading: boolean;
  error: string | null;
  busyId: number | null;
  onOpen: (entry: HistoryEntry) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function HistoryList({
  items,
  loading,
  error,
  busyId,
  onOpen,
  onDelete,
  onRefresh,
}: HistoryListProps) {
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((entry) =>
      [entry.label, `#${entry.id}`].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [items, query]);

  return (
    <section className="card overflow-hidden no-print" aria-labelledby="history-title">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div>
          <h2
            id="history-title"
            className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            Riwayat Perhitungan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tersimpan di server, {items.length} entri
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={onRefresh} disabled={loading}>
          {loading ? "Memuat…" : "Muat ulang"}
        </button>
      </div>

      <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
        <label className="field-label" htmlFor="history-search">
          Cari riwayat
        </label>
        <input
          id="history-search"
          type="search"
          className="field-input"
          placeholder="Nama model atau nomor entri, mis. vas 12"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {error ? (
        <p className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      {loading && items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">Memuat riwayat…</p>
      ) : items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">
          Belum ada riwayat. Simpan perhitungan pertama Anda.
        </p>
      ) : filtered.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">
          Tidak ada riwayat yang cocok dengan &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((entry) => (
            <li key={entry.id} className="px-5 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {entry.label.trim() || `Perhitungan #${entry.id}`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatNumber(entry.weightG)} g · {formatNumber(entry.printHours)} jam ·{" "}
                    {dateFormatter.format(new Date(entry.createdAt))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums text-brand-700 dark:text-brand-300">
                    {formatRupiah(entry.totalHpp)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">total HPP</p>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => onOpen(entry)}>
                  Buka
                </button>
                {pendingDelete === entry.id ? (
                  <>
                    <button
                      type="button"
                      className="btn-danger px-2 py-1 text-xs"
                      onClick={() => {
                        onDelete(entry.id);
                        setPendingDelete(null);
                      }}
                      disabled={busyId === entry.id}
                    >
                      {busyId === entry.id ? "Menghapus…" : "Yakin hapus?"}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1 text-xs"
                      onClick={() => setPendingDelete(null)}
                    >
                      Batal
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1 text-xs"
                    onClick={() => setPendingDelete(entry.id)}
                  >
                    Hapus
                  </button>
                )}
                <span className="ml-auto flex flex-wrap gap-1 text-xs text-slate-500 dark:text-slate-400">
                  {entry.result.margins.map((row) => (
                    <span
                      key={`${entry.id}-${row.percent}`}
                      className="rounded bg-slate-100 px-1.5 py-0.5 tabular-nums dark:bg-slate-800"
                    >
                      {formatNumber(row.percent)}%: {formatRupiah(row.sellingPrice)}
                    </span>
                  ))}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
