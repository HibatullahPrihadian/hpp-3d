import { formatNumber, formatRupiah, type CalcResult } from "@hpp/shared";

interface CostBreakdownProps {
  result: CalcResult;
  riskPercent: number;
}

interface Row {
  label: string;
  detail: string;
  value: number;
}

export function CostBreakdown({ result, riskPercent }: CostBreakdownProps) {
  const rows: Row[] = [
    { label: "Biaya Material", detail: "berat / 1000 × harga filament", value: result.material },
    { label: "Biaya Penyusutan", detail: "harga mesin / umur × jam cetak", value: result.depreciation },
    { label: "Biaya Listrik", detail: "kW × jam × tarif", value: result.electricity },
    { label: "Jasa Cat", detail: "biaya finishing", value: result.paint },
  ];

  return (
    <section className="card overflow-hidden" aria-labelledby="breakdown-title">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <h2
          id="breakdown-title"
          className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          Rincian HPP
        </h2>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          per model
        </span>
      </div>

      <dl className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-3">
            <div>
              <dt className="text-sm font-medium text-slate-700 dark:text-slate-200">{row.label}</dt>
              <p className="text-xs text-slate-500 dark:text-slate-400">{row.detail}</p>
            </div>
            <dd className="shrink-0 text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
              {formatRupiah(row.value)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="space-y-3 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/60">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Subtotal HPP</span>
          <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
            {formatRupiah(result.subtotal)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            Risiko {formatNumber(riskPercent)}%
          </span>
          <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
            {formatRupiah(result.riskAmount)}
          </span>
        </div>
        <div className="flex items-end justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total HPP
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              subtotal + risiko {formatNumber(riskPercent)}%
            </p>
          </div>
          <p
            className="text-2xl font-bold tabular-nums text-brand-700 dark:text-brand-300"
            aria-live="polite"
          >
            {formatRupiah(result.totalHpp)}
          </p>
        </div>
      </div>
    </section>
  );
}
