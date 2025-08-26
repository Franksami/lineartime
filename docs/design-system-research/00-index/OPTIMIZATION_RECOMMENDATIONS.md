# 🚀 Optimization Recommendations (Gap Analysis → Actions)

## ✅ Executive Summary
This layer strengthens the existing plan with governance, deeper tokens, motion language, i18n/content, observability/SLOs, and experimentation ops. It adds quality gates, closes scale-risk gaps, and makes improvements measurable.

---

## 1) Governance & Quality Gates
- **Definition of Done (per surface)**
  - Layout ASCII + responsive spec + z-index map
  - Token-only compliance (CI guard passes)
  - Motion spec (duration/ease/role + reduced-motion)
  - A11y (WCAG AA): Keyboard, SR labels, contrast
  - Perf budget met (route + component)
- **Review cadence**: weekly design review; monthly a11y/perf audit
- **PR checks**: theme scan, a11y axe, Lighthouse CI, bundle budgets, token guard
- **Design freeze rule**: no brand utilities; token-first only

Actions
- Add CODEOWNERS for `docs/design-system-research/**`
- Gate merges on CI checks; require 2 approvals (design + eng)

---

## 2) Token System Deep Spec
- Expand beyond color tokens:
  - Typography scale (display → microcopy); optical sizes
  - Spacing scale (4px base → sections); density modes (comfortable/compact)
  - Radius/elevation (shadow tokens → semantic: card, popover, modal)
  - Focus/ring tokens; state tokens (hover, active, disabled)
  - Data vis tokens (success/warn/info/semantic series)

Actions
- Create `/20-theming/tokens/{typography,spacing,elevation,density}.md`
- Add usage tables and component mappings

---

## 3) Motion Design Language
- Roles: feedback (≤150ms), interface (200–300ms), page (250–400ms)
- Curves: standard, decelerate, accelerate, spring; map to use-cases
- Reduced-motion tokens: motion-none, motion-minimal variants
- Performance: transform/opacity only; 60fps budgets; GPU hints

Actions
- Add `/30-animations/MOTION_LANGUAGE.md` with tokenized durations/easings
- Pattern library: modal, tooltip, list-insert/remove, page transition

---

## 4) i18n & Content Guidelines
- Locale/time: ISO handling, first day of week, 12/24h, regional calendars
- RTL support: logical properties, mirroring for timeline chrome (not grid)
- UX writing: tone, action-first CTAs, error style, empty-states script
- Truncation rules for event titles; tooltip fallbacks

Actions
- Add `/60-i18n/CONTENT_GUIDELINES.md` and `/60-i18n/RTL_SUPPORT.md`
- Add locale matrix and QA checklist

---

## 5) Observability & SLOs (UX-level)
- SLOs: LCP ≤ 2.5s (p75), TTI ≤ 2.0s, CLS ≤ 0.1, Event render ≤ 50ms/1k
- Interaction SLOs: open modal ≤ 150ms; drag latency ≤ 16ms; search ≤ 200ms
- A11y SLOs: axe critical = 0; contrast failures = 0
- Dashboards: Web Vitals + route budgets + calendar-specific KPIs

Actions
- Add `/80-performance/SLOs.md` and dashboard JSON examples
- Wire RUM to analytics with alert thresholds

---

## 6) Experimentation & Research Ops
- A/B pillars: layout density, motion presence, tooltip timing, label clarity
- Diary studies: power users/enterprises for horizontal timeline utility
- Feedback loop: in-product prompt linking to task IDs

Actions
- Add `/90-research-ops/EXPERIMENTATION_PLAN.md`
- Create lightweight consent + privacy notes

---

## 7) Risk Register (Design System)
- Token drift via one-off utilities → Mitigation: CI guard + code review checklists
- Animation regressions for reduced motion → Mitigation: prefer-reduced-motion tests
- Accessibility regressions → Mitigation: axe in CI; monthly audits
- Perf regressions (event volume spikes) → Mitigation: virtualization gate tests

---

## 8) Roadmap (4 weeks)
- Week 1: Governance + token deep spec + motion language
- Week 2: i18n/RTL + observability SLOs + alerting
- Week 3: Experimentation plan + a11y/perf audits
- Week 4: Close gaps; stabilize CI gates; publish v1 design system site

---

## 9) Success Criteria
- CI passes on theme/a11y/perf across all PRs
- ≥90% components mapped to deep tokens
- Motion compliance in all overlays and page transitions
- RUM SLOs green for calendar + top routes for 2 weeks
- At least 2 validated experiments improving UX KPIs

---

## 10) Ownership
- Design system TL: tokens, motion, docs
- A11y lead: audits, QA, training
- Perf lead: budgets, dashboards, regressions
- Research ops: studies, experiments, feedback triage
