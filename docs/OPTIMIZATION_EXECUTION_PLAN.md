## Command Center Calendar Optimization Execution Plan (Hand-off for Cloud Code)

### Purpose
Comprehensive, sequential plan to harden configs, align tooling, enforce rules, and integrate CI—ready for execution by a coding agent. Includes phased to-do list, coding prompt, research tasks, and verification checklist.

### Context & Non‑Negotiable Rules
- React 19, Next.js 15 App Router, TypeScript 5; Server Components by default; `use client` only when required
- Token-only theming via shadcn/Vercel tokens; no brand colors or glass effects
- Foundation lock: DO NOT modify `components/calendar/LinearCalendarHorizontal.tsx` layout
- Use `CalendarProvider` system; avoid direct provider API calls
- Keep foundation tests green (`test:foundation`) before merging
- Prefer `pnpm` for installs; Turbopack for dev/build

### High‑Signal Findings From Audit
- Biome is primary formatter/linter; strict a11y/security; uses 2-space indent & semicolons
- `next.config.ts` has: absolute Turbopack `root`, permissive `typescript.ignoreBuildErrors` + `eslint.ignoreDuringBuilds` (unsafe for CI)
- `experimental.optimizePackageImports` lists packages not in deps (e.g., `react-dnd`, `tui-calendar`, `@tabler/icons-react`)
- Security headers present but incomplete (missing CSP, HSTS, Referrer-Policy, Permissions-Policy, COOP/CORP)
- `package.json` scripts point to `.js` files that are `.ts/.tsx` (quality/perf/security monitors)
- `test:foundation` targets a file that doesn’t exist; repository has `tests/foundation/` suite
- Some scripts/tools referenced not in devDeps (e.g., `retire`, `husky`)
- Rules docs exist but many don’t match the “Required Rule Structure” frontmatter (description, globs, alwaysApply)

---

### Command Workspace & Feature Flags (Updates Detected)

- Command Workspace is the new primary shell (three‑pane: Sidebar + Tabs + Context Dock).
  - See: `docs/command-workspace/ULTIMATE_COMPREHENSIVE_PRD.md`, `components/shell/AppShell.tsx`, `components/commands/*`, `components/dock/*`, `views/*`.
- Year Lens: Horizontal 12‑month foundation is preserved but scoped as an optional view only.
  - Do not import `LinearCalendarHorizontal` outside Year Lens paths.
  - See: `docs/command-workspace/DEPRECATION_12_MONTH_FOUNDATION.md`, `CLAUDE.md` (architecture section).
- Feature flags: multiple systems present—consolidation and governance needed:
  - Command Workspace flags and hooks: `lib/features/flags.ts`, `lib/features/useFeatureFlags.ts`
  - Modern feature flag provider/context: `lib/featureFlags/modernFeatureFlags.tsx`
  - Advanced manager with kill‑switch/rollback: `lib/featureFlags/FeatureFlagManager.tsx`
  - Admin/UX page: `app/feature-flags/page.tsx`
  - Quantum feature flags UI: `components/calendar/quantum/QuantumFeatureFlags.tsx`
- Governance: add CI guard to prevent `LinearCalendarHorizontal` imports outside Year Lens and validate feature flag usage per `docs/command-workspace/FEATURE_FLAGS_AND_ROLLOUT.md`.

### Phased To‑Do List (Sequential)

#### Phase 0 — Gating & Context
- [ ] Confirm CI policy: TS/ESLint must fail builds in CI; allow relaxed locally
- [ ] Inventory rules docs; define validator for required frontmatter (description, globs, alwaysApply)
- [ ] Confirm Command Workspace as primary shell and Year Lens scope; encode in rules/governance

#### Phase 1 — Build/Config Hardening
- [ ] Make Turbopack `root` portable (no absolute path)
- [ ] Wrap `typescript.ignoreBuildErrors` / `eslint.ignoreDuringBuilds` with `process.env.CI ? false : true`
- [ ] Prune `experimental.optimizePackageImports` to only installed packages; add comments for rationale
- [ ] Add CI import guard: forbid `components/calendar/LinearCalendarHorizontal.tsx` outside Year Lens

#### Phase 2 — Scripts & Tooling Coherence
- [ ] Fix script paths in `package.json` to match `.ts/.tsx` or route via `tsx/ts-node`/compiled outputs
- [ ] Add `test:unit` using Vitest; keep Playwright for e2e
- [ ] Add missing devDeps used by scripts (`retire`, `husky`) or refactor scripts to avoid them

#### Phase 3 — Security Headers & Privacy
- [ ] Add CSP (script-src/style-src/connect-src/img-src/font-src/frame-ancestors) with nonces/hashes where needed
- [ ] Add HSTS (includeSubDomains; preload for production)
- [ ] Add Referrer-Policy, Permissions-Policy, COOP/CORP, Cross-Origin-Embedder-Policy as appropriate
- [ ] Keep token-only theming and explicit consent flows per Phase 3.0

#### Phase 4 — Performance Budgets & Monitoring
- [ ] Enforce budgets (asset ≤ 250KB, entrypoint ≤ 400KB) in Next config and CI
- [ ] Ensure Web Vitals pipeline is functional (client → analytics); decide on reporting method
- [ ] Keep bundle analyzer opt-in via `ANALYZE=true`
- [ ] Add Command Workspace perf assertions (tab switch, palette latency, omnibox time‑to‑first‑token)

#### Phase 5 — Testing & Foundation Protection
- [ ] Point `test:foundation` to `tests/foundation/` folder
- [ ] Add vitest coverage thresholds from `vitest.config.ts` to CI gate
- [ ] Add perf and a11y baselines (AAA) and ensure Biome a11y rules pass
- [ ] Add import‑boundary test: no shell/components import `LinearCalendarHorizontal` outside Year Lens

#### Phase 6 — CI Integration
- [ ] Wire GitHub Actions to run: `lint:biome`, `deadcode`, `test:unit`, `test:foundation`, `test:all`, budgets, build
- [ ] Add semantic-release and trunk-based flow; sync branch protections
- [ ] Optional: integrate Bruno API tests into CI

#### Phase 7 — Rules & Documentation
- [ ] Normalize all rule files to “Required Rule Structure” frontmatter
- [ ] Add rules validation step to governance checks
- [ ] Update Phase indexes and cross-links; refresh optimization report if metrics change
- [ ] Add Command Workspace rules module + Cursor rules alignment; include import‑boundary enforcement

---

### Implementation Guide (Step‑By‑Step)

1) `next.config.ts`
   - Replace absolute `turbopack.root` with portable config
   - Guard `typescript.ignoreBuildErrors` / `eslint.ignoreDuringBuilds` with CI env
   - Remove unknown entries from `optimizePackageImports`; keep only installed libraries
   - Add complete security headers (CSP/HSTS/etc.)

2) `package.json`
   - Fix `.js` → `.ts/.tsx` script path mismatches or run via `tsx`
   - Add `test:unit` (Vitest) and ensure coverage flags are respected in CI
   - Ensure referenced tools are in devDeps or adjust scripts

3) Rules System
   - Add/align rule frontmatter: `description`, `globs`, `alwaysApply`
   - Add rules validation to governance pipeline
   - Encode Command Workspace as primary shell; Year Lens import boundary; feature flag usage policy

4) CI Workflows (`.github/workflows/*.yml`)
   - Jobs: Biome, Knip, Vitest, Playwright, Performance budgets, Build
   - Add semantic-release; ensure trunk-based workflow enforced

5) Tests
   - Point `test:foundation` to `tests/foundation/`
   - Maintain 80%+ coverage thresholds from `vitest.config.ts`
   - Add import‑boundary test and Command Workspace perf tests (palette latency, tab switch)

---

### Research Tasks (for Claude Code)
- Next.js 15 experimental flags: current support for `optimizeCss`, `scrollRestoration`, `optimizePackageImports`; recommended usage and pitfalls (2025)
- CSP templates for Next.js with SSR + 3rd‑party libs; nonce/hash patterns; safe `connect-src` for analytics
- Permissions-Policy, COOP/CORP/HSTS best practices for SPAs with API calls
- Biome 1.9+ recommended a11y/security rulesets for React/Next
- Vitest + Next 15 App Router integration: test env, module aliasing, jsx runtime, tsconfig interplay
- Performance budget enforcement and measurement approaches in Next 15 + Turbopack
- Command Workspace UX performance metrics (palette open latency, omnibox token time); measurement patterns and targets
- Feature flag consolidation (single provider + kill‑switch) in React/Next with SSR and local persistence

Provide short, actionable conclusions and example snippets for each.

---

### Coding Prompt (Hand to Cloud Code)
Context: Next.js 15 + React 19 + TS 5; App Router; Turbopack; Biome; Playwright e2e; Vitest unit tests; token-only shadcn/Vercel theming; foundation calendar layout is immutable.

Goals:
1) Harden `next.config.ts` (portable Turbopack, CI-safe TS/ESLint behavior, curated `optimizePackageImports`, full security headers)
2) Fix `package.json` script mismatches and add `test:unit`
3) Enforce performance budgets and verify Web Vitals pipeline
4) Correct `test:foundation` target and keep foundation tests green
5) Normalize rule files to required frontmatter and add rules validation to CI
6) Wire CI workflows for lint/deadcode/tests/budgets/build/release
7) Command Workspace alignment: enforce Year Lens boundary; consolidate feature flags with kill‑switch; add shell performance tests

Constraints:
- Do not modify `components/calendar/LinearCalendarHorizontal.tsx` layout or alignment logic
- Only import `LinearCalendarHorizontal` within Year Lens routes/components
- Server Components by default; avoid brand colors and glass effects
- Use `pnpm` for dependency changes

Implementation Steps:
- Update `next.config.ts` per goals (portable config, CI guards, security headers, refined imports)
- Update `package.json` scripts to correctly execute `.ts/.tsx` monitors (via `tsx` or compiled outputs); add `test:unit`
- Add/adjust GitHub Actions workflows to run governance pipeline and budgets; add semantic-release
- Normalize rules frontmatter and add a validation step to governance scripts
- Point `test:foundation` to `tests/foundation/`
 - Add CI guard to prevent `LinearCalendarHorizontal` imports outside Year Lens
 - Consolidate feature flags (provider + manager + hooks); document precedence and ensure admin page works

Verification:
- Run: `pnpm run lint:biome && pnpm run deadcode && pnpm run test:foundation && pnpm run test:all && pnpm run build`
- Confirm performance budgets (≤250KB asset, ≤400KB entrypoint) and no analyzer regressions
- Ensure Web Vitals events are captured and error-free in console/network
- Ensure Biome a11y/security rules pass without errors
 - Verify import‑boundary guard; no forbidden imports in shell/components
 - Validate feature flags: toggles persist; kill‑switch disables relevant features safely

---

### Acceptance Criteria
- CI fails builds on TS/ESLint errors (in CI only), passes locally
- No missing or orphaned script paths; monitors executable
- Security headers audited (CSP/HSTS/Policies present and sane)
- Foundation tests pass; unit/e2e suites green; coverage ≥ 80%
- Performance budgets enforced; analyzer opt-in works
- Rules normalized and validated in CI; documentation updated

### Risks & Rollback
- If `optimizePackageImports` pruning causes missing exports, revert entries one by one with comments
- If CSP breaks runtime, enable report-only mode first; iterate sources
- If CI failures are noisy, gate new checks behind a separate workflow and flip to required after burn-in

---

### Artifacts to Update After Implementation
- `.github/workflows/*.yml` (lint, test, budgets, release)
- `docs/PHASE_3_INDEX.md` and related Phase docs
- `LINEARTIME_OPTIMIZATION_REPORT.md` with new metrics


