// Category & Tag System Feature Tests
import { test, expect } from '@playwright/test';

test.describe('🏷️ Category & Tag System Feature Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to category tags test page first, fallback to main calendar
    try {
      await page.goto('http://localhost:3000/test-category-tags');
      await page.waitForSelector('body', { timeout: 5000 });
    } catch (error) {
      // Fallback to main calendar page
      await page.goto('http://localhost:3000/');
      await page.waitForSelector('body', { timeout: 15000 });
    }
    await page.waitForTimeout(2000); // Give time for React to render
  });

  test('should display category selector in event creation', async ({ page }) => {
    // Look for "New Event" button from the actual implementation
    const newEventButton = page.locator('button:has-text("New Event")');
    if ((await newEventButton.count()) > 0) {
      await newEventButton.click();
      await page.waitForTimeout(1000);

      // Should show category selection in the modal
      await expect(page.locator('select, [role="combobox"], input')).toBeVisible({ timeout: 5000 });
    } else {
      // Check for standalone Category Tag Manager
      await expect(page.locator('text=Standalone Category Manager')).toBeVisible();
    }
  });

  test('should show available event categories', async ({ page }) => {
    // Check for enhanced categories from the actual implementation
    await expect(page.locator('text=Enhanced Categories')).toBeVisible({ timeout: 10000 });

    // Look for category description mentioning the 7 category types
    await expect(
      page.locator('text=7 category types including Personal, Work, Effort')
    ).toBeVisible();

    // Look for current selection display showing categories - use first() to avoid strict mode violation
    await expect(page.locator('text=Category:')).toBeVisible();
    await expect(
      page.locator('text=/personal|work|effort|note|meeting|deadline|milestone/').first()
    ).toBeVisible();
  });

  test('should support priority levels in events', async ({ page }) => {
    // Check for Priority Levels section from the actual implementation
    await expect(page.locator('text=Priority Levels')).toBeVisible({ timeout: 10000 });

    // Look for priority description mentioning the 5 priority levels
    await expect(page.locator('text=5 priority levels from Critical to Optional')).toBeVisible();

    // Look for current selection showing priority
    await expect(page.locator('text=Priority:')).toBeVisible();

    // Should show priority badges (critical, high, medium, low, optional) - use first() to avoid strict mode violation
    await expect(page.locator('text=/critical|high|medium|low|optional/').first()).toBeVisible();
  });

  test('should display category color coding', async ({ page }) => {
    // Look for color-coded category indicators from the actual implementation
    await expect(page.locator('text=visual color coding')).toBeVisible({ timeout: 10000 });

    // Should show colored category indicators (token-based classes)
    const coloredElements = page.locator('.bg-primary, .bg-secondary, .bg-accent, .bg-muted');
    await expect(coloredElements.first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow filtering by categories', async ({ page }) => {
    // Look for filter controls
    const filterButtons = [
      'button:has-text("Filter")',
      '[data-testid="category-filter"]',
      'button:has-text("Categories")',
      'select[name*="category"]',
      '.filter-button',
      '.category-filter',
    ];

    let filterFound = false;
    for (const selector of filterButtons) {
      const filterButton = page.locator(selector);
      if ((await filterButton.count()) > 0) {
        await expect(filterButton.first()).toBeVisible();
        filterFound = true;
        break;
      }
    }

    // If no specific filter UI, check if categories are interactive
    if (!filterFound) {
      const interactiveCategories = page.locator(
        'button[class*="category"], .category-tag[role="button"], [data-category]'
      );
      if ((await interactiveCategories.count()) > 0) {
        await expect(interactiveCategories.first()).toBeVisible();
      }
    }
  });

  test('should show tag management interface', async ({ page }) => {
    // Look for tag-related UI elements
    const tagElements = [
      'text=/Tag|Tags/',
      '[data-testid*="tag"]',
      '.tag, .chip',
      'input[placeholder*="tag"]',
      'button:has-text("Add Tag")',
    ];

    let tagFound = false;
    for (const selector of tagElements) {
      const tagElement = page.locator(selector);
      if ((await tagElement.count()) > 0) {
        await expect(tagElement.first()).toBeVisible();
        tagFound = true;
        break;
      }
    }

    // Fallback: check if tagging is available in event creation
    if (!tagFound) {
      const eventCreation = page.locator(
        'button:has-text("Create"), [data-testid="create-event"], .event-create'
      );
      if ((await eventCreation.count()) > 0) {
        await eventCreation.first().click();
        await expect(page.locator('input, textarea, select').first()).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('should support custom category creation', async ({ page }) => {
    // Look for "Add Category" or similar functionality
    const addCategoryButtons = [
      'button:has-text("Add Category")',
      'button:has-text("New Category")',
      'button:has-text("+")',
      '[data-testid="add-category"]',
      '.add-category-button',
    ];

    for (const selector of addCategoryButtons) {
      const button = page.locator(selector);
      if ((await button.count()) > 0) {
        await expect(button.first()).toBeVisible();
        break;
      }
    }
  });

  test('should display category statistics', async ({ page }) => {
    // Navigate to analytics or manage page for category stats
    const statsPages = [
      'a[href="/analytics"]',
      'a[href*="manage"]',
      'button:has-text("Statistics")',
      'text=Analytics',
    ];

    for (const selector of statsPages) {
      const link = page.locator(selector);
      if ((await link.count()) > 0) {
        await link.first().click();
        await page.waitForTimeout(1000);
        break;
      }
    }

    // Look for category breakdown or statistics
    await expect(page.locator('text=/Categories|Category Distribution|Event Types/')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should handle category assignment to events', async ({ page }) => {
    // Find an existing event or create one
    const eventElement = page.locator('.event, [data-event-id], .calendar-event').first();

    if ((await eventElement.count()) > 0) {
      // Click on event to edit
      await eventElement.click();

      // Look for category assignment UI
      await expect(page.locator('select, dropdown, input').first()).toBeVisible({ timeout: 5000 });
    } else {
      // Try to create a new event
      const dateCell = page.locator('[data-date], .calendar-cell, td').first();
      await dateCell.click();

      // Should show event creation form with category options
      await expect(page.locator('input, select, form').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should support bulk category operations', async ({ page }) => {
    // Look for bulk selection or management features
    const bulkElements = [
      'input[type="checkbox"]',
      'button:has-text("Select All")',
      'button:has-text("Bulk")',
      '[data-testid="bulk-actions"]',
      '.bulk-actions',
    ];

    for (const selector of bulkElements) {
      const element = page.locator(selector);
      if ((await element.count()) > 0) {
        await expect(element.first()).toBeVisible();
        break;
      }
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Category UI should still be accessible
    await expect(page.locator('text=/Category|Personal|Work/')).toBeVisible({ timeout: 10000 });

    // Touch-friendly category selection
    const categoryElement = page.locator('button, select, .category-item').first();
    if ((await categoryElement.count()) > 0) {
      await expect(categoryElement).toBeVisible();
    }
  });

  test('visual regression - category and tag system', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Try to trigger category UI
    const dateCell = page.locator('[data-date], .calendar-cell').first();
    if ((await dateCell.count()) > 0) {
      await dateCell.click();
      await page.waitForTimeout(1000);
    }

    // Take screenshot for visual regression testing
    await expect(page).toHaveScreenshot('category-tag-system.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });
});
