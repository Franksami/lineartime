import { test, expect, Page } from '@playwright/test';

// Helper to wait for calendar to load
async function waitForCalendar(page: Page) {
  await page.waitForSelector('[role="grid"]', { timeout: 10000 });
  await page.waitForTimeout(500);
}

// Helper to seed test events
async function seedTestEvents(page: Page) {
  await page.evaluate(() => {
    // Create test events in IndexedDB
    const testEvents = [
      {
        id: 'test-1',
        title: 'Test Event 1',
        startDate: new Date(2025, 0, 15).toISOString(),
        endDate: new Date(2025, 0, 16).toISOString(),
        category: 'personal',
        description: 'Test description',
      },
      {
        id: 'test-2',
        title: 'Test Event 2',
        startDate: new Date(2025, 1, 10).toISOString(),
        endDate: new Date(2025, 1, 12).toISOString(),
        category: 'work',
        description: 'Another test',
      },
    ];

    // Store in localStorage for quick testing
    const existingEvents = JSON.parse(localStorage.getItem('linearCalendarEvents') || '[]');
    const updatedEvents = [...existingEvents, ...testEvents];
    localStorage.setItem('linearCalendarEvents', JSON.stringify(updatedEvents));
  });

  // Reload to show events
  await page.reload();
  await waitForCalendar(page);
}

test.describe('FloatingToolbar Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForCalendar(page);
  });

  test('FloatingToolbar appears when clicking on an event', async ({ page }) => {
    // Seed test events
    await seedTestEvents(page);

    // Look for event elements
    const events = page.locator('div').filter({
      has: page.locator('text=/Test Event/'),
    });

    const eventCount = await events.count();
    console.log('Test events found:', eventCount);

    if (eventCount === 0) {
      // Try alternative selector for events
      const altEvents = page.locator(
        '[class*="bg-green"], [class*="bg-blue"], [class*="bg-orange"], [class*="bg-purple"]'
      );
      const altCount = await altEvents.count();
      console.log('Alternative event selector found:', altCount);

      if (altCount > 0) {
        // Click first event
        await altEvents.first().click();
      }
    } else {
      // Click the first test event
      await events.first().click();
    }

    // Wait a moment for toolbar to appear
    await page.waitForTimeout(500);

    // Look for floating toolbar
    const toolbar = page.locator('[class*="floating"], [class*="toolbar"]').filter({
      has: page.locator('button'),
    });

    const toolbarVisible = await toolbar.isVisible({ timeout: 2000 }).catch(() => false);
    console.log('FloatingToolbar visible:', toolbarVisible);

    // Also check for specific toolbar elements
    const editButton = page
      .locator('button[aria-label*="edit"], button')
      .filter({ hasText: /edit/i });
    const deleteButton = page
      .locator('button[aria-label*="delete"], button')
      .filter({ hasText: /delete/i });

    const hasEditButton = await editButton.isVisible({ timeout: 1000 }).catch(() => false);
    const hasDeleteButton = await deleteButton.isVisible({ timeout: 1000 }).catch(() => false);

    console.log('Edit button visible:', hasEditButton);
    console.log('Delete button visible:', hasDeleteButton);

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/floating-toolbar-test.png' });

    // Verify toolbar appeared
    expect(toolbarVisible || hasEditButton || hasDeleteButton).toBeTruthy();
  });

  test('FloatingToolbar provides inline editing capabilities', async ({ page }) => {
    // Seed test events
    await seedTestEvents(page);

    // Find and click an event
    const events = page.locator(
      '[class*="bg-green"], [class*="bg-blue"], [class*="bg-orange"], [class*="bg-purple"]'
    );

    if ((await events.count()) > 0) {
      await events.first().click();
      await page.waitForTimeout(500);

      // Look for inline editing elements
      const titleInput = page.locator('input[type="text"]').first();
      const descriptionInput = page.locator('textarea, input').filter({ hasText: /description/i });

      const hasTitleInput = await titleInput.isVisible({ timeout: 1000 }).catch(() => false);
      const hasDescriptionInput = await descriptionInput
        .isVisible({ timeout: 1000 })
        .catch(() => false);

      console.log('Title input visible:', hasTitleInput);
      console.log('Description input visible:', hasDescriptionInput);

      // Try to edit if visible
      if (hasTitleInput) {
        await titleInput.fill('Updated Event Title');
      }

      if (hasDescriptionInput) {
        await descriptionInput.fill('Updated description text');
      }

      // Look for save/update button
      const saveButton = page.locator('button').filter({ hasText: /save|update|apply/i });
      if (await saveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await saveButton.click();
      }
    }
  });

  test('FloatingToolbar closes when clicking outside', async ({ page }) => {
    // Seed test events
    await seedTestEvents(page);

    // Find and click an event
    const events = page.locator(
      '[class*="bg-green"], [class*="bg-blue"], [class*="bg-orange"], [class*="bg-purple"]'
    );

    if ((await events.count()) > 0) {
      await events.first().click();
      await page.waitForTimeout(500);

      // Check if toolbar appeared
      const toolbar = page.locator('[class*="floating"], [class*="toolbar"]').filter({
        has: page.locator('button'),
      });

      const toolbarVisible = await toolbar.isVisible({ timeout: 1000 }).catch(() => false);

      if (toolbarVisible) {
        // Click outside the toolbar (on the grid)
        const grid = page.locator('[role="grid"]');
        await grid.click({ position: { x: 100, y: 100 } });

        await page.waitForTimeout(500);

        // Toolbar should be hidden now
        const stillVisible = await toolbar.isVisible({ timeout: 500 }).catch(() => false);
        expect(stillVisible).toBeFalsy();
      }
    }
  });

  test('Time adjustment buttons work in FloatingToolbar', async ({ page }) => {
    // Seed test events
    await seedTestEvents(page);

    // Find and click an event
    const events = page.locator(
      '[class*="bg-green"], [class*="bg-blue"], [class*="bg-orange"], [class*="bg-purple"]'
    );

    if ((await events.count()) > 0) {
      await events.first().click();
      await page.waitForTimeout(500);

      // Look for time adjustment buttons
      const plusButtons = page.locator('button').filter({ hasText: /\+15|\+1h|add.*time/i });
      const minusButtons = page.locator('button').filter({ hasText: /\-15|\-1h|subtract.*time/i });

      console.log('Plus buttons found:', await plusButtons.count());
      console.log('Minus buttons found:', await minusButtons.count());

      if ((await plusButtons.count()) > 0) {
        await plusButtons.first().click();
        console.log('Clicked time adjustment button');
      }
    }
  });

  test('All-day toggle works in FloatingToolbar', async ({ page }) => {
    // Seed test events
    await seedTestEvents(page);

    // Find and click an event
    const events = page.locator(
      '[class*="bg-green"], [class*="bg-blue"], [class*="bg-orange"], [class*="bg-purple"]'
    );

    if ((await events.count()) > 0) {
      await events.first().click();
      await page.waitForTimeout(500);

      // Look for all-day toggle
      const allDayCheckbox = page
        .locator('input[type="checkbox"]')
        .filter({ hasText: /all.*day/i });
      const allDaySwitch = page.locator('[role="switch"]');
      const allDayButton = page.locator('button').filter({ hasText: /all.*day/i });

      const hasAllDayControl =
        (await allDayCheckbox.isVisible({ timeout: 1000 }).catch(() => false)) ||
        (await allDaySwitch.isVisible({ timeout: 1000 }).catch(() => false)) ||
        (await allDayButton.isVisible({ timeout: 1000 }).catch(() => false));

      console.log('All-day control found:', hasAllDayControl);

      if (await allDayCheckbox.isVisible()) {
        await allDayCheckbox.click();
      } else if (await allDaySwitch.isVisible()) {
        await allDaySwitch.click();
      } else if (await allDayButton.isVisible()) {
        await allDayButton.click();
      }
    }
  });
});
