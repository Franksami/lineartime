# Motion System Implementation Guide

**LinearTime Motion System** - A comprehensive motion design language built on Motion library with 84% bundle size reduction (32KB → 5KB) and audio-visual synchronization.

## 🎯 Overview

The LinearTime Motion System replaces Framer Motion with the Motion library while providing:

- **Performance**: 112+ FPS targets with hardware acceleration
- **Audio-Visual Sync**: Coordinated animations with sound effects
- **Token Integration**: Design system tokens for consistent timing
- **Migration Tools**: Gradual migration from Framer Motion
- **Comprehensive API**: Hooks, utilities, and performance monitoring

## 📦 Installation & Setup

### 1. Dependencies

The Motion library is already installed. Required dependencies:

```bash
# Core dependencies (already included)
motion: ^12.23.12
use-sound: ^5.0.0

# TypeScript support
@types/react: ^19+
```

### 2. Basic Setup

```typescript
// Import motion system
import { 
  useMotionSystem, 
  animate, 
  useButtonAnimation 
} from '@/lib/motion'

// Basic usage in components
function MyComponent() {
  const { animate, tokens } = useMotionSystem()
  
  const handleClick = () => {
    animate('#my-element', { scale: 1.1 }, {
      duration: tokens.durations.fast / 1000,
      category: 'feedback',
      audio: { sound: 'success', syncTiming: true }
    })
  }
  
  return <button id="my-element" onClick={handleClick}>Click me</button>
}
```

## 🎵 Audio-Visual Sync System

### Configuration

The audio-visual sync system integrates with the existing sound service and settings context:

```typescript
import { useAudioVisualSync, ANIMATION_AUDIO_MAPPING } from '@/lib/motion/audio-visual-sync'
import { useSettingsContext } from '@/contexts/SettingsContext'

function MyComponent() {
  const settings = useSettingsContext()
  const { syncWithPreset, syncAnimation } = useAudioVisualSync(settings.notifications)
  
  // Use predefined presets
  const handleButtonPress = () => {
    syncWithPreset('button-press', 150, 'buttonPress')
  }
  
  // Custom sync configuration
  const handleModalOpen = () => {
    syncAnimation('modal-1', 300, {
      sound: 'notification',
      timing: 'end',
      delay: 50,
      volume: 0.2
    })
  }
}
```

### Available Presets

| Preset | Sound | Timing | Use Case |
|--------|-------|--------|----------|
| `buttonPress` | success | start | Button feedback |
| `buttonHover` | notification | start | Hover states |
| `modalOpen` | notification | end | Modal appearances |
| `modalClose` | success | middle | Modal dismissals |
| `eventCreate` | success | end | Calendar event creation |
| `eventUpdate` | notification | middle | Event modifications |
| `eventDelete` | error | start | Event deletions |

## 🎨 Motion Design Language

### Motion Categories & Performance Budgets

```typescript
// Feedback motions (≤150ms) - Immediate user feedback
animate(element, { scale: 0.95 }, { 
  category: 'feedback',
  duration: 0.1,
  audio: { sound: 'success', syncTiming: true }
})

// Interface motions (200-300ms) - UI state changes
animate(element, { x: 100, opacity: 1 }, { 
  category: 'interface',
  duration: 0.25,
  easing: tokens.easings.easeOut
})

// Page transitions (250-400ms) - Route changes
animate(element, { y: 0, opacity: 1 }, { 
  category: 'page',
  duration: 0.35,
  audio: { sound: 'notification', timing: 'middle' }
})
```

### Design Tokens Integration

Motion tokens are automatically integrated with the design system:

```typescript
import { getMotionTokens } from '@/lib/motion'

const tokens = getMotionTokens()

// Duration tokens (in milliseconds)
tokens.durations.instant  // 0ms
tokens.durations.fast     // 100ms
tokens.durations.normal   // 200ms
tokens.durations.slow     // 300ms
tokens.durations.slower   // 400ms

// Easing tokens
tokens.easings.linear     // linear
tokens.easings.easeIn     // ease-in
tokens.easings.easeOut    // ease-out
tokens.easings.easeInOut  // ease-in-out
tokens.easings.spring     // Spring physics
tokens.easings.bouncy     // Bouncy spring
tokens.easings.smooth     // Smooth spring

// Spring configurations
tokens.springs.gentle     // { stiffness: 150, damping: 40 }
tokens.springs.normal     // { stiffness: 300, damping: 30 }
tokens.springs.bouncy     // { stiffness: 400, damping: 20 }
tokens.springs.stiff      // { stiffness: 500, damping: 25 }
```

## 🪝 React Hooks API

### Core Hooks

#### `useMotion<T>()`

Basic motion hook with ref management:

```typescript
function MyComponent() {
  const { ref, animate, stop, state } = useMotion<HTMLDivElement>()
  
  const handleAnimate = () => {
    animate({ x: 100, scale: 1.1 }, {
      duration: 0.3,
      category: 'interface'
    })
  }
  
  return (
    <div ref={ref}>
      <button onClick={handleAnimate}>Animate</button>
      {state.isAnimating && <p>Animating... {Math.round(state.progress * 100)}%</p>}
    </div>
  )
}
```

#### `useButtonAnimation<T>()`

Enhanced button interactions with press feedback:

```typescript
function AnimatedButton() {
  const { ref, handlePress, handleHover, isAnimating } = useButtonAnimation<HTMLButtonElement>()
  
  return (
    <button
      ref={ref}
      onClick={() => handlePress({ audio: { sound: 'success', volume: 0.1 } })}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
      disabled={isAnimating}
    >
      Click Me
    </button>
  )
}
```

#### `useModalAnimation()`

Complete modal animation management:

```typescript
function MyModal() {
  const { modalRef, backdropRef, isOpen, open, close } = useModalAnimation()
  
  return (
    <>
      <button onClick={() => open()}>Open Modal</button>
      
      {isOpen && (
        <div ref={backdropRef} className="fixed inset-0 bg-black/50">
          <div ref={modalRef} className="bg-white p-6 rounded-lg">
            <h2>Modal Content</h2>
            <button onClick={() => close()}>Close</button>
          </div>
        </div>
      )}
    </>
  )
}
```

### Advanced Hooks

#### `useScrollAnimation<T>()`

Intersection Observer-based scroll animations:

```typescript
function ScrollReveal() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>(
    { y: 0, opacity: 1 },
    { 
      category: 'scroll',
      audio: { sound: 'notification', timing: 'end' }
    }
  )
  
  return (
    <div 
      ref={ref}
      style={{ transform: 'translateY(20px)', opacity: 0 }}
      className={isVisible ? 'animate-complete' : ''}
    >
      Content revealed on scroll
    </div>
  )
}
```

#### `useCalendarEventAnimation<T>()`

Calendar-specific event animations:

```typescript
function CalendarEvent() {
  const { ref, animateCreate, animateUpdate, animateDelete } = useCalendarEventAnimation<HTMLDivElement>()
  
  return (
    <div ref={ref} className="calendar-event">
      <button onClick={() => animateCreate()}>Create</button>
      <button onClick={() => animateUpdate()}>Update</button>
      <button onClick={() => animateDelete()}>Delete</button>
    </div>
  )
}
```

## 🔄 Migration from Framer Motion

### Drop-in Replacement Components

```typescript
// Before (Framer Motion)
import { motion, AnimatePresence } from 'framer-motion'

// After (Motion System)
import { motion, AnimatePresence } from '@/lib/motion/framer-motion-migration'

// Usage remains the same
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

### Enhanced Migration with Audio

```typescript
// Enhanced version with audio sync
import { Animated } from '@/lib/motion'

<Animated
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  category="interface"
  audio={{ sound: 'notification', timing: 'end' }}
  onAnimationComplete={() => console.log('Done!')}
>
  Content
</Animated>
```

### Migration Checklist

1. **Install Motion library** ✅ (Already done)
2. **Update imports** - Replace framer-motion imports
3. **Convert transitions** - Use motion tokens
4. **Add audio sync** - Enhance with sound effects
5. **Performance testing** - Validate 112+ FPS targets

## ⚡ Performance Optimization

### Performance Monitoring

```typescript
import { usePerformanceMonitor } from '@/lib/motion/performance-monitor'

function MyComponent() {
  const { monitor, metrics, startMonitoring, stopMonitoring } = usePerformanceMonitor()
  
  useEffect(() => {
    startMonitoring()
    return () => stopMonitoring()
  }, [])
  
  return (
    <div>
      {metrics && (
        <div className="performance-stats">
          <p>FPS: {metrics.fps} (target: 112+)</p>
          <p>Frame Drops: {metrics.frameDrops}</p>
          <p>Memory: {metrics.memoryUsage.toFixed(1)}MB</p>
          <p>GPU Acceleration: {metrics.gpuAccelerated ? '✅' : '❌'}</p>
        </div>
      )}
    </div>
  )
}
```

### Hardware Acceleration Tips

1. **Use transform properties**: `translateX`, `scale`, `rotate`
2. **Add will-change hints**: Applied automatically by performance monitor
3. **Avoid layout triggers**: Don't animate `width`, `height`, `top`, `left`
4. **Use composite properties**: `transform`, `opacity`, `filter`, `clipPath`

```typescript
// ✅ Hardware accelerated
animate(element, { 
  transform: 'translateX(100px) scale(1.1)',
  opacity: 0.8 
})

// ❌ Causes layout/paint
animate(element, { 
  width: '200px',
  backgroundColor: 'red' 
})
```

## 🎯 Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Frame Rate | 112+ FPS | 90+ FPS |
| Frame Drops | ≤5 per session | ≤10 per session |
| Memory Usage | ≤100MB | ≤150MB |
| Render Time | ≤8.9ms per frame | ≤16.7ms per frame |

## 📝 Best Practices

### 1. Motion Categories

Use appropriate categories for different animation types:

```typescript
// Quick feedback (≤150ms)
animate(button, { scale: 0.95 }, { category: 'feedback' })

// Interface changes (200-300ms)
animate(panel, { x: 0, opacity: 1 }, { category: 'interface' })

// Page transitions (250-400ms)
animate(page, { y: 0, opacity: 1 }, { category: 'page' })

// Scroll-linked (progressive)
animate(element, { y: 0 }, { category: 'scroll' })
```

### 2. Audio-Visual Coordination

Sync animation timing with audio cues:

```typescript
// Start audio with animation
{ audio: { sound: 'success', timing: 'start' } }

// Completion confirmation
{ audio: { sound: 'notification', timing: 'end' } }

// Mid-animation accent
{ audio: { sound: 'success', timing: 'middle' } }

// Parallel audio track
{ audio: { sound: 'notification', timing: 'parallel' } }
```

### 3. Reduced Motion Support

The system automatically respects user preferences:

```typescript
// Automatically reduces motion for accessibility
animate(element, keyframes, { 
  reducedMotion: 'respect' // default
})

// Force animation even with reduced motion
animate(element, keyframes, { 
  reducedMotion: 'ignore' // use carefully
})
```

### 4. Spring Physics

Use spring animations for natural feel:

```typescript
import { animateSpring } from '@/lib/motion'

// Gentle spring (UI feedback)
animateSpring(element, { scale: 1.1 }, 'gentle')

// Normal spring (interface changes)
animateSpring(element, { x: 100 }, 'normal')

// Bouncy spring (playful interactions)
animateSpring(element, { y: 0 }, 'bouncy')

// Stiff spring (precise movements)
animateSpring(element, { rotate: 90 }, 'stiff')
```

## 🔧 Troubleshooting

### Common Issues

1. **Low FPS Warning**
   - Check for layout-triggering properties
   - Ensure GPU acceleration is enabled
   - Reduce concurrent animations

2. **Audio Not Playing**
   - Check sound settings in SettingsContext
   - Verify sound files exist in `/public/sounds/`
   - Check browser autoplay policies

3. **Memory Leaks**
   - Always cleanup animations on unmount
   - Use the performance monitor to track usage
   - Stop monitoring when component unmounts

### Debug Tools

```typescript
// Enable performance monitoring
const monitor = getPerformanceMonitor({ minFPS: 90 })
monitor.startMonitoring()

// Check current metrics
const metrics = monitor.getCurrentMetrics()
console.log('Performance:', metrics)

// Performance violation warnings appear in console
// 💡 Optimization suggestions are automatically provided
```

## 🚀 Advanced Usage

### Custom Animation Sequences

```typescript
import { createAudioSequence } from '@/lib/motion/audio-visual-sync'

// Complex multi-step animation with audio sequence
const complexAnimation = async () => {
  // Step 1: Initial movement with sound
  await animate(element1, { x: 100 }, { 
    category: 'interface',
    audio: { sound: 'notification', timing: 'start' }
  })
  
  // Step 2: Secondary element with delayed sound
  await animate(element2, { scale: 1.2 }, {
    category: 'interface',
    audio: { sound: 'success', timing: 'end', delay: 100 }
  })
  
  // Step 3: Final state with completion sound
  animate(container, { opacity: 1 }, {
    category: 'interface',
    audio: { sound: 'notification', timing: 'end' }
  })
}
```

### Performance-Critical Animations

```typescript
// High-performance animation for critical interactions
animate(element, keyframes, {
  category: 'feedback',
  performance: 'crisp', // Prefer sharp rendering over smoothness
  reducedMotion: 'respect',
  // Manual GPU hints
  composite: 'replace',
  // Performance monitoring
  onUpdate: (progress) => {
    if (monitor.getCurrentMetrics().fps < 90) {
      console.warn('Performance degradation detected')
    }
  }
})
```

## 📊 Bundle Size Impact

| Library | Size | Reduction |
|---------|------|-----------|
| Framer Motion | 32KB | - |
| Motion (new) | 5KB | **84%** |
| **Net Savings** | **27KB** | **84%** |

## 🎉 Migration Benefits

1. **Performance**: 84% smaller bundle, 112+ FPS targets
2. **Audio-Visual**: Coordinated animations with sound
3. **Tokens**: Integrated design system tokens  
4. **Monitoring**: Real-time performance validation
5. **Accessibility**: Automatic reduced motion support
6. **Developer Experience**: Enhanced hooks and utilities

---

**Need Help?** Check the component examples in `/components/calendar/MotionEnhancedCalendarToolbar.tsx` for real-world usage patterns.