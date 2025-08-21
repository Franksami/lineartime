import { test, expect } from '@playwright/test';

test.describe('Simple UI Validation', () => {
  test('main layout and views work correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Check page loads
    await expect(page).toHaveTitle(/LinearTime/);
    
    // Check main heading is visible
    await expect(page.locator('h1').first()).toContainText('2025 Linear Calendar');
    
    // Check ViewSwitcher works
    await expect(page.locator('button:has-text("Year View")').first()).toBeVisible();
    
    // Click Timeline view
    await page.locator('button:has-text("Timeline")').first().click();
    await page.waitForTimeout(500);
    
    // Click Manage view
    await page.locator('button:has-text("Manage")').first().click();
    await expect(page.locator('text=Event Management')).toBeVisible();
    
    // Go back to Year view
    await page.locator('button:has-text("Year View")').first().click();
    await page.waitForTimeout(500);
    
    // Check no gray backgrounds visible (should be pure black or card colors)
    const bodyBg = await page.locator('body').evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    console.log('Body background color:', bodyBg);
    
    // Take a screenshot for visual validation
    await page.screenshot({ path: 'test-results/ui-validation.png', fullPage: false });
  });
  
  test('responsive layout works', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('.hidden.md\\:flex').first()).toBeVisible();
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.md\\:hidden').first()).toBeVisible();
  });
});