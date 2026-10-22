import { formatRupiah, parseNumber } from "@hpp/shared";
import { NumberField } from "./NumberField";
import type { FormErrors, FormStrings } from "../form";

interface ParameterFormProps {
  form: FormStrings;
  errors: FormErrors;
  onChange: (key: keyof FormStrings, value: string) => void;
  onReset: () => void;
}

export function ParameterForm({ form, errors, onChange, onReset }: ParameterFormProps) {
  const materialPreview =
    (parseNumber(form.weightG) / 1000) * parseNumber(form.filamentPricePerKg);
  const life = parseNumber(form.machineLifeHours);
  const depreciationPreview =
    life > 0
      ? (parseNumber(form.machinePrice) / life) * parseNumber(form.printHours)
      : 0;

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Parameter Mesin &amp; Listrik
          </h2>
          <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={onReset}>
            Reset ke default
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            id="machinePrice"
            label="Harga Mesin"
            prefix="Rp"
            value={form.machinePrice}
            onChange={(value) => onChange("machinePrice", value)}
            error={errors.machinePrice}
            hint={`${formatRupiah(parseNumber(form.machinePrice))}`}
          />
          <NumberField
            id="machineLifeHours"
            label="Estimasi Umur Mesin"
            suffix="jam"
            value={form.machineLifeHours}
            onChange={(value) => onChange("machineLifeHours", value)}
            error={errors.machineLifeHours}
            hint="Total jam operasional sebelum mesin dianggap habis"
          />
          <NumberField
            id="filamentPricePerKg"
            label="Harga Filament per Kg"
            prefix="Rp"
            value={form.filamentPricePerKg}
            onChange={(value) => onChange("filamentPricePerKg", value)}
            error={errors.filamentPricePerKg}
            hint={formatRupiah(parseNumber(form.filamentPricePerKg))}
          />
          <NumberField
            id="printerPowerKw"
            label="Daya Printer"
            suffix="kW"
            value={form.printerPowerKw}
            onChange={(value) => onChange("printerPowerKw", value)}
            error={errors.printerPowerKw}
            hint="Contoh: 0,5 untuk printer 500 watt"
          />
          <NumberField
            id="electricityTariff"
            label="Tarif Listrik per kWh"
            prefix="Rp"
            value={form.electricityTariff}
            onChange={(value) => onChange("electricityTariff", value)}
            error={errors.electricityTariff}
            hint={formatRupiah(parseNumber(form.electricityTariff))}
          />
          <NumberField
            id="riskPercent"
            label="Risiko / Cadangan"
            suffix="%"
            value={form.riskPercent}
            onChange={(value) => onChange("riskPercent", value)}
            error={errors.riskPercent}
            hint="Ditambahkan ke subtotal (default 10%)"
          />
        </div>

        <dl className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-2 dark:bg-slate-950/60 dark:text-slate-400">
          <div className="flex justify-between gap-2">
            <dt>Material per model</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">
              {formatRupiah(materialPreview)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Penyusutan per model</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">
              {formatRupiah(depreciationPreview)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Detail Pekerjaan
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="label">
              Nama Model (opsional)
            </label>
            <input
              id="label"
              className="field-input"
              value={form.label}
              onChange={(event) => onChange("label", event.target.value)}
              placeholder="Contoh: Vas Geometris 15 cm"
              maxLength={120}
            />
          </div>
          <NumberField
            id="weightG"
            label="Berat Model"
            suffix="gram"
            value={form.weightG}
            onChange={(value) => onChange("weightG", value)}
            error={errors.weightG}
            hint="Berat filament terpakai (termasuk support)"
          />
          <NumberField
            id="printHours"
            label="Waktu Cetak"
            suffix="jam"
            value={form.printHours}
            onChange={(value) => onChange("printHours", value)}
            error={errors.printHours}
            hint="Gunakan desimal, mis. 2,5 untuk 2 jam 30 menit"
          />
          <NumberField
            id="paintCost"
            label="Jasa Cat / Finishing"
            prefix="Rp"
            value={form.paintCost}
            onChange={(value) => onChange("paintCost", value)}
            error={errors.paintCost}
            hint="Isi 0 jika tanpa finishing"
          />
        </div>
      </section>
    </div>
  );
}
