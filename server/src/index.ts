import express from "express";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { openDatabase } from "./db";
import { createCalculationsRouter } from "./routes/calculations";
import { createSettingsRouter } from "./routes/settings";

const here = dirname(fileURLToPath(import.meta.url));
const clientDist = resolve(here, "..", "..", "client", "dist");

export function createApp(db = openDatabase()) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/settings", createSettingsRouter(db));
  app.use("/api/calculations", createCalculationsRouter(db));

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Endpoint tidak ditemukan" } });
  });

  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(resolve(clientDist, "index.html"));
    });
  }

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan pada server" },
      });
    },
  );

  return app;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const port = Number(process.env.PORT ?? 3001);
  const app = createApp();
  app.listen(port, () => {
    console.log(`HPP server berjalan di http://localhost:${port}`);
  });
}
