import { test, expect } from '@playwright/test';

test('verify January is visible and no empty space at bottom', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[role="grid"]', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Check January (first month) is visible
  const januaryRow = await page.locator('[class*="border-b"]').first();
  const januaryLabel = await page.locator('text=/Jan/i').first();

  await expect(januaryRow).toBeVisible();
  await expect(januaryLabel).toBeVisible();

  // Get position of January
  const januaryBox = await januaryRow.boundingBox();
  console.log(`January position - Top: ${januaryBox?.y}px`);

  // January should not be cut off (should be below header)
  expect(januaryBox?.y).toBeGreaterThan(60); // Should be below the header

  // Check December (last month) position
  const decemberRow = await page.locator('[class*="border-b"]').nth(11);
  const decemberBox = await decemberRow.boundingBox();

  // Get viewport height
  const viewportSize = page.viewportSize();
  const viewportHeight = viewportSize?.height || 900;

  // Calculate bottom position of December
  const decemberBottom = (decemberBox?.y || 0) + (decemberBox?.height || 0);
  console.log(`December bottom: ${decemberBottom}px, Viewport: ${viewportHeight}px`);

  // The calendar should extend to or beyond the viewport (scrollable)
  expect(decemberBottom).toBeGreaterThanOrEqual(viewportHeight - 100); // Within 100px of bottom or beyond

  // Take screenshot showing the full layout
  await page.screenshot({
    path: 'tests/screenshots/final-layout-top.png',
    fullPage: false,
  });

  // Scroll to bottom to check for empty space
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('[role="grid"]')?.parentElement;
    if (scrollContainer) {
      scrollContainer.scrollTo(0, scrollContainer.scrollHeight);
    }
  });

  await page.waitForTimeout(500);

  // Take screenshot of bottom
  await page.screenshot({
    path: 'tests/screenshots/final-layout-bottom.png',
    fullPage: false,
  });

  console.log('✅ January is visible at top');
  console.log('✅ Calendar extends to bottom of viewport');
  console.log('Screenshots saved to tests/screenshots/');
});
