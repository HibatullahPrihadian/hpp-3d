import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { createApp } from "./index";
import { openDatabase } from "./db";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const db = openDatabase(":memory:");
  const app = createApp(db);
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

const validSettings = {
  machinePrice: 13_000_000,
  machineLifeHours: 5000,
  filamentPricePerKg: 130_000,
  printerPowerKw: 0.5,
  electricityTariff: 1350,
  riskPercent: 10,
  margins: [50, 70, 80, 100, 125],
};

describe("settings API", () => {
  it("returns seeded defaults", async () => {
    const res = await fetch(`${baseUrl}/api/settings`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.machinePrice).toBe(13_000_000);
    expect(body.margins).toEqual([50, 70, 80, 100, 125]);
  });

  it("rejects invalid settings", async () => {
    const res = await fetch(`${baseUrl}/api/settings`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validSettings, machineLifeHours: 0 }),
    });
    expect(res.status).toBe(400);
  });

  it("persists settings", async () => {
    const res = await fetch(`${baseUrl}/api/settings`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validSettings, riskPercent: 12, margins: [50, 100] }),
    });
    expect(res.status).toBe(200);

    const check = await fetch(`${baseUrl}/api/settings`);
    const body = await check.json();
    expect(body.riskPercent).toBe(12);
    expect(body.margins).toEqual([50, 100]);
  });
});

describe("calculations API", () => {
  it("creates an entry using server-side math", async () => {
    const res = await fetch(`${baseUrl}/api/calculations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        label: "Model Uji",
        weightG: 55,
        printHours: 4,
        paintCost: 15_000,
        settings: validSettings,
      }),
    });

    expect(res.status).toBe(201);
    const entry = await res.json();
    expect(entry.totalHpp).toBe(38_775);
    expect(entry.result.material).toBe(7150);
    expect(entry.result.depreciation).toBe(10_400);
    expect(entry.result.electricity).toBe(2700);
    expect(entry.result.margins[0]).toEqual({
      percent: 50,
      sellingPrice: 58_163,
      netProfit: 19_388,
    });

    const list = await fetch(`${baseUrl}/api/calculations`);
    const body = await list.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].label).toBe("Model Uji");
  });

  it("rejects a mismatched total", async () => {
    const res = await fetch(`${baseUrl}/api/calculations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        weightG: 55,
        printHours: 4,
        paintCost: 15_000,
        settings: validSettings,
        totalHpp: 1,
      }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 when deleting a missing entry", async () => {
    const res = await fetch(`${baseUrl}/api/calculations/9999`, { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});
