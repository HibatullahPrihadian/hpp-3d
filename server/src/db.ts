import type { DatabaseSync as DatabaseSyncType } from "node:sqlite";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_SETTINGS, type SettingsPayload } from "@hpp/shared";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");

const here = dirname(fileURLToPath(import.meta.url));

export const defaultDatabasePath = resolve(here, "..", "data", "hpp.db");

export type Database = DatabaseSyncType;

export function openDatabase(path = process.env.DATABASE_PATH ?? defaultDatabasePath): Database {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }

  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      machine_price REAL NOT NULL,
      machine_life_hours REAL NOT NULL,
      filament_price_per_kg REAL NOT NULL,
      printer_power_kw REAL NOT NULL,
      electricity_tariff REAL NOT NULL,
      risk_percent REAL NOT NULL,
      margins TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL DEFAULT '',
      weight_g REAL NOT NULL,
      print_hours REAL NOT NULL,
      paint_cost REAL NOT NULL,
      settings_snapshot TEXT NOT NULL,
      result_snapshot TEXT NOT NULL,
      total_hpp REAL NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const row = db.prepare("SELECT id FROM settings WHERE id = 1").get();
  if (!row) {
    saveSettings(db, DEFAULT_SETTINGS);
  }
}

export function loadSettings(db: Database): SettingsPayload {
  const row = db
    .prepare(
      `SELECT machine_price, machine_life_hours, filament_price_per_kg,
              printer_power_kw, electricity_tariff, risk_percent, margins
       FROM settings WHERE id = 1`,
    )
    .get() as Record<string, unknown> | undefined;

  if (!row) {
    saveSettings(db, DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, margins: [...DEFAULT_SETTINGS.margins] };
  }

  return {
    machinePrice: Number(row.machine_price),
    machineLifeHours: Number(row.machine_life_hours),
    filamentPricePerKg: Number(row.filament_price_per_kg),
    printerPowerKw: Number(row.printer_power_kw),
    electricityTariff: Number(row.electricity_tariff),
    riskPercent: Number(row.risk_percent),
    margins: parseMargins(String(row.margins)),
  };
}

export function saveSettings(db: Database, settings: SettingsPayload): SettingsPayload {
  db.prepare(
    `INSERT INTO settings (id, machine_price, machine_life_hours, filament_price_per_kg,
                           printer_power_kw, electricity_tariff, risk_percent, margins, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       machine_price = excluded.machine_price,
       machine_life_hours = excluded.machine_life_hours,
       filament_price_per_kg = excluded.filament_price_per_kg,
       printer_power_kw = excluded.printer_power_kw,
       electricity_tariff = excluded.electricity_tariff,
       risk_percent = excluded.risk_percent,
       margins = excluded.margins,
       updated_at = excluded.updated_at`,
  ).run(
    settings.machinePrice,
    settings.machineLifeHours,
    settings.filamentPricePerKg,
    settings.printerPowerKw,
    settings.electricityTariff,
    settings.riskPercent,
    JSON.stringify(settings.margins),
    new Date().toISOString(),
  );

  return loadSettings(db);
}

function parseMargins(raw: string): number[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const margins = parsed.filter(
        (value): value is number => typeof value === "number" && Number.isFinite(value),
      );
      if (margins.length > 0) return margins;
    }
  } catch {
    // fall through to defaults
  }
  return [...DEFAULT_SETTINGS.margins];
}
