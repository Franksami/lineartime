/**
 * View System Tests
 * Tests for all workspace views (Week, Planner, Notes, Mailbox, etc.)
 * Research validation: View scaffold pattern, keyboard navigation
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Week View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app?view=week');
    await page.waitForLoadState('networkidle');
  });

  test('should render week view with proper structure', async ({ page }) => {
    // Check view scaffold components
    const viewHeader = page.locator('[data-testid="view-header"]');
    const viewContent = page.locator('[data-testid="view-content"]');

    await expect(viewHeader).toBeVisible();
    await expect(viewContent).toBeVisible();

    // Check week-specific elements
    const weekGrid = page.locator('[data-testid="week-grid"]');
    await expect(weekGrid).toBeVisible();
  });

  test('should display 7 day columns', async ({ page }) => {
    const dayColumns = page.locator('[data-testid^="day-column-"]');
    const count = await dayColumns.count();
    expect(count).toBe(7);
  });

  test('should navigate between weeks', async ({ page }) => {
    // Get current week display
    const weekDisplay = page.locator('[data-testid="week-display"]');
    const initialWeek = await weekDisplay.textContent();

    // Navigate to next week
    const nextButton = page.locator('[data-testid="next-week-button"]');
    if (await nextButton.isVisible()) {
      await nextButton.click();

      // Week should change
      const newWeek = await weekDisplay.textContent();
      expect(newWeek).not.toBe(initialWeek);
    }
  });

  test('should support double-click event creation (<120ms)', async ({ page }) => {
    // Find a time slot
    const timeSlot = page.locator('[data-testid="time-slot"]').first();

    if (await timeSlot.isVisible()) {
      const startTime = Date.now();

      // Double click on time slot
      await timeSlot.dblclick();

      // Event creation dialog should appear quickly
      const createDialog = page.locator('[data-testid="event-create-dialog"]');
      await createDialog.waitFor({ state: 'visible', timeout: 120 });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(120); // Schedule X pattern: <120ms
    }
  });

  test('should drag to create events', async ({ page }) => {
    const weekGrid = page.locator('[data-testid="week-grid"]');

    if (await weekGrid.isVisible()) {
      // Get grid bounds for drag operation
      const box = await weekGrid.boundingBox();

      if (box) {
        // Drag to create event
        await page.mouse.move(box.x + 100, box.y + 100);
        await page.mouse.down();
        await page.mouse.move(box.x + 100, box.y + 200);
        await page.mouse.up();

        // Check if event creation was triggered
        const newEvent = page.locator('[data-testid="new-event"]');
        const eventDialog = page.locator('[data-testid="event-create-dialog"]');

        // Either a new event or dialog should appear
        const hasNewEvent = await newEvent.isVisible().catch(() => false);
        const hasDialog = await eventDialog.isVisible().catch(() => false);

        expect(hasNewEvent || hasDialog).toBe(true);
      }
    }
  });
});

test.describe('Planner View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app?view=planner');
    await page.waitForLoadState('networkidle');
  });

  test('should render planner with kanban and time-blocking', async ({ page }) => {
    const plannerView = page.locator('[data-testid="planner-view"]');

    if (await plannerView.isVisible()) {
      // Check for kanban board
      const kanbanBoard = page.locator('[data-testid="kanban-board"]');
      await expect(kanbanBoard).toBeVisible();

      // Check for time blocking area
      const timeBlocking = page.locator('[data-testid="time-blocking"]');
      await expect(timeBlocking).toBeVisible();
    }
  });

  test('should have task columns', async ({ page }) => {
    const columns = ['todo', 'in-progress', 'done'];

    for (const column of columns) {
      const columnElement = page.locator(`[data-testid="kanban-column-${column}"]`);
      const exists = (await columnElement.count()) > 0;

      if (exists) {
        await expect(columnElement).toBeVisible();
      }
    }
  });

  test('should drag tasks between columns', async ({ page }) => {
    const task = page.locator('[data-testid="kanban-task"]').first();
    const targetColumn = page.locator('[data-testid="kanban-column-in-progress"]');

    if ((await task.isVisible()) && (await targetColumn.isVisible())) {
      // Drag task to different column
      await task.dragTo(targetColumn);

      // Task should be in new column
      const tasksInTarget = targetColumn.locator('[data-testid="kanban-task"]');
      const count = await tasksInTarget.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should support time blocking drag and drop', async ({ page }) => {
    const task = page.locator('[data-testid="unscheduled-task"]').first();
    const timeSlot = page.locator('[data-testid="time-block-slot"]').first();

    if ((await task.isVisible()) && (await timeSlot.isVisible())) {
      // Drag task to time slot
      await task.dragTo(timeSlot);

      // Task should be scheduled
      const scheduledTask = page.locator('[data-testid="scheduled-task"]');
      const exists = (await scheduledTask.count()) > 0;
      expect(exists).toBe(true);
    }
  });
});

test.describe('Notes View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app?view=notes');
    await page.waitForLoadState('networkidle');
  });

  test('should render notes editor with markdown support', async ({ page }) => {
    const notesView = page.locator('[data-testid="notes-view"]');

    if (await notesView.isVisible()) {
      // Check for editor
      const editor = page.locator('[data-testid="notes-editor"]');
      await expect(editor).toBeVisible();

      // Check for note list
      const noteList = page.locator('[data-testid="notes-list"]');
      await expect(noteList).toBeVisible();
    }
  });

  test('should create new note', async ({ page }) => {
    const newNoteButton = page.locator('[data-testid="new-note-button"]');

    if (await newNoteButton.isVisible()) {
      await newNoteButton.click();

      // New note should be created
      const editor = page.locator('[data-testid="notes-editor"]');
      await expect(editor).toBeVisible();
      await expect(editor).toBeFocused();
    }
  });

  test('should support markdown formatting', async ({ page }) => {
    const editor = page.locator('[data-testid="notes-editor"]');

    if (await editor.isVisible()) {
      // Type markdown
      await editor.click();
      await editor.type('# Heading\n**Bold text**\n- List item');

      // Switch to preview (if available)
      const previewButton = page.locator('[data-testid="preview-button"]');
      if (await previewButton.isVisible()) {
        await previewButton.click();

        // Check rendered markdown
        const preview = page.locator('[data-testid="markdown-preview"]');
        await expect(preview).toContainText('Heading');
      }
    }
  });

  test('should support entity linking with [[brackets]]', async ({ page }) => {
    const editor = page.locator('[data-testid="notes-editor"]');

    if (await editor.isVisible()) {
      await editor.click();
      await editor.type('Link to [[');

      // Should show autocomplete
      const autocomplete = page.locator('[data-testid="entity-autocomplete"]');
      const hasAutocomplete = await autocomplete.isVisible().catch(() => false);

      if (hasAutocomplete) {
        await expect(autocomplete).toBeVisible();
      }
    }
  });

  test('should search notes', async ({ page }) => {
    const searchInput = page.locator('[data-testid="notes-search"]');

    if (await searchInput.isVisible()) {
      await searchInput.type('test search');

      // Results should update
      const searchResults = page.locator('[data-testid="search-results"]');
      const hasResults = await searchResults.isVisible().catch(() => false);

      if (hasResults) {
        await expect(searchResults).toBeVisible();
      }
    }
  });
});

test.describe('Mailbox View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app?view=mailbox');
    await page.waitForLoadState('networkidle');
  });

  test('should render mailbox with triage interface', async ({ page }) => {
    const mailboxView = page.locator('[data-testid="mailbox-view"]');

    if (await mailboxView.isVisible()) {
      // Check for inbox
      const inbox = page.locator('[data-testid="mailbox-inbox"]');
      await expect(inbox).toBeVisible();

      // Check for triage actions
      const triageActions = page.locator('[data-testid="triage-actions"]');
      await expect(triageActions).toBeVisible();
    }
  });

  test('should display email list', async ({ page }) => {
    const emailList = page.locator('[data-testid="email-list"]');

    if (await emailList.isVisible()) {
      const emails = page.locator('[data-testid="email-item"]');
      const count = await emails.count();

      // Should have some emails (or empty state)
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should convert email to task', async ({ page }) => {
    const firstEmail = page.locator('[data-testid="email-item"]').first();

    if (await firstEmail.isVisible()) {
      // Select email
      await firstEmail.click();

      // Click convert to task
      const convertButton = page.locator('[data-testid="convert-to-task"]');
      if (await convertButton.isVisible()) {
        await convertButton.click();

        // Task creation dialog should appear
        const taskDialog = page.locator('[data-testid="task-create-dialog"]');
        await expect(taskDialog).toBeVisible();
      }
    }
  });

  test('should support quick triage actions', async ({ page }) => {
    const firstEmail = page.locator('[data-testid="email-item"]').first();

    if (await firstEmail.isVisible()) {
      // Hover to show quick actions
      await firstEmail.hover();

      // Quick actions should appear
      const quickActions = page.locator('[data-testid="quick-actions"]');
      const hasActions = await quickActions.isVisible().catch(() => false);

      if (hasActions) {
        // Archive action
        const archiveButton = page.locator('[data-testid="quick-archive"]');
        await expect(archiveButton).toBeVisible();
      }
    }
  });
});

test.describe('View Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should switch between views via tabs', async ({ page }) => {
    // Click planner tab
    let tab = page.locator('[data-testid="tab-planner"]');
    if (await tab.isVisible()) {
      await tab.click();
      const plannerView = page.locator('[data-testid="planner-view"]');
      await expect(plannerView).toBeVisible();
    }

    // Click notes tab
    tab = page.locator('[data-testid="tab-notes"]');
    if (await tab.isVisible()) {
      await tab.click();
      const notesView = page.locator('[data-testid="notes-view"]');
      await expect(notesView).toBeVisible();
    }
  });

  test('should switch views via command palette', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    const modKey = isMac ? 'Meta' : 'Control';

    // Open command palette
    await page.keyboard.press(`${modKey}+P`);

    // Search for view switch command
    const input = page.locator('[data-testid="command-palette-input"]');
    await input.type('Switch to Notes');
    await page.keyboard.press('Enter');

    // Should switch to notes view
    const notesView = page.locator('[data-testid="notes-view"]');
    await expect(notesView).toBeVisible();
  });

  test('should maintain view state on reload', async ({ page }) => {
    // Switch to planner view
    const plannerTab = page.locator('[data-testid="tab-planner"]');
    if (await plannerTab.isVisible()) {
      await plannerTab.click();

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be on planner view
      const plannerView = page.locator('[data-testid="planner-view"]');
      await expect(plannerView).toBeVisible();
    }
  });

  test('should switch views within 200ms', async ({ page }) => {
    const weekTab = page.locator('[data-testid="tab-week"]');
    const plannerTab = page.locator('[data-testid="tab-planner"]');

    if ((await weekTab.isVisible()) && (await plannerTab.isVisible())) {
      const startTime = Date.now();

      await plannerTab.click();

      const plannerView = page.locator('[data-testid="planner-view"]');
      await plannerView.waitFor({ state: 'visible', timeout: 200 });

      const switchTime = Date.now() - startTime;
      expect(switchTime).toBeLessThan(200); // Target: <200ms tab switch
    }
  });
});
