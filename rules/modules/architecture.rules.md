# Architecture Rules Module

---
extends: ../RULES_MASTER.md
module: architecture
version: 1.0.0
priority: high
---

## Component Architecture

### ARCH-M001: Component Structure

Every component must follow this structure:

```typescript
// components/[domain]/[ComponentName]/
├── index.tsx              // Public API
├── [ComponentName].tsx    // Main component
├── [ComponentName].types.ts // TypeScript types
├── [ComponentName].test.tsx // Tests
└── [ComponentName].stories.tsx // Storybook (optional)
```

### ARCH-M002: AsChild Pattern

Use AsChild pattern for composition flexibility:

```typescript
// ✅ CORRECT - AsChild pattern
<Button asChild>
  <Link href="/dashboard">Dashboard</Link>
</Button>

// ❌ AVOID - Prop spreading
<Button as={Link} href="/dashboard">Dashboard</Button>
```

### ARCH-M003: Server Components Default

React Server Components are the default:

```typescript
// ✅ DEFAULT - Server Component
export default function Component() {
  return <div>Server-rendered by default</div>;
}

// Only add 'use client' when needed
'use client';
export default function InteractiveComponent() {
  const [state, setState] = useState();
  return <button onClick={() => setState()}>Client-side</button>;
}
```

## Data Flow Architecture

### ARCH-M004: Unidirectional Data Flow

Data flows in one direction:

```
User Action → Action Creator → Store → View Update
```

### ARCH-M005: API Layer Separation

All API calls through dedicated service layer:

```typescript
// ✅ CORRECT
// services/api/events.service.ts
export const eventsService = {
  async getAll() { /* ... */ },
  async create(data) { /* ... */ },
  async update(id, data) { /* ... */ },
  async delete(id) { /* ... */ }
};

// components/EventList.tsx
import { eventsService } from '@/services/api/events.service';
```

## Module Boundaries

### ARCH-M006: Clear Module Boundaries

Modules can only import from:
1. Their own directory
2. Shared libraries
3. UI components
4. Type definitions

```typescript
// ✅ ALLOWED
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import type { Event } from '@/types/event';

// ❌ PROHIBITED - Cross-module import
import { InternalHelper } from '@/views/week/internal/helper';
```

## Performance Architecture

### ARCH-M007: Code Splitting Strategy

Implement code splitting at route and heavy component level:

```typescript
// ✅ Route-level splitting
const CalendarView = lazy(() => import('@/views/calendar/CalendarView'));

// ✅ Heavy component splitting
const ChartComponent = lazy(() => import('@/components/charts/HeavyChart'));
```

### ARCH-M008: Memoization Strategy

Use memoization judiciously:

```typescript
// ✅ GOOD - Expensive computation
const expensiveValue = useMemo(
  () => calculateExpensive(data),
  [data]
);

// ❌ AVOID - Premature optimization
const simpleValue = useMemo(() => x + y, [x, y]);
```

## Security Architecture

### ARCH-M009: Security Layers

Implement defense in depth:

1. **Input Validation** - Client and server
2. **Authentication** - Token-based (JWT/Session)
3. **Authorization** - Role-based access control
4. **Encryption** - TLS + field-level encryption
5. **Audit Logging** - All sensitive operations

### ARCH-M010: Secure Defaults

All new features start with secure defaults:

```typescript
// Security configuration defaults
{
  authentication: required,
  encryption: enabled,
  audit_logging: enabled,
  rate_limiting: enabled,
  csrf_protection: enabled
}
```

## Error Handling Architecture

### ARCH-M011: Error Boundaries

Every view must have error boundary:

```typescript
// views/[view]/index.tsx
export default function ViewWithBoundary() {
  return (
    <ErrorBoundary fallback={<ViewErrorFallback />}>
      <ActualView />
    </ErrorBoundary>
  );
}
```

### ARCH-M012: Graceful Degradation

Features must degrade gracefully:

```typescript
// ✅ CORRECT - Graceful degradation
if (!aiService.available) {
  return <ManualModeComponent />;
}
return <AIEnhancedComponent />;
```

## Accessibility Architecture

### ARCH-M013: Accessibility First

All interactive elements must be keyboard accessible:

```typescript
// ✅ CORRECT
<button
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  aria-label="Save changes"
  role="button"
  tabIndex={0}
>
  Save
</button>
```

### ARCH-M014: Focus Management

Proper focus management for modals and overlays:

```typescript
// ✅ CORRECT - Focus trap
import { FocusTrap } from '@/components/utils/FocusTrap';

<Modal>
  <FocusTrap>
    <ModalContent />
  </FocusTrap>
</Modal>
```

## Testing Architecture

### ARCH-M015: Test Organization

Tests co-located with components:

```
component/
├── Component.tsx
├── Component.test.tsx      # Unit tests
├── Component.e2e.tsx       # E2E tests
└── Component.visual.tsx    # Visual regression tests
```

### ARCH-M016: Test Data Builders

Use test data builders for consistency:

```typescript
// test-utils/builders/event.builder.ts
export const eventBuilder = {
  default: () => ({
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    date: faker.date.future()
  }),
  
  withConflict: () => ({
    ...eventBuilder.default(),
    hasConflict: true
  })
};
```

---

These architectural rules ensure scalability, maintainability, and consistency across the Command Center Calendar codebase.