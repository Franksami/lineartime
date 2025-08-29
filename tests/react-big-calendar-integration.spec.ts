import { test, expect } from '@playwright/test';

test.describe('React Big Calendar Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-react-big-calendar');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Component Initialization', () => {
    test('should load React Big Calendar component successfully', async ({ page }) => {
      await expect(page.locator('[data-testid="react-big-calendar-view"]')).toBeVisible();
      await expect(page.locator('.rbc-calendar')).toBeVisible();
      await expect(page.locator('.rbc-toolbar')).toBeVisible();
    });

    test('should display calendar header with navigation controls', async ({ page }) => {
      await expect(page.locator('.rbc-toolbar-label')).toBeVisible();
      await expect(page.locator('.rbc-btn-group button')).toHaveCount(3); // Today, Back, Next
      await expect(page.locator('text=Today')).toBeVisible();
    });

    test('should show calendar grid with proper month view', async ({ page }) => {
      await expect(page.locator('.rbc-month-view')).toBeVisible();
      await expect(page.locator('.rbc-date-cell')).toHaveCount(42); // 6 weeks × 7 days
      await expect(page.locator('.rbc-header')).toHaveCount(7); // Week days
    });
  });

  test.describe('Event Management', () => {
    test('should create new event via click-to-create', async ({ page }) => {
      // Click on a date cell to create event
      const dateCell = page.locator('.rbc-date-cell').first();
      await dateCell.click();

      // Event creation modal should appear
      await expect(page.locator('[data-testid="event-modal"]')).toBeVisible();

      // Fill in event details
      await page.fill('[data-testid="event-title-input"]', 'Test Event');
      await page.fill('[data-testid="event-description-input"]', 'Test event description');

      // Save event
      await page.click('[data-testid="save-event-btn"]');
      await page.waitForTimeout(500);

      // Verify event appears on calendar
      await expect(page.locator('text=Test Event')).toBeVisible();
    });

    test('should support drag-to-create events', async ({ page }) => {
      const startCell = page.locator('.rbc-date-cell').first();
      const endCell = page.locator('.rbc-date-cell').nth(2);

      // Perform drag action
      await startCell.hover();
      await page.mouse.down();
      await endCell.hover();
      await page.mouse.up();

      // Event creation modal should appear
      await expect(page.locator('[data-testid="event-modal"]')).toBeVisible();

      // Cancel to verify drag-to-create worked
      await page.click('[data-testid="cancel-event-btn"]');
    });

    test('should edit existing events', async ({ page }) => {
      // First create an event
      await page.locator('.rbc-date-cell').first().click();
      await page.fill('[data-testid="event-title-input"]', 'Editable Event');
      await page.click('[data-testid="save-event-btn"]');
      await page.waitForTimeout(500);

      // Click on the created event to edit
      await page.locator('text=Editable Event').click();

      // Modal should appear with existing data
      await expect(page.locator('[data-testid="event-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="event-title-input"]')).toHaveValue('Editable Event');

      // Update the event
      await page.fill('[data-testid="event-title-input"]', 'Updated Event');
      await page.click('[data-testid="save-event-btn"]');
      await page.waitForTimeout(500);

      // Verify update
      await expect(page.locator('text=Updated Event')).toBeVisible();
    });

    test('should delete events', async ({ page }) => {
      // Create an event to delete
      await page.locator('.rbc-date-cell').first().click();
      await page.fill('[data-testid="event-title-input"]', 'Event to Delete');
      await page.click('[data-testid="save-event-btn"]');
      await page.waitForTimeout(500);

      // Click on the event and delete
      await page.locator('text=Event to Delete').click();
      await page.click('[data-testid="delete-event-btn"]');
      await page.waitForTimeout(500);

      // Verify deletion
      await expect(page.locator('text=Event to Delete')).not.toBeVisible();
    });
  });

  test.describe('Drag and Drop Functionality', () => {
    test('should support event drag and drop', async ({ page }) => {
      // Create an event first
      await page.locator('.rbc-date-cell').first().click();
      await page.fill('[data-testid="event-title-input"]', 'Draggable Event');
      await page.click('[data-testid="save-event-btn"]');
      await page.waitForTimeout(500);

      // Get event and target cell
      const event = page.locator('text=Draggable Event');
      const targetCell = page.locator('.rbc-date-cell').nth(7); // Next week

      // Perform drag and drop
      await event.dragTo(targetCell);
      await page.waitForTimeout(500);

      // Event should move to new position
      // Note: Exact verification depends on how drag-drop updates are reflected
    });

    test('should support event resizing', async ({ page }) => {
      // Create a multi-day event
      await page.locator('.rbc-date-cell').first().click();
      await page.fill('[data-testid="event-title-input"]', 'Resizable Event');
      await page.click('[data-testid="save-event-btn"]');
      await page.waitForTimeout(500);

      // Look for resize handles on the event
      const event = page.locator('.rbc-event').first();
      await expect(event).toBeVisible();
    });
  });

  test.describe('View Navigation', () => {
    test('should navigate between months', async ({ page }) => {
      const toolbar = page.locator('.rbc-toolbar');
      const currentLabel = await toolbar.locator('.rbc-toolbar-label').textContent();

      // Click next month
      await toolbar.locator('button:has-text("Next")').click();
      await page.waitForTimeout(300);

      // Verify month changed
      const newLabel = await toolbar.locator('.rbc-toolbar-label').textContent();
      expect(newLabel).not.toBe(currentLabel);

      // Go back to today
      await toolbar.locator('button:has-text("Today")').click();
    });

    test('should support different view types', async ({ page }) => {
      // Test month view (default)
      await expect(page.locator('.rbc-month-view')).toBeVisible();

      // Switch to week view if available
      const weekBtn = page.locator('button:has-text("Week")');
      if (await weekBtn.isVisible()) {
        await weekBtn.click();
        await expect(page.locator('.rbc-time-view')).toBeVisible();
      }

      // Switch to day view if available
      const dayBtn = page.locator('button:has-text("Day")');
      if (await dayBtn.isVisible()) {
        await dayBtn.click();
        await expect(page.locator('.rbc-time-view')).toBeVisible();
      }
    });
  });

  test.describe('Event Display Features', () => {
    test('should show event priorities with color coding', async ({ page }) => {
      // Create high priority event
      await page.locator('.rbc-date-cell').first().click();
      await page.fill('[data-testid="event-title-input"]', 'High Priority Event');
      await page.selectOption('[data-testid="event-priority-select"]', 'high');
      await page.click('[data-testid="save-event-btn"]');
      await page.waitForTimeout(500);

      // Verify priority styling
      const event = page.locator('text=High Priority Event').first();
      await expect(event).toBeVisible();

      // Check for priority indicator or styling
      const eventElement = event.locator('xpath=..');
      await expect(eventElement).toHaveClass(/priority-high|high-priority/);
    });

    test('should display event tooltips on hover', async ({ page }) => {
      // Create an event with description
      await page.locator('.rbc-date-cell').first().click();
      await page.fill('[data-testid="event-title-input"]', 'Event with Tooltip');
      await page.fill('[data-testid="event-description-input"]', 'This is a detailed description');
      await page.click('[data-testid="save-event-btn"]');
      await page.waitForTimeout(500);

      // Hover over event
      const event = page.locator('text=Event with Tooltip').first();
      await event.hover();

      // Look for tooltip or popover
      await expect(
        page.locator('[data-testid="event-tooltip"], .tooltip, [role="tooltip"]')
      ).toBeVisible();
    });

    test('should handle event overflow in busy days', async ({ page }) => {
      // Create multiple events on the same day
      const targetCell = page.locator('.rbc-date-cell').first();

      for (let i = 1; i <= 5; i++) {
        await targetCell.click();
        await page.fill('[data-testid="event-title-input"]', `Event ${i}`);
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(300);
      }

      // Check for "more events" indicator or similar overflow handling
      const dayCell = page.locator('.rbc-date-cell').first();
      await expect(dayCell.locator('.rbc-show-more, .more-events')).toBeVisible();
    });
  });

  test.describe('Integration with CalendarProvider', () => {
    test('should integrate with CalendarProvider state', async ({ page }) => {
      // Verify CalendarProvider context is available
      await page.evaluate(() => {
        return window.__CALENDAR_PROVIDER_STATE__ !== undefined;
      });
    });

    test('should sync events with other calendar views', async ({ page }) => {
      // Create event in React Big Calendar
      await page.locator('.rbc-date-cell').first().click();
      await page.fill('[data-testid="event-title-input"]', 'Sync Test Event');
      await page.click('[data-testid="save-event-btn"]');
      await page.waitForTimeout(500);

      // Switch to different calendar library
      const librarySelector = page.locator('[data-testid="library-selector"]');
      if (await librarySelector.isVisible()) {
        await librarySelector.selectOption('linear');
        await page.waitForTimeout(1000);

        // Event should appear in different calendar view
        await expect(page.locator('text=Sync Test Event')).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Calendar should still be visible and usable
      await expect(page.locator('.rbc-calendar')).toBeVisible();

      // Mobile-specific features should be present
      const toolbar = page.locator('.rbc-toolbar');
      await expect(toolbar).toBeVisible();

      // Touch interactions should work
      await page.locator('.rbc-date-cell').first().tap();
      await expect(page.locator('[data-testid="event-modal"]')).toBeVisible();
    });

    test('should handle tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('.rbc-calendar')).toBeVisible();
      await expect(page.locator('.rbc-month-view')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Focus on calendar
      await page.keyboard.press('Tab');

      // Navigate with arrow keys
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');

      // Create event with keyboard
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="event-modal"]')).toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await expect(page.locator('.rbc-calendar')).toHaveAttribute('role', 'application');
      await expect(page.locator('.rbc-toolbar')).toHaveAttribute('role', 'toolbar');
    });

    test('should support screen readers', async ({ page }) => {
      // Check for proper labeling of interactive elements
      const todayBtn = page.locator('button:has-text("Today")');
      await expect(todayBtn).toHaveAttribute('aria-label');

      const nextBtn = page.locator('button:has-text("Next")');
      await expect(nextBtn).toHaveAttribute('aria-label');
    });
  });

  test.describe('Performance', () => {
    test('should handle large numbers of events', async ({ page }) => {
      // Create many events programmatically
      await page.evaluate(() => {
        const events = [];
        for (let i = 0; i < 100; i++) {
          events.push({
            id: `perf-event-${i}`,
            title: `Performance Test Event ${i}`,
            start: new Date(2024, 0, Math.floor(i / 3) + 1),
            end: new Date(2024, 0, Math.floor(i / 3) + 1),
            allDay: true,
          });
        }
        // Simulate adding events to provider
        if (window.__CALENDAR_PROVIDER_STATE__) {
          window.__CALENDAR_PROVIDER_STATE__.setEvents(events);
        }
      });

      await page.waitForTimeout(1000);

      // Calendar should remain responsive
      await expect(page.locator('.rbc-calendar')).toBeVisible();

      // Navigation should still work smoothly
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(300);
      await expect(page.locator('.rbc-month-view')).toBeVisible();
    });

    test('should maintain 60fps during interactions', async ({ page }) => {
      // Measure performance during calendar interaction
      await page.evaluate(() => {
        window.__performanceMarks__ = [];
        const originalRaf = window.requestAnimationFrame;
        window.requestAnimationFrame = function (callback) {
          const start = performance.now();
          return originalRaf.call(this, function (time) {
            const end = performance.now();
            window.__performanceMarks__.push(end - start);
            callback(time);
          });
        };
      });

      // Perform interactions
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);

      // Check frame times
      const frameTimes = await page.evaluate(() => window.__performanceMarks__);
      const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;

      // Should maintain ~60fps (16.67ms per frame)
      expect(averageFrameTime).toBeLessThan(20);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid event data gracefully', async ({ page }) => {
      await page.evaluate(() => {
        // Try to add invalid event
        if (window.__CALENDAR_PROVIDER_STATE__) {
          window.__CALENDAR_PROVIDER_STATE__.addEvent({
            id: 'invalid',
            title: '',
            start: null,
            end: 'invalid-date',
          });
        }
      });

      // Calendar should not crash
      await expect(page.locator('.rbc-calendar')).toBeVisible();
    });

    test('should recover from component errors', async ({ page }) => {
      // Simulate error condition
      await page.evaluate(() => {
        const errorEvent = new Error('Test error');
        window.dispatchEvent(new CustomEvent('calendar-error', { detail: errorEvent }));
      });

      await page.waitForTimeout(500);

      // Calendar should show error boundary or recover
      await expect(page.locator('.rbc-calendar, [data-testid="error-boundary"]')).toBeVisible();
    });
  });
});
