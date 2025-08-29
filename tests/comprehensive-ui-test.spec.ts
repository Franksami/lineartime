import { test, expect } from '@playwright/test';

test.describe('🔍 Comprehensive UI Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000); // Wait for initial render
  });

  test('Foundation Structure Check', async ({ page }) => {
    console.log('=== FOUNDATION STRUCTURE CHECK ===');

    // Check month labels
    const monthLabels = await page
      .locator('text=/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/')
      .all();
    console.log(`Found ${monthLabels.length} month labels`);

    // Check week headers
    const weekHeaders = await page.locator('text=/Su|Mo|Tu|We|Th|Fr|Sa/').all();
    console.log(`Found ${weekHeaders.length} week day headers`);

    // Check for duplicate elements
    const janLabels = await page.locator('text="Jan"').all();
    console.log(`Found ${janLabels.length} "Jan" labels (should be 2: left and right)`);

    // Check main container
    const calendarContainer = page.locator('[role="application"]');
    await expect(calendarContainer).toBeVisible();

    // Check year header
    const yearHeader = page.locator('text=/2025.*Calendar/i');
    await expect(yearHeader).toBeVisible();

    // Check tagline
    const tagline = page.locator('text="Life is bigger than a week"');
    const taglineCount = await tagline.count();
    console.log(`Found ${taglineCount} tagline instances`);
  });

  test('Event Creation UI Check', async ({ page }) => {
    console.log('=== EVENT CREATION UI CHECK ===');

    // Find a clickable day cell
    const dayCell = page.locator('[data-date]').first();
    const hasDayCell = (await dayCell.count()) > 0;
    console.log(`Day cells found: ${hasDayCell}`);

    if (hasDayCell) {
      // Try to click and create event
      await dayCell.click();
      await page.waitForTimeout(500);

      // Check for event modal or inline editor
      const eventModal = page.locator('[role="dialog"]');
      const hasModal = (await eventModal.count()) > 0;
      console.log(`Event modal appears: ${hasModal}`);

      const inlineEditor = page.locator('input[placeholder*="event" i]');
      const hasInlineEditor = (await inlineEditor.count()) > 0;
      console.log(`Inline editor appears: ${hasInlineEditor}`);
    }
  });

  test('Toolbar and Controls Check', async ({ page }) => {
    console.log('=== TOOLBAR AND CONTROLS CHECK ===');

    // Check zoom controls
    const zoomIn = page.locator('button[aria-label*="Zoom in" i]');
    const zoomOut = page.locator('button[aria-label*="Zoom out" i]');
    const hasZoomControls = (await zoomIn.count()) > 0 && (await zoomOut.count()) > 0;
    console.log(`Zoom controls present: ${hasZoomControls}`);

    // Check for floating toolbar
    const floatingToolbar = page.locator('[class*="floating"][class*="toolbar" i]');
    const hasFloatingToolbar = (await floatingToolbar.count()) > 0;
    console.log(`Floating toolbar present: ${hasFloatingToolbar}`);

    // Check for command bar
    const commandBar = page.locator('[placeholder*="Type a command" i]');
    const hasCommandBar = (await commandBar.count()) > 0;
    console.log(`Command bar present: ${hasCommandBar}`);

    // Check all buttons
    const buttons = await page.locator('button').all();
    console.log(`Total buttons found: ${buttons.length}`);

    for (let i = 0; i < Math.min(5, buttons.length); i++) {
      const text = await buttons[i].textContent();
      const ariaLabel = await buttons[i].getAttribute('aria-label');
      console.log(`Button ${i}: text="${text}", aria-label="${ariaLabel}"`);
    }
  });

  test('Mobile Responsiveness Check', async ({ page }) => {
    console.log('=== MOBILE RESPONSIVENESS CHECK ===');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Check mobile menu
    const mobileMenu = page.locator('button[class*="md:hidden"]');
    const hasMobileMenu = (await mobileMenu.count()) > 0;
    console.log(`Mobile menu button present: ${hasMobileMenu}`);

    // Check if calendar adapts
    const calendarVisible = await page.locator('[role="application"]').isVisible();
    console.log(`Calendar visible on mobile: ${calendarVisible}`);

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Visual Hierarchy Check', async ({ page }) => {
    console.log('=== VISUAL HIERARCHY CHECK ===');

    // Check z-index layers
    const elements = await page.locator('*').evaluateAll((els) =>
      els
        .map((el) => ({
          tag: el.tagName,
          zIndex: window.getComputedStyle(el).zIndex,
          position: window.getComputedStyle(el).position,
          className: el.className,
        }))
        .filter((el) => el.zIndex !== 'auto' && el.zIndex !== '0')
        .sort((a, b) => parseInt(b.zIndex) - parseInt(a.zIndex))
        .slice(0, 10)
    );

    console.log('Top z-index elements:');
    elements.forEach((el) => {
      console.log(`  ${el.tag}: z-index=${el.zIndex}, position=${el.position}`);
    });
  });

  test('Performance Metrics Check', async ({ page }) => {
    console.log('=== PERFORMANCE METRICS CHECK ===');

    // Measure initial load time
    const metrics = await page.evaluate(() => {
      const navEntries = performance.getEntriesByType('navigation');
      if (!navEntries.length || navEntries[0].entryType !== 'navigation') {
        throw new Error('Navigation timing entry not available');
      }
      const perf = navEntries[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        domInteractive: perf.domInteractive - perf.fetchStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      };
    });

    console.log('Performance metrics:');
    console.log(`  DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`  Load Complete: ${metrics.loadComplete}ms`);
    console.log(`  DOM Interactive: ${metrics.domInteractive}ms`);
    console.log(`  First Paint: ${metrics.firstPaint}ms`);
  });

  test('Accessibility Quick Check', async ({ page }) => {
    console.log('=== ACCESSIBILITY QUICK CHECK ===');

    // Check ARIA labels
    const elementsWithAria = await page.locator('[aria-label]').all();
    console.log(`Elements with aria-label: ${elementsWithAria.length}`);

    // Check role attributes
    const elementsWithRole = await page.locator('[role]').all();
    console.log(`Elements with role: ${elementsWithRole.length}`);

    // Check focus indicators
    const firstButton = page.locator('button').first();
    if ((await firstButton.count()) > 0) {
      await firstButton.focus();
      const focusStyles = await firstButton.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
        };
      });
      console.log(
        `Focus styles: outline="${focusStyles.outline}", boxShadow="${focusStyles.boxShadow}"`
      );
    }
  });

  test('Data Validation Check', async ({ page }) => {
    console.log('=== DATA VALIDATION CHECK ===');

    // Check for calendar data
    const hasCalendarData = await page.evaluate(() => {
      return (
        window.localStorage.getItem('calendar-events') !== null || window.indexedDB !== undefined
      );
    });
    console.log(`Has calendar data storage: ${hasCalendarData}`);

    // Check for proper date cells
    const dateCells = await page.locator('[data-date], [data-day], .day-cell').all();
    console.log(`Date cells found: ${dateCells.length}`);
  });
});
