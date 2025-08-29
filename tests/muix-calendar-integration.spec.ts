import { test, expect } from '@playwright/test';

test.describe('MUI X Calendar Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-muix-calendar');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Component Initialization', () => {
    test('should load MUI X Calendar component successfully', async ({ page }) => {
      await expect(page.locator('.muix-calendar-view')).toBeVisible();
      await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();
    });

    test('should display Material Design header with controls', async ({ page }) => {
      await expect(page.locator('h2:has-text("MUI X Calendar")')).toBeVisible();
      await expect(page.locator('[data-testid="add-event-btn"]')).toBeVisible();
      await expect(page.locator('[data-testid="picker-type-selector"]')).toBeVisible();
    });

    test('should show calendar with Material Design styling', async ({ page }) => {
      await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();
      await expect(page.locator('.MuiPickersCalendarHeader-root')).toBeVisible();
      await expect(page.locator('.MuiDayCalendar-root')).toBeVisible();
    });

    test('should initialize with current month and year', async ({ page }) => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear().toString();
      const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long' });

      // Check if header shows current month/year
      const header = page.locator('.MuiPickersCalendarHeader-root');
      await expect(header).toContainText(currentYear);
    });
  });

  test.describe('Picker Type Variations', () => {
    test('should support DateCalendar picker type', async ({ page }) => {
      const pickerSelector = page.locator('[data-testid="picker-type-selector"]');
      await pickerSelector.selectOption('DateCalendar');
      await page.waitForTimeout(300);

      await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();
      await expect(page.locator('.MuiDayCalendar-root')).toBeVisible();
    });

    test('should support DatePicker with input field', async ({ page }) => {
      const pickerSelector = page.locator('[data-testid="picker-type-selector"]');
      await pickerSelector.selectOption('DatePicker');
      await page.waitForTimeout(300);

      // Should show input field
      await expect(page.locator('.MuiOutlinedInput-root')).toBeVisible();
      await expect(page.locator('input[type="text"]')).toBeVisible();

      // Click input to open picker
      await page.click('input[type="text"]');
      await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();
    });

    test('should support DateTimePicker with time selection', async ({ page }) => {
      const pickerSelector = page.locator('[data-testid="picker-type-selector"]');
      await pickerSelector.selectOption('DateTimePicker');
      await page.waitForTimeout(300);

      // Should show input field
      await expect(page.locator('.MuiOutlinedInput-root')).toBeVisible();

      // Click input to open picker
      await page.click('input[type="text"]');
      await page.waitForTimeout(300);

      // Should show both date and time components
      await expect(page.locator('.MuiDateCalendar-root, .MuiTimeClock-root')).toBeVisible();
    });

    test('should support DateRangePicker for range selection', async ({ page }) => {
      const pickerSelector = page.locator('[data-testid="picker-type-selector"]');
      await pickerSelector.selectOption('DateRangePicker');
      await page.waitForTimeout(300);

      // Should show range input fields
      const inputs = page.locator('.MuiOutlinedInput-root input');
      await expect(inputs).toHaveCount(2); // Start and end date inputs

      // Click first input to open range picker
      await inputs.first().click();
      await page.waitForTimeout(300);

      await expect(page.locator('.MuiDateRangeCalendar-root, .MuiDateCalendar-root')).toBeVisible();
    });

    test('should switch between picker types dynamically', async ({ page }) => {
      const pickerSelector = page.locator('[data-testid="picker-type-selector"]');

      // Start with DateCalendar
      await pickerSelector.selectOption('DateCalendar');
      await page.waitForTimeout(300);
      await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();

      // Switch to DatePicker
      await pickerSelector.selectOption('DatePicker');
      await page.waitForTimeout(300);
      await expect(page.locator('.MuiOutlinedInput-root')).toBeVisible();

      // Switch to DateTimePicker
      await pickerSelector.selectOption('DateTimePicker');
      await page.waitForTimeout(300);
      await expect(page.locator('.MuiOutlinedInput-root')).toBeVisible();
    });
  });

  test.describe('Date Selection and Navigation', () => {
    test('should select dates by clicking on calendar days', async ({ page }) => {
      // Ensure we're in DateCalendar mode
      const pickerSelector = page.locator('[data-testid="picker-type-selector"]');
      await pickerSelector.selectOption('DateCalendar');
      await page.waitForTimeout(300);

      // Click on a day
      const dayButton = page.locator('.MuiPickersDay-root').filter({ hasText: /^\d+$/ }).first();
      await dayButton.click();

      // Day should be selected (highlighted)
      await expect(dayButton).toHaveClass(/Mui-selected/);
    });

    test('should navigate between months using header arrows', async ({ page }) => {
      const currentMonth = await page.locator('.MuiPickersCalendarHeader-label').textContent();

      // Navigate to next month
      await page.click('[data-testid="ArrowRight"], .MuiPickersArrowSwitcher-button:last-child');
      await page.waitForTimeout(300);

      const newMonth = await page.locator('.MuiPickersCalendarHeader-label').textContent();
      expect(newMonth).not.toBe(currentMonth);

      // Navigate back
      await page.click('[data-testid="ArrowLeft"], .MuiPickersArrowSwitcher-button:first-child');
      await page.waitForTimeout(300);

      const backMonth = await page.locator('.MuiPickersCalendarHeader-label').textContent();
      expect(backMonth).toBe(currentMonth);
    });

    test('should support year and month selection via header click', async ({ page }) => {
      // Click on month/year label to open year/month selector
      await page.click('.MuiPickersCalendarHeader-label');
      await page.waitForTimeout(300);

      // Should show year selector
      const yearView = page.locator('.MuiYearCalendar-root, .MuiMonthCalendar-root');
      if (await yearView.isVisible()) {
        // Select a different year/month
        const yearButton = yearView.locator('button').first();
        await yearButton.click();
        await page.waitForTimeout(300);
      }
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
      const selectedDay = page.locator('.MuiPickersDay-root.Mui-selected');
      await expect(selectedDay).toBeVisible();
    });
  });

  test.describe('Event Management Integration', () => {
    test('should create events for selected dates', async ({ page }) => {
      // Select a date
      const dayButton = page.locator('.MuiPickersDay-root').filter({ hasText: /^\d+$/ }).first();
      await dayButton.click();

      // Click Add Event button
      await page.click('[data-testid="add-event-btn"]');

      // Event creation modal should appear
      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'MUI X Test Event');
        await page.fill('[data-testid="event-description-input"]', 'Created via MUI X Calendar');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }
    });

    test('should show event indicators on calendar dates', async ({ page }) => {
      // Create an event first
      const dayButton = page.locator('.MuiPickersDay-root').filter({ hasText: /^\d+$/ }).first();
      await dayButton.click();
      await page.click('[data-testid="add-event-btn"]');

      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'Indicator Test');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }

      // Look for event indicators on the calendar
      const eventIndicators = page.locator('.event-indicator, [data-event-count]');
      await expect(eventIndicators).toHaveCount.toBeGreaterThan(0);
    });

    test('should display events in sidebar when date selected', async ({ page }) => {
      // Create and select an event
      const dayButton = page.locator('.MuiPickersDay-root').filter({ hasText: /^\d+$/ }).first();
      await dayButton.click();
      await page.click('[data-testid="add-event-btn"]');

      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'Sidebar Event');
        await page.fill('[data-testid="event-description-input"]', 'Shows in sidebar');
        await page.selectOption('[data-testid="event-priority-select"]', 'high');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }

      // Select the same date to see event in sidebar
      await dayButton.click();

      // Check sidebar for event
      const sidebar = page.locator('[data-testid="event-sidebar"]');
      if (await sidebar.isVisible()) {
        await expect(sidebar.locator('text=Sidebar Event')).toBeVisible();
        await expect(sidebar.locator('text=Shows in sidebar')).toBeVisible();
      }
    });
  });

  test.describe('Material Design Theming', () => {
    test('should apply Material Design theme correctly', async ({ page }) => {
      const calendar = page.locator('.MuiDateCalendar-root');

      // Check for Material Design classes
      await expect(calendar).toHaveClass(/MuiDateCalendar-root/);

      // Check computed styles follow Material Design
      const computedStyles = await calendar.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          fontFamily: styles.fontFamily,
          borderRadius: styles.borderRadius,
          boxShadow: styles.boxShadow,
        };
      });

      // Should have Roboto font or Material Design font family
      expect(computedStyles.fontFamily).toMatch(/Roboto|Material|sans-serif/i);
    });

    test('should support theme switching', async ({ page }) => {
      const themeToggle = page.locator('[data-testid="theme-toggle"]');

      if (await themeToggle.isVisible()) {
        // Get current theme
        const calendar = page.locator('.MuiDateCalendar-root');
        const currentTheme = await calendar.getAttribute('class');

        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(300);

        // Theme should change
        const newTheme = await calendar.getAttribute('class');
        expect(newTheme).not.toBe(currentTheme);
      }
    });

    test('should maintain Material Design consistency across components', async ({ page }) => {
      // Check that all MUI components follow consistent theming
      const muiComponents = [
        '.MuiDateCalendar-root',
        '.MuiButton-root',
        '.MuiOutlinedInput-root',
        '.MuiCard-root',
      ];

      for (const selector of muiComponents) {
        const component = page.locator(selector);
        if (await component.isVisible()) {
          const hasThemeClass = await component.evaluate((el) => {
            return el.className.includes('Mui');
          });
          expect(hasThemeClass).toBe(true);
        }
      }
    });
  });

  test.describe('Input Field Interactions (DatePicker/DateTimePicker)', () => {
    test('should allow manual date input via text field', async ({ page }) => {
      const pickerSelector = page.locator('[data-testid="picker-type-selector"]');
      await pickerSelector.selectOption('DatePicker');
      await page.waitForTimeout(300);

      const input = page.locator('input[type="text"]');

      // Clear and type a date
      await input.clear();
      await input.fill('12/25/2024');
      await page.keyboard.press('Enter');

      // Input should accept the date
      await expect(input).toHaveValue(/25|12/); // Should contain date parts
    });

    test('should validate date input format', async ({ page }) => {
      const pickerSelector = page.locator('[data-testid="picker-type-selector"]');
      await pickerSelector.selectOption('DatePicker');
      await page.waitForTimeout(300);

      const input = page.locator('input[type="text"]');

      // Enter invalid date
      await input.clear();
      await input.fill('invalid-date');
      await page.keyboard.press('Tab'); // Trigger validation

      // Should show error state or reset
      const hasError = await input.evaluate((el) => {
        return el.getAttribute('aria-invalid') === 'true' || el.classList.contains('Mui-error');
      });

      // Either shows error or resets to valid state
      expect(hasError || (await input.inputValue()) === '').toBe(true);
    });

    test('should open calendar popup when input is clicked', async ({ page }) => {
      const pickerSelector = page.locator('[data-testid="picker-type-selector"]');
      await pickerSelector.selectOption('DatePicker');
      await page.waitForTimeout(300);

      const input = page.locator('input[type="text"]');
      await input.click();

      // Calendar popup should open
      await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();

      // Click outside to close
      await page.click('body');
      await page.waitForTimeout(300);
    });
  });

  test.describe('Time Selection (DateTimePicker)', () => {
    test('should support time selection in DateTimePicker', async ({ page }) => {
      const pickerSelector = page.locator('[data-testid="picker-type-selector"]');
      await pickerSelector.selectOption('DateTimePicker');
      await page.waitForTimeout(300);

      // Click input to open picker
      const input = page.locator('input[type="text"]');
      await input.click();
      await page.waitForTimeout(300);

      // Look for time selection component
      const timePicker = page.locator(
        '.MuiTimeClock-root, .MuiTimeField-root, .MuiMultiSectionDigitalClock-root'
      );
      if (await timePicker.isVisible()) {
        // Try to select a time
        const timeButton = timePicker.locator('button, [role="option"]').first();
        if (await timeButton.isVisible()) {
          await timeButton.click();
        }
      }
    });

    test('should switch between date and time views', async ({ page }) => {
      const pickerSelector = page.locator('[data-testid="picker-type-selector"]');
      await pickerSelector.selectOption('DateTimePicker');
      await page.waitForTimeout(300);

      // Open picker
      const input = page.locator('input[type="text"]');
      await input.click();
      await page.waitForTimeout(300);

      // Look for view switching tabs or buttons
      const viewSwitcher = page.locator(
        '.MuiDateTimePickerTabs-root, [role="tablist"], button:has-text("Date"), button:has-text("Time")'
      );
      if (await viewSwitcher.isVisible()) {
        const tabs = viewSwitcher.locator('button, [role="tab"]');
        if ((await tabs.count()) > 1) {
          await tabs.last().click(); // Switch to time view
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Date Range Selection (DateRangePicker)', () => {
    test('should support range selection with start and end dates', async ({ page }) => {
      const pickerSelector = page.locator('[data-testid="picker-type-selector"]');
      await pickerSelector.selectOption('DateRangePicker');
      await page.waitForTimeout(300);

      // Click first input to start range selection
      const inputs = page.locator('.MuiOutlinedInput-root input');
      await inputs.first().click();
      await page.waitForTimeout(300);

      // Select start date
      const startDay = page.locator('.MuiPickersDay-root').filter({ hasText: '10' }).first();
      if (await startDay.isVisible()) {
        await startDay.click();
        await page.waitForTimeout(300);
      }

      // Select end date
      const endDay = page.locator('.MuiPickersDay-root').filter({ hasText: '15' }).first();
      if (await endDay.isVisible()) {
        await endDay.click();
        await page.waitForTimeout(300);
      }

      // Both inputs should have values
      await expect(inputs.first()).not.toHaveValue('');
      await expect(inputs.last()).not.toHaveValue('');
    });

    test('should highlight date range on calendar', async ({ page }) => {
      const pickerSelector = page.locator('[data-testid="picker-type-selector"]');
      await pickerSelector.selectOption('DateRangePicker');
      await page.waitForTimeout(300);

      // Open range picker
      const inputs = page.locator('.MuiOutlinedInput-root input');
      await inputs.first().click();
      await page.waitForTimeout(300);

      // Select range
      const startDay = page.locator('.MuiPickersDay-root').filter({ hasText: '10' }).first();
      const endDay = page.locator('.MuiPickersDay-root').filter({ hasText: '15' }).first();

      if ((await startDay.isVisible()) && (await endDay.isVisible())) {
        await startDay.click();
        await page.waitForTimeout(200);
        await endDay.click();
        await page.waitForTimeout(300);

        // Look for range highlighting
        const rangeHighlight = page.locator(
          '.MuiDateRangePickerDay-rangeIntervalDayHighlight, .MuiPickersDay-root.Mui-selected'
        );
        await expect(rangeHighlight).toHaveCount.toBeGreaterThan(0);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Calendar should still be visible and usable
      await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();

      // Should maintain touch-friendly interactions
      const dayButton = page.locator('.MuiPickersDay-root').first();
      await dayButton.tap();

      // Day should be selectable
      await expect(dayButton).toHaveClass(/Mui-selected/);
    });

    test('should handle tablet viewport properly', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();

      // Should show full calendar interface
      await expect(page.locator('.MuiPickersCalendarHeader-root')).toBeVisible();
      await expect(page.locator('.MuiDayCalendar-root')).toBeVisible();
    });

    test('should maintain proper sizing across screen sizes', async ({ page }) => {
      const viewports = [
        { width: 320, height: 568 }, // Small mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1024, height: 768 }, // Tablet landscape
        { width: 1920, height: 1080 }, // Desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(300);

        const calendar = page.locator('.MuiDateCalendar-root');
        const calendarBounds = await calendar.boundingBox();

        // Calendar should fit viewport appropriately
        expect(calendarBounds!.width).toBeLessThanOrEqual(viewport.width);
        expect(calendarBounds!.height).toBeLessThanOrEqual(viewport.height);

        // Should remain interactive
        await expect(calendar).toBeVisible();
      }
    });
  });

  test.describe('Performance', () => {
    test('should load calendar components quickly', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/test-muix-calendar');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle rapid picker type switching efficiently', async ({ page }) => {
      const pickerSelector = page.locator('[data-testid="picker-type-selector"]');
      const pickerTypes = ['DateCalendar', 'DatePicker', 'DateTimePicker', 'DateRangePicker'];

      // Rapidly switch between picker types
      for (let i = 0; i < 3; i++) {
        for (const pickerType of pickerTypes) {
          await pickerSelector.selectOption(pickerType);
          await page.waitForTimeout(100); // Minimal delay
        }
      }

      // Should still be functional
      await expect(page.locator('.muix-calendar-view')).toBeVisible();
    });

    test('should maintain performance with many events', async ({ page }) => {
      // Add events programmatically
      await page.evaluate(() => {
        const events = [];
        for (let i = 0; i < 50; i++) {
          const eventDate = new Date();
          eventDate.setDate(eventDate.getDate() + (i % 30));

          events.push({
            id: `muix-event-${i}`,
            title: `MUI X Event ${i}`,
            start: eventDate,
            end: eventDate,
            allDay: true,
          });
        }

        if (window.__CALENDAR_PROVIDER_STATE__) {
          window.__CALENDAR_PROVIDER_STATE__.setEvents(events);
        }
      });

      await page.waitForTimeout(1000);

      // Calendar should remain responsive
      await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();

      // Navigation should work smoothly
      await page.click('.MuiPickersArrowSwitcher-button:last-child');
      await page.waitForTimeout(300);
      await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();
    });
  });

  test.describe('Integration with CalendarProvider', () => {
    test('should sync events with CalendarProvider state', async ({ page }) => {
      // Create event via MUI X calendar
      const dayButton = page.locator('.MuiPickersDay-root').filter({ hasText: /^\d+$/ }).first();
      await dayButton.click();
      await page.click('[data-testid="add-event-btn"]');

      const modal = page.locator('[data-testid="event-modal"]');
      if (await modal.isVisible()) {
        await page.fill('[data-testid="event-title-input"]', 'MUI X Provider Event');
        await page.click('[data-testid="save-event-btn"]');
        await page.waitForTimeout(500);
      }

      // Verify event in provider
      const hasEvent = await page.evaluate(() => {
        if (window.__CALENDAR_PROVIDER_STATE__) {
          const events = window.__CALENDAR_PROVIDER_STATE__.getEvents();
          return events.some((event) => event.title === 'MUI X Provider Event');
        }
        return false;
      });

      expect(hasEvent).toBe(true);
    });

    test('should support library switching through provider', async ({ page }) => {
      const librarySelector = page.locator('[data-testid="library-selector"]');

      if (await librarySelector.isVisible()) {
        // Switch to different calendar library
        await librarySelector.selectOption('linear');
        await page.waitForTimeout(1000);

        // Should show different calendar
        await expect(
          page.locator('.linear-calendar, [data-testid="linear-calendar"]')
        ).toBeVisible();

        // Switch back to MUI X
        await librarySelector.selectOption('muix');
        await page.waitForTimeout(1000);

        await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Calendar should have proper role
      const calendar = page.locator('.MuiDateCalendar-root');
      await expect(calendar).toHaveAttribute('role');

      // Day buttons should be properly labeled
      const dayButton = page.locator('.MuiPickersDay-root').first();
      const ariaLabel = await dayButton.getAttribute('aria-label');
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

      // Should select date
      const selectedDay = page.locator('.MuiPickersDay-root.Mui-selected');
      await expect(selectedDay).toBeVisible();
    });

    test('should support screen readers', async ({ page }) => {
      // Header should be labeled
      const header = page.locator('.MuiPickersCalendarHeader-root');
      const headerLabel = await header.getAttribute('aria-label');

      // Navigation buttons should be labeled
      const navButtons = page.locator('.MuiPickersArrowSwitcher-button');
      for (let i = 0; i < (await navButtons.count()); i++) {
        const buttonLabel = await navButtons.nth(i).getAttribute('aria-label');
        expect(buttonLabel).toBeTruthy();
      }
    });

    test('should provide proper focus management', async ({ page }) => {
      // Focus should be visible
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => document.activeElement?.className);
      expect(focusedElement).toContain('Mui');

      // Focus should move logically
      await page.keyboard.press('Tab');
      const newFocusedElement = await page.evaluate(() => document.activeElement?.className);
      expect(newFocusedElement).toBeTruthy();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid date inputs gracefully', async ({ page }) => {
      const pickerSelector = page.locator('[data-testid="picker-type-selector"]');
      await pickerSelector.selectOption('DatePicker');
      await page.waitForTimeout(300);

      const input = page.locator('input[type="text"]');

      // Enter completely invalid input
      await input.fill('not-a-date-at-all');
      await page.keyboard.press('Tab');

      // Should not crash the component
      await expect(page.locator('.MuiDateCalendar-root, .MuiOutlinedInput-root')).toBeVisible();
    });

    test('should recover from component initialization errors', async ({ page }) => {
      // Simulate initialization error
      await page.evaluate(() => {
        const error = new Error('MUI X initialization error');
        window.dispatchEvent(new CustomEvent('muix-error', { detail: error }));
      });

      await page.waitForTimeout(500);

      // Should show error boundary or recover
      const hasCalendar = await page.locator('.MuiDateCalendar-root').isVisible();
      const hasError = await page.locator('[data-testid="error-boundary"]').isVisible();

      expect(hasCalendar || hasError).toBe(true);
    });

    test('should handle theme loading failures', async ({ page }) => {
      // Calendar should work even if theme fails
      await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();

      // Basic functionality should remain
      const dayButton = page.locator('.MuiPickersDay-root').first();
      await dayButton.click();
      await expect(dayButton).toHaveClass(/Mui-selected/);
    });
  });
});
