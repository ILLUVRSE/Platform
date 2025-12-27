# Observability

## Metrics
- AgentManager: queue depth, job latency, failure rate.
- Kernel: sign/verify latency and error rate.
- World State: active connections, room counts.

## Logging
- Structured logs from all services.
- Centralized aggregation (Datadog/Loki/ELK).

## Tracing
- OpenTelemetry across API boundaries.
- Propagate trace IDs in agent actions and marketplace flows.

## Alerts
- Job failure rate > 5%.
- Kernel signing errors.
- World state disconnect spikes.
