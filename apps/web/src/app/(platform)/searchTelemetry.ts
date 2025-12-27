export const SEARCH_TELEMETRY_EVENT = "illuvrse-search-telemetry";

type SearchTelemetryPayload = Record<string, unknown>;

export const trackSearchEvent = (name: string, payload?: SearchTelemetryPayload) => {
  if (typeof window === "undefined") return;
  const detail = {
    name,
    payload: payload ?? {},
    timestamp: Date.now()
  };
  window.dispatchEvent(new CustomEvent(SEARCH_TELEMETRY_EVENT, { detail }));
};
