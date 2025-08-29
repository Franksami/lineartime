// Analytics Dashboard Feature Tests
import { test, expect } from '@playwright/test';

test.describe('📊 Analytics Dashboard Feature Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to analytics page
    await page.goto('http://localhost:3000/analytics');
    await page.waitForSelector('text=Calendar Analytics', { timeout: 15000 });
  });

  test('should display analytics dashboard page', async ({ page }) => {
    // Check page title and basic structure - use first() to avoid strict mode violation
    await expect(page.locator('h1:has-text("Calendar Analytics")').first()).toBeVisible();

    // Look for main analytics components from actual implementation
    await expect(page.locator('text=Insights into your').first()).toBeVisible();
    await expect(page.locator('text=Total Events').first()).toBeVisible();
  });

  test('should show productivity metrics', async ({ page }) => {
    // Check for productivity-related metrics from actual implementation
    await expect(page.locator('text=Productivity Score')).toBeVisible();
    await expect(page.locator('text=Total Events')).toBeVisible();
    await expect(page.locator('text=Total Days')).toBeVisible();

    // Should show numerical values - use first() to avoid strict mode violation
    await expect(page.locator('text=/\\d+/').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display event category breakdown', async ({ page }) => {
    // Check for category breakdown from actual implementation
    await expect(page.locator('text=Event Categories')).toBeVisible();
    await expect(page.locator('text=Distribution by event type')).toBeVisible();

    // Look for category badges with event counts - use first() to avoid strict mode violation
    await expect(page.locator('text=/personal|work|effort|note/').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should show monthly activity tracking', async ({ page }) => {
    // Check for monthly activity visualization from actual implementation
    await expect(page.locator('text=Monthly Event Distribution')).toBeVisible();
    await expect(page.locator('text=Most Productive')).toBeVisible();

    // Look for month names in the most productive month display - use first() to avoid strict mode violation
    await expect(
      page.locator('text=/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should provide AI-powered insights', async ({ page }) => {
    // Check for AI insights section from actual implementation
    await expect(page.locator('text=Key Insights')).toBeVisible();
    await expect(page.locator('text=AI-powered insights from your calendar data')).toBeVisible();
    await expect(page.locator('text=Peak Activity')).toBeVisible({ timeout: 10000 });
  });

  test('should have export functionality', async ({ page }) => {
    // Check for export options from actual implementation
    await expect(page.locator('button:has-text("Export Report")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Filter")')).toBeVisible();
  });

  test('should handle year selection', async ({ page }) => {
    // Look for year selector from actual implementation
    const currentYear = new Date().getFullYear();
    await expect(page.locator(`button:has-text("${currentYear}")`)).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`button:has-text("${currentYear - 1}")`)).toBeVisible();
  });

  test('should display charts and visualizations', async ({ page }) => {
    // Look for chart placeholders from actual implementation
    await expect(page.locator('text=Chart visualization coming soon')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('.bg-muted.rounded-lg')).toBeVisible();
  });

  test('should show event statistics', async ({ page }) => {
    // Check for numerical statistics
    await expect(page.locator('text=/\\d+/').first()).toBeVisible({ timeout: 5000 });

    // Look for common statistics terms - use first() to avoid strict mode violation
    await expect(page.locator('text=/Total|Count|Average|Hours|Days/').first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('text=Calendar Analytics', { timeout: 15000 });

    // Check that main elements are still visible on mobile
    await expect(page.locator('text=Calendar Analytics')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Total Events')).toBeVisible();
  });

  test('should navigate back to main calendar', async ({ page }) => {
    // Look for navigation back to main calendar from actual implementation - use first() to avoid strict mode violation
    const backButton = page.locator('button:has-text("Back")').first();
    await expect(backButton).toBeVisible();

    // Test navigation to calendar view
    const calendarViewButton = page.locator('button:has-text("Calendar View")');
    if ((await calendarViewButton.count()) > 0) {
      await expect(calendarViewButton.first()).toBeVisible();
    }
  });

  test('visual regression - analytics dashboard', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Take screenshot for visual regression testing
    await expect(page).toHaveScreenshot('analytics-dashboard-full.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });
});
