# 📈 UX SLOs & Dashboards

## 1) SLO Targets (p75 unless noted)
- LCP ≤ 2.5s (landing ≤ 2.0s)
- TTI ≤ 2.0s; TBT ≤ 200ms
- CLS ≤ 0.1
- Calendar: firstEventVisible ≤ 1.2s; eventRender ≤ 50ms/1k
- Interactions: modalOpen ≤ 150ms; dragLatency ≤ 16ms; searchSuggestions ≤ 200ms
- A11y: axe critical = 0; contrast failures = 0

## 2) Dashboards
- Web Vitals (route-level)
- Calendar KPIs (render time, scroll FPS, memory)
- API latencies (Convex queries/mutations; provider APIs)
- Error rates and user-impact heatmap

## 3) Alerts
- LCP > 3000ms (warn) / 4000ms (critical)
- Memory > 100MB sustained 60s
- FPS < 50 for > 3s during calendar scroll
- Sync > 2s (initial) / > 500ms (incremental)

## 4) RUM Wiring
- Track LCP/FID/CLS with web-vitals
- Custom metrics: calendar-render, event-render, scroll-fps
- Send to analytics with user/session tags
