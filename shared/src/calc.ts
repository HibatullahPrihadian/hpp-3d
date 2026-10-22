export interface MachineSettings {
  machinePrice: number;
  machineLifeHours: number;
  filamentPricePerKg: number;
  printerPowerKw: number;
  electricityTariff: number;
  riskPercent: number;
}

export interface JobInput {
  label?: string;
  weightG: number;
  printHours: number;
  paintCost: number;
}

export type CalcInput = MachineSettings & JobInput;

export interface CostBreakdown {
  material: number;
  depreciation: number;
  electricity: number;
  paint: number;
  subtotal: number;
  riskAmount: number;
  totalHpp: number;
}

export interface MarginResult {
  percent: number;
  sellingPrice: number;
  netProfit: number;
}

export interface CalcResult extends CostBreakdown {
  margins: MarginResult[];
}

export interface SettingsPayload extends MachineSettings {
  margins: number[];
}

export const DEFAULT_SETTINGS: SettingsPayload = {
  machinePrice: 13_000_000,
  machineLifeHours: 5000,
  filamentPricePerKg: 130_000,
  printerPowerKw: 0.5,
  electricityTariff: 1350,
  riskPercent: 10,
  margins: [50, 70, 80, 100, 125],
};

export const DEFAULT_JOB: JobInput = {
  label: "",
  weightG: 55,
  printHours: 4,
  paintCost: 15_000,
};

const roundRupiah = (value: number): number => Math.round(value + 1e-9);

export const riskAmountOf = (subtotal: number, riskPercent: number): number =>
  roundRupiah((subtotal * riskPercent) / 100);

export function computeBreakdown(input: CalcInput): CostBreakdown {
  const material = roundRupiah((input.weightG / 1000) * input.filamentPricePerKg);
  const depreciation =
    input.machineLifeHours > 0
      ? roundRupiah((input.machinePrice / input.machineLifeHours) * input.printHours)
      : 0;
  const electricity = roundRupiah(
    input.printerPowerKw * input.printHours * input.electricityTariff,
  );
  const paint = roundRupiah(input.paintCost);

  const subtotal = material + depreciation + electricity + paint;
  const riskAmount = riskAmountOf(subtotal, input.riskPercent);

  return {
    material,
    depreciation,
    electricity,
    paint,
    subtotal,
    riskAmount,
    totalHpp: subtotal + riskAmount,
  };
}

export function computeMargin(totalHpp: number, percent: number): MarginResult {
  const sellingPrice = roundRupiah(totalHpp * (1 + percent / 100));
  return {
    percent,
    sellingPrice,
    netProfit: sellingPrice - totalHpp,
  };
}

export function computeResult(input: CalcInput, margins: number[]): CalcResult {
  const breakdown = computeBreakdown(input);
  return {
    ...breakdown,
    margins: margins.map((percent) => computeMargin(breakdown.totalHpp, percent)),
  };
}
