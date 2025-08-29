# Performance Rules Module

---
extends: ../RULES_MASTER.md
module: performance  
version: 1.0.0
priority: medium
---

## Performance Standards

### PERF-M001: Core Web Vitals Targets

Non-negotiable Web Vitals metrics:

```javascript
// Web Vitals Configuration
const WEB_VITALS_TARGETS = {
  LCP: {
    target: 2500,  // 2.5 seconds
    good: 2000,    // 2.0 seconds
    warning: 2500, // 2.5 seconds
    critical: 4000 // 4.0 seconds
  },
  INP: {  // Interaction to Next Paint (replaces FID)
    target: 200,   // 200ms
    good: 100,     // 100ms
    warning: 200,  // 200ms
    critical: 500  // 500ms
  },
  CLS: {
    target: 0.1,   // 0.1
    good: 0.05,    // 0.05
    warning: 0.1,  // 0.1
    critical: 0.25 // 0.25
  },
  FCP: {  // First Contentful Paint
    target: 1800,  // 1.8 seconds
    good: 1000,    // 1.0 second
    warning: 1800, // 1.8 seconds
    critical: 3000 // 3.0 seconds
  },
  TTFB: {  // Time to First Byte
    target: 800,   // 800ms
    good: 500,     // 500ms
    warning: 800,  // 800ms
    critical: 1800 // 1.8 seconds
  }
};
```

### PERF-M002: Runtime Performance Targets

Application runtime metrics:

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60 FPS (112+ ideal) | Performance.now() |
| Shell Render | <500ms | Initial mount time |
| Tab Switch | <200ms | State change to paint |
| Keyboard Response | <120ms | Keypress to visual feedback |
| Scroll Performance | 60 FPS | Frame timing API |
| Memory Usage | <100MB | Performance.memory |
| CPU Usage | <30% average | Performance monitoring |

### PERF-M003: Bundle Size Budgets

Strict bundle size limits:

```javascript
// size-limit.config.js
module.exports = [
  {
    name: "Shell Core",
    path: "dist/shell/index.js",
    limit: "150 KB",
    gzip: true
  },
  {
    name: "Per View",
    path: "dist/views/[name].js",
    limit: "100 KB",
    gzip: true
  },
  {
    name: "Dock Panel",
    path: "dist/dock/[name].js",
    limit: "50 KB",
    gzip: true
  },
  {
    name: "Command System",
    path: "dist/commands/index.js",
    limit: "75 KB",
    gzip: true
  },
  {
    name: "AI Agents",
    path: "dist/ai/agents.js",
    limit: "200 KB",
    gzip: true
  },
  {
    name: "Total Initial",
    path: "dist/initial.js",
    limit: "500 KB",
    gzip: true
  }
];
```

### PERF-M004: Code Splitting Strategy

Mandatory code splitting points:

```typescript
// Routes - Automatic splitting
const routes = {
  week: lazy(() => import('@/views/week/WeekView')),
  month: lazy(() => import('@/views/month/MonthView')),
  planner: lazy(() => import('@/views/planner/PlannerView')),
  notes: lazy(() => import('@/views/notes/NotesView'))
};

// Heavy components - Manual splitting
const HeavyChart = lazy(() => 
  import(/* webpackChunkName: "charts" */ '@/components/charts/HeavyChart')
);

// Conditional features
const AIPanel = lazy(() => 
  import(/* webpackChunkName: "ai" */ '@/components/ai/AIPanel')
);
```

## Optimization Techniques

### PERF-M005: React Performance Patterns

Required optimization patterns:

```typescript
// ✅ CORRECT - Memoization for expensive operations
const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(
    () => expensiveProcessing(data),
    [data]
  );
  
  const handleClick = useCallback(
    (id) => processItem(id),
    [processItem]
  );
  
  return <List data={processedData} onClick={handleClick} />;
});

// ✅ CORRECT - Virtualization for long lists
import { VirtualList } from '@tanstack/react-virtual';

const LongList = ({ items }) => (
  <VirtualList
    height={600}
    itemCount={items.length}
    itemSize={50}
    overscan={5}
  >
    {({ index }) => <Item data={items[index]} />}
  </VirtualList>
);
```

### PERF-M006: Image Optimization

Image performance requirements:

```typescript
// ✅ CORRECT - Next.js Image with optimization
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL={blurData}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// Image formats priority
1. AVIF (when supported)
2. WebP (fallback)
3. JPEG/PNG (final fallback)
```

### PERF-M007: Network Optimization

Network request optimization:

```typescript
// Request batching
const batchRequests = useBatch({
  maxBatchSize: 10,
  maxWaitTime: 50, // ms
  batchFunction: async (requests) => {
    return await api.batch(requests);
  }
});

// Request deduplication
const dedupedFetch = useSWR(
  key,
  fetcher,
  {
    dedupingInterval: 2000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  }
);

// Prefetching
const prefetchNextView = () => {
  queryClient.prefetchQuery(
    ['events', nextWeek],
    () => fetchEvents(nextWeek)
  );
};
```

## Database Performance

### PERF-M008: Query Optimization

Database query requirements:

```typescript
// ✅ CORRECT - Optimized query with selective fields
const events = await db
  .select(['id', 'title', 'date', 'duration'])
  .from('events')
  .where('date', '>=', startDate)
  .where('date', '<=', endDate)
  .orderBy('date', 'asc')
  .limit(100);

// ✅ CORRECT - Batch operations
const batchInsert = await db
  .insert(events)
  .into('events')
  .chunk(100); // Insert in chunks

// ❌ AVOID - N+1 queries
for (const event of events) {
  const attendees = await db.select().from('attendees')
    .where('event_id', event.id);
}
```

### PERF-M009: Caching Strategy

Multi-layer caching:

```typescript
// 1. Memory Cache (Runtime)
const memoryCache = new LRU({
  max: 500,
  ttl: 1000 * 60 * 5 // 5 minutes
});

// 2. Session Storage (Tab lifetime)
const sessionCache = {
  get: (key) => JSON.parse(sessionStorage.getItem(key)),
  set: (key, value, ttl) => {
    sessionStorage.setItem(key, JSON.stringify({
      value,
      expires: Date.now() + ttl
    }));
  }
};

// 3. IndexedDB (Persistent)
const persistentCache = await Dexie.open('cache');

// 4. Service Worker (Network)
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/static')) {
    event.respondWith(
      caches.match(event.request).then(
        (response) => response || fetch(event.request)
      )
    );
  }
});
```

## Animation Performance

### PERF-M010: Animation Guidelines

Animation performance rules:

```css
/* ✅ CORRECT - GPU accelerated properties only */
.animated {
  transform: translateX(100px);
  opacity: 0.8;
  will-change: transform, opacity;
}

/* ❌ AVOID - Non-GPU properties */
.bad-animation {
  left: 100px;
  width: 200px;
  margin-left: 50px;
}
```

```typescript
// ✅ CORRECT - RequestAnimationFrame for JS animations
const animate = () => {
  requestAnimationFrame(() => {
    element.style.transform = `translateX(${position}px)`;
    if (position < target) {
      animate();
    }
  });
};

// ✅ CORRECT - Respect reduced motion
const prefersReducedMotion = 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  element.classList.add('animated');
}
```

## Monitoring & Alerts

### PERF-M011: Performance Monitoring

Required monitoring setup:

```typescript
// Web Vitals monitoring
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

const reportWebVitals = (metric) => {
  // Send to analytics
  analytics.track('Web Vitals', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta
  });
  
  // Alert on violations
  if (metric.rating === 'poor') {
    alerting.send({
      level: 'warning',
      metric: metric.name,
      value: metric.value,
      threshold: WEB_VITALS_TARGETS[metric.name].warning
    });
  }
};

onLCP(reportWebVitals);
onINP(reportWebVitals);
onCLS(reportWebVitals);
onFCP(reportWebVitals);
onTTFB(reportWebVitals);
```

### PERF-M012: Performance Budgets

Automated budget enforcement:

```javascript
// webpack.config.js
module.exports = {
  performance: {
    hints: 'error',
    maxEntrypointSize: 500000, // 500KB
    maxAssetSize: 250000, // 250KB
    assetFilter: (assetFilename) => {
      return !assetFilename.match(/\.(map|txt)$/);
    }
  }
};

// CI/CD performance gates
{
  "lighthouse": {
    "performance": 90,
    "accessibility": 95,
    "best-practices": 90,
    "seo": 90
  }
}
```

## Memory Management

### PERF-M013: Memory Leak Prevention

Memory management patterns:

```typescript
// ✅ CORRECT - Cleanup in useEffect
useEffect(() => {
  const timer = setInterval(updateData, 1000);
  const listener = window.addEventListener('resize', handleResize);
  
  return () => {
    clearInterval(timer);
    window.removeEventListener('resize', handleResize);
  };
}, []);

// ✅ CORRECT - WeakMap for object references
const cache = new WeakMap();
const getCachedData = (obj) => {
  if (!cache.has(obj)) {
    cache.set(obj, processData(obj));
  }
  return cache.get(obj);
};

// ✅ CORRECT - Clear references
class Component {
  dispose() {
    this.data = null;
    this.listeners.clear();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
```

### PERF-M014: Resource Loading

Optimize resource loading:

```html
<!-- Preload critical resources -->
<link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>
<link rel="preload" href="/css/critical.css" as="style">

<!-- Prefetch next page resources -->
<link rel="prefetch" href="/next-page.js">

<!-- DNS prefetch for external domains -->
<link rel="dns-prefetch" href="https://api.example.com">

<!-- Preconnect for faster connection -->
<link rel="preconnect" href="https://api.example.com">
```

---

These performance rules ensure the Command Center Calendar application maintains exceptional speed and responsiveness.