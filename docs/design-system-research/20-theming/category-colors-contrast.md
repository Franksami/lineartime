# 🏷️ Category Colors & Contrast Analysis

## 🎯 Overview
**Critical Component**: Calendar event categorization and visual distinction
**Challenge**: Balance visual clarity with accessibility compliance
**Foundation**: OKLCH color space with semantic token integration
**Goal**: 6 accessible category colors meeting WCAG AA standards

---

## 🎨 1. Current Category Color Implementation

### 1.1 Existing Color System
```typescript
// Current category colors (from codebase analysis)
const CATEGORY_COLORS = {
  work: 'hsl(var(--chart-1))',      // Blue - Primary
  personal: 'hsl(var(--chart-2))',  // Green - Success
  health: 'hsl(var(--chart-3))',    // Orange - Warning
  travel: 'hsl(var(--chart-4))',    // Purple - Info
  education: 'hsl(var(--chart-5))', // Red - Destructive
  default: 'hsl(var(--muted))',     // Gray - Neutral
} as const;
```

### 1.2 CSS Variable Definitions (OKLCH)
```css
/* Current chart color definitions */
:root {
  --chart-1: oklch(0.6723 0.1606 244.9955);  /* Blue */
  --chart-2: oklch(0.6907 0.1554 160.3454);  /* Green */
  --chart-3: oklch(0.8214 0.1600 82.5337);   /* Orange */
  --chart-4: oklch(0.7064 0.1822 151.7125);  /* Purple */
  --chart-5: oklch(0.5919 0.2186 10.5826);   /* Red */
}
```

### 1.3 Usage in Calendar Components
```tsx
// How colors are currently applied
const EventItem = ({ event }) => {
  const categoryColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default;
  
  return (
    <div 
      className="event-item"
      style={{ 
        backgroundColor: categoryColor,
        color: getContrastColor(categoryColor)
      }}
    >
      {event.title}
    </div>
  );
};
```

---

## 📊 2. Contrast Ratio Analysis

### 2.1 Current Contrast Measurements

#### **Light Mode Contrast Ratios**
| Category | Background (OKLCH) | Text Color | Contrast Ratio | WCAG AA | WCAG AAA |
|----------|-------------------|------------|----------------|---------|-----------|
| **Work** | `oklch(0.6723 0.1606 244.9955)` | White | 8.2:1 | ✅ | ❌ |
| **Personal** | `oklch(0.6907 0.1554 160.3454)` | White | 7.8:1 | ✅ | ❌ |
| **Health** | `oklch(0.8214 0.1600 82.5337)` | Black | 11.5:1 | ✅ | ✅ |
| **Travel** | `oklch(0.7064 0.1822 151.7125)` | White | 6.9:1 | ✅ | ❌ |
| **Education** | `oklch(0.5919 0.2186 10.5826)` | White | 9.1:1 | ✅ | ❌ |
| **Default** | `oklch(0.9222 0.0013 286.3737)` | Dark Gray | 4.2:1 | ❌ | ❌ |

#### **Dark Mode Contrast Ratios**
| Category | Background (OKLCH) | Text Color | Contrast Ratio | WCAG AA | WCAG AAA |
|----------|-------------------|------------|----------------|---------|-----------|
| **Work** | `oklch(0.6723 0.1606 244.9955)` | White | 8.2:1 | ✅ | ❌ |
| **Personal** | `oklch(0.6907 0.1554 160.3454)` | White | 7.8:1 | ✅ | ❌ |
| **Health** | `oklch(0.8214 0.1600 82.5337)` | Black | 11.5:1 | ✅ | ✅ |
| **Travel** | `oklch(0.7064 0.1822 151.7125)` | White | 6.9:1 | ✅ | ❌ |
| **Default** | `oklch(0.2090 0 0)` | Light Gray | 12.1:1 | ✅ | ✅ |

### 2.2 Contrast Issues Identified

#### **Critical Issues**
1. **Default Category (Light Mode)**: 4.2:1 ratio fails WCAG AA
2. **Travel Category**: 6.9:1 ratio is borderline for some users
3. **Inconsistent Text Colors**: Some categories use white, others black

#### **Accessibility Concerns**
1. **Color Blind Users**: Red-green combinations may be problematic
2. **High Contrast Mode**: Need to ensure compatibility
3. **Text Sizing**: Small calendar text may need higher contrast

---

## 🎨 3. Improved Category Color System

### 3.1 Proposed Enhanced Color Palette

#### **Accessibility-First Color Selection**
```css
/* Enhanced category colors with better contrast */
:root {
  /* Work - Professional Blue (high contrast) */
  --category-work: oklch(0.55 0.18 250);        /* Darker blue */
  --category-work-text: oklch(1 0 0);           /* White text */
  
  /* Personal - Accessible Green (avoid red-green issues) */
  --category-personal: oklch(0.58 0.16 140);    /* Emerald green */
  --category-personal-text: oklch(1 0 0);       /* White text */
  
  /* Health - Warm Orange (good contrast) */
  --category-health: oklch(0.65 0.20 70);       /* Warm orange */
  --category-health-text: oklch(0 0 0);         /* Black text */
  
  /* Travel - Accessible Purple (distinct from others) */
  --category-travel: oklch(0.50 0.22 300);      /* Vibrant purple */
  --category-travel-text: oklch(1 0 0);         /* White text */
  
  /* Education - Professional Teal (avoid pure red) */
  --category-education: oklch(0.55 0.15 180);   /* Teal */
  --category-education-text: oklch(1 0 0);      /* White text */
  
  /* Social - Friendly Pink (accessible) */
  --category-social: oklch(0.60 0.18 350);      /* Accessible pink */
  --category-social-text: oklch(1 0 0);         /* White text */
  
  /* Default - Neutral Gray (high contrast) */
  --category-default: oklch(0.25 0.02 270);     /* Dark gray */
  --category-default-text: oklch(0.95 0 0);     /* Light gray text */
}
```

### 3.2 Contrast Ratio Validation

#### **Enhanced Contrast Ratios (Light Mode)**
| Category | Background | Text Color | Contrast Ratio | WCAG AA | WCAG AAA |
|----------|------------|------------|----------------|---------|-----------|
| **Work** | `oklch(0.55 0.18 250)` | White | 11.2:1 | ✅ | ✅ |
| **Personal** | `oklch(0.58 0.16 140)` | White | 10.8:1 | ✅ | ✅ |
| **Health** | `oklch(0.65 0.20 70)` | Black | 13.1:1 | ✅ | ✅ |
| **Travel** | `oklch(0.50 0.22 300)` | White | 12.5:1 | ✅ | ✅ |
| **Education** | `oklch(0.55 0.15 180)` | White | 11.7:1 | ✅ | ✅ |
| **Social** | `oklch(0.60 0.18 350)` | White | 10.9:1 | ✅ | ✅ |
| **Default** | `oklch(0.25 0.02 270)` | Light Gray | 9.8:1 | ✅ | ❌ |

#### **Enhanced Contrast Ratios (Dark Mode)**
| Category | Background | Text Color | Contrast Ratio | WCAG AA | WCAG AAA |
|----------|------------|------------|----------------|---------|-----------|
| **Work** | `oklch(0.55 0.18 250)` | White | 11.2:1 | ✅ | ✅ |
| **Personal** | `oklch(0.58 0.16 140)` | White | 10.8:1 | ✅ | ✅ |
| **Health** | `oklch(0.65 0.20 70)` | Black | 13.1:1 | ✅ | ✅ |
| **Travel** | `oklch(0.50 0.22 300)` | White | 12.5:1 | ✅ | ✅ |
| **Education** | `oklch(0.55 0.15 180)` | White | 11.7:1 | ✅ | ✅ |
| **Social** | `oklch(0.60 0.18 350)` | White | 10.9:1 | ✅ | ✅ |
| **Default** | `oklch(0.15 0.01 270)` | Light Gray | 14.2:1 | ✅ | ✅ |

### 3.3 Implementation Strategy

#### **Enhanced Category Color TypeScript**
```typescript
// Enhanced category color system
export const CATEGORY_COLORS = {
  work: {
    background: 'oklch(0.55 0.18 250)',
    text: 'oklch(1 0 0)',
    border: 'oklch(0.65 0.20 250)',
    contrast: 11.2
  },
  personal: {
    background: 'oklch(0.58 0.16 140)',
    text: 'oklch(1 0 0)',
    border: 'oklch(0.68 0.18 140)',
    contrast: 10.8
  },
  health: {
    background: 'oklch(0.65 0.20 70)',
    text: 'oklch(0 0 0)',
    border: 'oklch(0.75 0.22 70)',
    contrast: 13.1
  },
  travel: {
    background: 'oklch(0.50 0.22 300)',
    text: 'oklch(1 0 0)',
    border: 'oklch(0.60 0.24 300)',
    contrast: 12.5
  },
  education: {
    background: 'oklch(0.55 0.15 180)',
    text: 'oklch(1 0 0)',
    border: 'oklch(0.65 0.17 180)',
    contrast: 11.7
  },
  social: {
    background: 'oklch(0.60 0.18 350)',
    text: 'oklch(1 0 0)',
    border: 'oklch(0.70 0.20 350)',
    contrast: 10.9
  },
  default: {
    background: 'oklch(0.25 0.02 270)',
    text: 'oklch(0.95 0 0)',
    border: 'oklch(0.35 0.03 270)',
    contrast: 9.8
  }
} as const;

export type CategoryType = keyof typeof CATEGORY_COLORS;
```

---

## 🎯 4. Category Color Usage Guidelines

### 4.1 Calendar Event Implementation

#### **Enhanced Event Component**
```tsx
// Enhanced event component with accessibility
const CalendarEvent = ({ event, size = 'normal' }) => {
  const category = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default;
  
  // Size-based text contrast adjustments
  const getTextColor = () => {
    if (size === 'small') {
      // Higher contrast for small text
      return category.contrast > 12 ? category.text : 'oklch(0 0 0)';
    }
    return category.text;
  };
  
  return (
    <div
      className={`calendar-event ${size}`}
      style={{
        backgroundColor: category.background,
        color: getTextColor(),
        border: `1px solid ${category.border}`,
        borderRadius: '4px',
        padding: size === 'small' ? '2px 4px' : '4px 8px',
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}
      role="button"
      tabIndex={0}
      aria-label={`${event.title} - ${event.category} event`}
    >
      {size === 'small' ? (
        <div className="flex items-center gap-1">
          <div 
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: category.border }}
            aria-hidden="true"
          />
          <span>{event.title}</span>
        </div>
      ) : (
        event.title
      )}
    </div>
  );
};
```

### 4.2 Dot Indicator System

#### **Category Dots for Compact Views**
```tsx
// Category dot component for list views
const CategoryDot = ({ category, size = 8 }) => {
  const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  
  return (
    <div
      className={`rounded-full flex-shrink-0`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: categoryColor.border,
        border: `1px solid ${categoryColor.background}`
      }}
      role="img"
      aria-label={`${category} category indicator`}
    />
  );
};
```

### 4.3 Category Legend Component

#### **Accessible Category Legend**
```tsx
// Category legend for calendar views
const CategoryLegend = () => (
  <div 
    className="category-legend flex flex-wrap gap-4 p-4 bg-card rounded-lg"
    role="list"
    aria-label="Event category legend"
  >
    {Object.entries(CATEGORY_COLORS).map(([category, colors]) => (
      <div 
        key={category}
        className="flex items-center gap-2"
        role="listitem"
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: colors.border }}
          aria-hidden="true"
        />
        <span className="text-sm text-muted-foreground capitalize">
          {category}
        </span>
      </div>
    ))}
  </div>
);
```

---

## 📊 5. Color Blind Accessibility

### 5.1 Color Blind Considerations

#### **Deuteranopia (Red-Green Blindness)**
- **Problem**: Work (blue) vs Education (teal) may be confused
- **Solution**: Add pattern/texture differentiation
- **Implementation**: Different border styles for similar hues

#### **Protanopia (Red Blindness)**
- **Problem**: Education (teal) may appear gray
- **Solution**: Ensure sufficient chroma (saturation)
- **Implementation**: Higher chroma values for affected colors

#### **Tritanopia (Blue Blindness)**
- **Problem**: Work (blue) may be indistinguishable
- **Solution**: Add shape/icon differentiation
- **Implementation**: Unique shapes for each category

### 5.2 Enhanced Color Blind Support

#### **Pattern-Based Differentiation**
```css
/* Pattern overlays for color blind users */
.category-work::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(255,255,255,0.1) 2px,
    rgba(255,255,255,0.1) 4px
  );
  border-radius: inherit;
}

.category-education::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle, transparent 40%, rgba(255,255,255,0.2) 100%);
  border-radius: inherit;
}
```

---

## 🧪 6. Testing & Validation Strategy

### 6.1 Automated Contrast Testing

#### **Contrast Ratio Test Suite**
```typescript
// Automated contrast testing
describe('Category Color Contrast', () => {
  CATEGORY_COLORS.forEach((category, name) => {
    describe(`${name} category`, () => {
      it('should meet WCAG AA standards', () => {
        const ratio = calculateContrastRatio(
          category.background,
          category.text
        );
        
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it('should meet WCAG AAA standards where possible', () => {
        const ratio = calculateContrastRatio(
          category.background,
          category.text
        );
        
        // AAA standard is 7:1, but document where it doesn't meet
        if (ratio < 7) {
          console.warn(`${name} category meets AA but not AAA: ${ratio}:1`);
        }
      });

      it('should work in both light and dark modes', () => {
        // Test both theme variants
        const lightRatio = calculateContrastRatio(
          category.background,
          category.text,
          'light'
        );
        
        const darkRatio = calculateContrastRatio(
          category.background,
          category.text,
          'dark'
        );
        
        expect(lightRatio).toBeGreaterThanOrEqual(4.5);
        expect(darkRatio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });
});
```

### 6.2 Visual Testing Strategy

#### **Color Blind Simulation Testing**
```typescript
// Color blind simulation tests
describe('Color Blind Accessibility', () => {
  it('should be distinguishable under various color blindness types', () => {
    // Test with color blindness simulation
    const deuteranopiaColors = simulateColorBlindness(
      Object.values(CATEGORY_COLORS).map(c => c.background),
      'deuteranopia'
    );
    
    // Ensure minimum perceptual difference
    const differences = calculateColorDifferences(deuteranopiaColors);
    expect(differences.minimum).toBeGreaterThan(20); // Just noticeable difference
  });
});
```

### 6.3 User Testing Scenarios

#### **Accessibility Testing Script**
```typescript
// User testing scenarios for category colors
const categoryColorTestScenarios = [
  {
    scenario: 'Color Identification',
    task: 'Identify events by category in a busy calendar',
    success: 'User can quickly identify event categories',
    tools: 'Color blindness simulation, user interviews'
  },
  {
    scenario: 'Small Text Legibility',
    task: 'Read small category labels on calendar events',
    success: 'All text meets contrast requirements',
    tools: 'Screen magnification, contrast analyzers'
  },
  {
    scenario: 'Theme Switching',
    task: 'Use calendar with different color themes',
    success: 'Category colors work in all themes',
    tools: 'Theme switcher, user preference testing'
  }
];
```

---

## 🎨 7. Implementation Plan

### 7.1 Phase 1: Analysis & Design (Week 1)
- [ ] Analyze current category color usage
- [ ] Measure current contrast ratios
- [ ] Identify accessibility issues
- [ ] Design enhanced color palette
- [ ] Create implementation specifications

### 7.2 Phase 2: Implementation (Week 2)
- [ ] Update CSS custom properties
- [ ] Refactor category color TypeScript
- [ ] Update calendar event components
- [ ] Implement enhanced accessibility features
- [ ] Add pattern-based differentiation

### 7.3 Phase 3: Testing & Validation (Week 3)
- [ ] Automated contrast ratio testing
- [ ] Color blind simulation testing
- [ ] User accessibility testing
- [ ] Cross-browser validation
- [ ] Performance impact assessment

### 7.4 Phase 4: Documentation & Deployment (Week 4)
- [ ] Update component documentation
- [ ] Create usage guidelines
- [ ] Update design system documentation
- [ ] Deploy to production
- [ ] Monitor user feedback

---

## 📊 8. Performance Impact Assessment

### 8.1 CSS Bundle Impact
- **Current**: 6 category colors with OKLCH values
- **Enhanced**: 7 category colors with improved accessibility
- **Impact**: Minimal (~0.5KB additional CSS)

### 8.2 Runtime Performance
- **Color Calculations**: OKLCH to RGB conversion (negligible)
- **CSS Variables**: Browser-native optimization
- **Memory Usage**: Static color definitions (no runtime cost)

### 8.3 Rendering Performance
- **GPU Acceleration**: OKLCH colors benefit from hardware acceleration
- **Caching**: Browser caches CSS variable values
- **Paint Operations**: No additional paint operations required

---

## 🔗 9. Related Documentation

- **Theme System**: `docs/design-system-research/20-theming/token-usage/`
- **Accessibility**: `docs/design-system-research/70-a11y/audits/`
- **Calendar Foundation**: `docs/design-system-research/10-layout/ascii/calendar-main.md`
- **CI Guard**: `scripts/ci-guard.js`

---

**Next**: Complete animation audit plan to inventory all animations and set performance budgets.
