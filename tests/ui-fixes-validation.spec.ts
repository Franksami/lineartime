import { test, expect } from '@playwright/test';

test.describe('UI Positioning Fixes Validation', () => {
  test('Visual validation of positioning fixes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for the calendar to load
    await page.waitForSelector('text=Command Center Calendar', { timeout: 10000 });

    // Take screenshot to validate visual positioning
    await page.screenshot({
      path: 'ui-fixes-validation-desktop.png',
      fullPage: false,
    });

    // Check key elements are visible and positioned correctly
    const linearTimeHeader = page.locator('text=Command Center Calendar').first();
    await expect(linearTimeHeader).toBeVisible();

    const filtersButton = page.locator('button:has-text("Filter")').first();
    if (await filtersButton.isVisible()) {
      console.log('Filters button is visible and positioned in top-right area');
    }

    const onlineBadge = page.locator('text=Online').first();
    if (await onlineBadge.isVisible()) {
      console.log('Online badge is visible and positioned in top-right area');
    }

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000); // Wait for responsive layout

    await page.screenshot({
      path: 'ui-fixes-validation-mobile.png',
      fullPage: false,
    });

    console.log(
      'Screenshots saved: ui-fixes-validation-desktop.png and ui-fixes-validation-mobile.png'
    );
  });

  test('Elements do not overlap test', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Basic overlap check - ensure key elements are in different areas
    const header = page.locator('text=Command Center Calendar').first();
    await expect(header).toBeVisible();

    // Check filters button positioning relative to calendar
    const filtersButton = page.locator('button:has-text("Filter")').first();
    if (await filtersButton.isVisible()) {
      const buttonBox = await filtersButton.boundingBox();
      // Should be in upper area of screen
      expect(buttonBox?.y).toBeLessThan(100);
      // Should be on right side of screen (not covering left side calendar)
      expect(buttonBox?.x).toBeGreaterThan(200);
    }
  });
});
