import { test, expect } from '@playwright/test';

test.describe('Day Detail View Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should open day detail view when clicking on a day with events', async ({ page }) => {
    // First, create an event
    const today = new Date();
    const currentDay = String(today.getDate()).padStart(2, '0');

    // Click on today's date
    const todayCell = page
      .locator(`button:has-text("${currentDay}")`)
      .filter({ hasText: currentDay })
      .first();

    await todayCell.click();

    // Event modal should open for empty day
    await expect(page.locator('text="Create Event"')).toBeVisible({ timeout: 5000 });

    // Fill in event details
    await page.fill('input[placeholder="Event title"]', 'Test Event for Stacking');
    await page.fill(
      'textarea[placeholder="Description"]',
      'This is a test event to verify stacking works'
    );

    // Save the event
    await page.click('button:has-text("Save")');

    // Wait for modal to close
    await expect(page.locator('text="Create Event"')).not.toBeVisible({ timeout: 5000 });

    // Now click on the same day again - should open day detail view
    await todayCell.click();

    // Verify day detail view is open
    await expect(page.locator('text=/.*EEEE, MMMM d, yyyy.*/')).toBeVisible({ timeout: 5000 });

    // Verify drag and resize controls are visible
    await expect(page.locator('button:has-text("Drag: ON")')).toBeVisible();
    await expect(page.locator('button:has-text("Resize: ON")')).toBeVisible();

    // Verify the event is displayed in the day detail view
    await expect(page.locator('text="Test Event for Stacking"')).toBeVisible();

    // Close the day detail view
    await page.click('button[aria-label*="close"], button:has(svg.lucide-x)');

    // Verify it's closed
    await expect(page.locator('text=/.*EEEE, MMMM d, yyyy.*/')).not.toBeVisible({ timeout: 5000 });
  });

  test('should toggle drag and resize modes in day detail view', async ({ page }) => {
    // Navigate to test stacking page first to create some test events
    await page.goto('http://localhost:3000/test-stacking');
    await page.waitForLoadState('networkidle');

    // Go back to main calendar
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Find a day with events and click it
    const dayWithEvents = page
      .locator('button')
      .filter({ has: page.locator('div.absolute.bottom-0') })
      .first();

    if ((await dayWithEvents.count()) > 0) {
      await dayWithEvents.click();

      // Verify day detail view opened
      await expect(page.locator('button:has-text("Drag: ON")')).toBeVisible({ timeout: 5000 });

      // Toggle drag mode
      await page.click('button:has-text("Drag: ON")');
      await expect(page.locator('button:has-text("Drag: OFF")')).toBeVisible();

      // Toggle resize mode
      await page.click('button:has-text("Resize: ON")');
      await expect(page.locator('button:has-text("Resize: OFF")')).toBeVisible();

      // Close the view
      await page.click('button[aria-label*="close"], button:has(svg.lucide-x)');
    }
  });
});
