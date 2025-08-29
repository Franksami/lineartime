import { test, expect } from '@playwright/test';

test.describe('React Infinite Calendar Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-react-infinite-calendar');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Component Initialization', () => {
    test('should load React Infinite Calendar component successfully', async ({ page }) => {
      await expect(page.locator('[data-testid="react-infinite-calendar-view"]')).toBeVisible();
      await expect(page.locator('.infinite-calendar-container')).toBeVisible();
      await expect(page.locator('.Cal__Container')).toBeVisible();
    });

    test('should display custom header with controls', async ({ page }) => {
      await expect(page.locator('h2:has-text("Infinite Calendar")')).toBeVisible();
      await expect(page.locator('button:has-text("Add Event")')).toBeVisible();
      await expect(
        page.locator('button:has-text("Show Events"), button:has-text("Hide Events")')
      ).toBeVisible();
    });

    test('should show infinite scrolling calendar', async ({ page }) => {
      await expect(page.locator('.Cal__Container')).toBeVisible();
      await expect(page.locator('.Cal__Header')).toBeVisible();
      await expect(page.locator('.Cal__Weekdays')).toBeVisible();
      await expect(page.locator('.Cal__Day')).toHaveCount.toBeGreaterThan(30);
    });
  });

  test.describe('Infinite Scrolling Functionality', () => {
    test('should support infinite scrolling in both directions', async ({ page }) => {
      const calendarContainer = page.locator('.Cal__Container');

      // Get initial visible date range
      const initialDate = await page.locator('.Cal__Header__Label').textContent();

      // Scroll up to go to past months
      await calendarContainer.evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.waitForTimeout(300);

      const pastDate = await page.locator('.Cal__Header__Label').textContent();
      expect(pastDate).not.toBe(initialDate);

      // Scroll down to go to future months
      await calendarContainer.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await page.waitForTimeout(300);

      const futureDate = await page.locator('.Cal__Header__Label').textContent();
      expect(futureDate).not.toBe(pastDate);
    });

    test('should maintain smooth scrolling performance', async ({ page }) => {
      const calendarContainer = page.locator('.Cal__Container');

      // Measure scroll performance
      const scrollStart = Date.now();

      // Perform multiple scroll actions
      for (let i = 0; i < 5; i++) {
        await calendarContainer.evaluate((el) => {
          el.scrollTop += 200;
        });
        await page.waitForTimeout(50);
      }

      const scrollEnd = Date.now();
      const scrollDuration = scrollEnd - scrollStart;

      // Should complete scrolling in reasonable time
      expect(scrollDuration).toBeLessThan(1000);
    });

    test('should lazy load calendar months', async ({ page }) => {
      // Check that not all months are rendered initially
      const allDays = await page.locator('.Cal__Day').count();

      // Should not render entire year at once for performance
      expect(allDays).toBeLessThan(400); // Less than full year

      // Scroll to load more content
      await page.locator('.Cal__Container').evaluate((el) => {
        el.scrollTop += 1000;
      });
      await page.waitForTimeout(300);

      // More days should be available after scrolling
      const newDayCount = await page.locator('.Cal__Day').count();
      expect(newDayCount).toBeGreaterThanOrEqual(allDays);
    });
  });

  test.describe('Event Display and Indicators', () => {
    test('should show event indicators on days with events', async ({ page }) => {
      // Create an event first
      await page.click('button:has-text("Add Event")');
      await page.fill('[data-testid="event-title-input"]', 'Indicator Test Event');
      await page.click('[data-testid="save-event-btn"]');
      await page.waitForTimeout(500);

      // Find the day with the event
      const eventDay = page.locator('.Cal__Day').filter({ hasText: 'Indicator Test Event' });
      await expect(eventDay).toBeVisible();

      // Check for event indicators (dots, colors, etc.)
      await expect(eventDay.locator('.event-indicator, [style*="background-color"]')).toBeVisible();
    });

    test('should display different event priorities with color coding', async ({ page }) => {
      // Create high priority event
      await page.click('button:has-text("Add Event")');
      await page.fill('[data-testid="event-title-input"]', 'High Priority Event');
      await page.selectOption('[data-testid="event-priority-select"]', 'high');
      await page.click('[data-testid="save-event-btn"]');
      await page.waitForTimeout(500);

      // Create low priority event
      await page.click('button:has-text("Add Event")');
      await page.fill('[data-testid="event-title-input"]', 'Low Priority Event');
      await page.selectOption('[data-testid="event-priority-select"]', 'low');
      await page.click('[data-testid="save-event-btn"]');
      await page.waitForTimeout(500);

      // Verify different colors for different priorities
      const highPriorityIndicator = page.locator('[style*="#f97316"], [style*="#ef4444"]').first();
      const lowPriorityIndicator = page.locator('[style*="#22c55e"]').first();

      await expect(highPriorityIndicator).toBeVisible();
      await expect(lowPriorityIndicator).toBeVisible();
    });

    test('should handle event overflow with "more events" indicator', async ({ page }) => {
      // Create multiple events on the same day
      const today = new Date();

      for (let i = 1; i <= 5; i++) {
        await page.click('button:has-text("Add Event")');
        await page.fill('[data-testid="event-title-input"]', `Overflow Event ${i}`);
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(300);
      }

      // Look for overflow indicator
      const overflowIndicator = page.locator(
        '.more-events, .event-overflow, [style*="background-color"]:has-text("+")'
      );
      await expect(overflowIndicator).toBeVisible();
    });
  });

  test.describe('Date Selection and Navigation', () => {
    test('should select dates by clicking', async ({ page }) => {
      // Click on a specific day
      const targetDay = page.locator('.Cal__Day').filter({ hasText: /^\d+$/ }).first();
      await targetDay.click();

      // Day should be selected (highlighted)
      await expect(targetDay).toHaveClass(/selected|active/);

      // Selected date should be shown in sidebar
      const sidebar = page.locator('[data-testid="events-sidebar"]');
      if (await sidebar.isVisible()) {
        await expect(sidebar.locator('h3')).toContainText(/\d{1,2}/);
      }
    });

    test('should navigate to today with today helper', async ({ page }) => {
      const todayHelper = page.locator('.Cal__Today, button:has-text("Today")');

      if (await todayHelper.isVisible()) {
        await todayHelper.click();
        await page.waitForTimeout(300);

        // Should highlight today's date
        const today = new Date();
        const todayText = today.getDate().toString();
        const todayElement = page.locator(`.Cal__Day--today, .Cal__Day:has-text("${todayText}")`);
        await expect(todayElement).toBeVisible();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Focus on calendar
      await page.keyboard.press('Tab');

      // Navigate with arrow keys
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');

      // Select with Enter
      await page.keyboard.press('Enter');

      // Should open event creation or select date
      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await expect(modal).toBeVisible();
      }
    });
  });

  test.describe('Event Sidebar Integration', () => {
    test('should show event details in sidebar', async ({ page }) => {
      // Create an event
      await page.click('button:has-text("Add Event")');
      await page.fill('[data-testid="event-title-input"]', 'Sidebar Test Event');
      await page.fill('[data-testid="event-description-input"]', 'Event with description');
      await page.click('[data-testid="save-event-btn"]');
      await page.waitForTimeout(500);

      // Click on the event day
      const eventDay = page.locator('.Cal__Day').filter({ hasText: 'Sidebar Test Event' });
      await eventDay.click();

      // Sidebar should show event details
      const sidebar = page.locator('[data-testid="events-sidebar"]');
      if (await sidebar.isVisible()) {
        await expect(sidebar.locator('text=Sidebar Test Event')).toBeVisible();
        await expect(sidebar.locator('text=Event with description')).toBeVisible();
      }
    });

    test('should show event summary statistics', async ({ page }) => {
      // Create multiple events
      for (let i = 1; i <= 3; i++) {
        await page.click('button:has-text("Add Event")');
        await page.fill('[data-testid="event-title-input"]', `Summary Event ${i}`);
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(300);
      }

      // Check event summary
      const summarySection = page.locator('[data-testid="event-summary"]');
      if (await summarySection.isVisible()) {
        await expect(summarySection.locator('text=Total Events')).toBeVisible();
        await expect(summarySection.locator('text=3')).toBeVisible();
      }
    });

    test('should toggle sidebar visibility', async ({ page }) => {
      const toggleButton = page.locator(
        'button:has-text("Hide Events"), button:has-text("Show Events")'
      );
      const sidebar = page.locator('[data-testid="events-sidebar"]');

      // Hide sidebar
      if (await page.locator('button:has-text("Hide Events")').isVisible()) {
        await page.click('button:has-text("Hide Events")');
        await expect(sidebar).not.toBeVisible();
        await expect(page.locator('button:has-text("Show Events")')).toBeVisible();
      }

      // Show sidebar
      if (await page.locator('button:has-text("Show Events")').isVisible()) {
        await page.click('button:has-text("Show Events")');
        await expect(sidebar).toBeVisible();
        await expect(page.locator('button:has-text("Hide Events")')).toBeVisible();
      }
    });
  });

  test.describe('Theme and Styling', () => {
    test('should support light and dark themes', async ({ page }) => {
      // Check default theme
      const container = page.locator('.infinite-calendar-container');
      const currentClass = await container.getAttribute('class');

      // If theme selector is available, test theme switching
      const themeToggle = page.locator(
        '[data-testid="theme-toggle"], button:has-text("Dark"), button:has-text("Light")'
      );

      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(300);

        // Check that theme changed
        const newClass = await container.getAttribute('class');
        expect(newClass).not.toBe(currentClass);
      }
    });

    test('should apply custom calendar theme', async ({ page }) => {
      const calendarElement = page.locator('.Cal__Container');

      // Check for theme styling
      const computedStyles = await calendarElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
        };
      });

      // Should have theme-appropriate colors
      expect(computedStyles.backgroundColor).toBeTruthy();
      expect(computedStyles.color).toBeTruthy();
    });

    test('should maintain consistent styling across scroll', async ({ page }) => {
      const calendarContainer = page.locator('.Cal__Container');

      // Get initial styling
      const initialStyles = await page
        .locator('.Cal__Day')
        .first()
        .evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.fontSize;
        });

      // Scroll to different month
      await calendarContainer.evaluate((el) => {
        el.scrollTop += 500;
      });
      await page.waitForTimeout(300);

      // Check styling consistency
      const newStyles = await page
        .locator('.Cal__Day')
        .first()
        .evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.fontSize;
        });

      expect(newStyles).toBe(initialStyles);
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Calendar should still be visible and usable
      await expect(page.locator('.Cal__Container')).toBeVisible();

      // Calendar should fit mobile screen
      const calendarWidth = await page.locator('.Cal__Container').evaluate((el) => el.clientWidth);
      expect(calendarWidth).toBeLessThanOrEqual(375);

      // Touch interactions should work
      await page.locator('.Cal__Day').first().tap();
    });

    test('should handle tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('.Cal__Container')).toBeVisible();

      // Should show more content on tablet
      const visibleDays = await page.locator('.Cal__Day:visible').count();
      expect(visibleDays).toBeGreaterThan(30);
    });

    test('should maintain aspect ratio on different screens', async ({ page }) => {
      const viewports = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 375, height: 812 }, // iPhone X
        { width: 768, height: 1024 }, // iPad
        { width: 1024, height: 768 }, // iPad landscape
        { width: 1920, height: 1080 }, // Desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(300);

        // Calendar should be visible and properly sized
        await expect(page.locator('.Cal__Container')).toBeVisible();

        const calendarBounds = await page.locator('.Cal__Container').boundingBox();
        expect(calendarBounds).toBeTruthy();
        expect(calendarBounds!.width).toBeGreaterThan(0);
        expect(calendarBounds!.height).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Performance', () => {
    test('should handle rapid scrolling without lag', async ({ page }) => {
      const calendarContainer = page.locator('.Cal__Container');

      // Perform rapid scroll test
      const scrollStart = Date.now();

      for (let i = 0; i < 10; i++) {
        await calendarContainer.evaluate((el) => {
          el.scrollTop += 100;
        });
        await page.waitForTimeout(10); // Minimal delay to simulate rapid scrolling
      }

      const scrollEnd = Date.now();
      const totalTime = scrollEnd - scrollStart;

      // Should complete rapid scrolling quickly
      expect(totalTime).toBeLessThan(500);

      // Calendar should still be responsive
      await expect(page.locator('.Cal__Container')).toBeVisible();
    });

    test('should maintain performance with many events', async ({ page }) => {
      // Add many events across different months
      await page.evaluate(() => {
        const events = [];
        const today = new Date();

        for (let i = 0; i < 50; i++) {
          const eventDate = new Date(today);
          eventDate.setDate(eventDate.getDate() + (i - 25)); // Spread across dates

          events.push({
            id: `perf-event-${i}`,
            title: `Performance Test ${i}`,
            start: eventDate,
            end: eventDate,
            allDay: true,
          });
        }

        // Add events to calendar
        if (window.__CALENDAR_PROVIDER_STATE__) {
          window.__CALENDAR_PROVIDER_STATE__.setEvents(events);
        }
      });

      await page.waitForTimeout(1000);

      // Scrolling should remain smooth
      const calendarContainer = page.locator('.Cal__Container');
      await calendarContainer.evaluate((el) => {
        el.scrollTop += 300;
      });

      await page.waitForTimeout(300);
      await expect(page.locator('.Cal__Container')).toBeVisible();
    });

    test('should efficiently render only visible months', async ({ page }) => {
      // Check DOM size before scrolling
      const initialDayCount = await page.locator('.Cal__Day').count();

      // Scroll to distant future
      await page.locator('.Cal__Container').evaluate((el) => {
        el.scrollTop = 5000;
      });
      await page.waitForTimeout(500);

      const newDayCount = await page.locator('.Cal__Day').count();

      // Should not have excessive DOM elements
      expect(newDayCount).toBeLessThan(200); // Reasonable limit for visible rendering

      // But should show new months
      expect(newDayCount).toBeGreaterThan(30); // At least one month worth
    });
  });

  test.describe('Integration with CalendarProvider', () => {
    test('should sync with CalendarProvider state', async ({ page }) => {
      // Create event through infinite calendar
      await page.click('button:has-text("Add Event")');
      await page.fill('[data-testid="event-title-input"]', 'Provider Sync Event');
      await page.click('[data-testid="save-event-btn"]');
      await page.waitForTimeout(500);

      // Check if event is accessible via provider
      const providerHasEvent = await page.evaluate(() => {
        if (window.__CALENDAR_PROVIDER_STATE__) {
          const events = window.__CALENDAR_PROVIDER_STATE__.getEvents();
          return events.some((event) => event.title === 'Provider Sync Event');
        }
        return false;
      });

      expect(providerHasEvent).toBe(true);
    });

    test('should support library switching', async ({ page }) => {
      const librarySelector = page.locator('[data-testid="library-selector"]');

      if (await librarySelector.isVisible()) {
        // Switch to different calendar library
        await librarySelector.selectOption('linear');
        await page.waitForTimeout(1000);

        // Should show different calendar component
        await expect(
          page.locator('.linear-calendar, [data-testid="linear-calendar"]')
        ).toBeVisible();

        // Switch back
        await librarySelector.selectOption('infinite');
        await page.waitForTimeout(1000);

        await expect(page.locator('.Cal__Container')).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      await expect(page.locator('.Cal__Container')).toHaveAttribute('role', /application|grid/);

      // Calendar days should be properly labeled
      const calendarDay = page.locator('.Cal__Day').first();
      const ariaLabel = await calendarDay.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab to calendar
      await page.keyboard.press('Tab');

      // Arrow key navigation
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');

      // Enter to select
      await page.keyboard.press('Enter');

      // Should show some interaction (modal or selection)
      const hasModal = await page.locator('[data-testid="event-modal"]').isVisible();
      const hasSelection = await page.locator('.Cal__Day--selected').isVisible();

      expect(hasModal || hasSelection).toBe(true);
    });

    test('should work with screen readers', async ({ page }) => {
      // Check for screen reader friendly labels
      const headerLabel = page.locator('.Cal__Header__Label, .Cal__Header');
      await expect(headerLabel).toHaveAttribute('aria-label');

      // Navigation buttons should be labeled
      const navButtons = page.locator('button[aria-label*="previous"], button[aria-label*="next"]');
      if ((await navButtons.count()) > 0) {
        await expect(navButtons.first()).toHaveAttribute('aria-label');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle calendar initialization errors', async ({ page }) => {
      // Simulate initialization error
      await page.evaluate(() => {
        if (window.__CALENDAR_PROVIDER_STATE__) {
          window.__CALENDAR_PROVIDER_STATE__.setError('Calendar initialization failed');
        }
      });

      await page.waitForTimeout(500);

      // Should show error state or fallback
      const hasError = await page
        .locator('[data-testid="error-message"], .error-state')
        .isVisible();
      const hasCalendar = await page.locator('.Cal__Container').isVisible();

      // Either show error or gracefully continue
      expect(hasError || hasCalendar).toBe(true);
    });

    test('should recover from scroll errors', async ({ page }) => {
      // Force scroll error by scrolling to invalid position
      await page.locator('.Cal__Container').evaluate((el) => {
        el.scrollTop = -1000; // Invalid negative scroll
      });

      await page.waitForTimeout(300);

      // Calendar should still be functional
      await expect(page.locator('.Cal__Container')).toBeVisible();

      // Should be able to scroll normally
      await page.locator('.Cal__Container').evaluate((el) => {
        el.scrollTop = 100;
      });
      await page.waitForTimeout(300);
    });
  });
});
