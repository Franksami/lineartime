# 📱 Responsive Breakpoint System

## 🎯 Overview
**Mobile-First**: Design starts with mobile and scales up
**Foundation Challenge**: Horizontal calendar requires adaptive breakpoints
**Performance Focus**: Minimize layout shifts and optimize for each device

---

## 🏗️ 1. Core Breakpoint System

### 1.1 LinearTime Breakpoint Scale
```css
/* LinearTime Breakpoint Scale */
.breakpoints {
  --mobile: 0px;       /* Mobile-first base */
  --tablet: 768px;     /* Tablet landscape */
  --desktop: 1024px;   /* Desktop */
  --wide: 1440px;      /* Wide screens */
  --ultra: 1920px;     /* Ultra-wide displays */
}
```

### 1.2 Media Query Strategy
```css
/* Mobile-first media queries */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Wide */ }
@media (min-width: 1920px) { /* Ultra-wide */ }

/* Container query future consideration */
@container (min-width: 768px) { /* Future: container queries */ }
```

---

## 📱 2. Mobile Breakpoints (< 768px)

### 2.1 Mobile Portrait (320px - 414px)
```css
/* Mobile Portrait Layout */
.mobile-portrait {
  /* Single column layout */
  .container {
    padding-left: var(--grid-4);
    padding-right: var(--grid-4);
  }

  /* Landing page */
  .hero-section {
    padding-top: var(--grid-8);
    padding-bottom: var(--grid-8);

    .hero-content {
      text-align: center;
    }

    .cta-buttons {
      flex-direction: column;
      gap: var(--grid-2);
      width: 100%;

      .button {
        width: 100%;
        min-height: 44px; /* iOS touch target */
      }
    }

    .hero-preview {
      display: none; /* Hide on small screens */
    }
  }

  /* Dashboard */
  .dashboard-metrics {
    grid-template-columns: 1fr; /* Single column */
    gap: var(--grid-4);
  }

  .dashboard-main {
    flex-direction: column;
    gap: var(--grid-6);
  }

  /* Settings */
  .settings-layout {
    flex-direction: column;
    gap: var(--grid-6);
  }

  .settings-sidebar {
    order: -1; /* Move to top */
  }
}
```

### 2.2 Mobile Landscape (568px - 812px)
```css
/* Mobile Landscape Layout */
.mobile-landscape {
  /* Adjust for landscape orientation */
  .hero-section {
    padding-top: var(--grid-6);
    padding-bottom: var(--grid-6);
  }

  /* Dashboard can fit 2 columns */
  .dashboard-metrics {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--grid-4);
  }
}
```

### 2.3 Mobile Touch Optimization
```css
/* Touch target optimization */
.mobile-touch {
  /* Minimum touch targets */
  .interactive-element {
    min-width: 44px;
    min-height: 44px;
  }

  /* Button sizing */
  .button {
    min-height: 44px;
    padding: var(--grid-3) var(--grid-4);
  }

  /* Link sizing */
  .link {
    min-height: 44px;
    padding: var(--grid-3);
    display: flex;
    align-items: center;
  }

  /* Form controls */
  .form-input,
  .form-select,
  .form-textarea {
    min-height: 44px;
    padding: var(--grid-3);
  }
}
```

---

## 📱 3. Tablet Breakpoints (768px - 1023px)

### 3.1 Tablet Portrait (768px - 834px)
```css
/* Tablet Portrait Layout */
.tablet-portrait {
  /* Landing page */
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--grid-6);
  }

  .pricing-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--grid-6);
  }

  /* Dashboard */
  .dashboard-metrics {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--grid-5);
  }

  .dashboard-main {
    grid-template-columns: 1fr 1fr;
    gap: var(--grid-6);
  }

  /* Settings */
  .settings-layout {
    grid-template-columns: 1fr;
    gap: var(--grid-6);
  }

  /* Calendar */
  .calendar-toolbar {
    padding: var(--grid-3);
  }

  .calendar-foundation {
    font-size: 0.9rem; /* Slightly larger for tablet */
  }
}
```

### 3.2 Tablet Landscape (1024px - 1112px)
```css
/* Tablet Landscape Layout */
.tablet-landscape {
  /* Landing page */
  .features-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--grid-7);
  }

  .pricing-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--grid-7);
  }

  /* Dashboard */
  .dashboard-metrics {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--grid-6);
  }

  .dashboard-main {
    grid-template-columns: 1fr 1fr;
    gap: var(--grid-7);
  }

  /* Settings */
  .settings-layout {
    grid-template-columns: 280px 1fr;
    gap: var(--grid-8);
  }

  /* Calendar - Consider horizontal layout */
  .calendar-container {
    overflow-x: auto;
    overflow-y: hidden;
  }
}
```

### 3.3 Tablet Interaction Optimization
```css
/* Tablet interaction patterns */
.tablet-interaction {
  /* Hybrid touch/mouse */
  .interactive-element {
    min-width: 44px;
    min-height: 44px;

    /* Add hover states for mouse */
    &:hover {
      background: var(--accent);
    }
  }

  /* Context menu support */
  .context-menu-trigger {
    context-menu: default;
  }

  /* Precision interactions */
  .drag-handle {
    touch-action: manipulation;
    cursor: grab;
  }
}
```

---

## 💻 4. Desktop Breakpoints (1024px - 1439px)

### 4.1 Desktop Standard (1024px - 1279px)
```css
/* Desktop Standard Layout */
.desktop-standard {
  /* Landing page */
  .hero-section {
    padding-top: var(--grid-10);
    padding-bottom: var(--grid-10);

    .hero-content {
      max-width: 600px;
    }

    .cta-buttons {
      justify-content: flex-start;
      gap: var(--grid-4);
    }

    .hero-preview {
      display: block; /* Show preview */
    }
  }

  .features-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--grid-8);
  }

  .pricing-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--grid-8);
  }

  /* Dashboard */
  .dashboard-metrics {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--grid-6);
  }

  .dashboard-main {
    grid-template-columns: 1fr 1fr 2fr;
    gap: var(--grid-8);
  }

  /* Settings */
  .settings-layout {
    grid-template-columns: 320px 1fr;
    gap: var(--grid-8);
  }

  .settings-sidebar {
    position: sticky;
    top: 80px;
    height: fit-content;
  }

  /* Calendar */
  .calendar-container {
    /* Full horizontal layout */
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
  }

  .calendar-toolbar {
    padding: var(--grid-4);
    position: sticky;
    top: 0;
    z-index: 30;
    background: var(--background);
    border-bottom: 1px solid var(--border);
  }
}
```

### 4.2 Desktop Large (1280px - 1439px)
```css
/* Desktop Large Layout */
.desktop-large {
  /* Content centering */
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Enhanced spacing */
  .hero-section {
    padding-top: var(--grid-10);
    padding-bottom: var(--grid-10);
  }

  /* Calendar optimization */
  .calendar-day {
    min-height: 60px; /* Larger day cells */
  }

  .calendar-event {
    font-size: 0.875rem;
    padding: var(--grid-2) var(--grid-3);
  }
}
```

### 4.3 Desktop Keyboard & Mouse Optimization
```css
/* Desktop interaction optimization */
.desktop-interaction {
  /* Focus management */
  .interactive-element {
    &:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
  }

  /* Hover states */
  .button:hover {
    background: var(--accent);
    transform: translateY(-1px);
  }

  /* Keyboard navigation */
  .nav-item {
    &:focus {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
    }
  }

  /* Context menus */
  .context-menu {
    z-index: 20;
    position: absolute;
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
}
```

---

## 🖥️ 5. Wide Screen Breakpoints (1440px - 1919px)

### 5.1 Wide Screen Layout (1440px - 1599px)
```css
/* Wide Screen Layout */
.wide-screen {
  /* Content expansion */
  .container {
    max-width: 1400px;
    margin: 0 auto;
  }

  /* Enhanced grid layouts */
  .features-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--grid-9);
  }

  .pricing-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--grid-9);
  }

  /* Dashboard */
  .dashboard-metrics {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--grid-8);
  }

  .dashboard-main {
    grid-template-columns: 1fr 1fr 2fr;
    gap: var(--grid-9);
  }

  /* Settings */
  .settings-layout {
    grid-template-columns: 350px 1fr;
    gap: var(--grid-9);
  }

  /* Calendar */
  .calendar-container {
    /* Full horizontal with enhanced spacing */
    padding: var(--grid-6);
  }

  .calendar-day {
    min-height: 64px; /* Larger for wide screens */
    padding: var(--grid-3);
  }
}
```

### 5.2 Ultra-Wide Screen Layout (1920px+)
```css
/* Ultra-Wide Screen Layout */
.ultra-wide {
  /* Maximum content width */
  .container {
    max-width: 1600px;
    margin: 0 auto;
  }

  /* Multi-column layouts */
  .dashboard-main {
    grid-template-columns: 1fr 1fr 1fr 2fr;
    gap: var(--grid-10);
  }

  /* Enhanced calendar */
  .calendar-foundation {
    /* Additional month visibility */
    padding: 0 var(--grid-10);
  }

  .calendar-toolbar {
    /* Centered toolbar for ultra-wide */
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### 5.3 Wide Screen Productivity Features
```css
/* Wide screen productivity */
.wide-productivity {
  /* Multi-panel layouts */
  .multi-panel {
    display: grid;
    grid-template-columns: 1fr 320px; /* Main + sidebar */
    gap: var(--grid-8);
  }

  /* Enhanced toolbars */
  .toolbar-enhanced {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: var(--grid-4);
    padding: var(--grid-4) var(--grid-8);
  }

  /* Context panels */
  .context-panel {
    position: sticky;
    top: 80px;
    height: calc(100vh - 160px);
    overflow-y: auto;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: var(--grid-6);
  }
}
```

---

## 📊 6. Breakpoint Performance Considerations

### 6.1 Layout Shift Prevention
```css
/* Prevent layout shifts */
.layout-stable {
  /* Reserve space for dynamic content */
  min-height: var(--reserved-height, auto);

  /* Consistent aspect ratios */
  .responsive-image {
    aspect-ratio: 16 / 9;
  }

  /* Skeleton loading */
  .skeleton {
    background: var(--muted);
    border-radius: var(--radius);
    animation: pulse 2s ease-in-out infinite;
  }
}
```

### 6.2 Critical Resource Loading
```css
/* Critical resource prioritization */
@media (max-width: 767px) {
  /* Mobile: Load critical content first */
  .hero-section {
    content-visibility: auto;
    contain-intrinsic-size: 0 500px;
  }
}

@media (min-width: 768px) {
  /* Tablet+: Load full experience */
  .hero-preview {
    content-visibility: auto;
    contain-intrinsic-size: 0 600px;
  }
}
```

### 6.3 Memory Management
```css
/* Memory-efficient breakpoints */
@media (max-width: 767px) {
  /* Reduce DOM complexity on mobile */
  .complex-visual {
    display: none;
  }
}

@media (min-width: 1440px) {
  /* Enable advanced features on wide screens */
  .advanced-feature {
    display: block;
  }
}
```

---

## 🎯 7. Breakpoint Testing Strategy

### 7.1 Device-Specific Testing
```typescript
// Breakpoint testing utilities
const breakpoints = {
  mobile: { width: 375, height: 667 },      // iPhone SE
  tablet: { width: 768, height: 1024 },     // iPad
  desktop: { width: 1024, height: 768 },    // Standard desktop
  wide: { width: 1440, height: 900 },       // Wide screen
  ultra: { width: 1920, height: 1080 },     // Ultra-wide
};

describe('Responsive Breakpoints', () => {
  breakpoints.forEach(({ width, height }, name) => {
    describe(`${name} (${width}x${height})`, () => {
      beforeEach(() => {
        // Set viewport
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: height,
        });
      });

      it('should render correctly', () => {
        // Test layout rendering
      });

      it('should handle touch interactions', () => {
        // Test touch targets and gestures
      });
    });
  });
});
```

### 7.2 Layout Shift Testing
```typescript
// Layout shift detection
describe('Layout Stability', () => {
  it('should not cause layout shifts on resize', () => {
    // Measure layout stability during resize
    const shifts = measureLayoutShifts();

    expect(shifts.cumulative).toBeLessThan(0.1);
  });

  it('should maintain aspect ratios', () => {
    // Test responsive image aspect ratios
    const images = screen.getAllByRole('img');

    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      expect(rect.width / rect.height).toBeCloseTo(expectedRatio);
    });
  });
});
```

---

## 📱 8. Platform-Specific Breakpoint Behavior

### 8.1 iOS Safari Considerations
```css
/* iOS Safari specific adjustments */
@supports (-webkit-touch-callout: none) {
  .ios-specific {
    /* iOS viewport adjustments */
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);

    /* iOS momentum scrolling */
    .scroll-container {
      -webkit-overflow-scrolling: touch;
    }

    /* iOS touch targets */
    .interactive-element {
      min-height: 44px; /* iOS Human Interface Guidelines */
    }
  }
}
```

### 8.2 Android Chrome Considerations
```css
/* Android Chrome specific adjustments */
@supports (-webkit-appearance: none) {
  .android-specific {
    /* Android viewport */
    padding-top: var(--android-safe-area-top, 0);

    /* Android scrolling */
    .scroll-container {
      overscroll-behavior: contain;
    }

    /* Android touch targets */
    .button {
      min-height: 48px; /* Material Design guidelines */
    }
  }
}
```

### 8.3 Desktop Browser Considerations
```css
/* Desktop browser optimizations */
@media (hover: hover) and (pointer: fine) {
  .desktop-optimized {
    /* Precise hover states */
    .interactive-element:hover {
      transform: translateY(-1px);
    }

    /* Focus management */
    .focusable:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
  }
}
```

---

## 🔗 9. Related Documentation

- **Grid Systems**: `docs/design-system-research/10-layout/grids/grid-systems.md`
- **Scroll Containers**: `docs/design-system-research/10-layout/scroll-containers/scroll-behavior.md`
- **Z-Index Map**: `docs/design-system-research/10-layout/z-index/z-index-map.md`
- **ASCII Layouts**: `docs/design-system-research/10-layout/ascii/`
- **Performance Budgets**: `docs/design-system-research/80-performance/budgets/`

---

**Next**: Complete layout specifications and move to theming audit plan.
