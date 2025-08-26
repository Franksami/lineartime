# ↔️ RTL Support Plan

## 1) Foundations
- Use logical properties (inline/block) in styles
- Mirror chrome & nav; keep calendar day grid LTR to preserve date order

## 2) Components
- Icons/arrows mirrored where directional
- Tooltip and popover alignment flip for RTL
- Dialog/sheet default side mirrored

## 3) Testing
- Snapshot key routes with dir="rtl"
- Keyboard navigation parity
- Screen reader order checks
