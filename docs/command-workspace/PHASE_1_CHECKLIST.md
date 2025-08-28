# Phase 1 Implementation Checklist (Docs-First)

Scope: Shell scaffolding + WeekView + PlannerView + Command Palette + Dock stubs

## Feature Flags
- [ ] `shell.commandWorkspace`
- [ ] `views.week`
- [ ] `views.planner`
- [ ] `dock.details`
- [ ] `dock.ai` (stub)

## Shell (skeleton)
- [ ] AppShell (mount under /app)
- [ ] Sidebar (sections only; no heavy data)
- [ ] Tabs (open/close/reorder; URL sync)
- [ ] ContextDock (panel slots; minimal state)

## Views (initial)
- [ ] WeekView (basic range + render; lightweight sample data)
- [ ] PlannerView (kanban/list with DnD placeholder)

## Command Plane
- [ ] Command Registry (navigate/create/link/toggle stubs)
- [ ] Palette UI (open/execute; keyboard map)
- [ ] Omnibox (enabled later; show disabled state)

## Panels (stubs)
- [ ] Details/Props (entity placeholder)
- [ ] AI Panel (shell UI, no tools wired yet)

## Routing
- [ ] `/app` entry; reads `view`, `date`, `panel`
- [ ] Deep links redirect; legacy routes → `/app?view=week`

## Governance & Anti-Drift
- [ ] ESLint/Biome import bans in place (docs)
- [ ] dependency-cruiser rules (docs)
- [ ] CI grep command (docs)
- [ ] CODEOWNERS policy (docs)

## Perf/A11y Baselines
- [ ] Dev overlay for fps/memory enabled
- [ ] Keyboard navigation basic map works
- [ ] No hardcoded brand colors; token-only classes

## Exit Criteria
- Shell renders with WeekView/PlannerView tabs
- Palette opens and runs basic commands
- Dock toggles Details/AI stubs
- Routing params affect view/panel
- No legacy import violations in code search (dry run)
