# Testing Rules Module

---
extends: ../RULES_MASTER.md
module: testing
version: 1.0.0
priority: medium
---

## Testing Standards

### TEST-M001: Test File Naming

Test files follow strict naming conventions:

```
ComponentName.test.tsx    # Unit tests
ComponentName.e2e.tsx     # End-to-end tests
ComponentName.visual.tsx  # Visual regression tests
ComponentName.perf.tsx    # Performance tests
ComponentName.a11y.tsx    # Accessibility tests
```

### TEST-M002: Test Structure (AAA Pattern)

All tests follow Arrange-Act-Assert pattern:

```typescript
describe('EventCreator', () => {
  test('should create event with valid data', () => {
    // Arrange
    const mockData = eventBuilder.default();
    const onSubmit = jest.fn();
    
    // Act
    render(<EventCreator onSubmit={onSubmit} />);
    fireEvent.submit(form, mockData);
    
    // Assert
    expect(onSubmit).toHaveBeenCalledWith(mockData);
    expect(screen.getByText('Event created')).toBeInTheDocument();
  });
});
```

### TEST-M003: Test Coverage Requirements

Minimum coverage by file type:

| File Type | Branches | Functions | Lines | Statements |
|-----------|----------|-----------|-------|------------|
| Components | 80% | 80% | 80% | 80% |
| Hooks | 90% | 90% | 90% | 90% |
| Services | 95% | 95% | 95% | 95% |
| Utils | 100% | 100% | 100% | 100% |

### TEST-M004: Unit Testing Rules

Unit test requirements:

```typescript
// ✅ GOOD Unit Test
test('should calculate event duration correctly', () => {
  const duration = calculateDuration('09:00', '17:00');
  expect(duration).toBe(8);
});

// ❌ BAD - Testing implementation details
test('should call internal method', () => {
  const spy = jest.spyOn(component, '_internalMethod');
  component.process();
  expect(spy).toHaveBeenCalled();
});
```

### TEST-M005: Integration Testing

Integration test structure:

```typescript
describe('Calendar Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    await seedTestData();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  test('should sync events across providers', async () => {
    // Test actual integration points
    const googleEvent = await createGoogleEvent();
    const microsoftEvent = await syncToMicrosoft(googleEvent);
    
    expect(microsoftEvent.id).toBeDefined();
    expect(microsoftEvent.title).toBe(googleEvent.title);
  });
});
```

## E2E Testing Standards

### TEST-M006: Playwright Configuration

E2E test setup:

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' },
    { name: 'mobile-chrome' },
    { name: 'mobile-safari' },
  ],
});
```

### TEST-M007: E2E Test Patterns

E2E test best practices:

```typescript
test('user can complete calendar workflow', async ({ page }) => {
  // Use data-testid for stable selectors
  await page.goto('/app');
  await page.getByTestId('calendar-view').click();
  
  // Wait for specific conditions, not arbitrary time
  await page.waitForSelector('[data-testid="event-list"]');
  
  // Test user journeys, not implementation
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.fill('[data-testid="event-title"]', 'Team Meeting');
  await page.click('[data-testid="save-event"]');
  
  // Assert user-visible outcomes
  await expect(page.getByText('Team Meeting')).toBeVisible();
});
```

## Performance Testing

### TEST-M008: Performance Benchmarks

Performance test requirements:

```typescript
describe('Performance', () => {
  test('shell renders under 500ms', async () => {
    const start = performance.now();
    render(<AppShell />);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(500);
  });
  
  test('tab switch under 200ms', async () => {
    const { rerender } = render(<TabWorkspace activeTab="week" />);
    
    const start = performance.now();
    rerender(<TabWorkspace activeTab="month" />);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(200);
  });
});
```

### TEST-M009: Bundle Size Testing

Bundle size validation:

```javascript
// size-limit.config.js
module.exports = [
  {
    path: "dist/shell.js",
    limit: "150 KB",
    webpack: false
  },
  {
    path: "dist/views/*.js",
    limit: "100 KB",
    webpack: false
  }
];
```

## Accessibility Testing

### TEST-M010: WCAG Compliance

Accessibility test requirements:

```typescript
describe('Accessibility', () => {
  test('meets WCAG 2.2 Level AA', async () => {
    const { container } = render(<AppShell />);
    const results = await axe(container, {
      rules: {
        'wcag2aa': { enabled: true },
        'wcag2a': { enabled: true },
        'wcag21aa': { enabled: true },
        'wcag22aa': { enabled: true }
      }
    });
    
    expect(results.violations).toHaveLength(0);
  });
});
```

### TEST-M011: Keyboard Navigation

Keyboard testing requirements:

```typescript
test('supports full keyboard navigation', async () => {
  render(<CommandPalette />);
  
  // Open with keyboard
  fireEvent.keyDown(document, { key: 'k', metaKey: true });
  expect(screen.getByRole('dialog')).toBeVisible();
  
  // Navigate with arrow keys
  fireEvent.keyDown(document, { key: 'ArrowDown' });
  expect(screen.getByRole('option', { selected: true }))
    .toHaveAttribute('aria-selected', 'true');
  
  // Select with Enter
  fireEvent.keyDown(document, { key: 'Enter' });
  expect(handleSelect).toHaveBeenCalled();
});
```

## Test Data Management

### TEST-M012: Test Data Builders

Use builders for test data:

```typescript
// test-utils/builders/event.builder.ts
import { faker } from '@faker-js/faker';

export const eventBuilder = {
  minimal: () => ({
    title: faker.lorem.words(3),
    date: faker.date.future()
  }),
  
  complete: () => ({
    id: faker.string.uuid(),
    title: faker.lorem.words(3),
    description: faker.lorem.paragraph(),
    date: faker.date.future(),
    duration: faker.number.int({ min: 30, max: 180 }),
    attendees: Array.from({ length: 3 }, () => userBuilder.minimal())
  }),
  
  withConflict: () => ({
    ...eventBuilder.complete(),
    hasConflict: true,
    conflictingEvents: [eventBuilder.minimal()]
  })
};
```

### TEST-M013: Test Database

Test database management:

```typescript
// test-utils/database.ts
export const testDb = {
  async setup() {
    await migrate.latest();
    await seed.run();
  },
  
  async cleanup() {
    await db.raw('TRUNCATE TABLE events CASCADE');
  },
  
  async reset() {
    await this.cleanup();
    await this.setup();
  }
};
```

## Mocking Standards

### TEST-M014: Mock Boundaries

Mock at system boundaries only:

```typescript
// ✅ GOOD - Mock external service
jest.mock('@/services/calendar/google-calendar', () => ({
  syncEvents: jest.fn().mockResolvedValue([])
}));

// ❌ BAD - Mock internal module
jest.mock('@/utils/date-formatter', () => ({
  formatDate: jest.fn()
}));
```

### TEST-M015: Mock Data Consistency

Maintain consistent mock data:

```typescript
// test-utils/mocks/api.ts
export const apiMocks = {
  events: {
    success: () => ({
      status: 200,
      data: [eventBuilder.complete()]
    }),
    
    error: () => ({
      status: 500,
      error: 'Internal Server Error'
    }),
    
    empty: () => ({
      status: 200,
      data: []
    })
  }
};
```

---

These testing rules ensure comprehensive, reliable test coverage across the Command Center Calendar application.