# 🛡️ Governance & Quality Gates

## 1) Definition of Done (per surface)
- Layout: ASCII + grid + scroll + z-index + responsive
- Theming: token-only; CI guard passes; dark-mode parity
- Motion: role+duration+easing; reduced-motion variant
- A11y: WCAG 2.1 AA (keyboard, SR, contrast)
- Perf: route + component budgets met

## 2) Reviews & Ownership
- Weekly design review; monthly a11y/perf audit
- CODEOWNERS: design system TL + a11y + perf leads
- PR requires 2 approvals (design + eng)

## 3) CI Gates (all required)
- Theme guard (no brand utilities, no glass)
- axe-core tests (0 critical)
- Lighthouse CI (perf ≥ 0.85, a11y ≥ 0.90)
- Bundle budgets (per-route limits)
- Web Vitals smoke (integration tests)

## 4) Change Control
- Token changes → proposal + visual matrix + a11y check
- Motion changes → before/after capture + reduced-motion parity
- Breaking changes → migration notes

## 5) Training & Playbooks
- Token usage cookbook
- Motion language examples
- A11y checklists
- Perf debugging recipes
