# Accessibility Testing & Policy

## Standards
- WCAG 2.1 AA compliance
- Keyboard-only operation across shell and views
- Screen reader support (roles, labels, live regions)
- High-contrast tokens and 44px touch targets
- Reduced-motion compliance

## Keyboard Coverage
- Global: palette, omnibox, tabs cycle, split, panel toggle
- Views: navigation (arrows), selection (Enter/Space), quick actions
- Modals: focus traps, Esc close, SR announcements

## Screen Reader Patterns
- Role semantics for grids/lists
- `aria-label`, `aria-describedby` for actionable elements
- Live regions for async updates (omnibox streaming, AI results)

## Reduced Motion
- Prefer opacity/transform over layout changes
- Honor `prefers-reduced-motion: reduce`
- Provide instant (non-animated) feedback mode

## Testing Plan
- Automated: axe checks in Playwright on key routes
- Manual: keyboard walkthroughs per view; SR readouts
- Regression: a11y assertions in CI pipelines
