import { z } from "zod";

const finiteNumber = (max = Number.MAX_SAFE_INTEGER) =>
  z
    .number({ invalid_type_error: "Harus berupa angka" })
    .finite("Harus berupa angka valid")
    .min(0, "Tidak boleh negatif")
    .max(max, "Nilai terlalu besar");

export const settingsSchema = z.object({
  machinePrice: finiteNumber(),
  machineLifeHours: finiteNumber().min(0.01, "Umur mesin harus lebih dari 0"),
  filamentPricePerKg: finiteNumber().min(0.01, "Harga filament harus lebih dari 0"),
  printerPowerKw: finiteNumber(1000),
  electricityTariff: finiteNumber(),
  riskPercent: finiteNumber(1000),
  margins: z
    .array(finiteNumber(1000))
    .min(1, "Minimal satu persentase")
    .max(20, "Maksimal 20 persentase")
    .refine((values) => new Set(values).size === values.length, "Persentase tidak boleh duplikat"),
});

export const calculationSchema = z.object({
  label: z.string().trim().max(120, "Label maksimal 120 karakter").optional().default(""),
  weightG: finiteNumber(),
  printHours: finiteNumber(),
  paintCost: finiteNumber(),
  settings: settingsSchema,
  totalHpp: finiteNumber().optional(),
});

export type CalculationRequest = z.infer<typeof calculationSchema>;
