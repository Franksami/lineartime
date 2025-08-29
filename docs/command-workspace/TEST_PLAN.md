# Test Plan (Playwright + RTL + CI Budgets)

## End-to-End (Playwright)
### Shell
- [ ] `/app` renders shell; Sidebar/Tabs/Dock present
- [ ] Tabs: open/close/reorder; URL sync
- [ ] Dock: toggle AI/Details panels; persists per view
- [ ] Command Palette: opens via ⌘/Ctrl-K; executes stub commands
- [ ] Omnibox: disabled state (Phase 1); enabled in later phases

### Views
- [ ] WeekView: keyboard navigation; create/edit/delete (mock)
- [ ] PlannerView: select/edit items; basic DnD placeholders
- [ ] MonthStrip/Quarter/Notes/Mailbox/Automations (Phase 2): smoke tests

### Routing
- [ ] URL params switch views/panels
- [ ] `/entity/:type/:id` redirects and opens Details
- [ ] Legacy routes redirect to `/app?view=week`

### AI/CV (later phases)
- [ ] Agent apply/undo flow with confirmations
- [ ] Consent UI; indicator toggles; no network leakage in CV

## Unit/Integration (RTL/Jest)
- [ ] Command registry resolve/run
- [ ] Omnibox parsing and intent routing
- [ ] Panel registry contributions per view
- [ ] Entity link helpers and backlinks rendering

## Performance Budgets (CI)
- [ ] Bundle size checks per view/panel
- [ ] Initial render < 500ms (local snapshot; relative budget)
- [ ] View switch < 200ms; command run latency < 120ms
- [ ] 60fps scroll/drag snapshots

## Accessibility
- [ ] axe checks on core routes (no serious issues)
- [ ] Keyboard-only walkthroughs; focus trap tests in modals
- [ ] SR labels present on interactive elements; live regions verified
- [ ] Reduced-motion: animations disabled/toned down

## Reporting & Dashboards
- [ ] CI publishes artifacts (screenshots, traces)
- [ ] Latency histograms for command/omnibox/agent
- [ ] A11y reports with failure summaries
