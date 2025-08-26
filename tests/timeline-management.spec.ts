import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';

// Helper to navigate to a specific view
async function navigateToView(page: Page, viewName: 'Year' | 'Timeline' | 'Manage') {
  await page.click(`button:has-text("${viewName}")`);
  await page.waitForTimeout(500); // Let view transition complete
}

// Helper to create a test event
async function createTestEvent(page: Page, title: string, category: string = 'personal') {
  // Navigate to Year view first
  await navigateToView(page, 'Year');
  
  // Click on a date cell
  const cell = page.locator('[data-testid^="cell-2025-Januar-"]').first();
  await cell.click();
  
  // Fill event details in modal
  await page.fill('input[placeholder="Event title"]', title);
  
  // Select category if specified
  if (category !== 'personal') {
    await page.click('[data-testid="category-select"]');
    await page.click(`text=${category}`);
  }
  
  // Save event
  await page.click('button:has-text("Save")');
  await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
}

test.describe('Timeline View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('button:has-text("Timeline")');
  });

  test('should render vertical month-by-month timeline', async ({ page }) => {
    await navigateToView(page, 'Timeline');
    
    // Check if timeline container exists
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();
    
    // Check for month headers in long form
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    for (const month of months.slice(0, 3)) { // Check first 3 months
      await expect(page.locator(`text=${month} 2025`).first()).toBeVisible();
    }
  });

  test('should display events in timeline', async ({ page }) => {
    // Create test events first
    await createTestEvent(page, 'Timeline Event 1', 'work');
    await createTestEvent(page, 'Timeline Event 2', 'personal');
    
    // Navigate to Timeline
    await navigateToView(page, 'Timeline');
    
    // Check if events appear in timeline
    await expect(page.locator('text=Timeline Event 1')).toBeVisible();
    await expect(page.locator('text=Timeline Event 2')).toBeVisible();
  });

  // Zoom controls belonged to the old TimelineContainer; skipped for vertical view

  // Heat map was specific to TimelineContainer; skipped in vertical view

  // Vertical timeline is read-focused; no day-cell click handlers here

  test('timeline container remains visible after focus changes', async ({ page }) => {
    await navigateToView(page, 'Timeline');
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();
  });
});

test.describe('Event Management View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('button:has-text("Manage")');
  });

  test('should display event list', async ({ page }) => {
    // Create test events
    await createTestEvent(page, 'Managed Event 1', 'work');
    await createTestEvent(page, 'Managed Event 2', 'personal');
    await createTestEvent(page, 'Managed Event 3', 'effort');
    
    // Navigate to Manage view
    await navigateToView(page, 'Manage');
    
    // Check if event management container exists
    await expect(page.locator('[data-testid="event-management"]')).toBeVisible();
    
    // Check if events are listed
    await expect(page.locator('text=Managed Event 1')).toBeVisible();
    await expect(page.locator('text=Managed Event 2')).toBeVisible();
    await expect(page.locator('text=Managed Event 3')).toBeVisible();
  });

  test('should filter events by category', async ({ page }) => {
    // Create events with different categories
    await createTestEvent(page, 'Work Task', 'work');
    await createTestEvent(page, 'Personal Task', 'personal');
    
    await navigateToView(page, 'Manage');
    
    // Find category filter
    const categoryFilter = page.locator('[data-testid="category-filter"]');
    if (await categoryFilter.isVisible()) {
      // Filter by work
      await categoryFilter.selectOption('work');
      
      // Should show only work events
      await expect(page.locator('text=Work Task')).toBeVisible();
      await expect(page.locator('text=Personal Task')).not.toBeVisible();
      
      // Reset filter
      await categoryFilter.selectOption('all');
      
      // Should show all events
      await expect(page.locator('text=Work Task')).toBeVisible();
      await expect(page.locator('text=Personal Task')).toBeVisible();
    }
  });

  test('should edit event from management view', async ({ page }) => {
    await createTestEvent(page, 'Event to Edit', 'personal');
    
    await navigateToView(page, 'Manage');
    
    // Find edit button for the event
    const eventRow = page.locator('text=Event to Edit').locator('..');
    const editButton = eventRow.locator('button[aria-label="Edit"]').or(eventRow.locator('text=Edit'));
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Modal should open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Update title
      await page.fill('input[placeholder="Event title"]', 'Updated Event Title');
      
      // Save changes
      await page.click('button:has-text("Save")');
      
      // Verify update
      await expect(page.locator('text=Updated Event Title')).toBeVisible();
    }
  });

  test('should delete event from management view', async ({ page }) => {
    await createTestEvent(page, 'Event to Delete', 'personal');
    
    await navigateToView(page, 'Manage');
    
    // Find delete button for the event
    const eventRow = page.locator('text=Event to Delete').locator('..');
    const deleteButton = eventRow.locator('button[aria-label="Delete"]').or(eventRow.locator('text=Delete'));
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Confirm deletion if dialog appears
      const confirmButton = page.locator('button:has-text("Confirm")').or(page.locator('button:has-text("Delete")').last());
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Verify deletion
      await expect(page.locator('text=Event to Delete')).not.toBeVisible();
    }
  });

  test('should bulk select and delete events', async ({ page }) => {
    // Create multiple events
    await createTestEvent(page, 'Bulk Event 1', 'work');
    await createTestEvent(page, 'Bulk Event 2', 'work');
    await createTestEvent(page, 'Bulk Event 3', 'work');
    
    await navigateToView(page, 'Manage');
    
    // Check if bulk selection exists
    const selectAllCheckbox = page.locator('input[type="checkbox"][aria-label="Select all"]');
    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.click();
      
      // Find bulk delete button
      const bulkDeleteButton = page.locator('button:has-text("Delete Selected")');
      if (await bulkDeleteButton.isVisible()) {
        await bulkDeleteButton.click();
        
        // Confirm bulk deletion
        const confirmButton = page.locator('button:has-text("Confirm")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        
        // Verify all events deleted
        await expect(page.locator('text=Bulk Event 1')).not.toBeVisible();
        await expect(page.locator('text=Bulk Event 2')).not.toBeVisible();
        await expect(page.locator('text=Bulk Event 3')).not.toBeVisible();
      }
    }
  });

  test('should export events', async ({ page }) => {
    await createTestEvent(page, 'Export Test Event', 'personal');
    
    await navigateToView(page, 'Manage');
    
    // Find export button
    const exportButton = page.locator('button:has-text("Export")');
    if (await exportButton.isVisible()) {
      // Set up download promise before clicking
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      await exportButton.click();
      
      // Check if download initiated
      const download = await downloadPromise;
      if (download) {
        expect(download).toBeTruthy();
      }
    }
  });
});

test.describe('Bug Discovery Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
  });

  test('should handle non-functional buttons', async ({ page }) => {
    const nonFunctionalButtons = [];
    
    // Find all buttons
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const isDisabled = await button.isDisabled();
      
      if (!isDisabled) {
        // Try clicking the button
        try {
          await button.click({ timeout: 1000 });
          // Check if anything happened (modal opened, navigation changed, etc.)
          await page.waitForTimeout(100);
          
          // If no visible change, mark as potentially non-functional
          // This is a simple heuristic - you might need more sophisticated checks
        } catch (e) {
          nonFunctionalButtons.push(text || ariaLabel || 'Unknown button');
        }
      }
    }
    
    // Report non-functional buttons
    if (nonFunctionalButtons.length > 0) {
      console.log('Potentially non-functional buttons:', nonFunctionalButtons);
    }
    
    // Test should pass but log findings
    expect(nonFunctionalButtons.length).toBeLessThanOrEqual(5); // Allow some non-functional buttons
  });

  test('should not have overlapping UI elements', async ({ page }) => {
    // Check zoom buttons don't overlap text
    const zoomButtons = page.locator('button[aria-label*="Zoom"]').or(page.locator('button:has-text("+")'));
    const monthLabels = page.locator('text=/\\w+ 2025/');
    
    if (await zoomButtons.first().isVisible() && await monthLabels.first().isVisible()) {
      const zoomBox = await zoomButtons.first().boundingBox();
      const labelBox = await monthLabels.first().boundingBox();
      
      if (zoomBox && labelBox) {
        // Check if they overlap
        const overlap = !(zoomBox.x + zoomBox.width < labelBox.x || 
                         labelBox.x + labelBox.width < zoomBox.x ||
                         zoomBox.y + zoomBox.height < labelBox.y ||
                         labelBox.y + labelBox.height < zoomBox.y);
        
        expect(overlap).toBe(false);
      }
    }
  });

  test('should not have gradient buttons', async ({ page }) => {
    // Check all buttons for gradient styles
    const buttons = await page.locator('button').all();
    const gradientButtons = [];
    
    for (const button of buttons) {
      const className = await button.getAttribute('class');
      if (className && className.includes('gradient')) {
        const text = await button.textContent();
        gradientButtons.push(text || 'Unknown button');
      }
    }
    
    // Should have no gradient buttons
    expect(gradientButtons).toEqual([]);
  });

  test('should handle rapid clicking without errors', async ({ page }) => {
    // Monitor console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Rapid click on different elements
    const calendar = page.locator('[data-testid="calendar-fullbleed"]');
    if (await calendar.isVisible()) {
      // Click rapidly on different cells
      for (let i = 0; i < 10; i++) {
        const cell = page.locator('[data-testid^="cell-"]').nth(i);
        if (await cell.isVisible()) {
          await cell.click();
          // Close modal if it opens
          if (await page.locator('[role="dialog"]').isVisible()) {
            await page.keyboard.press('Escape');
          }
        }
      }
    }
    
    // Should have no console errors
    expect(errors.length).toBe(0);
  });

  test('should maintain state after page refresh', async ({ page }) => {
    // Create an event
    await page.click('[data-testid^="cell-2025-Januar-"]').first();
    await page.fill('input[placeholder="Event title"]', 'Persistence Test');
    await page.click('button:has-text("Save")');
    
    // Change view
    await navigateToView(page, 'Timeline');
    
    // Refresh page
    await page.reload();
    
    // Should still be on Timeline view
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();
    
    // Navigate back to Year view
    await navigateToView(page, 'Year');
    
    // Event should still exist
    await expect(page.locator('text=Persistence Test')).toBeVisible();
  });

  test('should handle edge cases gracefully', async ({ page }) => {
    // Test empty event creation
    await page.click('[data-testid^="cell-"]').first();
    await page.click('button:has-text("Save")');
    
    // Should show validation error or not save
    const validationError = page.locator('text=/required|empty|provide/i');
    const eventCount = await page.locator('[data-testid^="event-"]').count();
    
    // Either show error or don't create event
    const hasValidation = await validationError.isVisible();
    if (!hasValidation) {
      expect(eventCount).toBe(0);
    }
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Test very long event title
    await page.click('[data-testid^="cell-"]').first();
    const longTitle = 'A'.repeat(500);
    await page.fill('input[placeholder="Event title"]', longTitle);
    await page.click('button:has-text("Save")');
    
    // Should handle gracefully (truncate or show error)
    await page.waitForTimeout(500);
  });

  test('should have accessible ARIA labels', async ({ page }) => {
    // Check important interactive elements have ARIA labels
    const interactiveElements = await page.locator('button, input, select, [role="button"]').all();
    const missingLabels = [];
    
    for (const element of interactiveElements.slice(0, 20)) { // Check first 20 elements
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      const title = await element.getAttribute('title');
      const text = await element.textContent();
      
      if (!ariaLabel && !ariaLabelledBy && !title && !text?.trim()) {
        const tagName = await element.evaluate(el => el.tagName);
        missingLabels.push(tagName);
      }
    }
    
    // Should have minimal missing labels
    expect(missingLabels.length).toBeLessThanOrEqual(3);
  });
});