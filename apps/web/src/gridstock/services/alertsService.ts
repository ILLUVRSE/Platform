// src/services/alertsService.ts
import { AlertEvent, PriceAlert, Quote } from "@gridstock/types";

const ALERTS_KEY = "gridstock_alerts";
const ALERT_HISTORY_KEY = "gridstock_alert_history";
const ALERT_PREFS_KEY = "gridstock_alert_prefs";
const AUTO_SNOOZE_MS = 10 * 60 * 1000;
const MAX_HISTORY = 60;

type AlertPreferences = {
  notificationsEnabled: boolean;
};

class AlertsService {
  getAlerts(): PriceAlert[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(ALERTS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as PriceAlert[];
    } catch {
      return [];
    }
  }

  saveAlerts(alerts: PriceAlert[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  }

  getHistory(): AlertEvent[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(ALERT_HISTORY_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as AlertEvent[];
    } catch {
      return [];
    }
  }

  saveHistory(events: AlertEvent[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ALERT_HISTORY_KEY, JSON.stringify(events));
  }

  getPreferences(): AlertPreferences {
    if (typeof window === "undefined") return { notificationsEnabled: false };
    const raw = localStorage.getItem(ALERT_PREFS_KEY);
    if (!raw) return { notificationsEnabled: false };
    try {
      return { notificationsEnabled: false, ...(JSON.parse(raw) as AlertPreferences) };
    } catch {
      return { notificationsEnabled: false };
    }
  }

  savePreferences(preferences: AlertPreferences) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ALERT_PREFS_KEY, JSON.stringify(preferences));
  }

  addAlert(alert: Omit<PriceAlert, "id" | "createdAt">) {
    const current = this.getAlerts();
    const next: PriceAlert = {
      ...alert,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    this.saveAlerts([next, ...current]);
    return next;
  }

  deleteAlert(id: string) {
    const next = this.getAlerts().filter((a) => a.id !== id);
    this.saveAlerts(next);
  }

  snoozeAlert(id: string, until: number) {
    const alerts = this.getAlerts().map((a) =>
      a.id === id ? { ...a, snoozedUntil: until } : a
    );
    this.saveAlerts(alerts);
  }

  clearSnooze(id: string) {
    const alerts = this.getAlerts().map((a) =>
      a.id === id ? { ...a, snoozedUntil: undefined } : a
    );
    this.saveAlerts(alerts);
  }

  recordTriggers(triggered: PriceAlert[], quotes: Quote[]): AlertEvent[] {
    if (triggered.length === 0) return [];
    const history = this.getHistory();
    const now = Date.now();
    const nextEvents: AlertEvent[] = [];
    const recentByAlert = new Map<string, number>();
    history.forEach((event) => {
      if (!recentByAlert.has(event.alertId)) {
        recentByAlert.set(event.alertId, event.triggeredAt);
      }
    });

    triggered.forEach((alert) => {
      const lastTriggered = recentByAlert.get(alert.id);
      if (lastTriggered && now - lastTriggered < AUTO_SNOOZE_MS / 2) return;
      const quote = quotes.find((q) => q.symbol === alert.symbol);
      const event: AlertEvent = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        alertId: alert.id,
        symbol: alert.symbol,
        target: alert.target,
        direction: alert.direction,
        triggeredAt: now,
        price: quote?.price ?? 0,
      };
      nextEvents.push(event);
    });

    if (nextEvents.length > 0) {
      const combined = [...nextEvents, ...history].slice(0, MAX_HISTORY);
      this.saveHistory(combined);
    }
    return nextEvents;
  }

  evaluate(quotes: Quote[]): { triggered: PriceAlert[]; alerts: PriceAlert[] } {
    const alerts = this.getAlerts();
    const now = Date.now();
    const triggered: PriceAlert[] = [];
    const updated = alerts.map((alert) => {
      if (alert.snoozedUntil && alert.snoozedUntil > now) {
        return alert;
      }
      const q = quotes.find((qq) => qq.symbol === alert.symbol);
      if (!q) {
        return alert;
      }
      const hit =
        alert.direction === "above" ? q.price >= alert.target : q.price <= alert.target;
      if (hit) {
        triggered.push(alert);
        return {
          ...alert,
          lastTriggeredAt: now,
          snoozedUntil: now + AUTO_SNOOZE_MS,
        };
      }
      return alert;
    });
    if (triggered.length > 0) this.saveAlerts(updated);
    return { triggered, alerts: updated };
  }
}

export const alertsService = new AlertsService();
