// src/services/settingsService.ts
import { ViewDensitySetting } from "@/types/settings";

const SETTINGS_KEY = "gridstock_settings";

export interface GridStockSettings {
  defaultPollMs: number;
  viewDensity: ViewDensitySetting;
}

const DEFAULT_SETTINGS: GridStockSettings = {
  defaultPollMs: 4000,
  viewDensity: "regular",
};

class SettingsService {
  get(): GridStockSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(raw) as GridStockSettings;
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  save(settings: Partial<GridStockSettings>) {
    if (typeof window === "undefined") return;
    const next = { ...this.get(), ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }
}

export const settingsService = new SettingsService();
