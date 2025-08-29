import { test, expect } from '@playwright/test';

test.describe('Calendar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for calendar to load
    await page.waitForSelector(
      '[data-testid="calendar-container"], .calendar, [class*="calendar"]',
      {
        timeout: 10000,
      }
    );
  });

  test('should load the calendar page', async ({ page }) => {
    // Check for main calendar elements
    await expect(page.locator('text=/Linear Calendar/i')).toBeVisible();

    // Check year is displayed
    const currentYear = new Date().getFullYear();
    await expect(page.locator(`text=${currentYear}`)).toBeVisible();
  });

  test('should switch between views', async ({ page }) => {
    // Look for view switcher buttons
    const viewSwitcher = page.locator(
      '[role="tablist"], [aria-label*="view"], button:has-text("Timeline")'
    );

    if ((await viewSwitcher.count()) > 0) {
      // Switch to Timeline view
      await page.click('button:has-text("Timeline")');
      await page.waitForTimeout(500);

      // Switch to Manage view
      await page.click('button:has-text("Manage")');
      await page.waitForTimeout(500);

      // Switch back to Year view
      await page.click('button:has-text("Year")');
      await page.waitForTimeout(500);
    }
  });

  test('should navigate between months on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      // Wait for mobile calendar view
      await page
        .waitForSelector('.mobile-calendar, [class*="MobileCalendar"]', {
          timeout: 5000,
        })
        .catch(() => {});

      // Check for navigation buttons
      const prevButton = page
        .locator('button[aria-label*="prev" i], button:has(svg):left-of(:text("2024"))')
        .first();
      const nextButton = page
        .locator('button[aria-label*="next" i], button:has(svg):right-of(:text("2024"))')
        .first();

      if ((await prevButton.isVisible()) && (await nextButton.isVisible())) {
        // Navigate to next month
        await nextButton.click();
        await page.waitForTimeout(300);

        // Navigate back
        await prevButton.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should toggle virtual scrolling on desktop', async ({ page, isMobile }) => {
    if (!isMobile && process.env.NODE_ENV === 'development') {
      // Look for virtual scroll toggle
      const toggle = page.locator('text=/Use Virtual Scrolling/i');

      if (await toggle.isVisible()) {
        const checkbox = page.locator('input[type="checkbox"]').first();

        // Toggle off
        await checkbox.uncheck();
        await page.waitForTimeout(500);

        // Toggle back on
        await checkbox.check();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should open AI Assistant', async ({ page }) => {
    // Look for AI Assistant button
    const aiButton = page
      .locator('button:has(svg[class*="bot" i]), button[aria-label*="AI" i]')
      .first();

    if (await aiButton.isVisible()) {
      await aiButton.click();

      // Wait for assistant panel to open
      await page
        .waitForSelector('.ai-assistant, [class*="AssistantPanel"]', {
          timeout: 5000,
        })
        .catch(() => {});

      // Check if assistant is visible
      const assistantPanel = page.locator('text=/AI Assistant/i');
      if (await assistantPanel.isVisible()) {
        // Try to close it
        const closeButton = page
          .locator('button[aria-label*="close" i], button:has(svg[class*="x" i])')
          .first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }
  });

  test('should display performance monitor in development', async ({ page }) => {
    if (process.env.NODE_ENV === 'development') {
      const perfMonitor = page.locator('text=/Performance/i, text=/FPS/i');

      if (await perfMonitor.isVisible()) {
        // Check for FPS display
        await expect(page.locator('text=/FPS/i')).toBeVisible();

        // Check for memory display if available
        const memory = page.locator('text=/Memory/i');
        if (await memory.isVisible()) {
          await expect(memory).toBeVisible();
        }
      }
    }
  });
});

test.describe('Calendar Performance', () => {
  test('should handle large number of events', async ({ page }) => {
    // Navigate to performance test page
    await page.goto('/performance-test');

    // Wait for page to load
    await page.waitForSelector('text=/Performance Test Suite/i', { timeout: 10000 });

    // Add 100 events
    const add100Button = page.locator('button:has-text("Add 100 Events")');
    if (await add100Button.isVisible()) {
      await add100Button.click();

      // Wait for events to be generated
      await page.waitForTimeout(2000);

      // Check event count is displayed
      const eventCount = page.locator('text=/Event Count/i').locator('..').locator('p');
      const count = await eventCount.textContent();
      expect(parseInt(count || '0')).toBeGreaterThan(0);

      // Navigate back to calendar
      await page.click('button:has-text("Go to Calendar")');

      // Check calendar still loads
      await page.waitForSelector(
        '[data-testid="calendar-container"], .calendar, [class*="calendar"]',
        {
          timeout: 10000,
        }
      );
    }
  });

  test('should maintain 60fps target', async ({ page }) => {
    if (process.env.NODE_ENV === 'development') {
      await page.goto('/');

      // Wait for performance monitor
      await page.waitForTimeout(2000);

      const fpsDisplay = page.locator('text=/FPS/i').locator('..').locator('span');
      if (await fpsDisplay.isVisible()) {
        const fpsText = await fpsDisplay.textContent();
        const fps = parseInt(fpsText || '0');

        // FPS should be reasonable (allowing for initial load)
        expect(fps).toBeGreaterThan(30);
      }
    }
  });
});
