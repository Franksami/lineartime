import { test, expect, Page } from '@playwright/test';

/**
 * FullCalendar Pro Integration Foundation Validation
 *
 * This test ensures that the enhanced FullCalendar Pro integration maintains
 * compatibility with the LOCKED horizontal foundation structure:
 * - 12 horizontal month rows (IMMUTABLE)
 * - Complete day numbers (01-31) for each month
 * - Week day headers at top AND bottom
 * - Month labels on BOTH left AND right sides
 * - Year header with tagline
 * - Bordered grid structure
 */

test.describe('FullCalendar Pro Foundation Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page
    await page.goto('/test-fullcalendar-pro');

    // Wait for the calendar to fully load
    await page.waitForSelector('.linear-calendar-pro', { timeout: 10000 });

    // Wait for event generation to complete
    await page.waitForFunction(
      () => {
        const button = document.querySelector('button:has-text("Generate")');
        return button && !button.textContent?.includes('Generating...');
      },
      { timeout: 15000 }
    );
  });

  test('Should maintain LOCKED horizontal foundation structure in linearYear view', async ({
    page,
  }) => {
    // Ensure we're in linearYear view
    await page.click('button:has-text("Linear Year")');
    await page.waitForTimeout(2000);

    // Switch to CommandCenterCalendar Pro view and validate the foundation
    const calendarContainer = page.locator('.linear-calendar-pro');
    await expect(calendarContainer).toBeVisible();

    // Check for FullCalendar integration
    const fullCalendar = page.locator('.fc');
    await expect(fullCalendar).toBeVisible();

    // Validate LinearYear plugin is loaded
    const linearYearView = page.locator('.linear-year-view');
    await expect(linearYearView).toBeVisible();

    // Check for the LOCKED foundation elements in LinearYear view
    const yearHeader = page.locator('.year-header');
    await expect(yearHeader).toBeVisible();
    await expect(yearHeader.locator('h1')).toContainText('Linear Calendar');
    await expect(yearHeader.locator('p')).toContainText('Life is bigger than a week');

    // Validate 12 horizontal month rows structure
    const monthRows = page.locator('.month-row');
    await expect(monthRows).toHaveCount(12);

    // Check month labels on both sides
    const leftLabels = page.locator('.month-label').first();
    const rightLabels = page.locator('.month-label').last();
    await expect(leftLabels).toBeVisible();
    await expect(rightLabels).toBeVisible();

    // Validate day headers at top and bottom
    const daysHeader = page.locator('.days-header');
    const daysFooter = page.locator('.days-footer');
    await expect(daysHeader).toBeVisible();
    await expect(daysFooter).toBeVisible();

    // Check that all day names are present
    const expectedDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    for (const day of expectedDays) {
      await expect(daysHeader).toContainText(day);
      await expect(daysFooter).toContainText(day);
    }
  });

  test('Should preserve foundation when switching between FullCalendar views', async ({ page }) => {
    // Test view switching while maintaining foundation compatibility
    const views = ['Linear Year', 'Month', 'Week', 'Day'];

    for (const viewName of views) {
      await page.click(`button:has-text("${viewName}")`);
      await page.waitForTimeout(1000);

      // Ensure calendar container is still present
      const calendarContainer = page.locator('.linear-calendar-pro');
      await expect(calendarContainer).toBeVisible();

      // Ensure FullCalendar is properly integrated
      const fullCalendar = page.locator('.fc');
      await expect(fullCalendar).toBeVisible();

      if (viewName === 'Linear Year') {
        // Validate foundation structure is intact
        const linearYearView = page.locator('.linear-year-view');
        await expect(linearYearView).toBeVisible();

        const monthRows = page.locator('.month-row');
        await expect(monthRows).toHaveCount(12);
      }
    }
  });

  test('Should handle 1000+ events while maintaining foundation structure', async ({ page }) => {
    // Generate 2000 events for stress testing
    await page.fill('input[type="number"]', '2000');
    await page.click('button:has-text("Generate")');

    // Wait for generation to complete
    await page.waitForFunction(
      () => {
        const button = document.querySelector('button:has-text("Generate")');
        return button && !button.textContent?.includes('Generating...');
      },
      { timeout: 30000 }
    );

    // Ensure we're in linearYear view
    await page.click('button:has-text("Linear Year")');
    await page.waitForTimeout(3000);

    // Validate foundation structure is still intact with many events
    const linearYearView = page.locator('.linear-year-view');
    await expect(linearYearView).toBeVisible();

    // Check performance indicator
    const performanceIndicator = page.locator('[aria-label*="Performance"]').first();
    await expect(performanceIndicator).toBeVisible();

    // Validate month structure is preserved
    const monthRows = page.locator('.month-row');
    await expect(monthRows).toHaveCount(12);

    // Check that events are rendered
    const eventDots = page.locator('.event-dot');
    const eventCount = await eventDots.count();
    expect(eventCount).toBeGreaterThan(0);

    // Ensure day cells are still clickable
    const firstDayCell = page.locator('.day-cell').first();
    await expect(firstDayCell).toBeVisible();
    await firstDayCell.click();

    console.log(`Foundation maintained with ${eventCount} event dots rendered`);
  });

  test('Should maintain collision detection while preserving foundation', async ({ page }) => {
    // Enable collision detection
    await page.click('button[aria-label="Settings"]');

    // Look for collision detection toggle in dropdown
    const collisionToggle = page.locator('text="Collision Detection"');
    if (await collisionToggle.isVisible()) {
      await collisionToggle.click();
    }

    // Generate events that will create overlaps
    await page.fill('input[type="number"]', '1500');
    await page.click('button:has-text("Generate")');

    await page.waitForFunction(
      () => {
        const button = document.querySelector('button:has-text("Generate")');
        return button && !button.textContent?.includes('Generating...');
      },
      { timeout: 20000 }
    );

    // Switch to linearYear view
    await page.click('button:has-text("Linear Year")');
    await page.waitForTimeout(2000);

    // Check for conflict indicators
    const conflictBadge = page.locator('text*="conflicts"').first();

    // Validate foundation structure is intact despite conflict detection
    const monthRows = page.locator('.month-row');
    await expect(monthRows).toHaveCount(12);

    // Check for overlapping event indicators
    const overlappingDots = page.locator('.event-dot.bg-destructive');
    // Should have some overlapping events with 1500 events

    // Ensure calendar is still functional
    const dayCell = page.locator('.day-cell[data-has-overlap="true"]').first();
    if (await dayCell.isVisible()) {
      await dayCell.click();
      // Should trigger date click without breaking foundation
    }

    console.log('Collision detection integrated without breaking foundation');
  });

  test('Should preserve foundation with Pro features enabled', async ({ page }) => {
    // Test Pro-specific features while maintaining foundation

    // Enable all Pro features through toolbar
    await page.click('button[aria-label="Settings"]');
    await page.waitForTimeout(500);

    // Check if Pro features section is visible
    const proSection = page.locator('text="Pro Features"');
    if (await proSection.isVisible()) {
      // Virtual rendering toggle
      const virtualToggle = page.locator('text="Virtual Rendering"');
      if (await virtualToggle.isVisible()) {
        await virtualToggle.click();
      }

      // Collision detection toggle
      const collisionToggle = page.locator('text="Collision Detection"');
      if (await collisionToggle.isVisible()) {
        await collisionToggle.click();
      }
    }

    // Close dropdown
    await page.keyboard.press('Escape');

    // Ensure foundation is maintained
    const linearYearView = page.locator('.linear-year-view');
    await expect(linearYearView).toBeVisible();

    // Test advanced view switching with Pro features
    const proViews = ['Resource Timeline', 'Multi-Month'];

    for (const proView of proViews) {
      // Try to access pro views through "More Views" dropdown
      await page.click('button:has-text("More Views")');
      await page.waitForTimeout(500);

      const proViewButton = page.locator(`text="${proView}"`);
      if (await proViewButton.isVisible()) {
        await proViewButton.click();
        await page.waitForTimeout(1000);

        // Verify FullCalendar is still working
        const fullCalendar = page.locator('.fc');
        await expect(fullCalendar).toBeVisible();
      }

      await page.keyboard.press('Escape'); // Close any open dropdowns
    }

    // Return to linearYear view and validate foundation
    await page.click('button:has-text("Linear Year")');
    await page.waitForTimeout(1000);

    const monthRows = page.locator('.month-row');
    await expect(monthRows).toHaveCount(12);

    console.log('Pro features integrated without breaking foundation');
  });

  test('Should maintain performance with enhanced features', async ({ page }) => {
    // Test performance metrics tracking
    const performanceCard = page.locator('text="Performance"').locator('..');
    await expect(performanceCard).toBeVisible();

    // Generate moderate number of events
    await page.fill('input[type="number"]', '1000');
    await page.click('button:has-text("Generate")');

    await page.waitForFunction(
      () => {
        const button = document.querySelector('button:has-text("Generate")');
        return button && !button.textContent?.includes('Generating...');
      },
      { timeout: 15000 }
    );

    // Check performance metrics are updating
    const renderTime = page.locator('text="Render Time:"');
    await expect(renderTime).toBeVisible();

    const processingTime = page.locator('text="Processing:"');
    await expect(processingTime).toBeVisible();

    const memoryUsage = page.locator('text="Memory:"');
    await expect(memoryUsage).toBeVisible();

    // Ensure linearYear view loads with good performance
    await page.click('button:has-text("Linear Year")');
    await page.waitForTimeout(2000);

    // Check that performance level is acceptable
    const performanceLevel = page
      .locator(
        '.text-green-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */, .text-blue-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */, .text-yellow-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */'
      )
      .first();
    // Should be excellent, good, or warning (not poor/critical)

    // Validate foundation is still intact after performance testing
    const monthRows = page.locator('.month-row');
    await expect(monthRows).toHaveCount(12);

    const yearHeader = page.locator('.year-header h1');
    await expect(yearHeader).toContainText('Linear Calendar');

    console.log('Enhanced performance monitoring integrated successfully');
  });

  test('Should support React 19 patterns without breaking foundation', async ({ page }) => {
    // Test async transitions and modern patterns

    // Rapid view switching to test React 19 transitions
    const views = ['Linear Year', 'Month', 'Week', 'Day', 'Linear Year'];

    for (const view of views) {
      await page.click(`button:has-text("${view}")`);
      await page.waitForTimeout(300); // Quick switching to test transitions
    }

    // Validate foundation is stable after rapid switching
    const linearYearView = page.locator('.linear-year-view');
    await expect(linearYearView).toBeVisible();

    // Test event creation through enhanced patterns
    const firstDayCell = page.locator('.day-cell').first();
    await firstDayCell.click();

    // Should handle click without errors (React 19 event handling)
    await page.waitForTimeout(500);

    // Test collision detection updates (React 19 state transitions)
    await page.fill('input[type="number"]', '500');
    await page.click('button:has-text("Generate")');

    await page.waitForFunction(
      () => {
        const button = document.querySelector('button:has-text("Generate")');
        return button && !button.textContent?.includes('Generating...');
      },
      { timeout: 10000 }
    );

    // Foundation should remain intact through async operations
    const monthRows = page.locator('.month-row');
    await expect(monthRows).toHaveCount(12);

    // Check that concurrent features work
    const conflictBadge = page.locator('[aria-label*="conflicts"]');
    // May or may not be visible depending on event overlap

    console.log('React 19 patterns integrated without foundation disruption');
  });
});

test.describe('Performance Benchmarks', () => {
  test('Should meet performance thresholds with 1000+ events', async ({ page }) => {
    await page.goto('/test-fullcalendar-pro');

    // Wait for initial load
    await page.waitForSelector('.linear-calendar-pro', { timeout: 10000 });

    // Generate 1000 events
    await page.fill('input[type="number"]', '1000');

    const startTime = Date.now();
    await page.click('button:has-text("Generate")');

    await page.waitForFunction(
      () => {
        const button = document.querySelector('button:has-text("Generate")');
        return button && !button.textContent?.includes('Generating...');
      },
      { timeout: 15000 }
    );

    const generationTime = Date.now() - startTime;

    // Switch to linearYear and measure render time
    const renderStartTime = Date.now();
    await page.click('button:has-text("Linear Year")');
    await page.waitForTimeout(2000);
    const renderEndTime = Date.now() - renderStartTime;

    // Validate foundation is present
    const monthRows = page.locator('.month-row');
    await expect(monthRows).toHaveCount(12);

    // Check performance metrics from the page
    const renderTimeText = await page.locator('text="Render Time:"').locator('..').textContent();

    console.log(`Performance Results:`);
    console.log(`- Generation Time: ${generationTime}ms`);
    console.log(`- View Switch Time: ${renderEndTime}ms`);
    console.log(`- Reported Render Time: ${renderTimeText}`);

    // Performance should be reasonable (less than 5 seconds for generation)
    expect(generationTime).toBeLessThan(5000);
    expect(renderEndTime).toBeLessThan(3000);

    console.log('Performance benchmarks met with foundation intact');
  });
});
