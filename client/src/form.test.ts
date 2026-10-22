import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "@hpp/shared";
import {
  buildCalcInput,
  buildSettingsPayload,
  formFromSettings,
  marginsFromSettings,
  validateForm,
  type FormStrings,
} from "./form";

const baseForm = (): FormStrings => formFromSettings(DEFAULT_SETTINGS);
const baseMargins = () => marginsFromSettings(DEFAULT_SETTINGS);

describe("formFromSettings", () => {
  it("hydrates machine settings and default job values", () => {
    const form = baseForm();
    expect(form.machinePrice).toBe("13000000");
    expect(form.printerPowerKw).toBe("0.5");
    expect(form.riskPercent).toBe("10");
    expect(form.weightG).toBe("55");
    expect(form.printHours).toBe("4");
    expect(form.paintCost).toBe("15000");
    expect(form.label).toBe("");
  });
});

describe("buildCalcInput", () => {
  it("parses Indonesian formatted input", () => {
    const form: FormStrings = {
      ...baseForm(),
      machinePrice: "Rp 13.000.000",
      filamentPricePerKg: "130.000",
      printerPowerKw: "0,5",
      electricityTariff: "1.350",
      printHours: "4",
    };
    const input = buildCalcInput(form);
    expect(input.machinePrice).toBe(13_000_000);
    expect(input.filamentPricePerKg).toBe(130_000);
    expect(input.printerPowerKw).toBe(0.5);
    expect(input.electricityTariff).toBe(1350);
  });
});

describe("validateForm", () => {
  it("accepts the Excel defaults", () => {
    expect(validateForm(baseForm(), baseMargins())).toEqual({});
  });

  it("rejects zero machine life", () => {
    const errors = validateForm({ ...baseForm(), machineLifeHours: "0" }, baseMargins());
    expect(errors.machineLifeHours).toBeTruthy();
  });

  it("rejects duplicate margins", () => {
    const margins = [
      { id: "a", value: "50" },
      { id: "b", value: "50" },
    ];
    const errors = validateForm(baseForm(), margins);
    expect(errors.margins).toContain("duplikat");
  });

  it("rejects empty margin rows", () => {
    const margins = [{ id: "a", value: "" }];
    const errors = validateForm(baseForm(), margins);
    expect(errors.margins).toBeTruthy();
  });

  it("rejects negative job values", () => {
    const errors = validateForm(
      { ...baseForm(), weightG: "-1", printHours: "-2", paintCost: "-3" },
      baseMargins(),
    );
    expect(errors.weightG).toBeTruthy();
    expect(errors.printHours).toBeTruthy();
    expect(errors.paintCost).toBeTruthy();
  });
});

describe("buildSettingsPayload", () => {
  it("keeps margin order and numeric values", () => {
    const margins = [
      { id: "a", value: "150" },
      { id: "b", value: "12,5" },
    ];
    const payload = buildSettingsPayload(baseForm(), margins);
    expect(payload.margins).toEqual([150, 12.5]);
    expect(payload.machineLifeHours).toBe(5000);
  });
});
