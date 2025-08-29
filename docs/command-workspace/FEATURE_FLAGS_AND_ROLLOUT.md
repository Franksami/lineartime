# Feature Flags & Rollout Strategy

## Flags
- `shell.commandWorkspace`
- `views.week`
- `views.day`
- `views.monthStrip`
- `views.quarter`
- `views.planner`
- `views.notes`
- `views.mailbox`
- `views.automations`
- `views.yearLens`
- `dock.ai`
- `dock.details`
- `dock.conflicts`
- `dock.capacity`
- `dock.backlinks`
- `omnibox.enabled`
- `cv.enabled`

## Environments
- dev: rapid iteration, most flags ON by default (except `cv.enabled`)
- staging: selective flags ON for QA/UAT
- production: progressive rollout per slice

## Phased Rollout
- P0: `shell.commandWorkspace`, `views.week`, `views.planner`, `dock.details`, `dock.ai` (stubs)
- P1: `views.monthStrip`, `views.quarter`, `views.notes`, `views.mailbox`
- P2: `views.automations`, `views.yearLens` (optional), omnibox full, AI agents live
- P3: `cv.enabled` with consent UI; saved layouts; advanced analytics

## Guardrails
- CV disabled by default; requires explicit consent flows
- Destructive/bulk AI tools gated by confirmations
- Observability: latency, apply/undo, acceptance rates, consent logs

## Exit Criteria per Phase
- KPIs at or above targets for 3 consecutive CI runs and staging checks
- No P0/P1 a11y, privacy, or perf violations
