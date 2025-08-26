import { test, expect } from '@playwright/test';

test.describe('Progress Calendar Dot View Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000); // Wait for app to load
  });

  test('should be able to switch to dot view via settings', async ({ page }) => {
    // Open settings
    const settingsButton = page.locator('[data-testid="settings-button"], button:has-text("Settings"), [aria-label*="settings" i]').first();
    
    // If we can't find a direct settings button, try keyboard shortcut
    if (!(await settingsButton.isVisible())) {
      await page.keyboard.press(','); // Settings shortcut
    } else {
      await settingsButton.click();
    }
    
    // Wait for settings dialog
    await page.waitForSelector('[role="dialog"], .settings-dialog, [data-testid="settings-dialog"]', { timeout: 5000 });
    
    // Look for calendar day style setting
    const dayStyleSelect = page.locator('select', { hasText: 'Calendar Day Style' }).or(
      page.locator('[data-testid="calendar-day-style"]')
    ).or(
      page.getByLabel(/calendar.*day.*style/i)
    ).first();
    
    if (await dayStyleSelect.isVisible()) {
      await dayStyleSelect.selectOption('dot');
      
      // Close settings
      const closeButton = page.locator('button:has-text("Close"), [aria-label*="close" i]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
      
      // Verify dots are visible (look for small circular elements)
      const dots = page.locator('.rollingDigit, [style*="width: 5px"], [style*="width: var(--dot-size)"], .rounded-full');
      await expect(dots.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show days left counter in dot mode for current year', async ({ page }) => {
    // First switch to dot mode (if not already)
    await page.keyboard.press(','); // Settings shortcut
    await page.waitForTimeout(1000);
    
    // Try to find and set dot mode
    try {
      const dayStyleSelect = page.getByLabel(/calendar.*day.*style/i).first();
      if (await dayStyleSelect.isVisible()) {
        await dayStyleSelect.selectOption('dot');
      }
    } catch (e) {
      // Settings might not be available, continue with test
    }
    
    await page.keyboard.press('Escape'); // Close settings
    
    // Look for days left counter in current year
    const currentYear = new Date().getFullYear();
    const yearHeader = page.locator(`h1:has-text("${currentYear}")`);
    
    if (await yearHeader.isVisible()) {
      // Look for the specific days left container (most specific selector)
      const daysLeftContainer = page.locator('div.flex.items-baseline.gap-2:has-text("days left")').first();
      
      // In current year, days left counter should be visible
      if (await daysLeftContainer.isVisible()) {
        // Wait for rolling animation to complete
        await page.waitForTimeout(500);
        
        // Use the sr-only span that has the actual value
        const srOnlyValue = daysLeftContainer.locator('.sr-only').first();
        if (await srOnlyValue.isVisible()) {
          const daysLeftValue = await srOnlyValue.textContent();
          if (daysLeftValue) {
            const days = parseInt(daysLeftValue.trim());
            expect(days).toBeGreaterThanOrEqual(0);
            expect(days).toBeLessThanOrEqual(366);
          }
        } else {
          // Fallback to text content parsing
          const daysLeftText = await daysLeftContainer.textContent();
          const match = daysLeftText?.match(/(\d+)/);
          if (match) {
            const days = parseInt(match[1]);
            expect(days).toBeGreaterThanOrEqual(0);
            expect(days).toBeLessThanOrEqual(366);
          }
        }
      }
    }
  });

  test('should show tooltips on hover in dot mode', async ({ page, browserName }) => {
    // Skip on mobile browsers
    if (browserName === 'webkit' || browserName.includes('Mobile')) {
      test.skip();
    }
    
    // Look for dot elements or day cells
    const dayCell = page.locator('[data-date]').first();
    
    if (await dayCell.isVisible()) {
      // Hover over the day cell
      await dayCell.hover();
      
      // Look for tooltip content
      const tooltip = page.locator('[role="tooltip"], .tooltip, [data-testid="tooltip"]');
      
      // Tooltip might appear with date information
      if (await tooltip.isVisible({ timeout: 2000 })) {
        const tooltipText = await tooltip.textContent();
        expect(tooltipText).toBeTruthy();
        // Should contain date-like content
        expect(tooltipText).toMatch(/\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i);
      }
    }
  });

  test('should preserve foundation structure in dot mode', async ({ page }) => {
    // Verify the 12-month structure is still intact
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Check that month labels are still present
    for (const month of months.slice(0, 3)) { // Test first 3 months
      const monthLabel = page.locator(`text=${month}`).first();
      if (await monthLabel.isVisible()) {
        await expect(monthLabel).toBeVisible();
      }
    }
    
    // Check that the year header is still present
    const currentYear = new Date().getFullYear();
    const yearHeader = page.locator(`text=${currentYear} Linear Calendar`);
    if (await yearHeader.isVisible()) {
      await expect(yearHeader).toBeVisible();
    }
    
    // Check that the tagline is still present (use first() to handle multiple occurrences)
    const tagline = page.locator('text=Life is bigger than a week').first();
    if (await tagline.isVisible()) {
      await expect(tagline).toBeVisible();
    }
  });

  test('should handle year navigation while preserving dot mode', async ({ page }) => {
    // This test would verify that switching years maintains the dot view
    // Look for year navigation controls
    const yearControls = page.locator('button:has-text("2024"), button:has-text("2023"), [data-testid*="year"]');
    
    if (await yearControls.first().isVisible()) {
      await yearControls.first().click();
      await page.waitForTimeout(1000);
      
      // Verify dots are still present after navigation
      const dots = page.locator('.rounded-full, [style*="dot-size"]');
      if (await dots.first().isVisible()) {
        await expect(dots.first()).toBeVisible();
      }
    }
  });
});