import { Router } from "express";
import { computeResult, type CalcResult, type HistoryEntry, type SettingsPayload } from "@hpp/shared";
import type { Database } from "../db";
import { calculationSchema } from "../validate";

interface CalculationRow {
  id: number;
  label: string;
  weight_g: number;
  print_hours: number;
  paint_cost: number;
  settings_snapshot: string;
  result_snapshot: string;
  total_hpp: number;
  created_at: string;
}

function toEntry(row: CalculationRow): HistoryEntry {
  return {
    id: row.id,
    label: row.label,
    weightG: row.weight_g,
    printHours: row.print_hours,
    paintCost: row.paint_cost,
    settings: JSON.parse(row.settings_snapshot) as SettingsPayload,
    result: JSON.parse(row.result_snapshot) as CalcResult,
    totalHpp: row.total_hpp,
    createdAt: row.created_at,
  };
}

export function createCalculationsRouter(db: Database): Router {
  const router = Router();

  router.get("/", (req, res) => {
    const rawLimit = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 200) : 50;
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const rows = query
      ? (db
          .prepare(
            "SELECT * FROM calculations WHERE label LIKE ? ORDER BY id DESC LIMIT ?",
          )
          .all(`%${query}%`, limit) as unknown as CalculationRow[])
      : (db
          .prepare("SELECT * FROM calculations ORDER BY id DESC LIMIT ?")
          .all(limit) as unknown as CalculationRow[]);

    res.json({ items: rows.map(toEntry) });
  });

  router.post("/", (req, res) => {
    const parsed = calculationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Data perhitungan tidak valid",
          fields: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const { label, weightG, printHours, paintCost, settings, totalHpp } = parsed.data;
    const result = computeResult(
      {
        machinePrice: settings.machinePrice,
        machineLifeHours: settings.machineLifeHours,
        filamentPricePerKg: settings.filamentPricePerKg,
        printerPowerKw: settings.printerPowerKw,
        electricityTariff: settings.electricityTariff,
        riskPercent: settings.riskPercent,
        weightG,
        printHours,
        paintCost,
      },
      settings.margins,
    );

    if (typeof totalHpp === "number" && totalHpp !== result.totalHpp) {
      res.status(400).json({
        error: {
          code: "TOTAL_MISMATCH",
          message: "Total HPP tidak cocok dengan perhitungan server",
        },
      });
      return;
    }

    const createdAt = new Date().toISOString();
    const info = db
      .prepare(
        `INSERT INTO calculations
           (label, weight_g, print_hours, paint_cost, settings_snapshot, result_snapshot, total_hpp, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        label ?? "",
        weightG,
        printHours,
        paintCost,
        JSON.stringify(settings),
        JSON.stringify(result),
        result.totalHpp,
        createdAt,
      );

    const row = db
      .prepare("SELECT * FROM calculations WHERE id = ?")
      .get(Number(info.lastInsertRowid)) as unknown as CalculationRow | undefined;

    if (!row) {
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Gagal membaca data tersimpan" },
      });
      return;
    }

    res.status(201).json(toEntry(row));
  });

  router.delete("/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        error: { code: "INVALID_ID", message: "ID riwayat tidak valid" },
      });
      return;
    }

    const info = db.prepare("DELETE FROM calculations WHERE id = ?").run(id);
    if (info.changes === 0) {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "Riwayat tidak ditemukan" },
      });
      return;
    }

    res.status(204).end();
  });

  return router;
}
