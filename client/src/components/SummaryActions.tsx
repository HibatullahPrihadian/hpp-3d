import { useState } from "react";
import { formatRupiah, type CalcResult } from "@hpp/shared";
import { buildWhatsappSummary, copyToClipboard } from "../whatsapp";

interface SummaryActionsProps {
  disabled: boolean;
  saving: boolean;
  label: string;
  weightG: number;
  printHours: number;
  paintCost: number;
  result: CalcResult;
  onSave: () => Promise<void>;
  onNotify: (message: string, tone?: "success" | "error") => void;
}

export function SummaryActions({
  disabled,
  saving,
  label,
  weightG,
  printHours,
  paintCost,
  result,
  onSave,
  onNotify,
}: SummaryActionsProps) {
  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    setCopying(true);
    const summary = buildWhatsappSummary({ label, weightG, printHours, paintCost, result });
    const ok = await copyToClipboard(summary);
    setCopying(false);
    onNotify(
      ok ? "Ringkasan disalin ke clipboard." : "Gagal menyalin. Coba lagi.",
      ok ? "success" : "error",
    );
  };

  return (
    <section className="card p-5 no-print" aria-labelledby="actions-title">
      <h2
        id="actions-title"
        className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
      >
        Aksi
      </h2>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary"
          onClick={onSave}
          disabled={disabled || saving}
        >
          {saving ? "Menyimpan…" : "Simpan ke Riwayat"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => window.print()}>
          Cetak / PDF
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleCopy}
          disabled={copying}
        >
          {copying ? "Menyalin…" : "Salin WhatsApp"}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Total HPP saat ini <strong>{formatRupiah(result.totalHpp)}</strong>. Cetak/PDF membuka
        dialog print browser — pilih &quot;Save as PDF&quot;.
      </p>
    </section>
  );
}
