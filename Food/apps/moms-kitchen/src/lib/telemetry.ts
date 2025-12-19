const KEY = 'mk_telemetry';

export function isTelemetryEnabled() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEY) === 'true';
}

export function setTelemetry(enabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, enabled ? 'true' : 'false');
}

export function logEvent(event: string, payload?: Record<string, any>) {
  if (!isTelemetryEnabled()) return;
  // For now, just log to console as a stub
  // eslint-disable-next-line no-console
  console.log('[telemetry]', event, payload || {});
}
