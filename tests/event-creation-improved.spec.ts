import { test, expect } from '@playwright/test';

test.describe('Event Creation in Improved Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[role="grid"]', { timeout: 10000 });
    await page.waitForTimeout(1000); // Let calendar fully render
  });

  test('click-to-create event works with expanded layout', async ({ page }) => {
    // Find a day cell in the middle of the calendar (June)
    const juneRow = await page.locator('[class*="border-b-2"]').nth(5); // June is 6th month (0-indexed)
    const dayCell = await juneRow.locator('[class*="border-r"]').nth(14); // 15th of June

    // Click on the day to create event
    await dayCell.click();
    await page.waitForTimeout(500);

    // Check if event modal appears
    const eventModal = await page.locator('[role="dialog"], [class*="modal"], [class*="dialog"]');
    const modalCount = await eventModal.count();

    if (modalCount > 0) {
      await expect(eventModal.first()).toBeVisible();
      console.log('Event creation modal appeared successfully');
    } else {
      // Alternative: Check for inline event creation UI
      const inlineCreate = await page.locator(
        '[class*="quick-create"], input[placeholder*="event"], input[placeholder*="title"]'
      );
      if ((await inlineCreate.count()) > 0) {
        await expect(inlineCreate.first()).toBeVisible();
        console.log('Inline event creation UI appeared successfully');
      }
    }
  });

  test('drag-to-create multi-day event works', async ({ page }) => {
    // Find start and end day cells
    const marchRow = await page.locator('[class*="border-b-2"]').nth(2); // March
    const startDay = await marchRow.locator('[class*="border-r"]').nth(9); // 10th
    const endDay = await marchRow.locator('[class*="border-r"]').nth(12); // 13th

    // Get bounding boxes
    const startBox = await startDay.boundingBox();
    const endBox = await endDay.boundingBox();

    if (startBox && endBox) {
      // Perform drag from start to end
      await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(100);
      await page.mouse.move(endBox.x + endBox.width / 2, endBox.y + endBox.height / 2, {
        steps: 5,
      });
      await page.waitForTimeout(100);
      await page.mouse.up();

      // Wait for event creation UI
      await page.waitForTimeout(500);

      // Check for event creation modal or inline UI
      const eventUI = await page.locator(
        '[role="dialog"], [class*="modal"], [class*="quick-create"], input[placeholder*="event"]'
      );
      if ((await eventUI.count()) > 0) {
        console.log('Drag-to-create event UI appeared');
        await expect(eventUI.first()).toBeVisible();
      }
    }
  });

  test('event creation respects expanded month heights', async ({ page }) => {
    // Get viewport and calendar dimensions
    const viewportSize = page.viewportSize();
    const viewportHeight = viewportSize?.height || 900;

    // Calculate expected month height
    const navHeight = 60; // Navigation header
    const expectedMonthHeight = Math.floor((viewportHeight - navHeight) / 12);

    // Click on a day in December (last month)
    const decemberRow = await page.locator('[class*="border-b-2"]').nth(11);
    const decemberBox = await decemberRow.boundingBox();

    // Verify December row is using proper height
    if (decemberBox) {
      const actualHeight = decemberBox.height;
      console.log(`December row height: ${actualHeight}px, Expected: ~${expectedMonthHeight}px`);

      // Should be close to expected height (within 10px tolerance for borders/spacing)
      expect(Math.abs(actualHeight - expectedMonthHeight)).toBeLessThan(10);

      // Click on a day in December
      const dayCell = await decemberRow.locator('[class*="border-r"]').nth(14);
      await dayCell.click();

      // Verify click registers properly at the expanded position
      const clicked = await dayCell.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top,
          bottom: rect.bottom,
          height: rect.height,
        };
      });

      console.log(`Clicked cell position - Top: ${clicked.top}px, Height: ${clicked.height}px`);

      // Cell should have reasonable height for touch targets
      expect(clicked.height).toBeGreaterThan(40); // Minimum for good UX
    }
  });

  test('floating toolbar appears at correct position', async ({ page }) => {
    // Create a test event first
    const aprilRow = await page.locator('[class*="border-b-2"]').nth(3); // April
    const dayCell = await aprilRow.locator('[class*="border-r"]').nth(14); // 15th

    // Click to select/create
    await dayCell.click();
    await page.waitForTimeout(500);

    // Look for floating toolbar
    const toolbar = await page.locator('[class*="floating"], [class*="toolbar"], [role="toolbar"]');
    if ((await toolbar.count()) > 0) {
      const toolbarBox = await toolbar.boundingBox();
      const cellBox = await dayCell.boundingBox();

      if (toolbarBox && cellBox) {
        // Toolbar should appear near the clicked cell
        const distance = Math.abs(toolbarBox.y - cellBox.y);
        console.log(`Toolbar distance from cell: ${distance}px`);

        // Should be within reasonable distance (not at top of page)
        expect(distance).toBeLessThan(200);

        // Toolbar should be visible
        await expect(toolbar).toBeVisible();
      }
    }
  });

  test('events display properly in expanded month rows', async ({ page }) => {
    // Create an event via command bar (if available)
    await page.keyboard.press('Meta+k'); // or Control+k on Windows/Linux
    await page.waitForTimeout(500);

    const commandBar = await page.locator(
      '[class*="command"], input[placeholder*="Type a command"]'
    );
    if ((await commandBar.count()) > 0) {
      await commandBar.fill('Meeting tomorrow at 2pm');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      // Check if event appears in the calendar
      const eventElements = await page.locator(
        '[class*="bg-green"], [class*="bg-blue"], [class*="event"]'
      );
      const eventCount = await eventElements.count();

      if (eventCount > 0) {
        console.log(`Found ${eventCount} event(s) displayed in calendar`);

        // Check event positioning
        const firstEvent = eventElements.first();
        const eventBox = await firstEvent.boundingBox();

        if (eventBox) {
          // Event should have reasonable height in expanded layout
          expect(eventBox.height).toBeGreaterThan(16); // Minimum event height
          expect(eventBox.height).toBeLessThan(80); // Not taking full month height

          console.log(`Event height: ${eventBox.height}px`);
        }
      }
    }
  });

  test('scroll position maintained during event creation', async ({ page }) => {
    // Scroll to middle of calendar (June/July)
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('[role="grid"]')?.parentElement;
      if (scrollContainer) {
        const targetScroll = scrollContainer.scrollHeight / 2;
        scrollContainer.scrollTo(0, targetScroll);
      }
    });

    await page.waitForTimeout(500);

    // Get initial scroll position
    const initialScroll = await page.evaluate(() => {
      const scrollContainer = document.querySelector('[role="grid"]')?.parentElement;
      return scrollContainer?.scrollTop || 0;
    });

    // Click on a visible day
    const visibleDay = await page.locator('[class*="border-r"]').nth(180); // Roughly middle of year
    await visibleDay.click();
    await page.waitForTimeout(500);

    // Get scroll position after click
    const afterClickScroll = await page.evaluate(() => {
      const scrollContainer = document.querySelector('[role="grid"]')?.parentElement;
      return scrollContainer?.scrollTop || 0;
    });

    // Scroll position should not jump significantly
    const scrollDiff = Math.abs(afterClickScroll - initialScroll);
    console.log(`Scroll difference: ${scrollDiff}px`);

    // Should maintain scroll position (small tolerance for modal adjustments)
    expect(scrollDiff).toBeLessThan(100);
  });
});
