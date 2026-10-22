import { formatPercent, formatRupiah, type MarginResult } from "@hpp/shared";
import type { MarginRow } from "../form";

interface MarginTableProps {
  rows: MarginRow[];
  results: (MarginResult | null)[];
  error?: string;
  onChange: (id: string, value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function MarginTable({ rows, results, error, onChange, onAdd, onRemove }: MarginTableProps) {
  return (
    <section className="card overflow-hidden" aria-labelledby="margin-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div>
          <h2
            id="margin-title"
            className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            Harga Jual per Margin
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Harga jual = total HPP × (1 + persentase)
          </p>
        </div>
        <button type="button" className="btn-secondary no-print" onClick={onAdd}>
          + Tambah margin
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[26rem] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th scope="col" className="px-5 py-3 font-semibold">
                Persentase
              </th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">
                Harga Jual
              </th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">
                Bersih
              </th>
              <th scope="col" className="no-print px-2 py-3">
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row, index) => {
              const result = results[index] ?? null;
              return (
                <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        aria-label={`Persentase margin baris ${index + 1}`}
                        className="field-input w-24 text-right tabular-nums no-print"
                        value={row.value}
                        onChange={(event) => onChange(row.id, event.target.value)}
                        inputMode="decimal"
                        placeholder="50"
                      />
                      <span className="no-print text-slate-500 dark:text-slate-400">%</span>
                      <span className="hidden tabular-nums print:inline">
                        {result ? formatPercent(result.percent) : `${row.value}%`}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-right font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                    {result ? formatRupiah(result.sellingPrice) : "—"}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-emerald-700 dark:text-emerald-400">
                    {result ? formatRupiah(result.netProfit) : "—"}
                  </td>
                  <td className="no-print px-2 py-2.5 text-right">
                    <button
                      type="button"
                      className="btn-danger px-2 py-1"
                      onClick={() => onRemove(row.id)}
                      disabled={rows.length <= 1}
                      title={rows.length <= 1 ? "Minimal satu persentase" : "Hapus baris"}
                      aria-label={`Hapus margin ${row.value}%`}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error ? <p className="field-error px-5 pb-4">{error}</p> : null}
    </section>
  );
}
