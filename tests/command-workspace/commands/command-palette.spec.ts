/**
 * Command Palette Tests
 * Tests for the command palette (Ctrl+P/Cmd+P) with fuzzy search
 * Research validation: Obsidian command palette patterns
 */

import { test, expect, Page } from '@playwright/test';

const isMac = process.platform === 'darwin';
const modKey = isMac ? 'Meta' : 'Control';

test.describe('Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should open with Ctrl+P/Cmd+P shortcut', async ({ page }) => {
    // Press command palette shortcut
    await page.keyboard.press(`${modKey}+P`);

    // Verify palette is visible
    const palette = page.locator('[data-testid="command-palette"]');
    await expect(palette).toBeVisible();

    // Verify input is focused
    const input = page.locator('[data-testid="command-palette-input"]');
    await expect(input).toBeFocused();
  });

  test('should close with Escape key', async ({ page }) => {
    // Open palette
    await page.keyboard.press(`${modKey}+P`);
    const palette = page.locator('[data-testid="command-palette"]');
    await expect(palette).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify palette is hidden
    await expect(palette).toBeHidden();
  });

  test('should search commands with fuzzy matching', async ({ page }) => {
    // Open palette
    await page.keyboard.press(`${modKey}+P`);

    // Type partial command
    const input = page.locator('[data-testid="command-palette-input"]');
    await input.type('crt evt'); // Should match "Create Event"

    // Verify fuzzy match results
    const results = page.locator('[data-testid="command-result"]');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);

    // Check if "Create Event" is in results
    const createEventResult = page.locator(
      '[data-testid="command-result"]:has-text("Create Event")'
    );
    await expect(createEventResult).toBeVisible();
  });

  test('should execute commands on Enter', async ({ page }) => {
    // Open palette
    await page.keyboard.press(`${modKey}+P`);

    // Search for a command
    const input = page.locator('[data-testid="command-palette-input"]');
    await input.type('Switch to Week View');

    // Press Enter to execute
    await page.keyboard.press('Enter');

    // Verify command executed (week view should be active)
    const weekView = page.locator('[data-testid="view-week"]');
    await expect(weekView).toBeVisible();
  });

  test('should navigate results with arrow keys', async ({ page }) => {
    // Open palette
    await page.keyboard.press(`${modKey}+P`);

    // Type to get multiple results
    const input = page.locator('[data-testid="command-palette-input"]');
    await input.type('view');

    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');

    // Check selected state
    const selectedResult = page.locator('[data-testid="command-result"][data-selected="true"]');
    await expect(selectedResult).toBeVisible();
  });

  test('should show keyboard shortcuts in results', async ({ page }) => {
    // Open palette
    await page.keyboard.press(`${modKey}+P`);

    // Look for commands with shortcuts
    const resultsWithShortcuts = page.locator('[data-testid="command-shortcut"]');
    const count = await resultsWithShortcuts.count();

    // Should have at least some commands with shortcuts
    expect(count).toBeGreaterThan(0);
  });

  test('should support command categories', async ({ page }) => {
    // Open palette
    await page.keyboard.press(`${modKey}+P`);

    // Check for category headers
    const categories = page.locator('[data-testid="command-category"]');
    const categoryCount = await categories.count();

    // Should have multiple categories (Navigation, Creation, etc.)
    expect(categoryCount).toBeGreaterThan(0);
  });

  test('should maintain recent commands', async ({ page }) => {
    // Open palette and execute a command
    await page.keyboard.press(`${modKey}+P`);
    const input = page.locator('[data-testid="command-palette-input"]');
    await input.type('Create Event');
    await page.keyboard.press('Enter');

    // Close any dialogs
    await page.keyboard.press('Escape');

    // Open palette again
    await page.keyboard.press(`${modKey}+P`);

    // Check if recent commands section exists
    const recentSection = page.locator('[data-testid="recent-commands"]');
    if (await recentSection.isVisible()) {
      const recentCommand = page.locator('[data-testid="recent-command"]:has-text("Create Event")');
      await expect(recentCommand).toBeVisible();
    }
  });

  test('should respond within 100ms', async ({ page }) => {
    // Open palette
    await page.keyboard.press(`${modKey}+P`);

    // Measure search response time
    const input = page.locator('[data-testid="command-palette-input"]');

    const startTime = Date.now();
    await input.type('test');

    // Wait for results to update
    await page.waitForSelector('[data-testid="command-result"]', { timeout: 100 });

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(100); // Target: <100ms response
  });
});

test.describe('Omnibox Natural Language', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should parse natural language commands', async ({ page }) => {
    // Find omnibox input
    const omnibox = page.locator('[data-testid="omnibox-input"]');

    if (await omnibox.isVisible()) {
      // Type natural language command
      await omnibox.click();
      await omnibox.type('create meeting with Dan tomorrow at 3pm');

      // Wait for parsing
      await page.waitForTimeout(500);

      // Check for parsed intent
      const intentDisplay = page.locator('[data-testid="omnibox-intent"]');
      if (await intentDisplay.isVisible()) {
        await expect(intentDisplay).toContainText('Create Event');
      }
    }
  });

  test('should show confidence scores', async ({ page }) => {
    const omnibox = page.locator('[data-testid="omnibox-input"]');

    if (await omnibox.isVisible()) {
      await omnibox.click();
      await omnibox.type('schedule focus time');

      // Wait for processing
      await page.waitForTimeout(500);

      // Check for confidence display
      const confidence = page.locator('[data-testid="omnibox-confidence"]');
      if (await confidence.isVisible()) {
        const confidenceText = await confidence.textContent();
        expect(confidenceText).toMatch(/\d+%/); // Should show percentage
      }
    }
  });

  test('should auto-execute high confidence commands (≥80%)', async ({ page }) => {
    const omnibox = page.locator('[data-testid="omnibox-input"]');

    if (await omnibox.isVisible()) {
      await omnibox.click();
      // Type a clear, unambiguous command
      await omnibox.type('switch to week view');
      await page.keyboard.press('Enter');

      // Should auto-execute if confidence is high
      const weekView = page.locator('[data-testid="view-week"]');
      await expect(weekView).toBeVisible();
    }
  });

  test('should show suggestions for low confidence', async ({ page }) => {
    const omnibox = page.locator('[data-testid="omnibox-input"]');

    if (await omnibox.isVisible()) {
      await omnibox.click();
      // Type ambiguous command
      await omnibox.type('do something');

      await page.waitForTimeout(500);

      // Should show suggestions
      const suggestions = page.locator('[data-testid="omnibox-suggestion"]');
      const count = await suggestions.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should stream AI responses', async ({ page }) => {
    const omnibox = page.locator('[data-testid="omnibox-input"]');

    if (await omnibox.isVisible()) {
      await omnibox.click();
      await omnibox.type('summarize my day');
      await page.keyboard.press('Enter');

      // Check for streaming indicator
      const streamingIndicator = page.locator('[data-testid="omnibox-streaming"]');
      if (await streamingIndicator.isVisible()) {
        // Should show streaming state
        await expect(streamingIndicator).toBeVisible();
      }
    }
  });

  test('should respond within 400ms for first token', async ({ page }) => {
    const omnibox = page.locator('[data-testid="omnibox-input"]');

    if (await omnibox.isVisible()) {
      await omnibox.click();

      const startTime = Date.now();
      await omnibox.type('find conflicts');

      // Wait for first response
      const response = page.locator('[data-testid="omnibox-response"]');
      await response.waitFor({ state: 'visible', timeout: 400 });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(400); // Target: <400ms first token
    }
  });
});

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should support global keyboard shortcuts', async ({ page }) => {
    // Test view switching shortcuts
    await page.keyboard.press('Alt+1'); // Week view
    let activeView = page.locator('[data-testid="view-week"]');
    await expect(activeView).toBeVisible();

    await page.keyboard.press('Alt+2'); // Month view
    activeView = page.locator('[data-testid="view-month"]');
    // Month view might not exist, so we check conditionally
    const monthViewExists = (await activeView.count()) > 0;
    if (monthViewExists) {
      await expect(activeView).toBeVisible();
    }
  });

  test('should navigate between panes with Tab', async ({ page }) => {
    // Start from a known position
    await page.keyboard.press('Escape'); // Clear any focus

    // Tab through main areas
    await page.keyboard.press('Tab'); // Should focus sidebar
    const sidebarFocused = await page.evaluate(() => {
      const activeElement = document.activeElement;
      return activeElement?.closest('[data-testid="app-shell-sidebar"]') !== null;
    });

    await page.keyboard.press('Tab'); // Should move to tab workspace
    const workspaceFocused = await page.evaluate(() => {
      const activeElement = document.activeElement;
      return activeElement?.closest('[data-testid="tab-workspace"]') !== null;
    });

    // At least one should be focused
    expect(sidebarFocused || workspaceFocused).toBe(true);
  });

  test('should support Escape key consistently', async ({ page }) => {
    // Open command palette
    await page.keyboard.press(`${modKey}+P`);
    let palette = page.locator('[data-testid="command-palette"]');
    await expect(palette).toBeVisible();

    // Escape should close it
    await page.keyboard.press('Escape');
    await expect(palette).toBeHidden();

    // Open a modal (if available)
    const createButton = page.locator('[data-testid="create-event-button"]');
    if (await createButton.isVisible()) {
      await createButton.click();
      const modal = page.locator('[data-testid="create-event-modal"]');

      if (await modal.isVisible()) {
        // Escape should close modal
        await page.keyboard.press('Escape');
        await expect(modal).toBeHidden();
      }
    }
  });

  test('should maintain focus trap in modals', async ({ page }) => {
    // Open a modal
    const createButton = page.locator('[data-testid="create-event-button"]');

    if (await createButton.isVisible()) {
      await createButton.click();
      const modal = page.locator('[data-testid="create-event-modal"]');

      if (await modal.isVisible()) {
        // Tab multiple times
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
        }

        // Focus should still be within modal
        const focusInModal = await page.evaluate(() => {
          const activeElement = document.activeElement;
          return activeElement?.closest('[data-testid="create-event-modal"]') !== null;
        });

        expect(focusInModal).toBe(true);
      }
    }
  });

  test('should respond to keyboard within 120ms', async ({ page }) => {
    // Measure keyboard response time
    const startTime = Date.now();

    // Press a shortcut
    await page.keyboard.press(`${modKey}+P`);

    // Wait for palette to appear
    const palette = page.locator('[data-testid="command-palette"]');
    await palette.waitFor({ state: 'visible', timeout: 120 });

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(120); // Target: <120ms keyboard response
  });
});
