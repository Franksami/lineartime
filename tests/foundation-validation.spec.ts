import { test, expect, Page } from '@playwright/test';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

test.describe('Foundation validation (horizontal year timeline)', () => {
  test('renders the Command Center Calendar application container', async ({ page }) => {
    // Navigate to dashboard where the calendar now lives
    await page.goto('/app');
    // Wait for potential auth redirects to settle
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await expect(page.getByTestId('app-shell')).toBeVisible();
  });

  test('shows Command Workspace three-pane shell', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    // Validate three-pane shell architecture
    await expect(page.getByTestId('app-shell-sidebar')).toBeVisible();
    await expect(page.getByTestId('tab-workspace')).toBeVisible();
    await expect(page.getByTestId('tab-workspace-container')).toBeVisible();
  });

  test('shows sidebar sections and navigation', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    // Validate sidebar sections are present
    await expect(page.getByTestId('sidebar-section-calendar')).toBeVisible();
    await expect(page.getByTestId('sidebar-section-tasks')).toBeVisible();
    await expect(page.getByTestId('sidebar-section-notes')).toBeVisible();
    await expect(page.getByTestId('sidebar-section-mailbox')).toBeVisible();
  });
});

// Helper to wait for Command Workspace foundation to load
async function waitForFoundation(page: Page) {
  // Wait for the Command Workspace shell (new foundation)
  await page.waitForSelector('[data-testid="app-shell"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="app-shell-sidebar"]', { timeout: 5000 });
  await page.waitForSelector('[data-testid="tab-workspace"]', { timeout: 5000 });
  await page.waitForTimeout(500); // Let rendering complete
}

// Helper to verify foundation structure elements
async function verifyFoundationStructure(page: Page) {
  // Verify 12-month row structure
  const grid = page.locator('[role="grid"]');
  await expect(grid).toBeVisible();
  await expect(grid).toHaveAttribute('aria-rowcount', '12');
  await expect(grid).toHaveAttribute('aria-colcount', '42');

  // Verify year header
  await expect(page.locator('text=/\\d{4} Linear Calendar/i')).toBeVisible();
  await expect(page.locator('text=Life is bigger than a week').first()).toBeVisible();

  // Verify week day headers (top and bottom)
  const weekHeaders = page.locator('text=Su');
  const headerCount = await weekHeaders.count();
  expect(headerCount).toBeGreaterThanOrEqual(12); // Top + bottom headers

  // Verify month labels (left and right sides)
  const janLabels = page.locator('text=Jan');
  const janCount = await janLabels.count();
  expect(janCount).toBeGreaterThanOrEqual(2); // Left + right labels
}

test.describe('🔒 Foundation Validation - LOCKED STRUCTURE', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await waitForFoundation(page);
  });

  test('should display complete 12-month horizontal structure', async ({ page }) => {
    await verifyFoundationStructure(page);

    // Verify all 12 month labels present
    const monthLabels = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    for (const month of monthLabels) {
      const monthElements = page.locator(`text=${month}`);
      const count = await monthElements.count();
      expect(count).toBeGreaterThanOrEqual(2); // Left + Right sides
    }
  });

  test('should preserve foundation on mobile viewport', async ({ page }) => {
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await waitForFoundation(page);

    // Verify foundation structure maintained on mobile
    await verifyFoundationStructure(page);

    // Verify horizontal scrolling preserved
    const grid = page.locator('[role="grid"]');
    const scrollWidth = await grid.evaluate((el) => el.scrollWidth);
    expect(scrollWidth).toBeGreaterThan(375); // Should require horizontal scroll
  });

  test('should maintain week day headers at top AND bottom', async ({ page }) => {
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    for (const day of dayNames) {
      const dayElements = page.locator(`text=${day}`);
      const count = await dayElements.count();
      // Should appear in both top and bottom headers across full width
      expect(count).toBeGreaterThanOrEqual(12); // 6 weeks × 2 headers = 12 minimum
    }
  });

  test('should display complete day numbers for each month', async ({ page }) => {
    // Check if we're in dot mode or number mode
    const isDotMode = await page
      .locator('.rounded-full[style*="dot-size"]')
      .first()
      .isVisible()
      .catch(() => false);

    if (isDotMode) {
      // In dot mode, check for dots instead of numbers
      const dots = page.locator('.rounded-full[style*="dot-size"]');
      await expect(dots.first()).toBeVisible();

      // Should have at least 300+ dots (rough estimate for a year)
      const dotCount = await dots.count();
      expect(dotCount).toBeGreaterThan(300);
    } else {
      // In number mode, check for day numbers
      const jan01 = page.locator('text=01').first();
      await expect(jan01).toBeVisible();

      const jan31 = page.locator('text=31').first();
      await expect(jan31).toBeVisible();

      // Test February (28 days in 2025)
      const feb28 = page.locator('text=28').first();
      await expect(feb28).toBeVisible();
    }
  });

  test('should maintain performance benchmarks', async ({ page }) => {
    // Measure initial load performance
    const loadStart = Date.now();
    await waitForFoundation(page);
    const loadTime = Date.now() - loadStart;

    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds

    // Check memory usage via Performance API
    const memoryInfo = await page.evaluate(() => {
      return (performance as any).memory
        ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          }
        : null;
    });

    if (memoryInfo) {
      const memoryMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
      expect(memoryMB).toBeLessThan(150); // Reasonable memory usage
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Focus on calendar grid specifically (not the main app container)
    const calendar = page.locator('[role="application"]').nth(1); // Second application role is the calendar
    await calendar.focus();

    // Test Enter key activates navigation
    await page.keyboard.press('Enter');

    // Test arrow key navigation
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');

    // Test today navigation
    await page.keyboard.press('t');

    // Test escape
    await page.keyboard.press('Escape');
  });

  test('should maintain "Life is bigger than a week" philosophy', async ({ page }) => {
    // Verify tagline present
    await expect(page.locator('text=Life is bigger than a week').first()).toBeVisible();

    // Verify year-at-a-glance capability
    const grid = page.locator('[role="grid"]');
    await expect(grid).toBeVisible();

    // Verify all months visible simultaneously
    await expect(page.locator('text=Jan')).toBeVisible();
    await expect(page.locator('text=Dec')).toBeVisible();

    // Verify horizontal timeline structure
    const gridRect = await grid.boundingBox();
    expect(gridRect?.width).toBeGreaterThan(gridRect?.height || 0); // Wider than tall
  });

  test('should preserve foundation across different zoom levels', async ({ page }) => {
    // Test zoom in functionality
    const zoomIn = page.locator('[aria-label="Zoom in"]');
    if (await zoomIn.isVisible()) {
      await zoomIn.click();
      await page.waitForTimeout(500);

      // Verify foundation still present after zoom
      await verifyFoundationStructure(page);
    }

    // Test zoom out functionality
    const zoomOut = page.locator('[aria-label="Zoom out"]');
    if (await zoomOut.isVisible()) {
      await zoomOut.click();
      await page.waitForTimeout(500);

      // Verify foundation maintained
      await verifyFoundationStructure(page);
    }
  });

  test('should display proper weekend highlighting', async ({ page }) => {
    // Check for weekend styling (Saturday/Sunday columns)
    const weekendCells = page.locator('[class*="weekend"], [class*="bg-muted"]');
    const weekendCount = await weekendCells.count();

    // Should have weekend highlighting throughout the year
    expect(weekendCount).toBeGreaterThan(50); // At least some weekend cells visible
  });

  test('should show today indicator when current year', async ({ page }) => {
    const currentYear = new Date().getFullYear();
    const todayIndicator = page.locator('[class*="primary"], [class*="today"], [class*="current"]');

    // If viewing current year, should have today indicator
    const yearHeader = await page.locator('h1').textContent();
    if (yearHeader?.includes(currentYear.toString())) {
      const todayCount = await todayIndicator.count();
      expect(todayCount).toBeGreaterThan(0);
    }
  });
});

test.describe('🔒 Cross-Platform Foundation Validation', () => {
  const devices = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 1024, height: 768 },
    { name: 'Mobile Large', width: 414, height: 896 },
    { name: 'Mobile Small', width: 375, height: 667 },
  ];

  devices.forEach((device) => {
    test(`should maintain foundation structure on ${device.name}`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/app');
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await waitForFoundation(page);

      // Verify foundation elements present regardless of screen size
      await verifyFoundationStructure(page);

      // Verify horizontal scrolling capability
      const grid = page.locator('[role="grid"]');
      const scrollWidth = await grid.evaluate((el) => el.scrollWidth);
      const clientWidth = await grid.evaluate((el) => el.clientWidth);

      // Should be horizontally scrollable on smaller screens
      if (device.width < 1200) {
        expect(scrollWidth).toBeGreaterThan(clientWidth);
      }
    });
  });
});

test.describe('🧪 Foundation Performance Validation', () => {
  test('should render foundation within performance targets', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await waitForFoundation(page);

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds

    // Test scroll performance
    const grid = page.locator('[role="grid"]');
    await grid.hover();

    // Simulate scroll performance test
    await page.evaluate(() => {
      const grid = document.querySelector('[role="grid"]');
      if (grid) {
        let frameCount = 0;
        const startTime = performance.now();

        const scroll = () => {
          frameCount++;
          if (frameCount < 60 && performance.now() - startTime < 1000) {
            grid.scrollLeft += 10;
            requestAnimationFrame(scroll);
          }
        };

        scroll();
      }
    });
  });
});
