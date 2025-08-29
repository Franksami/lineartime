# QuantumCalendarCore Documentation

**Modern CSS Calendar with Iterative Refinement and A/B Testing**

## Overview

QuantumCalendarCore is a sophisticated foundation for continuous refinement and A/B testing, built upon the existing LinearCalendarHorizontal foundation. It leverages modern CSS features like Subgrid and Container Queries while preserving the immutable 12×42 grid layout specification.

## Key Features

### 🚀 Modern CSS Implementation
- **CSS Subgrid**: Perfect alignment across all 12 month rows and 42 day columns
- **Container Queries**: Responsive calendar cells that adapt to their containers
- **Fluid Typography**: clamp() functions with design token integration
- **Progressive Enhancement**: Graceful fallbacks for older browsers

### ⚡ Physics-Based Interactions
- **Micro-Interaction Framework**: Physics-based animations with performance monitoring
- **Elastic Hover Effects**: Spring-based hover and focus states
- **Magnetic Snapping**: Subtle magnetic effects for improved user experience
- **Haptic Feedback**: Touch device vibration support

### 📊 Performance & Analytics
- **Real-Time Monitoring**: Comprehensive performance metrics tracking
- **User Engagement Analytics**: Feature utilization and interaction patterns
- **A/B Testing Integration**: Gradual rollout and variant comparison
- **Memory Optimization**: GPU acceleration and virtualization

### ♿ Accessibility Excellence
- **WCAG AAA Compliance**: Enhanced focus indicators and screen reader support
- **Keyboard Navigation**: Full keyboard accessibility with visual feedback
- **Reduced Motion Support**: Respects user motion preferences
- **High Contrast**: Adaptive contrast ratios for accessibility

## Architecture

### Foundation Preservation

The QuantumCalendarCore **strictly preserves** the Command Center Calendar foundation layout:

- ✅ **12 vertical month rows** (Jan→Dec stacked)
- ✅ **42-cell grid per month** (6 weeks × 7 days) 
- ✅ **Correct day-of-week alignment** for any year
- ✅ **Week headers** at top and bottom
- ✅ **Month labels** on left and right
- ✅ **Year header** with tagline

All quantum enhancements are **additive** and do not modify the core layout structure.

### Component Structure

```
quantum/
├── QuantumCalendarCore.tsx          # Main component
├── QuantumFeatureFlags.tsx          # Feature flag management UI
├── QuantumAnalytics.tsx             # Analytics dashboard
├── utils.ts                         # Utility functions
├── constants.ts                     # Configuration constants
├── hooks.ts                         # Custom React hooks
└── index.ts                         # Public API exports
```

### CSS Architecture

```
styles/quantum-calendar.css
├── CSS Custom Properties            # Design tokens
├── Subgrid Implementation          # Perfect grid alignment
├── Container Queries               # Responsive adaptations
├── Physics Animations             # Micro-interactions
├── Accessibility Enhancements     # AAA compliance
├── Performance Optimizations      # GPU acceleration
└── Progressive Enhancement         # Fallback strategies
```

## Usage

### Basic Implementation

```tsx
import { QuantumCalendarCore } from '@/components/calendar/quantum';

<QuantumCalendarCore
  year={2025}
  events={events}
  onDateSelect={handleDateSelect}
  onEventClick={handleEventClick}
  onEventCreate={handleEventCreate}
  onEventUpdate={handleEventUpdate}
  onEventDelete={handleEventDelete}
/>
```

### With Feature Flags

```tsx
const featureFlags = {
  enableSubgrid: true,
  enableContainerQueries: true,
  enableFluidTypography: true,
  enablePhysicsAnimations: true,
  enablePerformanceTracking: true,
};

<QuantumCalendarCore
  year={2025}
  events={events}
  featureFlags={featureFlags}
  onFeatureFlagChange={handleFeatureFlagChange}
/>
```

### With A/B Testing

```tsx
const abTestConfig = {
  testId: 'quantum-features-test',
  testName: 'Modern CSS Features Test',
  hypothesis: 'Modern CSS features improve user experience',
  variants: [
    {
      id: 'control',
      name: 'Control',
      description: 'Standard CSS Grid layout',
      featureFlags: { 
        enableSubgrid: false,
        enableContainerQueries: false,
      },
      weight: 0.5,
      startDate: new Date(),
      targetMetrics: ['renderTime', 'taskCompletionRate'],
    },
    {
      id: 'quantum',
      name: 'Quantum Enhanced', 
      description: 'Modern CSS with subgrid and container queries',
      featureFlags: {
        enableSubgrid: true,
        enableContainerQueries: true,
        enableFluidTypography: true,
      },
      weight: 0.5,
      startDate: new Date(),
      targetMetrics: ['renderTime', 'engagementScore'],
    },
  ],
  sampleSize: 1000,
  confidenceLevel: 0.95,
  minDetectableEffect: 0.05,
};

<QuantumCalendarCore
  year={2025}
  events={events}
  abTestConfig={abTestConfig}
  onVariantAssignment={handleVariantAssignment}
/>
```

### With Performance Monitoring

```tsx
const performanceConfig = {
  enabled: true,
  sampleRate: 1.0,
  enableRealUserMonitoring: true,
  budgets: {
    renderTime: 16, // 60fps target
    memoryUsage: 100, // 100MB
    cumulativeLayoutShift: 0.1,
  },
  alerts: {
    enabled: true,
    thresholds: {
      performanceDegradation: 20,
      errorRate: 5,
    },
  },
};

<QuantumCalendarCore
  year={2025}
  events={events}
  performanceConfig={performanceConfig}
  onPerformanceMetric={handlePerformanceMetric}
/>
```

### Development Mode

```tsx
<QuantumCalendarCore
  year={2025}
  events={events}
  enableDebugMode={true}
  enablePerformanceOverlay={true}
  enableFeatureFlagPanel={true}
/>
```

## Feature Flags

### CSS Modern Features

| Flag | Description | Default | Browser Support |
|------|-------------|---------|----------------|
| `enableSubgrid` | CSS Subgrid for perfect alignment | `true` | Chrome 117+, Firefox 71+, Safari 16+ |
| `enableContainerQueries` | Container-based responsive design | `true` | Chrome 105+, Firefox 110+, Safari 16+ |
| `enableFluidTypography` | clamp() based responsive typography | `true` | Chrome 79+, Firefox 75+, Safari 13.1+ |

### Micro-Interactions & Physics

| Flag | Description | Default | Performance Impact |
|------|-------------|---------|-------------------|
| `enablePhysicsAnimations` | Spring-based animations | `false` | Medium |
| `enableParallaxEffects` | Parallax scrolling effects | `false` | High |
| `enableElasticScrolling` | Elastic scroll boundaries | `false` | Medium |
| `enableQuantumTransitions` | Enhanced state transitions | `true` | Low |

### Performance & Optimization

| Flag | Description | Default | Impact |
|------|-------------|---------|---------|
| `enableQuantumVirtualization` | Virtualized rendering | `true` | Positive |
| `enableIntersectionObserver` | Lazy loading with IntersectionObserver | `true` | Positive |
| `enableWebWorkerCalculations` | Background calculations | `false` | Positive |
| `enableGPUAcceleration` | Hardware acceleration | `true` | Positive |

### Advanced UI Features

| Flag | Description | Default | Browser Requirements |
|------|-------------|---------|---------------------|
| `enableMagneticSnapping` | Magnetic interaction effects | `false` | Modern browsers |
| `enableGestureRecognition` | Advanced touch gestures | `false` | Touch devices |
| `enableVoiceInteraction` | Voice commands | `false` | Web Speech API |
| `enableHapticFeedback` | Vibration feedback | `false` | Mobile devices |

### Analytics & Monitoring

| Flag | Description | Default | Privacy Impact |
|------|-------------|---------|---------------|
| `enablePerformanceTracking` | Performance metrics collection | `true` | None |
| `enableUserBehaviorAnalytics` | User interaction tracking | `true` | Low |
| `enableA11yMetrics` | Accessibility metrics | `true` | None |
| `enableErrorBoundaryReporting` | Error tracking | `true` | None |

## Performance Metrics

### Core Web Vitals

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s  
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Quantum-Specific Metrics

- **Render Time**: < 16ms (60fps target)
- **Memory Usage**: < 100MB
- **Subgrid Render Time**: < 8ms
- **Container Query Evaluation**: < 5ms
- **Physics Calculation Time**: < 10ms
- **Scroll Smoothness**: > 95%

### Budget Monitoring

```tsx
const budgets = {
  renderTime: 16,        // 60fps target
  memoryUsage: 100,      // 100MB
  bundleSize: 500,       // 500KB
  cumulativeLayoutShift: 0.1,
};
```

## A/B Testing Framework

### Variant Assignment

Users are automatically assigned to test variants using deterministic hashing:

```typescript
function assignUserToVariant(userId: string, variants: QuantumVariant[]) {
  const hash = hashString(userId);
  const normalizedHash = hash / 2147483647;
  
  let cumulativeWeight = 0;
  for (const variant of variants) {
    cumulativeWeight += variant.weight;
    if (normalizedHash <= cumulativeWeight) {
      return variant;
    }
  }
  
  return variants[variants.length - 1];
}
```

### Metrics Collection

The system automatically tracks key performance and engagement metrics for each variant:

- **Performance**: Render time, memory usage, scroll smoothness
- **Engagement**: Task completion rate, session duration, feature utilization
- **Quality**: Error rates, accessibility compliance, user satisfaction

### Statistical Analysis

Built-in statistical analysis ensures reliable test results:

- **Sample Size Calculation**: Power analysis for reliable results
- **Confidence Intervals**: 90%, 95%, 99% confidence levels
- **Minimum Detectable Effect**: Configurable effect size thresholds
- **Early Stopping**: Automatic test conclusion when significance reached

## Browser Support & Fallbacks

### Progressive Enhancement Strategy

The quantum calendar follows a progressive enhancement approach:

1. **Baseline**: CSS Grid support (required)
2. **Enhanced**: Container Queries and Subgrid (fallbacks provided)
3. **Advanced**: Physics animations and WebGL (graceful degradation)

### Fallback Strategies

| Feature | Primary | Fallback 1 | Fallback 2 |
|---------|---------|------------|------------|
| CSS Subgrid | `display: subgrid` | CSS Grid | Flexbox |
| Container Queries | `@container` | Media queries | Viewport units |
| Custom Properties | `var()` | Static values | Preprocessor variables |
| Intersection Observer | Native API | Scroll events | Manual viewport checks |

### Browser Compatibility Matrix

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS Subgrid | 117+ | 71+ | 16+ | 117+ |
| Container Queries | 105+ | 110+ | 16+ | 105+ |
| CSS Grid | 57+ | 52+ | 10.1+ | 16+ |
| Custom Properties | 49+ | 31+ | 9.1+ | 16+ |

## Development & Debugging

### Debug Mode

Enable comprehensive debugging with visual indicators:

```tsx
<QuantumCalendarCore
  enableDebugMode={true}
  className="quantum-debug"
/>
```

Debug mode provides:
- Grid line visualization
- Container query breakpoint indicators
- Performance overlay
- Feature flag status panel

### Performance Overlay

Real-time performance monitoring during development:

- **Render Time**: Current and average render performance
- **Memory Usage**: JavaScript heap size tracking
- **Feature Impact**: Individual feature performance costs
- **Browser Support**: Compatibility status for modern features

### Feature Flag Panel

Interactive panel for runtime feature management:

- **Category Organization**: Features grouped by type and impact
- **Real-Time Toggling**: Instant feature enable/disable
- **Performance Impact**: Visual indicators for each feature's cost
- **A/B Test Control**: Manual variant assignment for testing

## CSS Custom Properties Reference

### Layout Variables

```css
--quantum-calendar-gap: clamp(0.125rem, 0.5vw, 0.25rem);
--quantum-calendar-border-radius: clamp(0.25rem, 1vw, 0.5rem);
--quantum-calendar-header-height: clamp(2rem, 5vh, 3rem);
```

### Grid System

```css
--quantum-grid-columns: 42;
--quantum-grid-rows: 12;
--quantum-month-height: minmax(3rem, 1fr);
--quantum-day-width: minmax(1.5rem, 1fr);
```

### Fluid Typography

```css
--quantum-font-size-xs: clamp(0.625rem, 1.5vw, 0.75rem);
--quantum-font-size-sm: clamp(0.75rem, 2vw, 0.875rem);
--quantum-font-size-base: clamp(0.875rem, 2.5vw, 1rem);
--quantum-font-size-lg: clamp(1rem, 3vw, 1.125rem);
```

### Physics Animations

```css
--quantum-spring-tension: 120;
--quantum-spring-friction: 14;
--quantum-easing-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
--quantum-duration-quick: 200ms;
```

### Accessibility

```css
--quantum-focus-outline-width: 3px;
--quantum-focus-outline-offset: 2px;
--quantum-focus-outline-color: hsl(210 100% 50%);
--quantum-tap-target-min: 44px;
```

## Migration from LinearCalendarHorizontal

### API Compatibility

QuantumCalendarCore maintains 100% API compatibility with LinearCalendarHorizontal:

```tsx
// Existing LinearCalendarHorizontal props work unchanged
<QuantumCalendarCore
  year={year}
  events={events}
  onDateSelect={onDateSelect}
  onEventClick={onEventClick}
  onEventUpdate={onEventUpdate}
  onEventCreate={onEventCreate}
  onEventDelete={onEventDelete}
  enableInfiniteCanvas={enableInfiniteCanvas}
  dayContent={dayContent}
  className={className}
/>
```

### Progressive Migration

1. **Drop-in Replacement**: Replace component import, no other changes required
2. **Enable Modern CSS**: Add feature flags to gradually enable quantum features
3. **Add Analytics**: Configure performance and engagement tracking
4. **Implement A/B Testing**: Set up variants for feature comparison
5. **Optimize Performance**: Fine-tune based on metrics and user feedback

### Feature Parity

All LinearCalendarHorizontal features are preserved:

- ✅ Event CRUD operations
- ✅ Keyboard navigation
- ✅ Touch gesture support
- ✅ Accessibility features
- ✅ Internationalization
- ✅ RTL support
- ✅ Mobile optimization
- ✅ Performance monitoring
- ✅ AI integration points

## Best Practices

### Performance

1. **Enable Virtualization**: For calendars with >500 events
2. **Monitor Budgets**: Set appropriate performance budgets for your use case
3. **Use Container Queries**: For responsive components over media queries
4. **Optimize Physics**: Disable physics animations on low-end devices

### A/B Testing

1. **Start Small**: Test individual features rather than large feature sets
2. **Define Success Metrics**: Clearly define what success looks like
3. **Statistical Rigor**: Ensure adequate sample sizes and confidence levels
4. **Monitor Performance**: Watch for performance regressions in test variants

### Accessibility

1. **Test with Screen Readers**: Verify all functionality works with assistive technology
2. **Keyboard Navigation**: Ensure full keyboard accessibility
3. **Color Contrast**: Maintain WCAG AAA contrast ratios
4. **Reduced Motion**: Respect user motion preferences

### Development

1. **Use Debug Mode**: Enable during development for visual feedback
2. **Performance Overlay**: Monitor performance impact of features
3. **Progressive Enhancement**: Test fallback behavior in older browsers
4. **Feature Flags**: Use flags for gradual rollouts and easy rollbacks

## Troubleshooting

### Common Issues

#### Subgrid Not Working
```css
/* Check browser support */
@supports (grid-template-columns: subgrid) {
  .quantum-month-row {
    grid-template-columns: subgrid;
  }
}
```

#### Container Queries Not Responsive
```css
/* Ensure container-type is set */
.quantum-calendar-core {
  container-type: inline-size;
  container-name: quantum-calendar;
}
```

#### Performance Issues
1. Check performance overlay for bottlenecks
2. Disable physics animations if needed
3. Reduce virtualization buffer size
4. Monitor memory usage patterns

#### A/B Test Not Working
1. Verify variant weights sum to ≤ 1.0
2. Check user ID consistency
3. Confirm feature flags are properly applied
4. Review assignment logic in browser dev tools

## API Reference

### QuantumCalendarCore Props

```typescript
interface QuantumCalendarCoreProps {
  // Inherited from LinearCalendarHorizontal
  year: number;
  events: Event[];
  className?: string;
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
  onEventUpdate?: (event: Event) => void;
  onEventCreate?: (event: Partial<Event>) => void;
  onEventDelete?: (id: string) => void;
  enableInfiniteCanvas?: boolean;
  dayContent?: (ctx: DayContentContext) => React.ReactNode;
  
  // Quantum-specific props
  quantumConfig?: QuantumConfig;
  abTestConfig?: QuantumABTestConfig;
  performanceConfig?: QuantumPerformanceConfig;
  analyticsConfig?: QuantumAnalyticsConfig;
  
  // Feature flag overrides
  featureFlags?: Partial<QuantumFeatureFlags>;
  variant?: string;
  
  // Development & debugging
  enableDebugMode?: boolean;
  enablePerformanceOverlay?: boolean;
  enableFeatureFlagPanel?: boolean;
  
  // Callbacks
  onPerformanceMetric?: (metrics: QuantumPerformanceMetrics) => void;
  onEngagementMetric?: (metrics: QuantumEngagementMetrics) => void;
  onFeatureFlagChange?: (flag: keyof QuantumFeatureFlags, enabled: boolean) => void;
  onVariantAssignment?: (variant: QuantumVariant) => void;
}
```

### Utility Functions

```typescript
// Browser support detection
function detectBrowserSupport(): Record<string, BrowserSupportResult>

// Performance measurement
function calculatePerformanceScore(metrics: QuantumPerformanceMetrics): number
function measureQuantumFeatureImpact<T>(featureName: string, operation: () => T): T

// Analytics
function generateSessionId(): string
function trackQuantumEvent(eventType: string, data: Record<string, any>): QuantumEventData

// A/B testing
function assignUserToVariant(userId: string, variants: QuantumVariant[]): QuantumVariant | null
function evaluateFeatureFlag(flag: keyof QuantumFeatureFlags, ...): FeatureFlagEvaluation

// Configuration
function createQuantumConfig(overrides?: Partial<QuantumConfig>): QuantumConfig
function validateQuantumConfig(config: QuantumConfig): string[]
function mergeQuantumConfigs(base: QuantumConfig, override: Partial<QuantumConfig>): QuantumConfig
```

## Contributing

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Open quantum examples: `http://localhost:3000/quantum-examples`

### Adding New Features

1. **Define Feature Flag**: Add to `QuantumFeatureFlags` interface
2. **Implement Feature**: Add implementation with progressive enhancement
3. **Add Tests**: Include unit and integration tests
4. **Document Impact**: Measure performance and accessibility impact
5. **Update Documentation**: Add feature documentation and examples

### Testing

```bash
# Run foundation tests (required)
npm run test:foundation

# Run quantum-specific tests  
npm run test:quantum

# Run performance tests
npm run test:performance

# Run accessibility tests
npm run test:a11y
```

---

## Conclusion

QuantumCalendarCore provides a solid foundation for iterative calendar improvements through modern CSS features, comprehensive A/B testing, and detailed performance monitoring. By preserving the Command Center Calendar foundation while adding quantum enhancements, it enables continuous refinement based on real user data and performance metrics.

The modular architecture and feature flag system make it easy to experiment with new features, measure their impact, and roll them out gradually to ensure the best possible user experience.