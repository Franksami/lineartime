# 📐 Grid Systems Specification

## 🎯 Overview
**Foundation**: LinearTime uses a comprehensive grid system optimized for calendar interfaces
**Philosophy**: Grid-first design with calendar-specific adaptations
**Framework**: CSS Grid primary, Flexbox secondary, responsive scaling

---

## 🏗️ 1. Core Grid System

### 1.1 Primary Grid Scale
```css
/* LinearTime Grid Scale - 4px increments */
.grid-scale {
  --grid-1: 4px;    /* Minimum spacing */
  --grid-2: 8px;    /* Small gaps */
  --grid-3: 12px;   /* Content padding */
  --grid-4: 16px;   /* Component spacing */
  --grid-5: 20px;   /* Section spacing */
  --grid-6: 24px;   /* Major section gaps */
  --grid-7: 32px;   /* Large component spacing */
  --grid-8: 48px;   /* Page section spacing */
  --grid-9: 64px;   /* Major layout spacing */
  --grid-10: 96px;  /* Hero/promo spacing */
}
```

### 1.2 Calendar Foundation Grid (LINEAR CALENDAR - IMMUTABLE)

#### **Horizontal Timeline Grid** - `LinearCalendarHorizontal.tsx`
```css
/* FOUNDATION GRID - DO NOT MODIFY */
.calendar-foundation {
  display: grid;
  grid-template-columns: repeat(42, 1fr); /* 6 weeks × 7 days = 42 columns */
  grid-template-rows: auto auto repeat(6, 1fr); /* Header + Weekdays + 6 weeks */
  gap: var(--grid-1); /* 1px separation between cells */

  /* Day Cell Specifications */
  .calendar-day {
    min-width: 48px;     /* Minimum touch target */
    min-height: 48px;    /* Minimum touch target */
    aspect-ratio: 1;     /* Square cells */
    position: relative;
  }

  /* Month Strip Specifications */
  .month-strip {
    grid-column: 1 / -1; /* Full width */
    height: auto;        /* Variable height for events */
    border-bottom: 1px solid var(--border);
  }
}

/* Year Header Grid */
.year-header {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--grid-6);
  border-bottom: 1px solid var(--border);
}
```

#### **Week Header Grid**
```css
/* Week day headers - Top and Bottom */
.week-headers {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(7, 1fr); /* Su Mo Tu We Th Fr Sa */
  gap: var(--grid-1);

  .weekday-label {
    text-align: center;
    font-weight: 600;
    padding: var(--grid-2);
    color: var(--foreground);
  }
}

/* Month Labels Grid */
.month-labels {
  position: absolute;
  left: var(--grid-2);
  top: 50%;
  transform: translateY(-50%);
  font-weight: 600;
  color: var(--muted-foreground);
  z-index: 1;
}
```

---

## 🏗️ 2. Application Grid Systems

### 2.1 Landing Page Grids

#### **Hero Section Grid**
```css
/* Landing Hero Layout */
.hero-section {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto auto;
  gap: var(--grid-8);

  /* Badge Row */
  .badge-row {
    justify-self: start;
  }

  /* Headline Row */
  .headline-row {
    max-width: 550px;
  }

  /* CTA Row */
  .cta-row {
    display: flex;
    gap: var(--grid-4);
    justify-self: start;
  }

  /* Demo Preview Row */
  .preview-row {
    position: relative;
  }
}
```

#### **Features Grid** - Responsive Scaling
```css
/* Features Section */
.features-grid {
  /* Mobile: Single column */
  grid-template-columns: 1fr;
  gap: var(--grid-6);

  /* Tablet: Two columns */
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--grid-7);
  }

  /* Desktop: Three columns */
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--grid-8);
  }
}

.feature-card {
  padding: var(--grid-6);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
}
```

#### **Pricing Grid**
```css
/* Pricing Section */
.pricing-grid {
  /* Mobile: Single column */
  grid-template-columns: 1fr;
  gap: var(--grid-6);

  /* Tablet: Two columns */
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Desktop: Three columns */
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.pricing-card {
  padding: var(--grid-8);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);

  &.popular {
    border-color: var(--primary);
    box-shadow: 0 0 0 1px var(--primary);
  }
}
```

### 2.2 Dashboard Grid Systems

#### **Metrics Grid** - Responsive Dashboard
```css
/* Dashboard Metrics */
.metrics-grid {
  /* Mobile: Single column, 4 rows */
  grid-template-columns: 1fr;
  gap: var(--grid-4);

  /* Tablet: Two columns, 2 rows */
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }

  /* Desktop: Four columns, 1 row */
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: 1fr;
  }
}

.metric-card {
  padding: var(--grid-6);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
```

#### **Main Dashboard Grid**
```css
/* Dashboard Main Content */
.dashboard-main {
  /* Mobile: Single column */
  display: flex;
  flex-direction: column;
  gap: var(--grid-6);

  /* Desktop: Three column layout */
  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: 1fr 1fr 2fr; /* Activity, Status, Events */
    gap: var(--grid-6);
  }
}

.activity-panel,
.status-panel {
  padding: var(--grid-6);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
}

.events-panel {
  padding: var(--grid-6);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
}
```

### 2.3 Settings Page Grids

#### **Settings Layout Grid**
```css
/* Settings Page Layout */
.settings-layout {
  /* Mobile: Single column */
  display: flex;
  flex-direction: column;
  gap: var(--grid-6);

  /* Desktop: Sidebar + Content */
  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: 256px 1fr; /* Fixed sidebar */
    gap: var(--grid-6);
  }
}

.settings-sidebar {
  /* Mobile: Collapsed */
  display: none;

  /* Desktop: Visible */
  @media (min-width: 1024px) {
    display: block;
    position: sticky;
    top: var(--grid-8);
    height: fit-content;
  }

  .nav-item {
    padding: var(--grid-3) var(--grid-4);
    border-radius: var(--radius);
    margin-bottom: var(--grid-1);
    transition: background-color 0.15s ease;

    &:hover {
      background: var(--accent);
    }

    &.active {
      background: var(--accent);
      color: var(--accent-foreground);
    }
  }
}

.settings-content {
  min-height: 0; /* Allow flex shrinking */
}
```

#### **Settings Form Grids**
```css
/* Settings Form Sections */
.settings-form {
  display: flex;
  flex-direction: column;
  gap: var(--grid-6);
}

.form-section {
  padding: var(--grid-6);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);

  .form-group {
    margin-bottom: var(--grid-4);

    &:last-child {
      margin-bottom: 0;
    }
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--grid-4);

    /* Tablet: Label left, input right */
    @media (min-width: 768px) {
      grid-template-columns: 200px 1fr;
      align-items: start;
      gap: var(--grid-6);
    }
  }
}
```

### 2.4 Mobile Calendar Grids

#### **Mobile Calendar Layout**
```css
/* Mobile Calendar Container */
.mobile-calendar {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--background);
}

.mobile-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--grid-4);
  background: var(--background);
  border-bottom: 1px solid var(--border);
}

.mobile-toolbar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--grid-2);
  padding: var(--grid-4);
  border-bottom: 1px solid var(--border);

  .toolbar-button {
    padding: var(--grid-3);
    border-radius: var(--radius);
    background: var(--card);
    border: 1px solid var(--border);
    text-align: center;
    font-size: 0.875rem;
    font-weight: 500;
    min-height: 44px; /* iOS touch target */
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.mobile-calendar-view {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.month-focus {
  padding: var(--grid-4);
  border-bottom: 1px solid var(--border);

  .month-navigation {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--grid-4);
  }

  .weekday-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--grid-1);
    margin-bottom: var(--grid-2);
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--grid-1);

    .day-cell {
      aspect-ratio: 1;
      min-height: 44px;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
    }
  }
}

.today-events {
  padding: var(--grid-4);
  border-bottom: 1px solid var(--border);

  .event-item {
    padding: var(--grid-3);
    margin-bottom: var(--grid-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--card);

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.mobile-bottom-nav {
  position: sticky;
  bottom: 0;
  z-index: 40;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--grid-1);
  padding: var(--grid-3);
  background: var(--background);
  border-top: 1px solid var(--border);

  .nav-item {
    padding: var(--grid-3);
    border-radius: var(--radius);
    text-align: center;
    min-height: 44px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    gap: var(--grid-1);
  }
}
```

---

## 📱 3. Responsive Grid Scaling

### 3.1 Breakpoint System
```css
/* LinearTime Breakpoint Scale */
.breakpoints {
  --mobile: 0px;       /* Mobile-first */
  --tablet: 768px;     /* Tablet */
  --desktop: 1024px;   /* Desktop */
  --wide: 1440px;      /* Wide screens */
  --ultra: 1920px;     /* Ultra-wide */
}
```

### 3.2 Grid Scaling Patterns

#### **Container Queries vs Media Queries**
```css
/* Media Query Approach (Current) */
@media (min-width: 768px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Container Query Approach (Future) */
@container (min-width: 768px) {
  .features-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
```

#### **Flexible Grid Units**
```css
/* Flexible grid with min/max constraints */
.flexible-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: var(--grid-6);
}

/* Calendar-specific flexible grids */
.calendar-responsive {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(48px, 1fr));
  gap: var(--grid-1);
}
```

---

## 🎯 4. Grid Performance Considerations

### 4.1 Rendering Optimization
```css
/* Optimized grid rendering */
.optimized-grid {
  /* Force hardware acceleration */
  transform: translateZ(0);
  will-change: auto;

  /* Minimize layout shifts */
  contain: layout style paint;
}

/* Calendar grid optimization */
.calendar-grid-optimized {
  /* Use CSS containment for performance */
  contain: strict;

  /* Minimize paint operations */
  content-visibility: auto;
}
```

### 4.2 Memory Management
- **Virtual Scrolling**: For large calendar grids
- **Lazy Loading**: Grid sections loaded on demand
- **Grid Fragmentation**: Minimize grid area changes
- **CSS Containment**: Isolate grid rendering contexts

---

## 📊 5. Grid Testing & Validation

### 5.1 Layout Tests
```typescript
// Grid layout validation tests
describe('Grid Systems', () => {
  it('should maintain calendar foundation grid', () => {
    // Test 42-column grid integrity
    expect(calendarGrid.columns).toBe(42);
    expect(calendarGrid.gap).toBe('1px');
  });

  it('should scale responsively', () => {
    // Test breakpoint scaling
    expect(featuresGrid.columns).toBeGreaterThan(1); // Tablet+
    expect(metricsGrid.columns).toBeGreaterThan(2);  // Desktop+
  });

  it('should meet touch target requirements', () => {
    // Test mobile touch targets
    expect(dayCell.minWidth).toBeGreaterThanOrEqual(44);
    expect(dayCell.minHeight).toBeGreaterThanOrEqual(44);
  });
});
```

### 5.2 Performance Benchmarks
- **Grid Layout Time**: < 16ms
- **Paint Time**: < 8ms
- **Layout Shift**: < 0.1 cumulative layout shift
- **Memory Usage**: < 50MB for complex grids

---

## 🔗 6. Related Documentation

- **ASCII Layouts**: `docs/design-system-research/10-layout/ascii/`
- **Scroll Containers**: `docs/design-system-research/10-layout/scroll-containers/`
- **Z-Index Map**: `docs/design-system-research/10-layout/z-index/`
- **Responsive Specs**: `docs/design-system-research/10-layout/breakpoints/`

---

**Next**: Complete scroll container specifications for all surfaces.
