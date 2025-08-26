# 🎨 Deep Token Specification (Type, Space, Elevation, Density, Radius)

## 1) Typography Tokens
- Scale: display-2xl, display-xl, display-lg, h1–h6, body-lg, body-md, body-sm, micro
- Variables
  - --font-size-*, --line-height-*, --letter-spacing-*, --font-weight-*
  - Optical sizing rules for displays vs dense data tables
- Mappings
  - Headings → marketing + app chrome
  - Body → forms, dialogs, lists
  - Micro → metadata, captions, badges

## 2) Spacing Tokens
- Base: 4px
- Steps: 0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 7 (32px), 8 (48px), 9 (64px), 10 (96px)
- Usage
  - Component padding vs. layout gaps
  - Vertical rhythm rules; max nested spacing depth

## 3) Elevation (Shadow) Tokens → Semantic
- --elevation-none: none
- --elevation-1: subtle; cards
- --elevation-2: popovers/tooltips
- --elevation-3: modals/sheets
- Requirements: color-agnostic, dark-mode aware, performance-friendly

## 4) Density Modes
- Comfortable (default): spacing scale as-is
- Compact (data-heavy views): -1 step spacing; font-size -1 step where safe
- System toggle → local storage + prefers-contrast flag synergy

## 5) Radius Tokens
- --radius-xs (4px), --radius-sm (6px), --radius-md (8px), --radius-lg (12px), --radius-xl (16px)
- Mapping: input/button → sm; card → md; sheet/modal → lg; special → xl

## 6) State Tokens
- Focus: --ring-primary, --ring-offset
- Interaction: --hover-bg, --active-bg, --disabled-opacity
- Error/success/info: semantic foreground/background pairs

## 7) Data Visualization Tokens
- Series: --series-1..8 (OKLCH), tested AA on bg-card and bg-background
- Diverging ramps for analytics; color-blind-safe variants

## 8) Compliance Rules
- No brand utilities; tokens only
- All colors via CSS vars; Tailwind classes map to tokens
- Dark mode must be covered for each token set
- Contrast ≥ 4.5:1 for text; ≥ 3:1 for UI components

## 9) Testing
- Visual matrix per token
- Contrast unit tests with examples
- Theming snapshot diff in CI
