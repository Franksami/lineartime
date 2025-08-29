# Error Handling, Resilience & Offline

## Error Boundaries
- Shell-level boundary: show fallback UI; recover to `/app`, log + notify
- View-level boundary: fallback per view; preserve URL state
- Panel-level boundary: isolate failures without collapsing shell
- AI tool errors: show explanation, propose alternatives, retry options

## Resilience Patterns
- Circuit breakers around flaky services (AI/CV/backends)
- Exponential backoff retries with jitter; cap attempts; user feedback
- Graceful degradation: disable non-essential panels/features when budget exhausted

## Offline Strategy
- Service worker caches shell scaffolding and static assets
- Queue entity ops (create/update/delete) for sync; show sync status
- Conflict resolution strategy on reconnection (prefer server, merge hints)
- CV disabled when offline; show indicator; resume when online

## Logging & Observability
- Structured error logs with correlation ids
- Metrics: error rates per view/panel, retry counts, breaker trips
- Alerts on spikes; capture user action trail (sanitized) for diagnosis
