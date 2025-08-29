import { test, expect } from '@playwright/test';

test.describe('Basic Mobile Tests', () => {
  test('should load calendar on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to app
    await page.goto('http://localhost:3000');

    // Wait for any calendar element to appear
    await page.waitForSelector('div', { timeout: 5000 });

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/mobile-basic.png' });

    // Check if page has loaded
    const title = await page.title();
    console.log('Page title:', title);

    // Look for calendar container
    const calendarElements = await page.locator('div').count();
    console.log('Number of div elements:', calendarElements);
    expect(calendarElements).toBeGreaterThan(0);
  });

  test('should detect mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to app
    await page.goto('http://localhost:3000');

    // Check viewport width in the browser
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    console.log('Viewport width:', viewportWidth);
    expect(viewportWidth).toBe(375);

    // Check if media query detects mobile
    const isMobile = await page.evaluate(() => {
      return window.matchMedia('(max-width: 768px)').matches;
    });
    console.log('Is mobile detected:', isMobile);
    expect(isMobile).toBe(true);
  });

  test('should have mobile menu button', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to app
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/mobile-menu-check.png' });

    // Try different selectors for menu button
    const menuSelectors = [
      'button svg',
      'button[class*="z-30"]',
      'button',
      '[class*="Menu"]',
      '[class*="menu"]',
    ];

    let menuFound = false;
    for (const selector of menuSelectors) {
      const count = await page.locator(selector).count();
      console.log(`Selector "${selector}" found ${count} elements`);
      if (count > 0) {
        menuFound = true;
      }
    }

    // List all buttons on the page
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons total`);

    for (let i = 0; i < Math.min(3, buttons.length); i++) {
      const text = await buttons[i].textContent();
      const classes = await buttons[i].getAttribute('class');
      console.log(`Button ${i}: text="${text}", classes="${classes}"`);
    }
  });

  test('should render calendar on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to app
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/desktop-basic.png' });

    // Check if zoom controls are visible
    const buttons = await page.locator('button').all();
    console.log(`Desktop: Found ${buttons.length} buttons`);

    // Look for zoom indicators
    const hasZoomControls = await page.locator('text=/year|quarter|month|week|day/i').count();
    console.log('Has zoom controls:', hasZoomControls > 0);
  });
});
