# 📝 Master Research Templates

## 🎯 Template Overview

**Purpose**: Standardized documentation format for all research findings
**Framework**: Layout → Theming → Animations → Code
**Consistency**: All templates follow the same structure for cross-referencing

---

## 🏗️ 1. Layout Research Template

**File**: `10-layout/ascii/[component-name].md`

```markdown
# [Component/Surface Name] - Layout Analysis

## 📋 Surface Overview
- **Route**: `/path/to/route`
- **Component**: `ComponentName.tsx`
- **Purpose**: Brief description of surface purpose
- **User Context**: When/how users interact with this surface

## 📐 ASCII Layout Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Header / Navigation                                         │
├─────────────────┬───────────────────────────────────────────┤
│ Sidebar         │ Main Content Area                         │
│                 │ ┌─────────────────────────────────────┐ │
│                 │ │ Content Area                        │ │
│                 │ │                                     │ │
│                 │ │  ┌────────┬────────┬────────┐      │ │
│                 │ │  │ Item1  │ Item2  │ Item3  │      │ │
│                 │ │  └────────┴────────┴────────┘      │ │
│                 │ │                                     │ │
│                 │ └─────────────────────────────────────┘ │
└─────────────────┴───────────────────────────────────────────┘
```

## 🔍 Layout Specifications

### Container Structure
- **Root Container**: `h-screen bg-background`
- **Grid System**: CSS Grid with 12/24/48 column system
- **Responsive Breakpoints**: sm/md/lg/xl specifications

### Spacing & Dimensions
- **Spacing Scale**: 4px increments (4, 8, 12, 16, 24, 32, 48, 64, 96, 128)
- **Component Heights**: Fixed vs. dynamic sizing
- **Padding Standards**: Container padding patterns

### Scroll Behavior
- **Scroll Containers**: Which elements scroll independently
- **Scroll Direction**: Horizontal, vertical, or both
- **Virtual Scrolling**: Implementation details for large datasets

### Z-Index Layers
- **Base Layer**: 0-10 (content areas)
- **Interactive Layer**: 20-30 (buttons, inputs)
- **Overlay Layer**: 40-50 (tooltips, dropdowns)
- **Modal Layer**: 1000+ (dialogs, sheets)

## 📱 Responsive Behavior

### Mobile (< 768px)
- **Layout Changes**: Single column, stacked layout
- **Touch Targets**: Minimum 44px height
- **Navigation**: Bottom tabs or drawer pattern

### Tablet (768px - 1024px)
- **Layout Changes**: Two-column layout
- **Interaction Model**: Hybrid touch/mouse

### Desktop (> 1024px)
- **Layout Changes**: Multi-column with sidebar
- **Interaction Model**: Mouse and keyboard focused

## 🎯 Interaction Hotspots

### Primary Actions
- **CTA Buttons**: Location and prominence
- **Navigation Elements**: Menu items, breadcrumbs
- **Form Controls**: Inputs, selects, checkboxes

### Secondary Actions
- **Contextual Actions**: Dropdown menus, action buttons
- **Informational Elements**: Tooltips, help text

## ⚠️ Layout Issues & Recommendations

### Current Issues
- [ ] Issue description and impact
- [ ] User experience impact
- [ ] Technical constraints

### Recommended Improvements
- [ ] Specific layout changes
- [ ] Implementation approach
- [ ] Expected user experience improvement

## 📊 Performance Impact

### Rendering Performance
- **Repaint/Reflow Triggers**: Elements that cause layout shifts
- **Virtualization Needs**: Components requiring virtualization
- **Animation Impact**: Layout-affecting animations

### Bundle Impact
- **Component Size**: Estimated bundle contribution
- **Lazy Loading**: Opportunities for code splitting
- **Critical Path**: Above-the-fold loading requirements

## 🔗 Related Surfaces
- **Parent Surfaces**: Higher-level containers
- **Child Components**: Nested components
- **Related Flows**: Connected user journeys

## 📝 Notes & Observations
- Additional findings and insights
- Edge cases and considerations
- Future improvement opportunities
```

---

## 🎨 2. Theming Research Template

**File**: `20-theming/token-usage/[component-name].md`

```markdown
# [Component/Surface Name] - Theme Analysis

## 🎨 Current Token Usage

### Surface Tokens
- **Background**: `bg-background` (oklch(0 0 0))
- **Surface**: `bg-card` (oklch(0.2097 0.0080 274.5332))
- **Border**: `border-border` (oklch(0.2674 0.0047 248.0045))
- **Text**: `text-foreground` (oklch(0.9328 0.0025 228.7857))

### Interactive States
- **Hover**: `hover:bg-accent/10`
- **Focus**: `focus:ring-primary focus:ring-2`
- **Active**: `active:bg-accent/20`
- **Disabled**: `disabled:opacity-50 disabled:cursor-not-allowed`

### Text Hierarchy
- **Primary**: `text-foreground`
- **Secondary**: `text-muted-foreground`
- **Accent**: `text-accent-foreground`

## 🚨 Token Violations Found

### Hardcoded Colors (Critical)
```tsx
// ❌ VIOLATION: Hardcoded color
<div className="bg-blue-500 text-white">

// ✅ CORRECT: Semantic token
<div className="bg-primary text-primary-foreground">
```

### Glass Effects (Critical)
```tsx
// ❌ VIOLATION: Backdrop blur
<div className="backdrop-blur-md bg-white/10">

// ✅ CORRECT: Solid surface
<div className="bg-card border border-border">
```

### Brand Utilities (Warning)
```tsx
// ❌ WARNING: Brand utility
<div className="text-red-600">

// ✅ CORRECT: Semantic token
<div className="text-destructive">
```

## 📊 Color Contrast Analysis

### Text on Background Combinations
| Text Token | Background Token | Contrast Ratio | WCAG AA | WCAG AAA |
|------------|------------------|----------------|---------|-----------|
| `text-foreground` | `bg-background` | 21:1 | ✅ | ✅ |
| `text-muted-foreground` | `bg-card` | 4.5:1 | ✅ | ❌ |
| `text-accent-foreground` | `bg-accent` | 8.2:1 | ✅ | ❌ |

### Interactive Element Contrast
- **Buttons**: 4.5:1 minimum contrast
- **Links**: 4.5:1 minimum contrast
- **Focus Rings**: 3:1 minimum contrast

## 🏷️ Category Color Implementation

### Calendar Event Colors
```typescript
const CATEGORY_COLORS = {
  work: 'hsl(var(--chart-1))',      // Blue
  personal: 'hsl(var(--chart-2))',  // Green
  health: 'hsl(var(--chart-3))',    // Orange
  travel: 'hsl(var(--chart-4))',    // Purple
  education: 'hsl(var(--chart-5))', // Red
} as const;
```

### Dark Mode Compatibility
- **High Contrast**: All category colors meet 4.5:1 ratio
- **Color Blind Safe**: Avoid red-green combinations
- **Consistent Perception**: OKLCH color space for uniform lightness

## 🔄 Theme Consistency Check

### Component Variants
- [ ] Default state uses correct tokens
- [ ] Hover states use consistent patterns
- [ ] Focus states include visible ring
- [ ] Disabled states use opacity pattern
- [ ] Loading states maintain semantic meaning

### Theme Integration
- [ ] Respects user theme preferences
- [ ] Works in both light and dark modes
- [ ] Handles high contrast mode
- [ ] Supports reduced motion preferences

## 🎯 Theme Recommendations

### Immediate Fixes (Critical)
1. **Replace hardcoded colors** with semantic tokens
2. **Remove glass effects** and use solid surfaces
3. **Fix contrast issues** for accessibility compliance
4. **Standardize interactive states** across components

### Enhancement Opportunities
1. **Dynamic theme switching** based on user preferences
2. **Custom category colors** for power users
3. **Theme performance optimization** for large datasets
4. **Advanced contrast modes** for accessibility

## 📈 Performance Impact

### CSS Bundle Analysis
- **Current Token Usage**: Estimated 15KB of CSS
- **Hardcoded Overrides**: Additional 5KB of custom CSS
- **Optimization Potential**: 25% reduction through token standardization

### Runtime Performance
- **Style Calculations**: Reduced with consistent token usage
- **Paint Operations**: Fewer repaints with semantic colors
- **Memory Usage**: Lower with standardized patterns

## 🔗 Related Theme Documentation
- **Global Theme**: `app/globals.css`
- **Theme Provider**: `contexts/ThemeProvider.tsx`
- **Color System**: `docs/UI_STANDARDS.md`
- **CI Guard Rules**: `scripts/ci-guard.js`
```

---

## ⚡ 3. Animation Research Template

**File**: `30-animations/inventory/[component-name].md`

```markdown
# [Component/Surface Name] - Animation Analysis

## 🎬 Current Animation Inventory

### Framer Motion Animations
```tsx
// Page transitions
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
>
  <PageContent />
</motion.div>

// Micro-interactions
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.15 }}
>
  Click me
</motion.button>
```

### Tailwind CSS Transitions
```tsx
// Utility-based transitions
<div className="transition-all duration-300 ease-in-out hover:scale-105">
  Hover effect
</div>

// State transitions
<button className="transition-colors duration-200 hover:bg-accent">
  Interactive button
</button>
```

## 📊 Performance Metrics

### Frame Rate Analysis
- **Target FPS**: 60fps sustained
- **Current FPS**: [Measured value]
- **Performance Budget**: < 16ms per frame

### Animation Budget Compliance
| Animation Type | Duration Limit | Current | Compliant |
|----------------|----------------|---------|-----------|
| Page transitions | 400ms | 300ms | ✅ |
| Micro-interactions | 150ms | 100ms | ✅ |
| Loading animations | 1000ms | 800ms | ✅ |
| Hover effects | 200ms | 150ms | ✅ |

## 🎭 Animation Patterns

### Page Transitions
- **Enter**: `opacity: 0 → 1`, `y: 20 → 0`
- **Exit**: `opacity: 1 → 0`, `y: 0 → -20`
- **Easing**: `easeOut` for smooth entry
- **Stagger**: 100ms delay between child elements

### Micro-interactions
- **Hover**: Scale 1.02-1.05, subtle lift
- **Tap/Click**: Scale 0.98, immediate feedback
- **Focus**: Ring expansion, smooth growth
- **Loading**: Spin or pulse, consistent timing

### Complex Interactions
- **Drag & Drop**: Smooth following, snap feedback
- **Modal Open/Close**: Backdrop fade, content slide
- **Toast Notifications**: Slide in, auto-dismiss
- **Form Validation**: Error shake, success pulse

## ♿ Reduced Motion Compliance

### Current Implementation
```tsx
// Motion-aware animations
<motion.div
  animate={{
    scale: prefersReducedMotion ? 1 : 1.05
  }}
  transition={{
    duration: prefersReducedMotion ? 0 : 0.2
  }}
>
  Content
</motion.div>
```

### Detection Strategy
```tsx
// Hook for motion preferences
const prefersReducedMotion = useMediaQuery(
  '(prefers-reduced-motion: reduce)'
);
```

### Alternative UX Patterns
- **Instead of scale**: Use opacity changes
- **Instead of slide**: Use fade transitions
- **Instead of bounce**: Use simple fade in/out
- **Instead of spin**: Use static loading indicator

## 🎯 Animation Recommendations

### Performance Optimizations
1. **Use transform/opacity only** for smooth animations
2. **Avoid layout-triggering properties** (width, height, top, left)
3. **Implement will-change** for animated properties
4. **Use GPU acceleration** for transform-based animations

### Accessibility Improvements
1. **Respect reduced motion** preferences
2. **Provide alternative feedback** for motion-impaired users
3. **Ensure focus indicators** remain visible during animations
4. **Avoid vestibular triggers** (excessive movement)

### Consistency Standards
1. **Standardize duration scales** (150ms, 300ms, 500ms)
2. **Use consistent easing curves** (easeOut, easeInOut)
3. **Implement stagger patterns** for list animations
4. **Document animation tokens** for team consistency

## 📈 Performance Impact

### Animation Performance Budget
- **CPU Usage**: < 10% during animations
- **Memory Usage**: < 50MB during complex animations
- **Bundle Size**: < 20KB for animation libraries
- **Load Time Impact**: < 100ms additional load time

### Optimization Opportunities
- **Lazy load animation libraries** for non-critical components
- **Use CSS animations** for simple transitions
- **Implement animation pooling** for repeated elements
- **Monitor animation performance** in production

## 🔗 Related Animation Documentation
- **Framer Motion Guide**: Component library patterns
- **Tailwind Animation**: Utility class standards
- **Performance Monitoring**: Animation performance tracking
- **Accessibility Guidelines**: Motion accessibility standards
```

---

## 💻 4. Code Research Template

**File**: `40-components/checklists/[component-name]-checklist.md`

```markdown
# [Component Name] - Code Quality Checklist

## 📋 Component Overview
- **Location**: `components/[category]/[ComponentName].tsx`
- **Purpose**: Brief component purpose and usage
- **Dependencies**: Key imports and external dependencies

## ✅ Quality Checklist

### TypeScript & Code Quality
- [ ] **Strict TypeScript**: All props and state typed
- [ ] **Interface Documentation**: JSDoc comments on public APIs
- [ ] **Error Boundaries**: Proper error handling for async operations
- [ ] **Performance Optimized**: useMemo, useCallback where appropriate
- [ ] **Bundle Impact**: Lazy loading implemented where beneficial

### Accessibility Compliance (WCAG 2.1 AA)
- [ ] **Keyboard Navigation**: Full keyboard accessibility
- [ ] **Screen Reader Support**: Proper ARIA labels and roles
- [ ] **Focus Management**: Logical tab order and focus traps
- [ ] **Color Contrast**: 4.5:1 minimum for text, 3:1 for UI
- [ ] **Reduced Motion**: Respects user motion preferences

### Theme & Design System
- [ ] **Token Only**: Zero hardcoded colors or spacing
- [ ] **Semantic Colors**: Uses foreground/background/card/muted tokens
- [ ] **Consistent Spacing**: Follows 4px spacing scale
- [ ] **Responsive Design**: Mobile-first breakpoints implemented
- [ ] **Dark Mode Compatible**: Works in both light and dark themes

### Component Architecture
- [ ] **Single Responsibility**: One clear purpose
- [ ] **Composition Over Inheritance**: Uses composition patterns
- [ ] **Props Interface**: Well-documented prop interface
- [ ] **Default Props**: Sensible defaults for optional props
- [ ] **Forward Refs**: Proper ref forwarding if needed

### State Management
- [ ] **Local State**: useState for component-specific state
- [ ] **Effects**: Proper cleanup in useEffect hooks
- [ ] **Derived State**: useMemo for computed values
- [ ] **Performance**: Optimized re-renders with proper dependencies
- [ ] **Loading States**: Proper loading and error states

### Testing & Documentation
- [ ] **Unit Tests**: Comprehensive test coverage
- [ ] **Integration Tests**: Component integration tests
- [ ] **Visual Tests**: Screenshot tests for critical states
- [ ] **Documentation**: Storybook stories or documentation
- [ ] **Usage Examples**: Clear usage examples

### Performance & Bundle
- [ ] **Bundle Size**: < 10KB for component + dependencies
- [ ] **Render Performance**: < 16ms render time
- [ ] **Memory Usage**: No memory leaks in lifecycle
- [ ] **Lazy Loading**: Implemented for non-critical components
- [ ] **Code Splitting**: Proper chunk boundaries

## 🔧 Implementation Status

### Current State
- **Completion Level**: [0-100]%
- **Last Updated**: [Date]
- **Review Status**: [Draft/In Review/Approved]

### Outstanding Issues
- [ ] Issue description and priority
- [ ] Implementation plan
- [ ] Owner and timeline

### Dependencies & Blockers
- [ ] External dependencies required
- [ ] Upstream changes needed
- [ ] Design decisions pending

## 🎯 Recommendations

### Immediate Actions (High Priority)
1. **Accessibility**: Fix identified a11y issues
2. **Performance**: Implement performance optimizations
3. **Theme**: Replace hardcoded values with tokens
4. **Testing**: Add missing test coverage

### Future Improvements (Medium Priority)
1. **Enhanced Features**: Additional functionality
2. **Performance**: Further optimizations
3. **Developer Experience**: Better documentation

### Nice-to-Have (Low Priority)
1. **Polish**: Visual enhancements
2. **Advanced Features**: Complex functionality
3. **Integration**: Third-party service integration

## 📊 Metrics & KPIs

### Performance Metrics
- **Render Time**: [Current]ms → Target: <16ms
- **Bundle Size**: [Current]KB → Target: <10KB
- **Test Coverage**: [Current]% → Target: >90%

### Quality Metrics
- **Accessibility Score**: [Current]/100 → Target: 100
- **Theme Compliance**: [Current]% → Target: 100%
- **Code Quality**: [Current] → Target: A grade

## 📝 Notes & Observations
- Implementation notes and observations
- Edge cases and considerations
- Future improvement opportunities
- Technical debt and known issues

## 🔗 Related Documentation
- **Component Story**: `stories/[ComponentName].stories.tsx`
- **Tests**: `tests/components/[ComponentName].test.tsx`
- **Design**: `docs/design-system-research/10-layout/ascii/[component-name].md`
- **Theme**: `docs/design-system-research/20-theming/token-usage/[component-name].md`
- **Animation**: `docs/design-system-research/30-animations/inventory/[component-name].md`
```

---

## 📋 Template Usage Guidelines

### 1. Consistency Standards
- **File Naming**: Use kebab-case for file names
- **Section Headers**: Follow the exact hierarchy shown
- **Checkboxes**: Use for trackable items
- **Code Examples**: Include actual code snippets from codebase

### 2. Cross-Reference System
- **Link Between Templates**: Reference related template files
- **Component Relationships**: Document parent/child relationships
- **Flow Connections**: Link to UX flow documentation

### 3. Progress Tracking
- **Completion Checkboxes**: Track implementation status
- **Status Indicators**: Use ✅ ❌ 🔄 for progress states
- **Priority Labels**: High/Medium/Low priority indicators

### 4. Quality Assurance
- **Template Validation**: Ensure all required sections completed
- **Content Standards**: Use consistent formatting and terminology
- **Review Process**: Peer review before final approval

---

**Next**: Begin inventorying overlays (dialogs, sheets, tooltips, toasts) and creating the first ASCII layouts.
