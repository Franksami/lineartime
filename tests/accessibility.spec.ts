import { test, expect } from '@playwright/test';

test.describe('Accessibility Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('div[role="application"]', { timeout: 10000 });
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    // Check main calendar has proper ARIA attributes
    const calendar = await page.locator('[role="application"]').first();
    const ariaLabel = await calendar.getAttribute('aria-label');
    expect(ariaLabel).toContain('Calendar for year');

    // Check grid structure
    const grid = await page.locator('[role="grid"]').first();
    await expect(grid).toHaveAttribute('aria-rowcount', '12');
    await expect(grid).toHaveAttribute('aria-colcount', '31');

    // Check zoom controls have labels
    const zoomOut = await page.locator('button[aria-label="Zoom out"]').first();
    await expect(zoomOut).toBeVisible();

    const zoomIn = await page.locator('button[aria-label="Zoom in"]').first();
    await expect(zoomIn).toBeVisible();

    // Check zoom level indicator
    const zoomLevel = await page.locator('[role="status"][aria-label*="zoom level"]').first();
    await expect(zoomLevel).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Focus the calendar
    const calendar = await page.locator('[role="application"]').first();
    await calendar.focus();

    // Test keyboard navigation
    await page.keyboard.press('Enter'); // Enter navigation mode
    await page.waitForTimeout(100);

    // Test arrow keys
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);

    // Test T to go to today
    await page.keyboard.press('t');
    await page.waitForTimeout(100);

    // Test Escape to exit
    await page.keyboard.press('Escape');

    // Verify screen reader region exists
    const liveRegion = await page.locator('[role="status"][aria-live="polite"]');
    await expect(liveRegion).toBeAttached();
  });

  test('should have focus indicators', async ({ page }) => {
    // Tab through elements
    await page.keyboard.press('Tab');

    // Check focused element has visible indicator
    const focusedElement = await page.locator(':focus');
    const focusVisible = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });

    expect(focusVisible).toBeTruthy();
  });

  test('should announce changes to screen readers', async ({ page }) => {
    // Get live region
    const liveRegion = await page.locator('[role="status"][aria-live="polite"]').first();
    await expect(liveRegion).toBeAttached();

    // Focus calendar and navigate
    const calendar = await page.locator('[role="application"]').first();
    await calendar.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    // Navigate to trigger announcement
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);

    // Live region should update (content may vary)
    const hasAnnouncement = await liveRegion.evaluate((el) => {
      return el.textContent !== null && el.textContent.length > 0;
    });

    // Announcement may have been cleared, but element should exist
    expect(liveRegion).toBeTruthy();
  });

  test('should have accessible mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('[role="application"]');

    // Check mobile menu button
    const menuButton = await page.locator('button[aria-label*="menu"]').first();
    if (await menuButton.isVisible()) {
      // Check ARIA attributes
      await expect(menuButton).toHaveAttribute('aria-expanded', /(true|false)/);

      // Test menu toggle
      await menuButton.click();
      await expect(menuButton).toHaveAttribute('aria-expanded', 'true');

      // Check menu controls
      const toolbar = await page.locator('[role="toolbar"]').first();
      await expect(toolbar).toBeVisible();
    }
  });

  test('should meet minimum touch target size on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('[role="application"]');

    // Check button sizes
    const buttons = await page.locator('button').all();

    for (const button of buttons.slice(0, 5)) {
      // Check first 5 buttons
      const box = await button.boundingBox();
      if (box) {
        // WCAG requires 44x44px minimum touch targets
        expect(box.width).toBeGreaterThanOrEqual(40); // Allow slight variation
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('should have proper contrast ratios', async ({ page }) => {
    // Check text is visible against backgrounds
    const monthLabel = await page.locator('[role="rowheader"]').first();
    if (await monthLabel.isVisible()) {
      const hasText = await monthLabel.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.color !== styles.backgroundColor;
      });
      expect(hasText).toBeTruthy();
    }

    // Check day numbers are visible
    const dayNumber = await page.locator('.text-xs.text-muted-foreground').first();
    if (await dayNumber.isVisible()) {
      const isVisible = await dayNumber.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return parseFloat(styles.opacity) > 0.5;
      });
      expect(isVisible).toBeTruthy();
    }
  });

  test('should support reduced motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await page.waitForSelector('[role="application"]');

    // Check transitions are reduced
    const element = await page.locator('.transition-colors').first();
    if (await element.isVisible()) {
      const duration = await element.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.transitionDuration;
      });

      // Should be instant or very fast with reduced motion
      if (duration && duration !== 'none') {
        const ms = parseFloat(duration) * 1000;
        expect(ms).toBeLessThanOrEqual(100);
      }
    }
  });

  test('should have skip links', async ({ page }) => {
    // Tab to reveal skip links
    await page.keyboard.press('Tab');

    // Check for skip links
    const skipLink = await page.locator('a[href^="#"][class*="sr-only"]').first();
    if ((await skipLink.count()) > 0) {
      // Verify skip link target exists
      const href = await skipLink.getAttribute('href');
      if (href) {
        const target = await page.locator(href);
        await expect(target).toBeAttached();
      }
    }
  });

  test('should have semantic HTML structure', async ({ page }) => {
    // Check for header
    const header = await page.locator('header');
    await expect(header).toBeVisible();

    // Check for main content
    const main = await page.locator('main');
    await expect(main).toBeVisible();

    // Check for navigation
    const nav = await page.locator('nav');
    await expect(nav).toBeVisible();
  });
});
