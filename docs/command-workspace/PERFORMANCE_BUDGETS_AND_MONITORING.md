# Performance Budgets & Monitoring

## Budgets
- Initial render < 500ms
- View switch < 200ms
- Panel toggle < 100ms
- 60fps scroll/drag/animations
- Bundles: shell <150KB; per‑view <100KB; per‑panel <50KB
- Omnibox first token < 400ms; agent suggestion < 2s; tool exec < 5s

## Techniques
- Code‑split per view and dock panel
- Virtualized lists/grids
- Memoize panels and selectors
- Avoid layout thrash; prefer transform‑based motion
- Pre-warm legal endpoints (AI) judiciously

## Dev Instrumentation
- FPS/memory overlay in development
- Console timing for palette actions and view switches
- Warnings when thresholds are exceeded

## CI Monitoring
- Bundle size checks (per‑view, per‑panel)
- Playwright perf snapshots on core routes
- Lighthouse budget assertions (local or CI)

## Alerts & Dashboards
- Track `command.run` latency, `omnibox.intent_routed` first token time
- Track `ai.agent_apply` latency and acceptance rate
- Dashboard for budget violations per commit
