import type { CalcResult, SettingsPayload } from "./calc";

export interface HistoryEntry {
  id: number;
  label: string;
  weightG: number;
  printHours: number;
  paintCost: number;
  settings: SettingsPayload;
  result: CalcResult;
  totalHpp: number;
  createdAt: string;
}
