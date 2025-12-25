// src/app/settings/page.tsx
"use client";

import React, { useState } from "react";
import { settingsService, GridStockSettings } from "@gridstock/services/settingsService";
import { ViewDensitySetting } from "@gridstock/types/settings";
import { Card } from "@gridstock/components/ui/Card";
import { Button } from "@gridstock/components/ui/Button";

const POLL_OPTIONS = [2000, 4000, 8000, 12000];

export default function SettingsPage() {
  const [settings, setSettings] = useState<GridStockSettings | null>(() => settingsService.get());
  const [saving, setSaving] = useState(false);

  const updateSetting = (key: keyof GridStockSettings, value: number | ViewDensitySetting) => {
    if (!settings) return;
    const next = { ...settings, [key]: value } as GridStockSettings;
    setSettings(next);
  };

  const handleSave = () => {
    if (!settings) return;
    setSaving(true);
    settingsService.save(settings);
    setTimeout(() => setSaving(false), 300);
  };

  if (!settings) return <div className="p-8 text-gray-500">Loading settings...</div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-gray-400">Control how GridStock refreshes and displays data.</p>
      </header>

      <Card className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Refresh cadence</h2>
          <p className="text-sm text-gray-500">Default poll interval for new grids.</p>
          <div className="mt-3 flex gap-2 flex-wrap">
            {POLL_OPTIONS.map((ms) => (
              <button
                key={ms}
                onClick={() => updateSetting("defaultPollMs", ms)}
                className={`px-3 py-2 rounded border ${settings.defaultPollMs === ms ? "border-green-500 text-white bg-green-500/10" : "border-gray-700 text-gray-300 hover:border-gray-500"}`}
              >
                {(ms / 1000).toFixed(1)}s
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-1">View density</h2>
          <p className="text-sm text-gray-500">Default tile layout on the dashboard.</p>
          <div className="mt-3 flex gap-2">
            {(["regular", "compact"] as ViewDensitySetting[]).map((opt) => (
              <button
                key={opt}
                onClick={() => updateSetting("viewDensity", opt)}
                className={`px-3 py-2 rounded border ${settings.viewDensity === opt ? "border-green-500 text-white bg-green-500/10" : "border-gray-700 text-gray-300 hover:border-gray-500"}`}
              >
                {opt === "regular" ? "Spacious" : "Compact"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
