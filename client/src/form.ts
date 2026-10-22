import {
  DEFAULT_JOB,
  parseNumber,
  type CalcInput,
  type SettingsPayload,
} from "@hpp/shared";

export interface FormStrings {
  machinePrice: string;
  machineLifeHours: string;
  filamentPricePerKg: string;
  printerPowerKw: string;
  electricityTariff: string;
  riskPercent: string;
  weightG: string;
  printHours: string;
  paintCost: string;
  label: string;
}

export interface MarginRow {
  id: string;
  value: string;
}

export type FormErrors = Partial<Record<keyof FormStrings | "margins", string>>;

const asString = (value: number): string => String(Number(value.toFixed(4)));

export function formFromSettings(settings: SettingsPayload): FormStrings {
  return {
    machinePrice: asString(settings.machinePrice),
    machineLifeHours: asString(settings.machineLifeHours),
    filamentPricePerKg: asString(settings.filamentPricePerKg),
    printerPowerKw: asString(settings.printerPowerKw),
    electricityTariff: asString(settings.electricityTariff),
    riskPercent: asString(settings.riskPercent),
    weightG: asString(DEFAULT_JOB.weightG ?? 0),
    printHours: asString(DEFAULT_JOB.printHours ?? 0),
    paintCost: asString(DEFAULT_JOB.paintCost ?? 0),
    label: "",
  };
}

export function marginsFromSettings(settings: SettingsPayload): MarginRow[] {
  return settings.margins.map((value, index) => ({
    id: `margin-${index}-${value}`,
    value: asString(value),
  }));
}

export function parseMarginValues(margins: MarginRow[]): number[] {
  return margins
    .filter((row) => row.value.trim() !== "")
    .map((row) => parseNumber(row.value));
}

export function buildCalcInput(form: FormStrings): CalcInput {
  return {
    machinePrice: parseNumber(form.machinePrice),
    machineLifeHours: parseNumber(form.machineLifeHours),
    filamentPricePerKg: parseNumber(form.filamentPricePerKg),
    printerPowerKw: parseNumber(form.printerPowerKw),
    electricityTariff: parseNumber(form.electricityTariff),
    riskPercent: parseNumber(form.riskPercent),
    weightG: parseNumber(form.weightG),
    printHours: parseNumber(form.printHours),
    paintCost: parseNumber(form.paintCost),
  };
}

export function buildSettingsPayload(
  form: FormStrings,
  margins: MarginRow[],
): SettingsPayload {
  const input = buildCalcInput(form);
  return {
    machinePrice: input.machinePrice,
    machineLifeHours: input.machineLifeHours,
    filamentPricePerKg: input.filamentPricePerKg,
    printerPowerKw: input.printerPowerKw,
    electricityTariff: input.electricityTariff,
    riskPercent: input.riskPercent,
    margins: parseMarginValues(margins),
  };
}

export function validateForm(form: FormStrings, margins: MarginRow[]): FormErrors {
  const input = buildCalcInput(form);
  const errors: FormErrors = {};

  if (parseNumber(form.machinePrice) < 0) errors.machinePrice = "Tidak boleh negatif";
  if (input.machineLifeHours <= 0)
    errors.machineLifeHours = "Umur mesin harus lebih dari 0";
  if (input.filamentPricePerKg <= 0)
    errors.filamentPricePerKg = "Harga filament harus lebih dari 0";
  if (input.printerPowerKw < 0) errors.printerPowerKw = "Tidak boleh negatif";
  if (input.electricityTariff < 0) errors.electricityTariff = "Tidak boleh negatif";
  if (input.riskPercent < 0 || input.riskPercent > 1000)
    errors.riskPercent = "Risiko harus antara 0% dan 1000%";
  if (input.weightG < 0) errors.weightG = "Berat tidak boleh negatif";
  if (input.printHours < 0) errors.printHours = "Waktu cetak tidak boleh negatif";
  if (input.paintCost < 0) errors.paintCost = "Biaya cat tidak boleh negatif";

  const marginValues = parseMarginValues(margins);
  if (margins.some((row) => row.value.trim() === "")) {
    errors.margins = "Setiap baris persentase harus diisi";
  } else if (marginValues.length === 0) {
    errors.margins = "Minimal satu persentase";
  } else if (marginValues.some((value) => value < 0 || value > 1000)) {
    errors.margins = "Persentase harus antara 0% dan 1000%";
  } else if (new Set(marginValues).size !== marginValues.length) {
    errors.margins = "Persentase tidak boleh duplikat";
  }

  return errors;
}

export function settingsSignature(settings: SettingsPayload): string {
  return JSON.stringify(settings);
}
