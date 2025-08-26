# 📜 Scroll Container Specifications

## 🎯 Overview
**Critical Component**: Scroll behavior directly impacts user experience and performance
**Foundation Challenge**: Horizontal calendar timeline requires specialized scroll handling
**Performance Focus**: Smooth scrolling, virtual scrolling, and memory optimization

---

## 🏗️ 1. Core Scroll System

### 1.1 Scroll Container Types

#### **Page-Level Scrolling**
```css
/* Full page vertical scrolling */
.page-container {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden; /* Prevent horizontal scroll */

  /* Smooth scrolling */
  scroll-behavior: smooth;

  /* Performance optimization */
  -webkit-overflow-scrolling: touch; /* iOS momentum scrolling */
  overscroll-behavior: contain; /* Prevent scroll chaining */
}
```

#### **Component-Level Scrolling**
```css
/* Bounded scroll containers */
.scroll-container {
  overflow: auto;
  max-height: 400px; /* Explicit height limit */

  /* Custom scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: var(--muted-foreground) var(--background);

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: var(--background);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--muted-foreground);
    border-radius: 4px;
  }
}
```

#### **Virtual Scrolling** (Critical for Calendar)
```css
/* Virtual scroll container for large datasets */
.virtual-scroll {
  height: 600px;
  overflow: auto;
  position: relative;

  .virtual-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    transform: translateY(var(--virtual-offset, 0));
  }

  .virtual-item {
    position: absolute;
    width: 100%;
    transform: translateY(var(--item-offset, 0));
  }
}
```

---

## 📅 2. Calendar-Specific Scroll Behavior

### 2.1 Foundation Horizontal Scrolling (LINEAR CALENDAR - IMMUTABLE)

#### **Horizontal Timeline Scroll**
```css
/* FOUNDATION SCROLL BEHAVIOR - DO NOT MODIFY */
.calendar-horizontal-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;

  /* Hide scrollbar but maintain functionality */
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  /* iOS Safari scroll momentum */
  -webkit-overflow-scrolling: touch;

  /* Prevent vertical scroll */
  height: 100%;
  position: relative;
}

.calendar-container {
  /* Minimum width for 12 months */
  min-width: calc(42 * 48px + 41 * 1px); /* 42 columns + gaps */

  /* Foundation grid */
  display: grid;
  grid-template-columns: repeat(42, 1fr);
  gap: 1px;
}
```

#### **Month Navigation**
```css
/* Month jump navigation */
.month-navigation {
  position: sticky;
  left: 0;
  z-index: 10;
  background: var(--background);
  border-right: 1px solid var(--border);
  padding: var(--grid-4);

  .month-button {
    display: block;
    padding: var(--grid-2) var(--grid-4);
    margin-bottom: var(--grid-1);
    border-radius: var(--radius);
    background: var(--card);
    border: 1px solid var(--border);

    &:hover {
      background: var(--accent);
    }

    &.current-month {
      background: var(--primary);
      color: var(--primary-foreground);
    }
  }
}
```

#### **Touch & Gesture Handling**
```css
/* Touch-optimized scrolling */
.touch-scroll {
  /* Momentum scrolling on iOS */
  -webkit-overflow-scrolling: touch;

  /* Prevent scroll chaining */
  overscroll-behavior: contain;

  /* Touch action optimization */
  touch-action: pan-x pinch-zoom;
}

/* Swipe gesture handling */
.swipe-container {
  position: relative;
  overflow: hidden;

  .swipe-content {
    display: flex;
    width: 300%; /* 3x width for swipe buffer */
    transition: transform 0.3s ease-out;
  }
}
```

### 2.2 Vertical Event Scrolling

#### **Event List Scrolling**
```css
/* Vertical event scrolling within day cells */
.day-events-scroll {
  max-height: 100px; /* Limit event display */
  overflow-y: auto;
  overflow-x: hidden;

  /* Hide scrollbar */
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.event-item {
  padding: var(--grid-1) var(--grid-2);
  margin-bottom: 1px;
  font-size: 0.75rem;
  line-height: 1.2;
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

---

## 🏠 3. Application Scroll Containers

### 3.1 Landing Page Scrolling

#### **Full Page Vertical Scroll**
```css
/* Landing page container */
.landing-container {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;

  /* Section-based scrolling */
  scroll-snap-type: y proximity;
  scroll-behavior: smooth;
}

.landing-section {
  min-height: 100vh;
  padding: var(--grid-8) 0;
  display: flex;
  align-items: center;

  /* Optional scroll snapping */
  scroll-snap-align: start;
  scroll-snap-stop: always;
}
```

#### **Testimonial Carousel Scroll**
```css
/* Horizontal testimonial scroll */
.testimonial-carousel {
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;

  /* Hide scrollbar */
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.testimonial-slide {
  flex: 0 0 100%;
  scroll-snap-align: start;
  padding: 0 var(--grid-4);
}
```

### 3.2 Dashboard Scroll Containers

#### **Activity Feed Scrolling**
```css
/* Dashboard activity scroll */
.activity-feed {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: var(--grid-2); /* Space for scrollbar */

  .activity-item {
    padding: var(--grid-3);
    border-bottom: 1px solid var(--border);

    &:last-child {
      border-bottom: none;
    }
  }
}
```

#### **Event List Scrolling**
```css
/* Upcoming events scroll */
.events-list {
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;

  .event-item {
    padding: var(--grid-4);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-bottom: var(--grid-2);
    background: var(--card);

    &:last-child {
      margin-bottom: 0;
    }
  }
}
```

### 3.3 Settings Page Scrolling

#### **Settings Content Scroll**
```css
/* Settings content area */
.settings-content {
  height: calc(100vh - 200px); /* Account for header/footer */
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--grid-6);

  /* Smooth section scrolling */
  scroll-behavior: smooth;
}

.settings-section {
  margin-bottom: var(--grid-8);

  &:last-child {
    margin-bottom: 0;
  }
}
```

#### **Form Section Scrolling**
```css
/* Long form scrolling within sections */
.form-scroll-container {
  max-height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--grid-4);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--muted);
}
```

### 3.4 Mobile Scroll Containers

#### **Mobile Page Scrolling**
```css
/* Mobile full page scroll */
.mobile-page {
  min-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;

  /* iOS Safari optimization */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
```

#### **Mobile Calendar Scrolling**
```css
/* Mobile calendar scroll */
.mobile-calendar-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  /* Touch optimization */
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}
```

#### **Bottom Sheet Scrolling**
```css
/* Mobile bottom sheet */
.bottom-sheet-content {
  max-height: 70vh; /* Limit sheet height */
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--grid-4);

  /* iOS Safari optimization */
  -webkit-overflow-scrolling: touch;
}
```

---

## ⚡ 4. Performance Optimization

### 4.1 Scroll Performance Budget

#### **Frame Rate Targets**
- **60fps scrolling**: < 16ms per frame
- **Smooth animations**: No dropped frames
- **Memory usage**: < 50MB during scroll
- **Layout shifts**: < 0.1 cumulative layout shift

#### **Scroll Event Optimization**
```css
/* Optimized scroll event handling */
.scroll-optimized {
  /* Use passive listeners */
  will-change: scroll-position;

  /* Optimize for GPU */
  transform: translateZ(0);
  backface-visibility: hidden;

  /* Minimize paint operations */
  contain: layout style paint;
}
```

### 4.2 Virtual Scrolling Implementation

#### **Calendar Virtual Scrolling**
```css
/* Virtual scrolling for calendar months */
.calendar-virtual {
  position: relative;
  height: 600px;
  overflow: auto;

  .virtual-month {
    position: absolute;
    width: 100%;
    transform: translateY(var(--month-offset, 0));
  }
}

/* Event virtualization within days */
.day-virtual {
  position: relative;
  height: 100px;
  overflow: hidden;

  .event-container {
    position: absolute;
    width: 100%;
  }
}
```

### 4.3 Memory Management

#### **Scroll State Management**
```typescript
// Scroll position persistence
const useScrollPersistence = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollPosition;
};
```

---

## 🎯 5. Scroll Behavior Testing

### 5.1 Scroll Performance Tests
```typescript
// Scroll performance testing
describe('Scroll Performance', () => {
  it('should maintain 60fps during scroll', async () => {
    const scrollContainer = screen.getByTestId('scroll-container');

    // Measure scroll performance
    const metrics = await measureScrollPerformance(scrollContainer);

    expect(metrics.averageFrameRate).toBeGreaterThan(58);
    expect(metrics.maxFrameTime).toBeLessThan(16);
  });

  it('should handle large calendar datasets', () => {
    // Test with 10,000+ events
    const calendar = render(<Calendar events={largeEventSet} />);

    expect(calendar.container.scrollHeight).toBeDefined();
    expect(calendar.container.scrollWidth).toBeDefined();
  });
});
```

### 5.2 Touch & Gesture Tests
```typescript
// Touch gesture testing
describe('Touch Gestures', () => {
  it('should handle swipe gestures on mobile', () => {
    const calendar = render(<MobileCalendar />);

    // Simulate swipe gesture
    fireEvent.touchStart(calendar.container, { touches: [{ clientX: 0 }] });
    fireEvent.touchMove(calendar.container, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(calendar.container);

    expect(calendar.container.scrollLeft).toBeGreaterThan(0);
  });
});
```

---

## 📱 6. Platform-Specific Scroll Behavior

### 6.1 Desktop Scroll Behavior
- **Mouse wheel**: Smooth vertical scrolling
- **Shift + wheel**: Horizontal scrolling
- **Scrollbar styling**: Custom webkit scrollbars
- **Keyboard navigation**: Arrow key scrolling

### 6.2 Mobile Scroll Behavior
- **Touch scrolling**: Native momentum scrolling
- **Pull-to-refresh**: iOS/Android patterns
- **Overscroll**: Bounce vs contain behavior
- **Touch targets**: 44px minimum touch areas

### 6.3 Tablet Scroll Behavior
- **Hybrid input**: Touch + mouse support
- **Adaptive scrolling**: Context-aware behavior
- **Precision scrolling**: Pixel-perfect control

---

## 🔗 7. Related Documentation

- **Grid Systems**: `docs/design-system-research/10-layout/grids/grid-systems.md`
- **Z-Index Map**: `docs/design-system-research/10-layout/z-index/z-index-map.md`
- **ASCII Layouts**: `docs/design-system-research/10-layout/ascii/`
- **Performance Budgets**: `docs/design-system-research/80-performance/budgets/`

---

**Next**: Complete z-index hierarchy mapping for all surfaces and overlay layers.
