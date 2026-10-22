import { Router } from "express";
import { loadSettings, saveSettings, type Database } from "../db";
import { settingsSchema } from "../validate";

export function createSettingsRouter(db: Database): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json(loadSettings(db));
  });

  router.put("/", (req, res) => {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Pengaturan tidak valid",
          fields: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    res.json(saveSettings(db, parsed.data));
  });

  return router;
}
