# ⚡ Motion Design Language

## 1) Roles & Durations
- Feedback: 80–150ms (hover/focus/press)
- Interface: 180–260ms (dropdowns, tooltips, tabs)
- Overlays: 200–250ms (modals, sheets)
- Page transitions: 250–400ms
- Loading/skeleton: 800–1500ms cycles

## 2) Easing Tokens
- --ease-standard: cubic-bezier(0.4, 0, 0.2, 1)
- --ease-decelerate: cubic-bezier(0, 0, 0.2, 1)
- --ease-accelerate: cubic-bezier(0.4, 0, 1, 1)
- --ease-spring: cubic-bezier(0.15, 0.85, 0.25, 1)

## 3) Reduced Motion Tokens
- --motion-none: durations = 0.01ms; opacity-only fades
- --motion-minimal: durations = 120ms; no parallax or big transforms

## 4) Patterns
- Modal: fade+scale (0.98→1.0), 200ms, ease-out, overlay fade 150ms
- Tooltip: fade 120ms; position snap with no translate on reduced motion
- List insert/remove: height auto-animate + opacity, ≤ 160ms, ease-out
- Page: fade+small translate (y: 16px), 280ms, ease-out

## 5) Performance Rules
- Only transform/opacity; avoid top/left/width/height
- will-change: transform on hover-capable devices; remove when idle
- Respect prefers-reduced-motion and user toggle

## 6) Testing
- FPS budget: ≥ 58fps average in integration tests
- Visual state screenshots start/end
- Reduced-motion snapshot parity
