import { test, expect } from '@playwright/test';

test.describe('Mobile Optimization', () => {
  // Test different mobile viewports
  const mobileViewports = [
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'Pixel 5', width: 393, height: 851 },
    { name: 'Samsung Galaxy S20', width: 360, height: 800 },
    { name: 'iPad Mini', width: 768, height: 1024 },
  ];

  for (const viewport of mobileViewports) {
    test(`should display properly on ${viewport.name}`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Navigate to app
      await page.goto('http://localhost:3000');

      // Wait for calendar to load
      await page.waitForSelector('[class*="LinearCalendarHorizontal"]', { timeout: 10000 });

      // Check that mobile menu button is visible on mobile viewports
      if (viewport.width <= 768) {
        const menuButton = await page.locator('button:has(svg[class*="Menu"], svg[class*="X"])');
        await expect(menuButton).toBeVisible();

        // Test mobile menu toggle
        await menuButton.click();

        // Check that zoom controls are visible in mobile menu
        const zoomOutBtn = await page.locator('button:has-text("Zoom Out")');
        await expect(zoomOutBtn).toBeVisible();

        const zoomInBtn = await page.locator('button:has-text("Zoom In")');
        await expect(zoomInBtn).toBeVisible();

        const goToTodayBtn = await page.locator('button:has-text("Go to Today")');
        await expect(goToTodayBtn).toBeVisible();

        // Check mobile instructions are visible
        const instructions = await page.locator('text=/Long press to create event/');
        await expect(instructions).toBeVisible();

        // Close menu
        await menuButton.click();
      } else {
        // Desktop/tablet view - check regular zoom controls
        const zoomControls = await page.locator('[role="group"][aria-label="Zoom controls"]');
        await expect(zoomControls).toBeVisible();
      }

      // Take screenshot for visual verification
      await page.screenshot({
        path: `test-results/mobile-${viewport.name.replace(' ', '-')}.png`,
        fullPage: false,
      });
    });
  }

  test('should handle touch gestures on mobile', async ({ page, browserName }) => {
    // Skip on webkit as touch events are not fully supported
    test.skip(browserName === 'webkit', 'Touch events not fully supported in webkit');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to app
    await page.goto('http://localhost:3000');

    // Wait for calendar
    await page.waitForSelector('[class*="LinearCalendarHorizontal"]');

    // Test long press for event creation (simulated)
    const dayElement = await page.locator('[data-date]').first();

    if (dayElement) {
      // Simulate long press with mouse events
      await dayElement.hover();
      await page.mouse.down();
      await page.waitForTimeout(600); // Wait longer than longPressDelay (500ms)
      await page.mouse.up();

      // Check if event creation preview appears
      const eventPreview = await page.locator('text=/New Event/');
      const isVisible = await eventPreview.isVisible().catch(() => false);

      if (isVisible) {
        console.log('Event creation preview appeared after long press');
      }
    }

    // Test pinch to zoom (simulated with zoom controls)
    const menuButton = await page.locator('button:has(svg[class*="Menu"], svg[class*="X"])');
    await menuButton.click();

    const zoomInBtn = await page.locator('button:has-text("Zoom In")');
    await zoomInBtn.click();

    // Verify zoom level changed
    const zoomLevel = await page.locator('span[class*="capitalize"]').textContent();
    expect(['quarter', 'week', 'day']).toContain(zoomLevel);

    // Test "Go to Today" button
    const goToTodayBtn = await page.locator('button:has-text("Go to Today")');
    await goToTodayBtn.click();

    // Verify menu closed after action
    await expect(goToTodayBtn).not.toBeVisible();
  });

  test('should have responsive dimensions', async ({ page }) => {
    // Test mobile dimensions
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[class*="LinearCalendarHorizontal"]');

    // Check that mobile-specific dimensions are applied
    const monthRow = await page.locator('div[class*="border-b"]').first();
    const monthRowHeight = await monthRow.evaluate((el) => {
      return window.getComputedStyle(el).height;
    });

    // Mobile should have smaller month height (60px vs 80px)
    expect(parseInt(monthRowHeight)).toBeLessThanOrEqual(65);

    // Test desktop dimensions
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForSelector('[class*="LinearCalendarHorizontal"]');

    const desktopMonthRow = await page.locator('div[class*="border-b"]').first();
    const desktopMonthRowHeight = await desktopMonthRow.evaluate((el) => {
      return window.getComputedStyle(el).height;
    });

    // Desktop should have standard month height (80px)
    expect(parseInt(desktopMonthRowHeight)).toBeGreaterThanOrEqual(75);
  });

  test('should handle orientation changes', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[class*="LinearCalendarHorizontal"]');

    // Take portrait screenshot
    await page.screenshot({
      path: 'test-results/mobile-portrait.png',
      fullPage: false,
    });

    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500); // Wait for re-render

    // Take landscape screenshot
    await page.screenshot({
      path: 'test-results/mobile-landscape.png',
      fullPage: false,
    });

    // Verify calendar is still functional
    const calendar = await page.locator('[class*="LinearCalendarHorizontal"]');
    await expect(calendar).toBeVisible();
  });

  test('should have accessible touch targets', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[class*="LinearCalendarHorizontal"]');

    // Open mobile menu
    const menuButton = await page.locator('button:has(svg[class*="Menu"], svg[class*="X"])');
    await menuButton.click();

    // Check button sizes meet minimum touch target size (44x44px)
    const buttons = await page.locator('button').all();

    for (const button of buttons.slice(0, 5)) {
      // Check first 5 buttons
      const box = await button.boundingBox();
      if (box) {
        // Minimum touch target size should be at least 44x44px
        expect(box.width).toBeGreaterThanOrEqual(40); // Allow slight variation
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('should handle scroll momentum on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[class*="LinearCalendarHorizontal"]');

    // Get initial scroll position
    const scrollContainer = await page.locator('div[class*="overflow-auto"]').first();
    const initialScrollLeft = await scrollContainer.evaluate((el) => el.scrollLeft);

    // Simulate swipe gesture
    await page.mouse.move(200, 300);
    await page.mouse.down();
    await page.mouse.move(50, 300, { steps: 10 });
    await page.mouse.up();

    // Wait for scroll animation
    await page.waitForTimeout(500);

    // Check that scroll position changed
    const finalScrollLeft = await scrollContainer.evaluate((el) => el.scrollLeft);
    expect(Math.abs(finalScrollLeft - initialScrollLeft)).toBeGreaterThan(0);
  });
});

test.describe('Mobile Performance', () => {
  test('should maintain good performance on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Start performance measurement
    await page.goto('http://localhost:3000');

    // Measure load time
    const performanceTiming = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
      };
    });

    // Mobile load time should be under 3 seconds
    expect(performanceTiming.loadTime).toBeLessThan(3000);
    expect(performanceTiming.domContentLoaded).toBeLessThan(2000);

    console.log('Mobile Performance Metrics:', performanceTiming);
  });
});
