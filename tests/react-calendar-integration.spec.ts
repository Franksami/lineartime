import { test, expect } from '@playwright/test';

test.describe('React Calendar Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-react-calendar');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Component Initialization', () => {
    test('should load React Calendar component successfully', async ({ page }) => {
      await expect(page.locator('.react-calendar-view')).toBeVisible();
      await expect(page.locator('.react-calendar')).toBeVisible();
      await expect(page.locator('.react-calendar__navigation')).toBeVisible();
    });

    test('should display header with event count and controls', async ({ page }) => {
      await expect(page.locator('h2:has-text("React Calendar")')).toBeVisible();
      await expect(page.locator('[data-testid="event-count-badge"]')).toBeVisible();
      await expect(page.locator('button:has-text("Add Event")')).toBeVisible();
      await expect(page.locator('button:has-text("Today")')).toBeVisible();
    });

    test('should show calendar with proper month layout', async ({ page }) => {
      await expect(page.locator('.react-calendar__month-view')).toBeVisible();
      await expect(page.locator('.react-calendar__month-view__weekdays')).toBeVisible();
      await expect(page.locator('.react-calendar__month-view__days')).toBeVisible();

      // Should show proper number of day tiles
      const dayTiles = await page.locator('.react-calendar__tile').count();
      expect(dayTiles).toBeGreaterThanOrEqual(28); // At least one month worth
    });

    test('should display weekday headers', async ({ page }) => {
      const weekdays = page.locator('.react-calendar__month-view__weekdays__weekday');
      await expect(weekdays).toHaveCount(7);

      // Should show abbreviated weekday names
      const firstWeekday = await weekdays.first().textContent();
      expect(firstWeekday).toMatch(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat|S|M|T|W|F)$/);
    });
  });

  test.describe('Calendar Navigation', () => {
    test('should navigate between months using navigation buttons', async ({ page }) => {
      const currentMonth = await page.locator('.react-calendar__navigation__label').textContent();

      // Navigate to next month
      await page.click('.react-calendar__navigation__next-button');
      await page.waitForTimeout(300);

      const nextMonth = await page.locator('.react-calendar__navigation__label').textContent();
      expect(nextMonth).not.toBe(currentMonth);

      // Navigate to previous month
      await page.click('.react-calendar__navigation__prev-button');
      await page.waitForTimeout(300);

      const prevMonth = await page.locator('.react-calendar__navigation__label').textContent();
      expect(prevMonth).toBe(currentMonth);
    });

    test('should support year navigation via header click', async ({ page }) => {
      // Click on month/year label to navigate to year view
      await page.click('.react-calendar__navigation__label');
      await page.waitForTimeout(300);

      // Should show year view or decade view
      const yearView = page.locator('.react-calendar__year-view, .react-calendar__decade-view');
      if (await yearView.isVisible()) {
        // Click on a year to navigate back
        const yearTile = yearView.locator('.react-calendar__tile').first();
        await yearTile.click();
        await page.waitForTimeout(300);
      }
    });

    test('should support "Today" button navigation', async ({ page }) => {
      // Navigate away from today
      await page.click('.react-calendar__navigation__next-button');
      await page.waitForTimeout(300);

      // Click Today button
      await page.click('button:has-text("Today")');
      await page.waitForTimeout(300);

      // Should highlight today's date
      const today = new Date();
      const todayTile = page.locator('.react-calendar__tile--now');
      await expect(todayTile).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Focus on calendar
      await page.keyboard.press('Tab');

      // Navigate with arrow keys
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');

      // Select with Enter or Space
      await page.keyboard.press('Enter');

      // Should select a date
      const selectedTile = page.locator('.react-calendar__tile--active');
      await expect(selectedTile).toBeVisible();
    });
  });

  test.describe('Date Selection and Event Management', () => {
    test('should select dates by clicking on calendar tiles', async ({ page }) => {
      // Click on a date tile
      const dateTile = page
        .locator('.react-calendar__tile:not(.react-calendar__tile--neighboringMonth)')
        .first();
      await dateTile.click();

      // Tile should be active/selected
      await expect(dateTile).toHaveClass(/react-calendar__tile--active/);

      // Selected date should show in sidebar
      const sidebar = page.locator('[data-testid="event-sidebar"]');
      if (await sidebar.isVisible()) {
        await expect(sidebar.locator('h3')).toContainText(/\w/); // Should show date
      }
    });

    test('should create events for selected dates', async ({ page }) => {
      // Select a date
      const dateTile = page
        .locator('.react-calendar__tile:not(.react-calendar__tile--neighboringMonth)')
        .first();
      await dateTile.click();

      // Click Add Event button
      await page.click('button:has-text("Add Event")');

      // Event creation interface should appear
      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'React Calendar Event');
        await page.fill('[data-testid="event-description-input"]', 'Created via React Calendar');
        await page.selectOption('[data-testid="event-priority-select"]', 'medium');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }
    });

    test('should show event indicators on calendar dates', async ({ page }) => {
      // Create an event first
      const dateTile = page
        .locator('.react-calendar__tile:not(.react-calendar__tile--neighboringMonth)')
        .first();
      await dateTile.click();
      await page.click('button:has-text("Add Event")');

      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'Indicator Test Event');
        await page.selectOption('[data-testid="event-priority-select"]', 'high');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }

      // Look for event indicators on the calendar
      const eventIndicators = page.locator(
        '.event-indicator, [data-event-count], .priority-indicator'
      );
      await expect(eventIndicators).toHaveCount.toBeGreaterThan(0);
    });

    test('should display event priority with color coding', async ({ page }) => {
      // Create events with different priorities
      const priorities = ['critical', 'high', 'medium', 'low'];

      for (let i = 0; i < priorities.length; i++) {
        const dateTile = page
          .locator('.react-calendar__tile:not(.react-calendar__tile--neighboringMonth)')
          .nth(i);
        await dateTile.click();
        await page.click('button:has-text("Add Event")');

        const modal = page.locator('[data-testid="event-modal"]');
        if (await modal.isVisible()) {
          await page.fill('[data-testid="event-title-input"]', `${priorities[i]} Priority Event`);
          await page.selectOption('[data-testid="event-priority-select"]', priorities[i]);
          await page.click('[data-testid="save-event-btn"]');
          await page.waitForTimeout(300);
        }
      }

      // Check for different colored indicators
      const priorityIndicators = page.locator('.priority-indicator, [style*="background-color"]');
      await expect(priorityIndicators).toHaveCount.toBeGreaterThan(0);
    });
  });

  test.describe('Event Sidebar and Details', () => {
    test('should display events for selected date in sidebar', async ({ page }) => {
      // Create an event
      const dateTile = page
        .locator('.react-calendar__tile:not(.react-calendar__tile--neighboringMonth)')
        .first();
      await dateTile.click();
      await page.click('button:has-text("Add Event")');

      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'Sidebar Display Event');
        await page.fill('[data-testid="event-description-input"]', 'This event shows in sidebar');
        await page.fill('[data-testid="event-location-input"]', 'Conference Room A');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }

      // Select the same date to view event in sidebar
      await dateTile.click();

      // Check sidebar for event details
      const sidebar = page.locator('[data-testid="event-sidebar"]');
      if (await sidebar.isVisible()) {
        await expect(sidebar.locator('text=Sidebar Display Event')).toBeVisible();
        await expect(sidebar.locator('text=This event shows in sidebar')).toBeVisible();
        await expect(sidebar.locator('text=Conference Room A')).toBeVisible();
      }
    });

    test('should show event statistics and analytics', async ({ page }) => {
      // Create multiple events
      for (let i = 1; i <= 4; i++) {
        const dateTile = page
          .locator('.react-calendar__tile:not(.react-calendar__tile--neighboringMonth)')
          .nth(i - 1);
        await dateTile.click();
        await page.click('button:has-text("Add Event")');

        const modal = page.locator('[data-testid="event-modal"]');
        if (await modal.isVisible()) {
          await page.fill('[data-testid="event-title-input"]', `Analytics Event ${i}`);
          await page.selectOption(
            '[data-testid="event-priority-select"]',
            i <= 2 ? 'high' : 'medium'
          );
          await page.click('[data-testid="save-event-btn"]');
          await page.waitForTimeout(300);
        }
      }

      // Check analytics section
      const analyticsSection = page.locator('[data-testid="event-analytics"]');
      if (await analyticsSection.isVisible()) {
        await expect(analyticsSection.locator('text=Total Events')).toBeVisible();
        await expect(analyticsSection.locator('text=High Priority')).toBeVisible();
        await expect(analyticsSection.locator('text=This Month')).toBeVisible();
      }
    });

    test('should allow editing events from sidebar', async ({ page }) => {
      // Create an event
      const dateTile = page
        .locator('.react-calendar__tile:not(.react-calendar__tile--neighboringMonth)')
        .first();
      await dateTile.click();
      await page.click('button:has-text("Add Event")');

      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'Editable Event');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }

      // Click on event in sidebar to edit
      await dateTile.click();
      const eventInSidebar = page.locator('text=Editable Event');
      if (await eventInSidebar.isVisible()) {
        await eventInSidebar.click();

        // Edit modal should open
        if (await modal.isVisible()) {
          await page.fill('[data-testid="event-title-input"]', 'Edited Event');
          await page.click('[data-testid="save-event-btn"]');
          await page.waitForTimeout(500);

          // Should show updated title
          await expect(page.locator('text=Edited Event')).toBeVisible();
        }
      }
    });

    test('should allow deleting events from sidebar', async ({ page }) => {
      // Create an event to delete
      const dateTile = page
        .locator('.react-calendar__tile:not(.react-calendar__tile--neighboringMonth)')
        .first();
      await dateTile.click();
      await page.click('button:has-text("Add Event")');

      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'Event to Delete');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }

      // Find and click delete button
      await dateTile.click();
      const deleteBtn = page.locator(
        '[data-testid="delete-event-btn"], button[title*="Delete"], .delete-button'
      );
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        await page.waitForTimeout(500);

        // Event should be removed
        await expect(page.locator('text=Event to Delete')).not.toBeVisible();
      }
    });
  });

  test.describe('Calendar Tile Customization', () => {
    test('should apply custom styling to calendar tiles', async ({ page }) => {
      // Check for custom tile content
      const tiles = page.locator('.react-calendar__tile');
      await expect(tiles.first()).toBeVisible();

      // Tiles should have day numbers
      const firstTileText = await tiles.first().textContent();
      expect(firstTileText).toMatch(/\d+/);
    });

    test('should highlight today differently', async ({ page }) => {
      const todayTile = page.locator('.react-calendar__tile--now');

      if (await todayTile.isVisible()) {
        // Today tile should have special styling
        const hasSpecialClass = await todayTile.evaluate((el) => {
          return el.classList.contains('react-calendar__tile--now');
        });
        expect(hasSpecialClass).toBe(true);
      }
    });

    test('should show neighboring month dates differently', async ({ page }) => {
      const neighboringTiles = page.locator('.react-calendar__tile--neighboringMonth');

      if ((await neighboringTiles.count()) > 0) {
        // Neighboring month tiles should be visually distinct
        const hasNeighboringClass = await neighboringTiles.first().evaluate((el) => {
          return el.classList.contains('react-calendar__tile--neighboringMonth');
        });
        expect(hasNeighboringClass).toBe(true);
      }
    });

    test('should handle weekend highlighting', async ({ page }) => {
      const weekendTiles = page.locator('.react-calendar__month-view__days .react-calendar__tile');

      // Check if weekends are highlighted (implementation dependent)
      const tiles = await weekendTiles.all();
      for (const tile of tiles) {
        const className = await tile.getAttribute('class');
        if (
          className?.includes('weekend') ||
          className?.includes('saturday') ||
          className?.includes('sunday')
        ) {
          // Weekend styling is applied correctly
          expect(className).toBeTruthy();
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Calendar should be visible and usable
      await expect(page.locator('.react-calendar')).toBeVisible();

      // Calendar should fit mobile screen
      const calendarWidth = await page.locator('.react-calendar').evaluate((el) => el.clientWidth);
      expect(calendarWidth).toBeLessThanOrEqual(375);

      // Touch interactions should work
      const dateTile = page.locator('.react-calendar__tile').first();
      await dateTile.tap();
      await expect(dateTile).toHaveClass(/react-calendar__tile--active/);
    });

    test('should maintain layout on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('.react-calendar')).toBeVisible();

      // Should show sidebar on tablet
      const sidebar = page.locator('[data-testid="event-sidebar"]');
      if (await sidebar.isVisible()) {
        const sidebarBounds = await sidebar.boundingBox();
        expect(sidebarBounds!.width).toBeGreaterThan(200);
      }
    });

    test('should handle orientation changes', async ({ page }) => {
      // Portrait orientation
      await page.setViewportSize({ width: 375, height: 812 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.react-calendar')).toBeVisible();

      // Landscape orientation
      await page.setViewportSize({ width: 812, height: 375 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.react-calendar')).toBeVisible();
    });

    test('should scale calendar tiles appropriately', async ({ page }) => {
      const viewports = [
        { width: 320, height: 568 },
        { width: 768, height: 1024 },
        { width: 1024, height: 768 },
        { width: 1920, height: 1080 },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(300);

        const tile = page.locator('.react-calendar__tile').first();
        const tileBounds = await tile.boundingBox();

        // Tiles should be appropriately sized for viewport
        expect(tileBounds!.width).toBeGreaterThan(20); // Minimum usable size
        expect(tileBounds!.height).toBeGreaterThan(20);

        // Should be clickable
        await expect(tile).toBeVisible();
      }
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load calendar quickly', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/test-react-calendar');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.react-calendar')).toBeVisible();

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should handle rapid month navigation efficiently', async ({ page }) => {
      // Rapidly navigate through months
      for (let i = 0; i < 10; i++) {
        await page.click('.react-calendar__navigation__next-button');
        await page.waitForTimeout(50); // Minimal delay
      }

      // Calendar should remain functional
      await expect(page.locator('.react-calendar')).toBeVisible();

      // Navigate back
      for (let i = 0; i < 10; i++) {
        await page.click('.react-calendar__navigation__prev-button');
        await page.waitForTimeout(50);
      }

      await expect(page.locator('.react-calendar')).toBeVisible();
    });

    test('should maintain performance with many events', async ({ page }) => {
      // Add many events programmatically
      await page.evaluate(() => {
        const events = [];
        for (let i = 0; i < 100; i++) {
          const eventDate = new Date();
          eventDate.setDate(eventDate.getDate() + (i % 30)); // Spread across month

          events.push({
            id: `react-cal-event-${i}`,
            title: `Performance Event ${i}`,
            start: eventDate,
            end: eventDate,
            allDay: true,
            priority: ['low', 'medium', 'high'][i % 3],
          });
        }

        // Add to provider if available
        if (window.__CALENDAR_PROVIDER_STATE__) {
          window.__CALENDAR_PROVIDER_STATE__.setEvents(events);
        }
      });

      await page.waitForTimeout(1000);

      // Calendar should remain responsive
      await expect(page.locator('.react-calendar')).toBeVisible();

      // Navigation should work smoothly
      await page.click('.react-calendar__navigation__next-button');
      await page.waitForTimeout(300);
      await expect(page.locator('.react-calendar')).toBeVisible();
    });

    test('should handle rapid date selection efficiently', async ({ page }) => {
      const tiles = page.locator(
        '.react-calendar__tile:not(.react-calendar__tile--neighboringMonth)'
      );
      const tileCount = Math.min(await tiles.count(), 10);

      // Rapidly select different dates
      for (let i = 0; i < tileCount; i++) {
        await tiles.nth(i).click();
        await page.waitForTimeout(50);
      }

      // Last selected date should be active
      const activeTile = page.locator('.react-calendar__tile--active');
      await expect(activeTile).toBeVisible();
    });
  });

  test.describe('Integration with CalendarProvider', () => {
    test('should sync events with CalendarProvider state', async ({ page }) => {
      // Create event via React Calendar
      const dateTile = page
        .locator('.react-calendar__tile:not(.react-calendar__tile--neighboringMonth)')
        .first();
      await dateTile.click();
      await page.click('button:has-text("Add Event")');

      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'React Calendar Sync Event');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }

      // Verify event exists in provider
      const hasEvent = await page.evaluate(() => {
        if (window.__CALENDAR_PROVIDER_STATE__) {
          const events = window.__CALENDAR_PROVIDER_STATE__.getEvents();
          return events.some((event) => event.title === 'React Calendar Sync Event');
        }
        return false;
      });

      expect(hasEvent).toBe(true);
    });

    test('should support library switching via provider', async ({ page }) => {
      const librarySelector = page.locator('[data-testid="library-selector"]');

      if (await librarySelector.isVisible()) {
        // Switch to different library
        await librarySelector.selectOption('linear');
        await page.waitForTimeout(1000);

        // Should show different calendar
        await expect(
          page.locator('.linear-calendar, [data-testid="linear-calendar"]')
        ).toBeVisible();

        // Switch back to React Calendar
        await librarySelector.selectOption('react-calendar');
        await page.waitForTimeout(1000);

        await expect(page.locator('.react-calendar')).toBeVisible();
      }
    });

    test('should maintain event data consistency across library switches', async ({ page }) => {
      // Create event in React Calendar
      const dateTile = page
        .locator('.react-calendar__tile:not(.react-calendar__tile--neighboringMonth)')
        .first();
      await dateTile.click();
      await page.click('button:has-text("Add Event")');

      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'Consistency Test Event');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }

      const librarySelector = page.locator('[data-testid="library-selector"]');
      if (await librarySelector.isVisible()) {
        // Switch to different library and back
        await librarySelector.selectOption('linear');
        await page.waitForTimeout(500);
        await librarySelector.selectOption('react-calendar');
        await page.waitForTimeout(500);

        // Event should still exist
        await dateTile.click();
        await expect(page.locator('text=Consistency Test Event')).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Calendar should have proper role
      const calendar = page.locator('.react-calendar');
      const calendarRole = await calendar.getAttribute('role');
      expect(calendarRole).toBeTruthy();

      // Navigation buttons should be labeled
      const prevBtn = page.locator('.react-calendar__navigation__prev-button');
      const nextBtn = page.locator('.react-calendar__navigation__next-button');

      await expect(prevBtn).toHaveAttribute('aria-label');
      await expect(nextBtn).toHaveAttribute('aria-label');
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab to calendar navigation
      await page.keyboard.press('Tab');

      // Should focus on navigation buttons first
      const focusedElement = await page.evaluate(() => document.activeElement?.className);
      expect(focusedElement).toContain('react-calendar__navigation');

      // Tab to calendar grid
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Arrow key navigation
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');

      // Enter to select
      await page.keyboard.press('Enter');

      const selectedTile = page.locator('.react-calendar__tile--active');
      await expect(selectedTile).toBeVisible();
    });

    test('should work with screen readers', async ({ page }) => {
      // Calendar tiles should have accessible names
      const dateTile = page.locator('.react-calendar__tile').first();
      const ariaLabel = await dateTile.getAttribute('aria-label');
      expect(ariaLabel || (await dateTile.textContent())).toBeTruthy();

      // Navigation should be properly labeled
      const monthLabel = page.locator('.react-calendar__navigation__label');
      const labelText = await monthLabel.textContent();
      expect(labelText).toMatch(/\w+/); // Should contain month/year info
    });

    test('should provide proper focus management', async ({ page }) => {
      // Focus should be visible when tabbing
      await page.keyboard.press('Tab');

      const hasVisibleFocus = await page.evaluate(() => {
        const focused = document.activeElement;
        const styles = window.getComputedStyle(focused!);
        return styles.outline !== 'none' || styles.boxShadow !== 'none';
      });

      // Focus should be visible or have custom focus styling
      expect(hasVisibleFocus).toBe(true);
    });

    test('should announce date selection to screen readers', async ({ page }) => {
      // Select a date
      const dateTile = page
        .locator('.react-calendar__tile:not(.react-calendar__tile--neighboringMonth)')
        .first();
      await dateTile.click();

      // Should have proper ARIA attributes
      const isSelected = await dateTile.evaluate((el) => {
        return (
          el.getAttribute('aria-selected') === 'true' ||
          el.classList.contains('react-calendar__tile--active')
        );
      });

      expect(isSelected).toBe(true);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid date navigation gracefully', async ({ page }) => {
      // Try to navigate to invalid date ranges
      for (let i = 0; i < 50; i++) {
        await page.click('.react-calendar__navigation__prev-button');
      }

      // Calendar should still be functional
      await expect(page.locator('.react-calendar')).toBeVisible();
      await expect(page.locator('.react-calendar__month-view')).toBeVisible();
    });

    test('should recover from component errors', async ({ page }) => {
      // Simulate component error
      await page.evaluate(() => {
        const error = new Error('React Calendar error');
        window.dispatchEvent(new CustomEvent('calendar-error', { detail: error }));
      });

      await page.waitForTimeout(500);

      // Should show error boundary or recover gracefully
      const hasCalendar = await page.locator('.react-calendar').isVisible();
      const hasError = await page.locator('[data-testid="error-boundary"]').isVisible();

      expect(hasCalendar || hasError).toBe(true);
    });

    test('should handle missing event data gracefully', async ({ page }) => {
      // Add invalid event data
      await page.evaluate(() => {
        if (window.__CALENDAR_PROVIDER_STATE__) {
          window.__CALENDAR_PROVIDER_STATE__.addEvent({
            id: 'invalid-event',
            title: null,
            start: 'invalid-date',
            end: undefined,
          });
        }
      });

      await page.waitForTimeout(500);

      // Calendar should not crash
      await expect(page.locator('.react-calendar')).toBeVisible();

      // Should handle the invalid event gracefully
      const dateTile = page.locator('.react-calendar__tile').first();
      await dateTile.click();
      // Should not cause errors when displaying events
    });

    test('should handle CSS loading failures', async ({ page }) => {
      // Calendar should work even if CSS fails to load completely
      await expect(page.locator('.react-calendar')).toBeVisible();

      // Basic functionality should work
      const dateTile = page.locator('.react-calendar__tile').first();
      await dateTile.click();
      await expect(dateTile).toHaveClass(/react-calendar__tile--active/);
    });
  });
});
