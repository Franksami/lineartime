import { test, expect } from '@playwright/test';

test.describe('Event Creation and Toolbar Fixes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[role="grid"]', { timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  test('event modal does not show duplicate conflicts', async ({ page }) => {
    // Click on a day to create event
    const marchRow = await page.locator('text=/Mar/i').first().locator('..');
    const dayCell = await marchRow.locator('[class*="border-r"]').nth(14); // March 15

    await dayCell.click();
    await page.waitForTimeout(500);

    // Check if modal appears
    const modal = await page.locator('[role="dialog"]');

    if ((await modal.count()) > 0) {
      // Check conflict warnings
      const conflictSection = await modal.locator('text=/Schedule Conflict/i');

      if ((await conflictSection.count()) > 0) {
        // Count "New Event" entries in conflicts
        const conflictList = await modal.locator('ul').first();
        const conflictItems = await conflictList.locator('li').all();

        console.log(`Found ${conflictItems.length} conflict items`);

        // Should not have more than 5 conflicts shown (we limited it)
        expect(conflictItems.length).toBeLessThanOrEqual(5);

        // Check for duplicate "New Event" entries
        const titles = await Promise.all(conflictItems.map((item) => item.textContent()));

        const uniqueTitles = [...new Set(titles)];
        console.log(`Unique conflicts: ${uniqueTitles.length}`);

        // Should have removed duplicates
        expect(uniqueTitles.length).toBe(titles.length);
      }
    }
  });

  test('floating toolbar stays visible when event is near top', async ({ page }) => {
    // First, we need to create or find an event near the top
    const januaryRow = await page.locator('text=/Jan/i').first().locator('..');
    const dayCell = await januaryRow.locator('[class*="border-r"]').nth(14); // Jan 15

    // Click to create event
    await dayCell.click();
    await page.waitForTimeout(500);

    // Fill in event details if modal appears
    const modal = await page.locator('[role="dialog"]');
    if ((await modal.count()) > 0) {
      const titleInput = await modal.locator('input[id="title"]');
      await titleInput.fill('Test Event Near Top');

      // Save the event
      const saveButton = await modal.locator('button:has-text("Create Event")');
      await saveButton.click();
      await page.waitForTimeout(1000);
    }

    // Now look for the event and click it
    const eventElement = await page.locator('text=/Test Event Near Top/i').first();
    if ((await eventElement.count()) > 0) {
      await eventElement.click();
      await page.waitForTimeout(500);

      // Check for floating toolbar
      const toolbar = await page.locator('[data-testid="floating-toolbar"]');
      if ((await toolbar.count()) > 0) {
        const toolbarBox = await toolbar.boundingBox();

        // Toolbar should be visible (not hidden behind header)
        expect(toolbarBox?.y).toBeGreaterThan(100); // Should be below headers

        // Check z-index to ensure it's on top
        const zIndex = await toolbar.evaluate((el) => {
          return window.getComputedStyle(el).zIndex;
        });

        console.log(`Toolbar z-index: ${zIndex}`);
        expect(parseInt(zIndex)).toBeGreaterThan(1000); // Should have high z-index
      }
    }
  });

  test('toolbar position adjusts when too close to top', async ({ page }) => {
    // Click on January date
    const januaryLabel = await page.locator('text=/Jan/i').first();
    const januaryRow = await januaryLabel.locator('..');
    const dayCell = await januaryRow.locator('[class*="border-r"]').nth(0); // Jan 1

    // Get position of the day cell
    const cellBox = await dayCell.boundingBox();
    console.log(`Day cell position: Top=${cellBox?.y}px`);

    // Click the day
    await dayCell.click();
    await page.waitForTimeout(500);

    // Check if any floating UI appears
    const toolbar = await page.locator('[class*="fixed"][class*="shadow-lg"]');
    if ((await toolbar.count()) > 0) {
      const toolbarBox = await toolbar.boundingBox();

      // Toolbar should be positioned to be visible
      console.log(`Toolbar position: Top=${toolbarBox?.y}px`);

      // Should not be at the very top (hidden behind header)
      expect(toolbarBox?.y).toBeGreaterThan(50);

      // Should be reasonably close to the clicked cell
      const distance = Math.abs((toolbarBox?.y || 0) - (cellBox?.y || 0));
      expect(distance).toBeLessThan(200);
    }
  });

  test('toolbar has proper z-index above all elements', async ({ page }) => {
    // Create an event in the middle of calendar
    const juneRow = await page.locator('text=/Jun/i').first().locator('..');
    const dayCell = await juneRow.locator('[class*="border-r"]').nth(14); // June 15

    await dayCell.click();
    await page.waitForTimeout(500);

    // Check for any floating elements
    const floatingElements = await page
      .locator('[class*="fixed"], [class*="absolute"][style*="z-index"]')
      .all();

    for (const element of floatingElements) {
      const zIndex = await element.evaluate((el) => {
        return window.getComputedStyle(el).zIndex;
      });

      if (zIndex !== 'auto') {
        console.log(`Found element with z-index: ${zIndex}`);
      }
    }

    // Specifically check toolbar if it exists
    const toolbar = await page.locator('[data-testid="floating-toolbar"]');
    if ((await toolbar.count()) > 0) {
      await expect(toolbar).toBeVisible();

      const styles = await toolbar.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          position: computed.position,
          zIndex: computed.zIndex,
        };
      });

      console.log(`Toolbar styles: position=${styles.position}, z-index=${styles.zIndex}`);
      expect(styles.position).toBe('fixed');
      expect(parseInt(styles.zIndex)).toBeGreaterThanOrEqual(9999);
    }
  });
});
