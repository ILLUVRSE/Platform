// src/services/alertsService.ts
import { PriceAlert, Quote } from "@/types";

const ALERTS_KEY = "gridstock_alerts";

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

  evaluate(quotes: Quote[]): { triggered: PriceAlert[]; remaining: PriceAlert[] } {
    const alerts = this.getAlerts();
    const triggered: PriceAlert[] = [];
    const remaining: PriceAlert[] = [];
    alerts.forEach((alert) => {
      const q = quotes.find((qq) => qq.symbol === alert.symbol);
      if (!q) {
        remaining.push(alert);
        return;
      }
      const hit =
        alert.direction === "above" ? q.price >= alert.target : q.price <= alert.target;
      if (hit) triggered.push(alert);
      else remaining.push(alert);
    });
    if (triggered.length > 0) {
      this.saveAlerts(remaining);
    }
    return { triggered, remaining };
  }
}

export const alertsService = new AlertsService();
