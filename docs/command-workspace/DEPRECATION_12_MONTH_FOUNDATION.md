# Deprecation: 12‑Month Horizontal Foundation (as Shell)

Status: Enforced by governance; Year Lens only

## Decision
- The locked 12‑month horizontal foundation is deprecated as a global shell constraint.
- It is re‑scoped as an optional view only: `views/year-lens/YearLensView.tsx`.
- Default experience is the Command Workspace (Sidebar + Tabs + Context Dock).

## Rationale
- Modern productivity apps (Notion/Cron/Obsidian/Motion/Sunsama) organize around a workspace shell, not a single fixed layout.
- The 12‑row constraint blocked composability, AI surfaces, and consistent scaffolding across views.

## What Stays
- The Year Lens view remains available for year‑level insights.
- Its rendering rules and performance optimizations are preserved within `views/year-lens/*` only.

## What Changes
- All new UI surfaces must be implemented as views or dock panels under the Command Workspace shell.
- No other view, panel, or shell code may depend on 12‑row invariants.

## Enforcement (summarized)
- ESLint/Biome: no‑restricted‑imports to ban importing `LinearCalendarHorizontal` outside `views/year-lens/*`.
- Dependency‑cruiser: forbid cross‑boundary imports.
- CI grep: block accidental legacy imports.

## Communication
- Release notes: explicitly state the new shell norms and optional Year Lens.
- Developer onboarding links to PRD and governance docs.
