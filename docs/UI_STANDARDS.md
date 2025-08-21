# UI/UX Standards & Design System Documentation

## 🎨 Core Design Philosophy

### Primary Principles
- **Perceptual Uniformity**: Use oklch color space for consistent visual perception
- **Full-Screen Immersion**: Edge-to-edge layouts with no unnecessary padding
- **Pure Black Canvas**: Base background using `oklch(0 0 0)` for maximum contrast
- **Component Consistency**: All UI elements follow unified theme variables
- **Accessibility First**: WCAG 2.1 AA compliance minimum

## 🌈 Color System (oklch)

### Why oklch?
The oklch color space provides perceptually uniform colors, meaning that changes in lightness, chroma, and hue are consistent to human perception. This results in:
- Better color harmony
- Predictable color mixing
- Improved accessibility
- Consistent appearance across devices

### Core Theme Variables

```css
/* Dark Mode (Default) */
.dark {
  --background: oklch(0 0 0);           /* Pure black */
  --foreground: oklch(1 0 0);           /* Pure white */
  --card: oklch(0.1400 0 0);            /* Elevated surfaces */
  --card-foreground: oklch(1 0 0);      
  --popover: oklch(0.1400 0 0);         
  --popover-foreground: oklch(1 0 0);   
  --primary: oklch(0.6900 0.2018 256.72);
  --primary-foreground: oklch(0.2100 0 0);
  --secondary: oklch(0.2300 0 0);       
  --secondary-foreground: oklch(1 0 0); 
  --muted: oklch(0.2300 0 0);          
  --muted-foreground: oklch(0.7200 0 0);
  --accent: oklch(0.2300 0 0);         
  --accent-foreground: oklch(1 0 0);   
  --destructive: oklch(0.5729 0.1926 26.62);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.2600 0 0);         
  --input: oklch(0.2600 0 0);          
  --ring: oklch(0.6900 0.2018 256.72); 
}
```

### Color Usage Guidelines

1. **Never use hardcoded colors** - Always use theme variables
2. **Backgrounds**: 
   - Primary: `bg-background` (pure black)
   - Cards/Elevated: `bg-card`
   - Interactive: `bg-muted`
3. **Text Colors**:
   - Primary: `text-foreground`
   - Secondary: `text-muted-foreground`
   - Accent: Theme-specific colors
4. **Borders**: Always use `border-border`

### Category-Specific Colors

```typescript
// Event categories with oklch alpha blending
const categoryColors = {
  personal: 'bg-green-500/10 border-green-500/20',
  work: 'bg-blue-500/10 border-blue-500/20',
  effort: 'bg-orange-500/10 border-orange-500/20',
  note: 'bg-purple-500/10 border-purple-500/20'
}
```

## 📐 Layout Standards

### Full-Screen Implementation

```tsx
// Root container - always full viewport
<div className="h-screen bg-background overflow-hidden">
  {/* Header - minimal height */}
  <div className="px-4 pt-4">
    {/* Content */}
  </div>
  
  {/* Main content - fills remaining space */}
  <div className="flex-1 h-[calc(100vh-88px)] bg-background overflow-hidden">
    {/* View content */}
  </div>
</div>
```

### Key Layout Rules

1. **No rounded corners on main containers** - Edge-to-edge experience
2. **Minimal padding** - Only where functionally necessary
3. **Overflow handling** - Explicit overflow controls on containers
4. **Responsive breakpoints**:
   - Mobile: < 768px
   - Tablet: 768px - 1024px
   - Desktop: > 1024px

## 🧩 Component Patterns

### Glass Morphism (Optional)

```tsx
// Glass morphism container
<div className={cn(
  'backdrop-blur-2xl',
  'bg-gradient-to-br from-muted/20 to-muted/5',
  'border border-border',
  'shadow-lg'
)}>
  {/* Content */}
</div>
```

### Interactive States

```tsx
// Button/Interactive element
<button className={cn(
  'hover:bg-muted/50',      // Hover state
  'active:scale-95',         // Active state
  'focus:ring-2',            // Focus state
  'focus:ring-primary',
  'transition-all duration-200'
)}>
```

### Card Components

```tsx
// Standard card pattern
<div className={cn(
  'bg-card',
  'border border-border',
  'p-4',
  'transition-all duration-200',
  'hover:shadow-lg'
)}>
  {/* Card content */}
</div>
```

## 🔧 Implementation Process

### Step 1: Theme Installation

```bash
# Install Vercel theme via shadcn CLI
pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/vercel.json
```

### Step 2: Component Migration Checklist

- [ ] Remove all `bg-gray-*` classes
- [ ] Replace with theme variables (`bg-background`, `bg-card`, etc.)
- [ ] Update text colors to `text-foreground` or `text-muted-foreground`
- [ ] Replace borders with `border-border`
- [ ] Remove hardcoded color values
- [ ] Test in both light and dark modes
- [ ] Verify SSR compatibility

### Step 3: SSR Compatibility

```typescript
// Always check for browser environment
if (typeof window !== 'undefined') {
  // Browser-specific code
}

// Safe navigator access
const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
```

## ✅ Quality Assurance

### UI/UX Validation Checklist

1. **Visual Consistency**
   - [ ] All components use theme variables
   - [ ] No hardcoded colors
   - [ ] Consistent spacing and sizing
   - [ ] Proper overflow handling

2. **Accessibility**
   - [ ] WCAG 2.1 AA color contrast
   - [ ] Keyboard navigation support
   - [ ] Screen reader compatibility
   - [ ] Focus indicators visible

3. **Performance**
   - [ ] Load time < 3s on 3G
   - [ ] Bundle size < 500KB initial
   - [ ] Core Web Vitals pass
   - [ ] Smooth animations (60fps)

### Testing Requirements

```typescript
// Playwright test example
test('UI validation', async ({ page }) => {
  // Check for pure black background
  const bgColor = await page.locator('body').evaluate(el => 
    window.getComputedStyle(el).backgroundColor
  );
  expect(bgColor).toMatch(/rgb\(0,?\s*0,?\s*0\)|lab\(0/);
  
  // Verify theme variables
  const card = page.locator('.bg-card').first();
  await expect(card).toBeVisible();
  
  // Test responsive layout
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('.md\\:hidden')).toBeVisible();
});
```

## 🚀 Best Practices

### Do's
- ✅ Use theme variables exclusively
- ✅ Test all color modes
- ✅ Validate with ui-ux-engineer agent
- ✅ Run Playwright tests before committing
- ✅ Document any custom patterns
- ✅ Use semantic HTML
- ✅ Implement proper ARIA labels

### Don'ts
- ❌ Use inline styles for colors
- ❌ Hardcode hex/rgb values
- ❌ Mix color systems (rgb with oklch)
- ❌ Skip accessibility testing
- ❌ Ignore responsive design
- ❌ Use `bg-gray-*` classes (appear bluish)

## 📊 Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| LCP | < 2.5s | < 4s |
| FID | < 100ms | < 300ms |
| CLS | < 0.1 | < 0.25 |
| Bundle Size | < 500KB | < 1MB |
| Load Time (3G) | < 3s | < 5s |

## 🔄 Migration Guide

### Converting Existing Components

1. **Identify all color classes**
   ```bash
   grep -r "bg-gray\|text-white\|border-gray" components/
   ```

2. **Replace with theme variables**
   ```tsx
   // Before
   <div className="bg-gray-900 text-white border-gray-800">
   
   // After
   <div className="bg-card text-foreground border-border">
   ```

3. **Test thoroughly**
   ```bash
   npx playwright test tests/ui-validation.spec.ts
   ```

## 📝 Component Documentation Template

```typescript
/**
 * ComponentName
 * 
 * Design System Compliance:
 * - Theme Variables: ✅ Uses only theme colors
 * - Layout: ✅ Follows full-screen principles
 * - Accessibility: ✅ WCAG 2.1 AA compliant
 * - Performance: ✅ Lazy loaded, < 50KB
 * - Testing: ✅ Playwright tests included
 * 
 * @example
 * <ComponentName
 *   className="bg-card border-border"
 *   variant="default"
 * />
 */
```

## 🎯 Success Metrics

- **100% theme variable compliance** - No hardcoded colors
- **Zero console warnings** - Clean implementation
- **All Playwright tests passing** - Automated validation
- **< 3s load time** - Performance target
- **WCAG 2.1 AA** - Accessibility compliance

## 🔗 Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [COMPONENTS.md](./COMPONENTS.md) - Component guidelines
- [CLAUDE.md](./CLAUDE.md) - AI implementation guidelines
- [README.md](../README.md) - Project overview

---

*Last Updated: 2025-08-21*
*Version: 1.0.0*