type AuditEvent = {
  type: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp?: string;
};

export function emitAudit(event: AuditEvent) {
  const payload = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString()
  };
  // For now, emit to server logs; future: forward to upstream audit sink.
  console.info("[audit]", JSON.stringify(payload));
}
