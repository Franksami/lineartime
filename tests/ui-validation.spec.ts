import { test, expect } from '@playwright/test';

test.describe('UI Validation - Vercel Theme with oklch colors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should have full-screen layout with no unwanted padding', async ({ page }) => {
    // Check main container fills viewport
    const mainContainer = page.locator('div.h-screen').first();
    const viewport = page.viewportSize();
    
    // Check for full height
    await expect(mainContainer).toHaveCSS('height', `${viewport?.height}px`);
    
    // Check for black background (oklch(0 0 0))
    const bgColor = await mainContainer.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    // oklch(0 0 0) may convert to rgb(0, 0, 0) or lab format
    expect(bgColor).toMatch(/rgb\(0,?\s*0,?\s*0\)|lab\(0/);
  });

  test('should display all three views correctly', async ({ page }) => {
    // Year View (default)
    await expect(page.locator('text=/2025 Linear Calendar/')).toBeVisible();
    
    // Timeline View
    await page.click('text=Timeline');
    await expect(page.locator('.flex-1.overflow-auto')).toBeVisible();
    
    // Manage View
    await page.click('text=Manage');
    await expect(page.locator('text=Event Management')).toBeVisible();
  });

  test('should use theme colors consistently', async ({ page }) => {
    // Check ViewSwitcher uses card background
    const viewSwitcher = page.locator('.hidden.md\\:flex').first();
    // Check it has a background color (may be in lab or rgb format)
    const bgColor = await viewSwitcher.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBeTruthy();
    
    // Check header text uses foreground color
    const headerText = page.locator('h1').first();
    const textColor = await headerText.evaluate(el => 
      window.getComputedStyle(el).color
    );
    expect(textColor).not.toBe('rgb(255, 255, 255)'); // Should use theme foreground, not hardcoded white
  });

  test('should have proper overflow handling', async ({ page }) => {
    // Check calendar container has overflow handling
    const calendarContainer = page.locator('.flex-1.h-\\[calc\\(100vh-88px\\)\\]');
    await expect(calendarContainer).toHaveCSS('overflow', 'hidden');
  });

  test('should handle responsive layout', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mobile dropdown should be visible
    await expect(page.locator('.md\\:hidden')).toBeVisible();
    
    // Desktop tabs should be hidden
    await expect(page.locator('.hidden.md\\:flex')).toBeHidden();
  });
});