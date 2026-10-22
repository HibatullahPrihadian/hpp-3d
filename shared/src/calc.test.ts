import { describe, expect, it } from "vitest";
import { computeBreakdown, computeMargin, computeResult, type CalcInput } from "./calc";

const excelInput: CalcInput = {
  machinePrice: 13_000_000,
  machineLifeHours: 5000,
  filamentPricePerKg: 130_000,
  printerPowerKw: 0.5,
  electricityTariff: 1350,
  riskPercent: 10,
  weightG: 55,
  printHours: 4,
  paintCost: 15_000,
};

const excelMargins = [50, 70, 100, 125, 80];

describe("computeBreakdown", () => {
  it("matches the HPP.xlsx cost rows", () => {
    const result = computeBreakdown(excelInput);

    expect(result.material).toBe(7150);
    expect(result.depreciation).toBe(10400);
    expect(result.electricity).toBe(2700);
    expect(result.paint).toBe(15000);
    expect(result.subtotal).toBe(35250);
    expect(result.riskAmount).toBe(3525);
    expect(result.totalHpp).toBe(38775);
  });

  it("rounds half values up like the spreadsheet", () => {
    const result = computeBreakdown({
      ...excelInput,
      weightG: 1,
      filamentPricePerKg: 50_500,
    });
    expect(result.material).toBe(51);
  });

  it("handles zero print time and zero weight", () => {
    const result = computeBreakdown({
      ...excelInput,
      weightG: 0,
      printHours: 0,
      paintCost: 0,
      riskPercent: 0,
    });

    expect(result.material).toBe(0);
    expect(result.depreciation).toBe(0);
    expect(result.electricity).toBe(0);
    expect(result.subtotal).toBe(0);
    expect(result.totalHpp).toBe(0);
  });
});

describe("computeMargin", () => {
  const totalHpp = 38_775;

  it.each([
    [50, 58_163, 19_388],
    [70, 65_918, 27_143],
    [80, 69_795, 31_020],
    [100, 77_550, 38_775],
    [125, 87_244, 48_469],
  ])("percent %i -> price %i and net %i", (percent, price, net) => {
    const result = computeMargin(totalHpp, percent);
    expect(result.sellingPrice).toBe(price);
    expect(result.netProfit).toBe(net);
  });

  it("supports decimal percentages", () => {
    const result = computeMargin(10_000, 12.5);
    expect(result.sellingPrice).toBe(11_250);
    expect(result.netProfit).toBe(1250);
  });
});

describe("computeResult", () => {
  it("builds the margin table in the given order", () => {
    const result = computeResult(excelInput, excelMargins);
    expect(result.margins.map((row) => row.percent)).toEqual([50, 70, 100, 125, 80]);
    expect(result.margins.map((row) => row.sellingPrice)).toEqual([
      58_163, 65_918, 77_550, 87_244, 69_795,
    ]);
  });
});
