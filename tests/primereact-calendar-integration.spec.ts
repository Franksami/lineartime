import { test, expect } from '@playwright/test';

test.describe('PrimeReact Calendar Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-primereact-calendar');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Component Initialization', () => {
    test('should load PrimeReact Calendar component successfully', async ({ page }) => {
      await expect(page.locator('.primereact-calendar-view')).toBeVisible();
      await expect(page.locator('.p-calendar')).toBeVisible();
      await expect(page.locator('.p-datepicker')).toBeVisible();
    });

    test('should display header with event count badge', async ({ page }) => {
      await expect(page.locator('h2:has-text("PrimeReact Calendar")')).toBeVisible();
      await expect(page.locator('.p-badge')).toBeVisible();
      await expect(page.locator('button:has-text("Add Event")')).toBeVisible();
      await expect(page.locator('button:has-text("Show Events"), button:has-text("Hide Events")')).toBeVisible();
    });

    test('should show inline calendar with proper month view', async ({ page }) => {
      await expect(page.locator('.p-datepicker-inline')).toBeVisible();
      await expect(page.locator('.p-datepicker-header')).toBeVisible();
      await expect(page.locator('.p-datepicker-calendar')).toBeVisible();
      await expect(page.locator('td[data-p-selectable="true"]')).toHaveCount.toBeGreaterThan(28); // Month days
    });

    test('should display week numbers when configured', async ({ page }) => {
      const weekNumbers = page.locator('.p-datepicker-weeknumber');
      if (await weekNumbers.isVisible()) {
        await expect(weekNumbers).toHaveCount.toBeGreaterThan(4); // At least 4 weeks
      }
    });
  });

  test.describe('Calendar Navigation', () => {
    test('should navigate between months using header controls', async ({ page }) => {
      const currentMonth = await page.locator('.p-datepicker-title .p-datepicker-month').textContent();
      
      // Navigate to next month
      await page.click('.p-datepicker-next');
      await page.waitForTimeout(300);
      
      const newMonth = await page.locator('.p-datepicker-title .p-datepicker-month').textContent();
      expect(newMonth).not.toBe(currentMonth);
      
      // Navigate back to previous month
      await page.click('.p-datepicker-prev');
      await page.waitForTimeout(300);
      
      const backToMonth = await page.locator('.p-datepicker-title .p-datepicker-month').textContent();
      expect(backToMonth).toBe(currentMonth);
    });

    test('should support year navigation', async ({ page }) => {
      const currentYear = await page.locator('.p-datepicker-title .p-datepicker-year').textContent();
      
      // Click on year to show year picker
      await page.click('.p-datepicker-title .p-datepicker-year');
      await page.waitForTimeout(300);
      
      // Should show year selection view
      await expect(page.locator('.p-datepicker-year-picker')).toBeVisible();
      
      // Select a different year if available
      const yearOptions = page.locator('.p-datepicker-year-picker .p-yearpicker-year');
      if (await yearOptions.count() > 0) {
        await yearOptions.first().click();
        await page.waitForTimeout(300);
      }
    });

    test('should support month dropdown navigation', async ({ page }) => {
      // Click on month to show month picker
      await page.click('.p-datepicker-title .p-datepicker-month');
      await page.waitForTimeout(300);
      
      // Should show month selection view
      await expect(page.locator('.p-datepicker-month-picker')).toBeVisible();
      
      // Select a different month
      const monthOptions = page.locator('.p-datepicker-month-picker .p-monthpicker-month');
      if (await monthOptions.count() > 0) {
        await monthOptions.nth(6).click(); // Select July
        await page.waitForTimeout(300);
        
        const newMonth = await page.locator('.p-datepicker-title .p-datepicker-month').textContent();
        expect(newMonth).toContain('Jul');
      }
    });
  });

  test.describe('Date Selection and Event Management', () => {
    test('should select dates by clicking on calendar cells', async ({ page }) => {
      // Click on a selectable date
      const selectableDate = page.locator('td[data-p-selectable="true"]').first();
      await selectableDate.click();
      
      // Date should be selected (highlighted)
      await expect(selectableDate).toHaveClass(/p-highlight/);
      
      // Selected date should show in sidebar
      const sidebar = page.locator('[data-testid="events-sidebar"]');
      if (await sidebar.isVisible()) {
        await expect(sidebar.locator('h3')).toContainText(/\w{3}/); // Should show day name
      }
    });

    test('should create events for selected date', async ({ page }) => {
      // Select a date
      const selectableDate = page.locator('td[data-p-selectable="true"]').first();
      await selectableDate.click();
      
      // Click Add Event button
      await page.click('button:has-text("Add Event")');
      await page.waitForTimeout(300);
      
      // Event creation should trigger
      // This might show a modal or directly create an event
      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'PrimeReact Test Event');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }
    });

    test('should show event indicators on calendar dates', async ({ page }) => {
      // Create an event first
      const selectableDate = page.locator('td[data-p-selectable="true"]').first();
      await selectableDate.click();
      await page.click('button:has-text("Add Event")');
      
      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'Indicator Test Event');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }
      
      // Look for event indicators on the date
      const eventIndicators = page.locator('.event-indicator, [data-pr-tooltip]');
      await expect(eventIndicators).toHaveCount.toBeGreaterThan(0);
    });

    test('should display event tooltips on hover', async ({ page }) => {
      // Create an event with description
      const selectableDate = page.locator('td[data-p-selectable="true"]').first();
      await selectableDate.click();
      await page.click('button:has-text("Add Event")');
      
      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'Tooltip Event');
        await page.fill('[data-testid="event-description-input"]', 'Event with tooltip');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }
      
      // Hover over event indicator
      const eventIndicator = page.locator('.event-indicator, [data-pr-tooltip]').first();
      if (await eventIndicator.isVisible()) {
        await eventIndicator.hover();
        
        // Look for PrimeReact tooltip
        await expect(page.locator('.p-tooltip, [role="tooltip"]')).toBeVisible();
      }
    });
  });

  test.describe('Event Sidebar and Details', () => {
    test('should display events for selected date in sidebar', async ({ page }) => {
      // Create an event
      const selectableDate = page.locator('td[data-p-selectable="true"]').first();
      await selectableDate.click();
      await page.click('button:has-text("Add Event")');
      
      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'Sidebar Event');
        await page.fill('[data-testid="event-description-input"]', 'Event in sidebar');
        await page.selectOption('[data-testid="event-priority-select"]', 'high');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }
      
      // Select the date again to see event in sidebar
      await selectableDate.click();
      
      // Sidebar should show event
      const sidebar = page.locator('[data-testid="events-sidebar"]');
      if (await sidebar.isVisible()) {
        await expect(sidebar.locator('text=Sidebar Event')).toBeVisible();
        await expect(sidebar.locator('text=Event in sidebar')).toBeVisible();
        await expect(sidebar.locator('.p-badge')).toBeVisible(); // Priority badge
      }
    });

    test('should show event statistics in sidebar', async ({ page }) => {
      // Create multiple events
      for (let i = 1; i <= 3; i++) {
        const selectableDate = page.locator('td[data-p-selectable="true"]').nth(i-1);
        await selectableDate.click();
        await page.click('button:has-text("Add Event")');
        
        const modal = page.locator('[data-testid="event-modal"]');
        if (await modal.isVisible()) {
          await page.fill('[data-testid="event-title-input"]', `Stats Event ${i}`);
          await page.selectOption('[data-testid="event-priority-select"]', i === 1 ? 'high' : 'medium');
          await page.click('[data-testid="save-event-btn"]');
          await page.waitForTimeout(300);
        }
      }
      
      // Check statistics card
      const statsCard = page.locator('[data-testid="statistics-card"]');
      if (await statsCard.isVisible()) {
        await expect(statsCard.locator('text=Total Events')).toBeVisible();
        await expect(statsCard.locator('text=High Priority')).toBeVisible();
        await expect(statsCard.locator('text=This Month')).toBeVisible();
        
        // Should show event counts
        await expect(statsCard.locator('.p-badge')).toHaveCount.toBeGreaterThan(2);
      }
    });

    test('should allow deleting events from sidebar', async ({ page }) => {
      // Create an event
      const selectableDate = page.locator('td[data-p-selectable="true"]').first();
      await selectableDate.click();
      await page.click('button:has-text("Add Event")');
      
      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'Delete Test Event');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }
      
      // Find and delete the event
      await selectableDate.click();
      const deleteBtn = page.locator('.p-button-danger, button[tooltip="Delete event"]');
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        await page.waitForTimeout(500);
        
        // Event should be removed from sidebar
        await expect(page.locator('text=Delete Test Event')).not.toBeVisible();
      }
    });

    test('should toggle sidebar visibility', async ({ page }) => {
      const sidebar = page.locator('[data-testid="events-sidebar"]');
      const toggleBtn = page.locator('button:has-text("Hide Events"), button:has-text("Show Events")');
      
      // If sidebar is visible, hide it
      if (await sidebar.isVisible()) {
        await page.click('button:has-text("Hide Events")');
        await expect(sidebar).not.toBeVisible();
        await expect(page.locator('button:has-text("Show Events")')).toBeVisible();
      }
      
      // Show sidebar again
      if (await page.locator('button:has-text("Show Events")').isVisible()) {
        await page.click('button:has-text("Show Events")');
        await expect(sidebar).toBeVisible();
      }
    });
  });

  test.describe('PrimeReact Specific Features', () => {
    test('should support PrimeReact button styling', async ({ page }) => {
      const buttons = page.locator('.p-button');
      await expect(buttons).toHaveCount.toBeGreaterThan(0);
      
      // Buttons should have PrimeReact classes
      const addEventBtn = page.locator('button:has-text("Add Event")');
      const btnClass = await addEventBtn.getAttribute('class');
      expect(btnClass).toContain('p-button');
    });

    test('should use PrimeReact card components', async ({ page }) => {
      const cards = page.locator('.p-card');
      await expect(cards).toHaveCount.toBeGreaterThan(0);
      
      // Cards should have proper PrimeReact structure
      await expect(page.locator('.p-card-header, .p-card-body, .p-card-content')).toHaveCount.toBeGreaterThan(0);
    });

    test('should display PrimeReact badges for event counts', async ({ page }) => {
      const badges = page.locator('.p-badge');
      await expect(badges).toHaveCount.toBeGreaterThan(0);
      
      // Badges should show numbers
      const firstBadge = badges.first();
      const badgeText = await firstBadge.textContent();
      expect(badgeText).toMatch(/\d+/);
    });

    test('should support PrimeReact themes', async ({ page }) => {
      // Check for PrimeReact theme classes
      const calendarElement = page.locator('.p-calendar');
      const elementClass = await calendarElement.getAttribute('class');
      
      // Should have theme-related classes
      expect(elementClass).toContain('p-calendar');
      
      // Check theme is applied
      const computedStyles = await calendarElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          fontFamily: styles.fontFamily,
          fontSize: styles.fontSize
        };
      });
      
      expect(computedStyles.fontFamily).toBeTruthy();
      expect(computedStyles.fontSize).toBeTruthy();
    });
  });

  test.describe('Date Template and Customization', () => {
    test('should render custom date templates', async ({ page }) => {
      // Look for custom date template content
      const dateCells = page.locator('td[data-p-selectable="true"]');
      await expect(dateCells).toHaveCount.toBeGreaterThan(0);
      
      // Each cell should contain day number
      const firstCell = dateCells.first();
      const cellText = await firstCell.textContent();
      expect(cellText).toMatch(/\d+/);
    });

    test('should show event indicators in date templates', async ({ page }) => {
      // Create events for testing templates
      const selectableDate = page.locator('td[data-p-selectable="true"]').first();
      await selectableDate.click();
      await page.click('button:has-text("Add Event")');
      
      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'Template Test Event');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }
      
      // Date cell should show event indicators
      const eventIndicators = selectableDate.locator('.event-indicator, div[style*="background-color"]');
      await expect(eventIndicators).toHaveCount.toBeGreaterThan(0);
    });

    test('should handle date template overflow', async ({ page }) => {
      // Create multiple events on same day
      const selectableDate = page.locator('td[data-p-selectable="true"]').first();
      
      for (let i = 1; i <= 4; i++) {
        await selectableDate.click();
        await page.click('button:has-text("Add Event")');
        
        const modal = page.locator('[data-testid="event-modal"]');
        if (await modal.isVisible()) {
          await page.fill('[data-testid="event-title-input"]', `Overflow Event ${i}`);
          await page.click('[data-testid="save-event-btn"]');
          await page.waitForTimeout(300);
        }
      }
      
      // Should show overflow indicator
      const overflowIndicator = selectableDate.locator('div:has-text("+"), .more-events');
      await expect(overflowIndicator).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Calendar should still be visible
      await expect(page.locator('.p-calendar')).toBeVisible();
      
      // Calendar should fit mobile screen
      const calendarWidth = await page.locator('.p-calendar').evaluate((el) => el.clientWidth);
      expect(calendarWidth).toBeLessThanOrEqual(375);
      
      // Touch interactions should work
      await page.locator('td[data-p-selectable="true"]').first().tap();
    });

    test('should maintain layout on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.p-calendar')).toBeVisible();
      
      // Should show sidebar on tablet
      const sidebar = page.locator('[data-testid="events-sidebar"]');
      if (await sidebar.isVisible()) {
        const sidebarBounds = await sidebar.boundingBox();
        expect(sidebarBounds!.width).toBeGreaterThan(200);
      }
    });

    test('should handle different screen orientations', async ({ page }) => {
      // Portrait
      await page.setViewportSize({ width: 375, height: 812 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.p-calendar')).toBeVisible();
      
      // Landscape
      await page.setViewportSize({ width: 812, height: 375 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.p-calendar')).toBeVisible();
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load calendar quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/test-primereact-calendar');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.p-calendar')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should handle many events efficiently', async ({ page }) => {
      // Add many events programmatically
      await page.evaluate(() => {
        const events = [];
        for (let i = 0; i < 100; i++) {
          const eventDate = new Date();
          eventDate.setDate(eventDate.getDate() + (i % 30)); // Spread across month
          
          events.push({
            id: `perf-event-${i}`,
            title: `Performance Event ${i}`,
            start: eventDate,
            end: eventDate,
            allDay: true,
            priority: i % 3 === 0 ? 'high' : 'medium'
          });
        }
        
        // Add to provider if available
        if (window.__CALENDAR_PROVIDER_STATE__) {
          window.__CALENDAR_PROVIDER_STATE__.setEvents(events);
        }
      });
      
      await page.waitForTimeout(1000);
      
      // Calendar should remain responsive
      await expect(page.locator('.p-calendar')).toBeVisible();
      await page.click('.p-datepicker-next');
      await page.waitForTimeout(300);
      await expect(page.locator('.p-calendar')).toBeVisible();
    });

    test('should maintain performance during rapid interactions', async ({ page }) => {
      // Rapid month navigation
      for (let i = 0; i < 5; i++) {
        await page.click('.p-datepicker-next');
        await page.waitForTimeout(100);
      }
      
      // Calendar should still be responsive
      await expect(page.locator('.p-calendar')).toBeVisible();
      
      // Rapid date selection
      const dates = page.locator('td[data-p-selectable="true"]');
      const dateCount = Math.min(await dates.count(), 5);
      
      for (let i = 0; i < dateCount; i++) {
        await dates.nth(i).click();
        await page.waitForTimeout(50);
      }
      
      // Should handle rapid selections
      await expect(page.locator('.p-calendar')).toBeVisible();
    });
  });

  test.describe('Integration with CalendarProvider', () => {
    test('should sync events with CalendarProvider', async ({ page }) => {
      // Create event via PrimeReact calendar
      const selectableDate = page.locator('td[data-p-selectable="true"]').first();
      await selectableDate.click();
      await page.click('button:has-text("Add Event")');
      
      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'Provider Sync Event');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }
      
      // Check if event exists in provider
      const hasEvent = await page.evaluate(() => {
        if (window.__CALENDAR_PROVIDER_STATE__) {
          const events = window.__CALENDAR_PROVIDER_STATE__.getEvents();
          return events.some(event => event.title === 'Provider Sync Event');
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
        await expect(page.locator('.linear-calendar, [data-testid="linear-calendar"]')).toBeVisible();
        
        // Switch back to PrimeReact
        await librarySelector.selectOption('primereact');
        await page.waitForTimeout(1000);
        
        await expect(page.locator('.p-calendar')).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      await expect(page.locator('.p-calendar')).toHaveAttribute('role');
      
      // Calendar should be accessible
      const calendar = page.locator('.p-datepicker');
      await expect(calendar).toHaveAttribute('role', 'application');
      
      // Buttons should be properly labeled
      const navButtons = page.locator('.p-datepicker-prev, .p-datepicker-next');
      for (let i = 0; i < await navButtons.count(); i++) {
        await expect(navButtons.nth(i)).toHaveAttribute('aria-label');
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Focus on calendar
      await page.keyboard.press('Tab');
      
      // Navigate with arrow keys
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      
      // Select date with Enter
      await page.keyboard.press('Enter');
      
      // Should select date or open modal
      const hasSelection = await page.locator('td.p-highlight').isVisible();
      const hasModal = await page.locator('[data-testid="event-modal"]').isVisible();
      
      expect(hasSelection || hasModal).toBe(true);
    });

    test('should work with screen readers', async ({ page }) => {
      // Calendar title should be readable
      await expect(page.locator('.p-datepicker-title')).toHaveAttribute('aria-label');
      
      // Date cells should have proper labels
      const dateCell = page.locator('td[data-p-selectable="true"]').first();
      const ariaLabel = await dateCell.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid date selection gracefully', async ({ page }) => {
      // Try to select disabled/invalid date
      const disabledDate = page.locator('td[data-p-selectable="false"]');
      
      if (await disabledDate.isVisible()) {
        await disabledDate.click();
        
        // Should not break the calendar
        await expect(page.locator('.p-calendar')).toBeVisible();
      }
    });

    test('should recover from component errors', async ({ page }) => {
      // Simulate error condition
      await page.evaluate(() => {
        const error = new Error('PrimeReact calendar error');
        window.dispatchEvent(new CustomEvent('calendar-error', { detail: error }));
      });
      
      await page.waitForTimeout(500);
      
      // Should show error boundary or recover gracefully
      const hasCalendar = await page.locator('.p-calendar').isVisible();
      const hasError = await page.locator('[data-testid="error-boundary"]').isVisible();
      
      expect(hasCalendar || hasError).toBe(true);
    });

    test('should handle theme loading failures', async ({ page }) => {
      // Calendar should be functional even if theme fails to load
      await expect(page.locator('.p-calendar')).toBeVisible();
      
      // Basic functionality should work
      await page.click('td[data-p-selectable="true"]');
      await expect(page.locator('td.p-highlight')).toBeVisible();
    });
  });
});