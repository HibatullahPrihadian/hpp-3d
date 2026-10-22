import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SETTINGS,
  computeBreakdown,
  computeMargin,
  formatNumber,
  formatRupiah,
  parseNumber,
  type CalcResult,
  type HistoryEntry,
  type MarginResult,
} from "@hpp/shared";
import { ParameterForm } from "./components/ParameterForm";
import { CostBreakdown } from "./components/CostBreakdown";
import { MarginTable } from "./components/MarginTable";
import { SummaryActions } from "./components/SummaryActions";
import { HistoryList } from "./components/HistoryList";
import { useTheme } from "./hooks/useTheme";
import { useSettingsLoader } from "./hooks/useSettings";
import { useSettingsSaver } from "./hooks/useSettingsSaver";
import { useHistory } from "./hooks/useHistory";
import { api } from "./api";
import {
  buildCalcInput,
  buildSettingsPayload,
  formFromSettings,
  marginsFromSettings,
  settingsSignature,
  validateForm,
  type FormStrings,
  type MarginRow,
} from "./form";

interface Toast {
  message: string;
  tone: "success" | "error";
}

const printDateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeStyle: "short",
});

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { loaded, loadError, settled } = useSettingsLoader();

  const [form, setForm] = useState<FormStrings>(() => formFromSettings(DEFAULT_SETTINGS));
  const [margins, setMargins] = useState<MarginRow[]>(() =>
    marginsFromSettings(DEFAULT_SETTINGS),
  );
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [printedAt, setPrintedAt] = useState(() => new Date());
  const history = useHistory();

  useEffect(() => {
    if (!settled || hydrated) return;
    if (loaded) {
      setForm(formFromSettings(loaded));
      setMargins(marginsFromSettings(loaded));
    }
    setHydrated(true);
  }, [loaded, hydrated, settled]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const settingsPayload = useMemo(() => buildSettingsPayload(form, margins), [form, margins]);
  const signature = useMemo(() => settingsSignature(settingsPayload), [settingsPayload]);

  const errors = useMemo(() => validateForm(form, margins), [form, margins]);
  const hasErrors = Object.keys(errors).length > 0;

  const { saveState, saveError } = useSettingsSaver(
    settingsPayload,
    signature,
    hydrated,
    !hasErrors,
  );

  const calcInput = useMemo(() => buildCalcInput(form), [form]);
  const breakdown = useMemo(() => computeBreakdown(calcInput), [calcInput]);
  const marginResults = useMemo(
    () =>
      margins.map((row) => {
        if (row.value.trim() === "") return null;
        const percent = parseNumber(row.value);
        if (percent < 0 || percent > 1000) return null;
        return computeMargin(breakdown.totalHpp, percent);
      }),
    [breakdown.totalHpp, margins],
  );
  const result = useMemo<CalcResult>(
    () => ({
      ...breakdown,
      margins: marginResults.filter((row): row is MarginResult => row !== null),
    }),
    [breakdown, marginResults],
  );

  const notify = useCallback((message: string, tone: "success" | "error" = "success") => {
    setToast({ message, tone });
  }, []);

  const updateForm = useCallback((key: keyof FormStrings, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const updateMargin = useCallback((id: string, value: string) => {
    setMargins((current) =>
      current.map((row) => (row.id === id ? { ...row, value } : row)),
    );
  }, []);

  const addMargin = useCallback(() => {
    setMargins((current) => {
      const values = parseMarginValues(current);
      const next = values.length > 0 ? Math.max(...values) + 25 : 50;
      return [
        ...current,
        { id: `margin-${Date.now()}-${current.length}`, value: String(Number(next.toFixed(4))) },
      ];
    });
  }, []);

  const removeMargin = useCallback((id: string) => {
    setMargins((current) => (current.length <= 1 ? current : current.filter((row) => row.id !== id)));
  }, []);

  const handleSave = useCallback(async () => {
    if (hasErrors) {
      notify("Perbaiki input yang tidak valid sebelum menyimpan.", "error");
      return;
    }

    setSaving(true);
    try {
      const entry = await api.createHistory({
        label: form.label,
        weightG: calcInput.weightG,
        printHours: calcInput.printHours,
        paintCost: calcInput.paintCost,
        settings: settingsPayload,
        totalHpp: result.totalHpp,
      });
      history.setItems((current) => [entry, ...current]);
      notify("Perhitungan disimpan ke riwayat.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menyimpan riwayat.", "error");
    } finally {
      setSaving(false);
    }
  }, [calcInput, form.label, hasErrors, history, notify, result.totalHpp, settingsPayload]);

  const handleOpenHistory = useCallback(
    (entry: HistoryEntry) => {
      const nextForm: FormStrings = {
        ...formFromSettings(entry.settings),
        weightG: String(Number(entry.weightG.toFixed(4))),
        printHours: String(Number(entry.printHours.toFixed(4))),
        paintCost: String(Number(entry.paintCost.toFixed(4))),
        label: entry.label,
      };
      setForm(nextForm);
      setMargins(marginsFromSettings(entry.settings));
      notify(`Riwayat "${entry.label.trim() || `#${entry.id}`}" dibuka.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [notify],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      const removed = await history.remove(id);
      if (removed) notify("Riwayat dihapus.");
    },
    [history, notify],
  );

  const handleReset = useCallback(() => {
    const defaultForm = formFromSettings(DEFAULT_SETTINGS);
    setForm((current) => ({
      ...current,
      machinePrice: defaultForm.machinePrice,
      machineLifeHours: defaultForm.machineLifeHours,
      filamentPricePerKg: defaultForm.filamentPricePerKg,
      printerPowerKw: defaultForm.printerPowerKw,
      electricityTariff: defaultForm.electricityTariff,
      riskPercent: defaultForm.riskPercent,
    }));
    setMargins(marginsFromSettings(DEFAULT_SETTINGS));
    notify("Parameter dikembalikan ke default Excel.");
  }, [notify]);

  const handlePrint = useCallback(() => {
    setPrintedAt(new Date());
  }, []);

  useEffect(() => {
    const listener = () => handlePrint();
    window.addEventListener("beforeprint", listener);
    return () => window.removeEventListener("beforeprint", listener);
  }, [handlePrint]);

  const saveLabel =
    saveState === "saving"
      ? "Menyimpan…"
      : saveState === "saved"
        ? "Pengaturan tersimpan"
        : saveState === "error"
          ? "Gagal menyimpan"
          : "Pengaturan otomatis";

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-sm font-black text-white">
              3D
            </span>
            <div>
              <h1 className="text-base font-bold leading-tight text-slate-900 dark:text-white">
                Kalkulator HPP Cetak 3D
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Material · penyusutan · listrik · finishing
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span
              className={`hidden text-xs sm:inline ${
                saveState === "error"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
              aria-live="polite"
            >
              {saveLabel}
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
              title={theme === "dark" ? "Mode terang" : "Mode gelap"}
            >
              {theme === "dark" ? "Terang" : "Gelap"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {loadError ? (
          <div className="no-print mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
            {loadError}
          </div>
        ) : null}
        {saveError ? (
          <div className="no-print mb-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            {saveError}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] print:block">
          <div className="no-print space-y-6">
            <ParameterForm form={form} errors={errors} onChange={updateForm} onReset={handleReset} />
          </div>

          <div className="space-y-6 print:mt-0">
            <div className="print-area space-y-6">
              <div className="print-only hidden">
                <h2 className="text-lg font-bold">Estimasi HPP Cetak 3D</h2>
                <p className="text-sm">
                  {form.label.trim() || "Tanpa nama model"} · dicetak{" "}
                  {printDateFormatter.format(printedAt)}
                </p>
                <p className="mt-1 text-sm">
                  Berat {formatNumber(calcInput.weightG)} g · waktu{" "}
                  {formatNumber(calcInput.printHours)} jam · jasa cat{" "}
                  {formatRupiah(calcInput.paintCost)}
                </p>
                <p className="mt-1 text-xs">
                  Harga mesin {formatRupiah(calcInput.machinePrice)} · umur{" "}
                  {formatNumber(calcInput.machineLifeHours)} jam · filament{" "}
                  {formatRupiah(calcInput.filamentPricePerKg)}/kg · daya{" "}
                  {formatNumber(calcInput.printerPowerKw)} kW · tarif{" "}
                  {formatRupiah(calcInput.electricityTariff)}/kWh · risiko{" "}
                  {formatNumber(calcInput.riskPercent)}%
                </p>
                <hr className="mt-3 border-slate-300" />
              </div>

              <CostBreakdown result={result} riskPercent={parseNumber(form.riskPercent)} />
              <MarginTable
                rows={margins}
                results={marginResults}
                error={errors.margins}
                onChange={updateMargin}
                onAdd={addMargin}
                onRemove={removeMargin}
              />
            </div>

            <SummaryActions
              disabled={hasErrors}
              saving={saving}
              label={form.label}
              weightG={calcInput.weightG}
              printHours={calcInput.printHours}
              paintCost={calcInput.paintCost}
              result={result}
              onSave={handleSave}
              onNotify={notify}
            />

            <HistoryList
              items={history.items}
              loading={history.loading}
              error={history.error}
              busyId={history.busyId}
              onOpen={handleOpenHistory}
              onDelete={(id) => void handleDelete(id)}
              onRefresh={() => void history.refresh()}
            />
          </div>
        </div>

        <p className="no-print mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
          Rumus mengikuti HPP.xlsx: material, penyusutan mesin, listrik, jasa cat, lalu risiko.
        </p>
      </main>

      {toast ? (
        <div
          role="status"
          className={`no-print fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg ${
            toast.tone === "error"
              ? "bg-rose-600 text-white"
              : "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
