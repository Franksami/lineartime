import { test } from '@playwright/test';

test('capture current calendar layout', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[role="grid"]', { timeout: 10000 });
  
  // Wait for calendar to fully render
  await page.waitForTimeout(2000);
  
  // Take screenshot of current state
  await page.screenshot({ 
    path: 'tests/screenshots/improved-layout.png',
    fullPage: false // Only viewport to see actual user view
  });
  
  console.log('Screenshot saved to tests/screenshots/improved-layout.png');
  
  // Also take a full page screenshot for comparison
  await page.screenshot({ 
    path: 'tests/screenshots/improved-layout-full.png',
    fullPage: true
  });
  
  // Log viewport utilization
  const viewportSize = page.viewportSize();
  const calendarGrid = await page.locator('[role="grid"]');
  const gridBox = await calendarGrid.boundingBox();
  
  console.log(`Viewport height: ${viewportSize?.height}px`);
  console.log(`Calendar height: ${gridBox?.height}px`);
  console.log(`Utilization: ${((gridBox?.height || 0) / (viewportSize?.height || 1) * 100).toFixed(2)}%`);
});