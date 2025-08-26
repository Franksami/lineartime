# 🎯 Z-Index Hierarchy Map

## 🎯 Overview
**Critical System**: Z-index determines visual layering and interaction order
**Foundation Rule**: Linear Calendar components must maintain proper layering
**Performance Impact**: Incorrect z-index can cause repaint and performance issues

---

## 🏗️ 1. Core Z-Index Scale

### 1.1 LinearTime Z-Index Scale
```css
/* LinearTime Z-Index Scale */
.z-index-scale {
  --z-base: 0;        /* Default content layer */
  --z-content: 1;     /* Standard content */
  --z-interactive: 10; /* Buttons, inputs, interactive elements */
  --z-dropdown: 20;   /* Dropdown menus, select options */
  --z-sticky: 30;     /* Sticky elements, fixed headers */
  --z-tooltip: 40;    /* Tooltips, contextual help */
  --z-overlay: 50;    /* Modal backdrops, overlay panels */
  --z-modal: 1000;    /* Modal dialogs, full-screen overlays */
  --z-popover: 1010;  /* Popover content over modals */
  --z-toast: 1020;    /* Toast notifications, highest layer */
}
```

### 1.2 Layer Categories

#### **Content Layers** (z-index: 0-10)
- Base content and layout elements
- Standard text, images, and UI components
- Calendar grid and day cells (FOUNDATION)

#### **Interactive Layers** (z-index: 20-40)
- Hover states, focus indicators
- Dropdown menus and select options
- Context menus and action menus

#### **Overlay Layers** (z-index: 50-100)
- Modal backdrops and scrims
- Side panels and slide-out menus
- Notification banners

#### **Top Layers** (z-index: 1000+)
- Modal dialogs and full-screen interfaces
- Toast notifications and system alerts
- Critical error states and confirmations

---

## 📅 2. Calendar Foundation Z-Index (LINEAR CALENDAR - IMMUTABLE)

### 2.1 Foundation Layer Structure
```css
/* FOUNDATION Z-INDEX - DO NOT MODIFY */
.calendar-foundation {
  position: relative;
  z-index: var(--z-base); /* Foundation layer */

  .calendar-grid {
    z-index: var(--z-base); /* Base calendar grid */
  }

  .calendar-day {
    z-index: var(--z-base); /* Individual day cells */
  }

  .month-labels {
    z-index: var(--z-content); /* Month labels overlay */
    position: absolute;
  }

  .week-headers {
    z-index: var(--z-content); /* Week headers */
  }
}

/* Event Layer - Critical for calendar functionality */
.calendar-events {
  z-index: var(--z-interactive); /* Events above base grid */

  .event-item {
    z-index: var(--z-interactive);
    position: relative;
  }

  .event-tooltip {
    z-index: var(--z-tooltip); /* Event hover tooltips */
  }
}
```

### 2.2 Calendar Interaction Layers

#### **Event Creation & Editing**
```css
/* Event creation overlay */
.event-creation-overlay {
  z-index: var(--z-overlay);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;

  .event-creation-modal {
    z-index: var(--z-modal);
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
}
```

#### **Drag & Drop Layers**
```css
/* Drag and drop system */
.drag-preview {
  z-index: var(--z-tooltip); /* Drag preview above content */
  position: fixed;
  pointer-events: none;
}

.drop-zone {
  z-index: var(--z-interactive);
  position: relative;

  &.active {
    z-index: var(--z-overlay); /* Highlight active drop zones */
  }
}

.drag-feedback {
  z-index: var(--z-tooltip);
  position: absolute;
}
```

---

## 🏠 3. Application Z-Index Structure

### 3.1 Navigation & Header Layers

#### **Desktop Header**
```css
/* Desktop navigation header */
.navigation-header {
  z-index: var(--z-sticky); /* Sticky header */
  position: sticky;
  top: 0;
  background: var(--background);
  border-bottom: 1px solid var(--border);

  .nav-menu {
    z-index: var(--z-dropdown); /* Dropdown menus */
  }

  .user-menu {
    z-index: var(--z-dropdown);
  }
}
```

#### **Mobile Header & Navigation**
```css
/* Mobile header */
.mobile-header {
  z-index: var(--z-sticky);
  position: sticky;
  top: 0;
  background: var(--background);
  border-bottom: 1px solid var(--border);
}

.mobile-menu-overlay {
  z-index: var(--z-overlay); /* Mobile menu backdrop */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.mobile-menu-panel {
  z-index: var(--z-modal); /* Mobile menu panel */
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100%;
  background: var(--background);
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}
```

### 3.2 Content Area Layers

#### **Dashboard Layout**
```css
/* Dashboard content layers */
.dashboard-container {
  z-index: var(--z-base);

  .metric-cards {
    z-index: var(--z-content);
  }

  .activity-feed {
    z-index: var(--z-content);
    position: relative;
  }

  .integration-status {
    z-index: var(--z-content);
  }

  .upcoming-events {
    z-index: var(--z-content);
  }
}
```

#### **Settings Layout**
```css
/* Settings page layers */
.settings-layout {
  z-index: var(--z-base);

  .settings-sidebar {
    z-index: var(--z-sticky); /* Sticky sidebar */
    position: sticky;
    top: 80px; /* Below header */
  }

  .settings-content {
    z-index: var(--z-content);
  }

  .form-dropdowns {
    z-index: var(--z-dropdown);
  }
}
```

### 3.3 Landing Page Layers

#### **Hero Section Layers**
```css
/* Landing page hero */
.hero-section {
  z-index: var(--z-base);
  position: relative;

  .hero-content {
    z-index: var(--z-content);
  }

  .hero-badge {
    z-index: var(--z-content);
  }

  .hero-preview {
    z-index: var(--z-content);
    position: relative;

    .preview-background {
      z-index: var(--z-base);
    }

    .preview-content {
      z-index: var(--z-content);
    }
  }
}
```

#### **Feature Section Layers**
```css
/* Feature showcase */
.features-section {
  z-index: var(--z-base);

  .feature-cards {
    z-index: var(--z-content);
    position: relative;

    &:hover {
      z-index: var(--z-interactive);
    }
  }
}
```

---

## 🎨 4. Overlay Component Layers

### 4.1 Modal System Layers

#### **Modal Dialogs** (40+ instances)
```css
/* Modal system */
.modal-overlay {
  z-index: var(--z-overlay); /* Backdrop */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  z-index: var(--z-modal); /* Modal content */
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.modal-title {
  z-index: var(--z-content);
}

.modal-actions {
  z-index: var(--z-interactive);
}
```

#### **Alert Dialogs**
```css
/* Alert dialog layers */
.alert-overlay {
  z-index: var(--z-overlay);
}

.alert-content {
  z-index: var(--z-modal);
}

.alert-actions {
  z-index: var(--z-interactive);
}
```

### 4.2 Sheet/Sidebar System (16+ instances)

#### **Desktop Sidebar**
```css
/* Desktop sidebar */
.sidebar-overlay {
  z-index: var(--z-overlay);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.sidebar-panel {
  z-index: var(--z-modal);
  position: fixed;
  top: 0;
  right: 0; /* Right-side sidebar */
  width: 320px;
  height: 100%;
  background: var(--background);
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
}
```

#### **Mobile Bottom Sheet**
```css
/* Mobile bottom sheet */
.bottom-sheet-overlay {
  z-index: var(--z-overlay);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.bottom-sheet-panel {
  z-index: var(--z-modal);
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  max-height: 70vh;
  background: var(--background);
  border-top-left-radius: var(--radius);
  border-top-right-radius: var(--radius);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}
```

### 4.3 Tooltip System (57+ instances)

#### **Standard Tooltips**
```css
/* Tooltip system */
.tooltip-trigger {
  z-index: var(--z-content); /* Base trigger */
  position: relative;
}

.tooltip-content {
  z-index: var(--z-tooltip); /* Tooltip content */
  position: absolute;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: var(--grid-2);
  font-size: 0.875rem;
  max-width: 200px;
}
```

#### **Calendar Event Tooltips**
```css
/* Calendar-specific tooltips */
.event-tooltip {
  z-index: var(--z-tooltip);
  position: absolute;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: var(--grid-3);
  max-width: 300px;
  pointer-events: none; /* Don't interfere with interactions */
}
```

### 4.4 Toast System (15+ instances)

#### **Toast Notifications**
```css
/* Toast notification system */
.toast-container {
  z-index: var(--z-toast); /* Highest layer */
  position: fixed;
  top: var(--grid-8);
  right: var(--grid-8);
  max-width: 400px;
  pointer-events: none; /* Allow interactions below */
}

.toast-item {
  z-index: var(--z-toast);
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: var(--grid-4);
  margin-bottom: var(--grid-2);
  pointer-events: auto; /* Toast itself is interactive */
}

.toast-close-button {
  z-index: var(--z-interactive);
}
```

---

## 📱 5. Mobile-Specific Z-Index

### 5.1 Mobile Calendar Layers

#### **Mobile Calendar Stack**
```css
/* Mobile calendar z-index stack */
.mobile-calendar {
  z-index: var(--z-base);

  .mobile-header {
    z-index: var(--z-sticky);
    position: sticky;
    top: 0;
  }

  .mobile-toolbar {
    z-index: var(--z-content);
  }

  .calendar-view {
    z-index: var(--z-base);
  }

  .today-events {
    z-index: var(--z-content);
  }

  .mobile-bottom-nav {
    z-index: var(--z-sticky);
    position: sticky;
    bottom: 0;
  }
}
```

### 5.2 Touch Interaction Layers

#### **Touch Feedback**
```css
/* Touch interaction layers */
.touch-feedback {
  z-index: var(--z-interactive);
  position: absolute;
  pointer-events: none;
}

.touch-ripple {
  z-index: var(--z-tooltip);
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: ripple 0.6s linear;
}
```

---

## ⚡ 6. Performance & Optimization

### 6.1 Z-Index Performance Impact

#### **Repaint Optimization**
```css
/* Optimize for minimal repaints */
.z-optimized {
  /* Isolate compositing layers */
  transform: translateZ(0);
  will-change: transform;

  /* Minimize stacking context changes */
  contain: layout style paint;
}
```

#### **Layer Management**
```typescript
// Z-index management utility
const useZIndex = (layer: keyof typeof zIndexScale) => {
  const [zIndex, setZIndex] = useState(zIndexScale[layer]);

  useEffect(() => {
    // Ensure z-index doesn't conflict
    const currentMax = getCurrentMaxZIndex();
    if (zIndex <= currentMax) {
      setZIndex(currentMax + 1);
    }
  }, [zIndex]);

  return zIndex;
};
```

### 6.2 Memory Management

#### **Layer Cleanup**
```typescript
// Clean up z-index layers on unmount
const useZIndexCleanup = (layerId: string) => {
  useEffect(() => {
    return () => {
      // Remove from z-index registry
      removeLayer(layerId);
    };
  }, [layerId]);
};
```

---

## 🎯 7. Z-Index Testing & Validation

### 7.1 Layer Conflict Tests
```typescript
// Z-index conflict testing
describe('Z-Index Conflicts', () => {
  it('should not have modal behind tooltip', () => {
    const modal = screen.getByRole('dialog');
    const tooltip = screen.getByRole('tooltip');

    const modalZ = parseInt(window.getComputedStyle(modal).zIndex);
    const tooltipZ = parseInt(window.getComputedStyle(tooltip).zIndex);

    expect(modalZ).toBeGreaterThan(tooltipZ);
  });

  it('should maintain calendar foundation layers', () => {
    const calendar = screen.getByTestId('calendar-foundation');
    const events = screen.getByTestId('calendar-events');

    const calendarZ = parseInt(window.getComputedStyle(calendar).zIndex);
    const eventsZ = parseInt(window.getComputedStyle(events).zIndex);

    expect(eventsZ).toBeGreaterThan(calendarZ);
  });
});
```

### 7.2 Performance Tests
```typescript
// Z-index performance testing
describe('Z-Index Performance', () => {
  it('should not cause layout thrashing', () => {
    // Measure layout performance with z-index changes
    const metrics = measureZIndexPerformance();

    expect(metrics.layoutTime).toBeLessThan(16); // 60fps
    expect(metrics.repaintTime).toBeLessThan(8); // Smooth repaints
  });
});
```

---

## 🔗 8. Related Documentation

- **Grid Systems**: `docs/design-system-research/10-layout/grids/grid-systems.md`
- **Scroll Containers**: `docs/design-system-research/10-layout/scroll-containers/scroll-behavior.md`
- **ASCII Layouts**: `docs/design-system-research/10-layout/ascii/`
- **Modal Inventory**: `docs/design-system-research/50-ux-flows/OVERLAY_INVENTORY.md`

---

**Next**: Complete responsive breakpoint specifications for all device sizes.
