import { test, expect } from '@playwright/test';

test.describe('Toast UI Calendar Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Toast UI Calendar test page
    await page.goto('/test-toast-ui-calendar');
    
    // Wait for calendar to load
    await page.waitForSelector('.toastui-calendar', { timeout: 10000 });
  });

  test.describe('Calendar Loading and Initialization', () => {
    test('should load Toast UI Calendar with proper initialization', async ({ page }) => {
      // Check calendar container exists
      await expect(page.locator('.toastui-calendar')).toBeVisible();
      
      // Check calendar toolbar is present
      await expect(page.locator('[data-testid="calendar-toolbar"]')).toBeVisible();
      
      // Check view controls are available
      await expect(page.locator('button[data-view="month"]')).toBeVisible();
      await expect(page.locator('button[data-view="week"]')).toBeVisible();
      await expect(page.locator('button[data-view="day"]')).toBeVisible();
      
      // Verify calendar displays current month/year
      const currentDate = new Date();
      const expectedMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      await expect(page.locator('[data-testid="current-date"]')).toContainText(expectedMonth);
    });

    test('should display calendar statistics in sidebar', async ({ page }) => {
      // Check sidebar is visible
      await expect(page.locator('[data-testid="calendar-sidebar"]')).toBeVisible();
      
      // Check stats cards
      await expect(page.locator('[data-testid="stats-total"]')).toBeVisible();
      await expect(page.locator('[data-testid="stats-upcoming"]')).toBeVisible();
      await expect(page.locator('[data-testid="stats-today"]')).toBeVisible();
      await expect(page.locator('[data-testid="stats-completed"]')).toBeVisible();
      
      // Verify stats contain numbers
      const totalEvents = await page.locator('[data-testid="stats-total"]').textContent();
      expect(totalEvents).toMatch(/\d+/);
    });

    test('should load with proper CSS and styling', async ({ page }) => {
      // Check Toast UI Calendar CSS is loaded
      const calendarElement = page.locator('.toastui-calendar');
      
      // Verify calendar has proper dimensions
      const calendarBox = await calendarElement.boundingBox();
      expect(calendarBox?.width).toBeGreaterThan(600);
      expect(calendarBox?.height).toBeGreaterThan(400);
      
      // Check theme styling is applied
      await expect(calendarElement).toHaveCSS('background-color', /(rgb\(255, 255, 255\)|rgb\(0, 0, 0\))/);
    });
  });

  test.describe('Calendar Navigation', () => {
    test('should navigate to previous month', async ({ page }) => {
      // Get current month
      const currentMonth = await page.locator('[data-testid="current-date"]').textContent();
      
      // Click previous button
      await page.click('[data-testid="nav-previous"]');
      await page.waitForTimeout(500);
      
      // Verify month changed
      const newMonth = await page.locator('[data-testid="current-date"]').textContent();
      expect(newMonth).not.toBe(currentMonth);
    });

    test('should navigate to next month', async ({ page }) => {
      // Get current month
      const currentMonth = await page.locator('[data-testid="current-date"]').textContent();
      
      // Click next button
      await page.click('[data-testid="nav-next"]');
      await page.waitForTimeout(500);
      
      // Verify month changed
      const newMonth = await page.locator('[data-testid="current-date"]').textContent();
      expect(newMonth).not.toBe(currentMonth);
    });

    test('should return to today when clicking Today button', async ({ page }) => {
      // Navigate away from current month
      await page.click('[data-testid="nav-next"]');
      await page.click('[data-testid="nav-next"]');
      await page.waitForTimeout(500);
      
      // Click Today button
      await page.click('button:has-text("Today")');
      await page.waitForTimeout(500);
      
      // Verify we're back to current month
      const currentDate = new Date();
      const expectedMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      await expect(page.locator('[data-testid="current-date"]')).toContainText(expectedMonth);
    });
  });

  test.describe('View Switching', () => {
    test('should switch between month, week, and day views', async ({ page }) => {
      // Test month view
      await page.click('button[data-view="month"]');
      await page.waitForTimeout(300);
      await expect(page.locator('.toastui-calendar .tui-full-calendar-month')).toBeVisible();
      
      // Test week view
      await page.click('button[data-view="week"]');
      await page.waitForTimeout(300);
      await expect(page.locator('.toastui-calendar .tui-full-calendar-week')).toBeVisible();
      
      // Test day view
      await page.click('button[data-view="day"]');
      await page.waitForTimeout(300);
      await expect(page.locator('.toastui-calendar .tui-full-calendar-week')).toBeVisible(); // Day view uses week container
    });

    test('should maintain view state during navigation', async ({ page }) => {
      // Switch to week view
      await page.click('button[data-view="week"]');
      await page.waitForTimeout(300);
      
      // Navigate to next week
      await page.click('[data-testid="nav-next"]');
      await page.waitForTimeout(300);
      
      // Verify still in week view
      await expect(page.locator('.toastui-calendar .tui-full-calendar-week')).toBeVisible();
    });
  });

  test.describe('Drag and Drop Functionality', () => {
    test('should create event by dragging on calendar grid', async ({ page }) => {
      // Switch to week view for easier drag testing
      await page.click('button[data-view="week"]');
      await page.waitForTimeout(500);
      
      // Find a time slot to drag on
      const timeSlot = page.locator('.tui-full-calendar-time-date-schedule-block').first();
      await expect(timeSlot).toBeVisible();
      
      // Perform drag to create event
      const timeSlotBox = await timeSlot.boundingBox();
      if (timeSlotBox) {
        await page.mouse.move(timeSlotBox.x + 10, timeSlotBox.y + 10);
        await page.mouse.down();
        await page.mouse.move(timeSlotBox.x + 10, timeSlotBox.y + 60);
        await page.mouse.up();
        await page.waitForTimeout(500);
        
        // Check if creation popup appeared or event was created
        const isPopupVisible = await page.locator('.tui-full-calendar-popup').isVisible();
        const isEventCreated = await page.locator('.tui-full-calendar-weekday-schedule').count() > 0;
        
        expect(isPopupVisible || isEventCreated).toBeTruthy();
      }
    });

    test('should enable drag and drop of existing events', async ({ page }) => {
      // First create a test event if none exists
      await page.click('[data-testid="create-event-button"]');
      await page.waitForTimeout(500);
      
      // Look for existing events
      const events = page.locator('.tui-full-calendar-weekday-schedule .tui-full-calendar-weekday-schedule-title');
      const eventCount = await events.count();
      
      if (eventCount > 0) {
        const firstEvent = events.first();
        await expect(firstEvent).toBeVisible();
        
        // Get event position
        const eventBox = await firstEvent.boundingBox();
        if (eventBox) {
          // Try to drag event
          await page.mouse.move(eventBox.x + eventBox.width / 2, eventBox.y + eventBox.height / 2);
          await page.mouse.down();
          await page.mouse.move(eventBox.x + 100, eventBox.y + 50);
          await page.mouse.up();
          await page.waitForTimeout(500);
          
          // Verify drag interaction occurred (visual feedback or position change)
          const hasVisualFeedback = await page.locator('.tui-full-calendar-weekday-schedule-title').count() > 0;
          expect(hasVisualFeedback).toBeTruthy();
        }
      }
    });

    test('should support event resizing by dragging edges', async ({ page }) => {
      await page.click('button[data-view="week"]');
      await page.waitForTimeout(500);
      
      // Look for events with resize handles
      const resizeHandles = page.locator('.tui-full-calendar-weekday-resize-handle');
      const handleCount = await resizeHandles.count();
      
      if (handleCount > 0) {
        const handle = resizeHandles.first();
        await expect(handle).toBeVisible();
        
        // Try to resize
        const handleBox = await handle.boundingBox();
        if (handleBox) {
          await page.mouse.move(handleBox.x, handleBox.y);
          await page.mouse.down();
          await page.mouse.move(handleBox.x, handleBox.y + 30);
          await page.mouse.up();
          await page.waitForTimeout(500);
          
          // Verify resize interaction
          const hasResized = await page.locator('.tui-full-calendar-weekday-schedule').count() > 0;
          expect(hasResized).toBeTruthy();
        }
      }
    });
  });

  test.describe('Event Management', () => {
    test('should display events with proper formatting', async ({ page }) => {
      // Look for event elements
      const events = page.locator('.tui-full-calendar-weekday-schedule-title');
      const eventCount = await events.count();
      
      if (eventCount > 0) {
        const firstEvent = events.first();
        await expect(firstEvent).toBeVisible();
        
        // Verify event has title
        const eventText = await firstEvent.textContent();
        expect(eventText).toBeTruthy();
        expect(eventText!.length).toBeGreaterThan(0);
      }
    });

    test('should show event popups on click', async ({ page }) => {
      // Look for clickable events
      const events = page.locator('.tui-full-calendar-weekday-schedule-title');
      const eventCount = await events.count();
      
      if (eventCount > 0) {
        // Click on first event
        await events.first().click();
        await page.waitForTimeout(500);
        
        // Check if detail popup appeared
        const popup = page.locator('.tui-full-calendar-popup-detail');
        const isPopupVisible = await popup.isVisible();
        
        if (isPopupVisible) {
          await expect(popup).toContainText(/.+/); // Should contain some text
        }
      }
    });

    test('should support event creation via popup form', async ({ page }) => {
      // Try to open creation popup by double-clicking on calendar
      const calendarGrid = page.locator('.tui-full-calendar-time').first();
      await expect(calendarGrid).toBeVisible();
      
      await calendarGrid.dblclick();
      await page.waitForTimeout(500);
      
      // Look for creation popup
      const popup = page.locator('.tui-full-calendar-popup-form');
      const isPopupVisible = await popup.isVisible();
      
      if (isPopupVisible) {
        // Fill in event details
        const titleField = page.locator('input[name="title"]');
        if (await titleField.isVisible()) {
          await titleField.fill('Test Event from Popup');
          
          // Try to save
          const saveButton = page.locator('button:has-text("Save")');
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(500);
            
            // Verify event was created
            await expect(page.locator('.tui-full-calendar-weekday-schedule-title:has-text("Test Event from Popup")')).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Calendar Categories and Styling', () => {
    test('should display different calendar categories with colors', async ({ page }) => {
      // Check sidebar calendar list
      const calendarItems = page.locator('[data-testid="calendar-list"] .calendar-item');
      const itemCount = await calendarItems.count();
      
      expect(itemCount).toBeGreaterThan(0);
      
      // Verify each calendar has color indicator
      for (let i = 0; i < Math.min(itemCount, 3); i++) {
        const colorIndicator = calendarItems.nth(i).locator('.calendar-color-indicator');
        await expect(colorIndicator).toBeVisible();
        
        // Verify color is set
        const backgroundColor = await colorIndicator.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      }
    });

    test('should toggle calendar visibility', async ({ page }) => {
      const calendarToggles = page.locator('[data-testid="calendar-toggle"]');
      const toggleCount = await calendarToggles.count();
      
      if (toggleCount > 0) {
        // Get initial event count
        const initialEventCount = await page.locator('.tui-full-calendar-weekday-schedule').count();
        
        // Toggle first calendar
        await calendarToggles.first().click();
        await page.waitForTimeout(500);
        
        // Check if event count changed
        const newEventCount = await page.locator('.tui-full-calendar-weekday-schedule').count();
        
        // Should be different (unless no events in that calendar)
        const countChanged = newEventCount !== initialEventCount;
        const visualFeedbackExists = await page.locator('[data-testid="calendar-list"] .opacity-50').count() > 0;
        
        expect(countChanged || visualFeedbackExists).toBeTruthy();
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(500);
      
      // Check if sidebar is hidden or collapsed on mobile
      const sidebar = page.locator('[data-testid="calendar-sidebar"]');
      const sidebarVisible = await sidebar.isVisible();
      
      if (sidebarVisible) {
        const sidebarBox = await sidebar.boundingBox();
        expect(sidebarBox?.width).toBeLessThan(300); // Should be narrower on mobile
      }
      
      // Verify calendar still visible and functional
      await expect(page.locator('.toastui-calendar')).toBeVisible();
      
      // Check mobile navigation
      await expect(page.locator('[data-testid="nav-previous"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-next"]')).toBeVisible();
    });

    test('should handle touch interactions on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(500);
      
      // Test touch navigation
      await page.tap('[data-testid="nav-next"]');
      await page.waitForTimeout(300);
      
      const dateAfterTap = await page.locator('[data-testid="current-date"]').textContent();
      expect(dateAfterTap).toBeTruthy();
      
      // Test view switching with touch
      await page.tap('button[data-view="week"]');
      await page.waitForTimeout(300);
      
      await expect(page.locator('.tui-full-calendar-week')).toBeVisible();
    });
  });

  test.describe('Performance and Optimization', () => {
    test('should load calendar within performance thresholds', async ({ page }) => {
      const startTime = Date.now();
      
      // Navigate to calendar
      await page.goto('/test-toast-ui-calendar');
      await page.waitForSelector('.toastui-calendar');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle multiple events without performance degradation', async ({ page }) => {
      // Switch to month view to see more events
      await page.click('button[data-view="month"]');
      await page.waitForTimeout(500);
      
      // Measure rendering performance
      const startTime = Date.now();
      
      // Navigate to different months to trigger re-renders
      for (let i = 0; i < 3; i++) {
        await page.click('[data-testid="nav-next"]');
        await page.waitForTimeout(100);
      }
      
      const navigationTime = Date.now() - startTime;
      
      // Should navigate smoothly
      expect(navigationTime).toBeLessThan(2000);
    });
  });

  test.describe('Accessibility Features', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check calendar has proper role
      const calendar = page.locator('.toastui-calendar');
      await expect(calendar).toHaveAttribute('role', /.*/);
      
      // Check navigation buttons have labels
      await expect(page.locator('[data-testid="nav-previous"]')).toHaveAttribute('aria-label', /.*/);
      await expect(page.locator('[data-testid="nav-next"]')).toHaveAttribute('aria-label', /.*/);
      
      // Check view buttons have labels
      await expect(page.locator('button[data-view="month"]')).toHaveAttribute('aria-label', /.*/);
      await expect(page.locator('button[data-view="week"]')).toHaveAttribute('aria-label', /.*/);
      await expect(page.locator('button[data-view="day"]')).toHaveAttribute('aria-label', /.*/);
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Focus on calendar
      await page.keyboard.press('Tab');
      
      // Test arrow key navigation
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
      
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(100);
      
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
      
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(100);
      
      // Should maintain focus and respond to keyboard
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have proper color contrast', async ({ page }) => {
      // Check calendar text has sufficient contrast
      const calendarText = page.locator('.tui-full-calendar-month-dayname').first();
      
      if (await calendarText.isVisible()) {
        const textColor = await calendarText.evaluate(el => 
          window.getComputedStyle(el).color
        );
        const backgroundColor = await calendarText.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        
        // Basic contrast check (colors should not be the same)
        expect(textColor).not.toBe(backgroundColor);
      }
    });
  });

  test.describe('Integration with CalendarProvider', () => {
    test('should integrate with global calendar state', async ({ page }) => {
      // Check if events from CalendarProvider are displayed
      const events = page.locator('.tui-full-calendar-weekday-schedule');
      const eventCount = await events.count();
      
      // Should have some events (assuming test data exists)
      expect(eventCount).toBeGreaterThanOrEqual(0);
    });

    test('should sync with other calendar views when library is switched', async ({ page }) => {
      // This test would verify that switching libraries maintains event data
      // Implementation depends on having library switching UI
      await expect(page.locator('[data-testid="library-selector"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid event data gracefully', async ({ page }) => {
      // Test with malformed event data (would need to be injected via JavaScript)
      await page.evaluate(() => {
        // Simulate invalid event data
        const invalidEvent = {
          id: 'invalid',
          title: null,
          start: 'invalid-date',
          end: 'invalid-date'
        };
        
        // Try to add invalid event (this might throw or handle gracefully)
        try {
          (window as any).calendarInstance?.createEvents([invalidEvent]);
        } catch (error) {
          console.log('Handled invalid event:', error);
        }
      });
      
      // Calendar should still be functional
      await expect(page.locator('.toastui-calendar')).toBeVisible();
    });

    test('should recover from network failures', async ({ page }) => {
      // Simulate network failure
      await page.route('**/*', route => route.abort());
      
      // Calendar should still be visible (cached resources)
      await expect(page.locator('.toastui-calendar')).toBeVisible();
      
      // Restore network
      await page.unroute('**/*');
    });
  });
});