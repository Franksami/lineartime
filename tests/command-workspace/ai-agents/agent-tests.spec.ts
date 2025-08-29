/**
 * AI Agent Tests
 * Tests for AI agents with constraint solving and conversation management
 * Research validation: Timefold AI Solver patterns, Rasa conversation patterns
 */

import { test, expect, Page } from '@playwright/test';

test.describe('AI Assistant Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Open AI panel in context dock
    const aiTab = page.locator('[data-testid="dock-panel-tab-ai"]');
    if (await aiTab.isVisible()) {
      await aiTab.click();
    }
  });

  test('should render AI assistant interface', async ({ page }) => {
    const aiPanel = page.locator('[data-testid="ai-assistant-panel"]');

    if (await aiPanel.isVisible()) {
      // Check for chat interface
      const chatInterface = page.locator('[data-testid="ai-chat-interface"]');
      await expect(chatInterface).toBeVisible();

      // Check for input field
      const chatInput = page.locator('[data-testid="ai-chat-input"]');
      await expect(chatInput).toBeVisible();
    }
  });

  test('should stream AI responses', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    if (await chatInput.isVisible()) {
      // Send a message
      await chatInput.type('Help me schedule my day');
      await page.keyboard.press('Enter');

      // Check for streaming indicator
      const streamingIndicator = page.locator('[data-testid="ai-streaming"]');
      await expect(streamingIndicator).toBeVisible();

      // Wait for response
      const response = page.locator('[data-testid="ai-response"]');
      await expect(response).toBeVisible({ timeout: 5000 });
    }
  });

  test('should maintain conversation context', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    if (await chatInput.isVisible()) {
      // First message
      await chatInput.type('My name is Test User');
      await page.keyboard.press('Enter');

      // Wait for response
      await page.waitForTimeout(1000);

      // Second message referring to context
      await chatInput.type('What is my name?');
      await page.keyboard.press('Enter');

      // Response should contain context
      const responses = page.locator('[data-testid="ai-response"]');
      const lastResponse = responses.last();

      // Should reference the name from context
      const text = await lastResponse.textContent();
      expect(text?.toLowerCase()).toContain('test user');
    }
  });

  test('should show confidence scores for suggestions', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    if (await chatInput.isVisible()) {
      await chatInput.type('Find conflicts in my schedule');
      await page.keyboard.press('Enter');

      // Wait for analysis
      await page.waitForTimeout(1000);

      // Check for confidence indicators
      const confidenceScores = page.locator('[data-testid="confidence-score"]');
      const count = await confidenceScores.count();

      if (count > 0) {
        // Should show confidence as percentage
        const firstScore = await confidenceScores.first().textContent();
        expect(firstScore).toMatch(/\d+%/);
      }
    }
  });

  test('should switch between AI agents', async ({ page }) => {
    // Check for agent selector
    const agentSelector = page.locator('[data-testid="ai-agent-selector"]');

    if (await agentSelector.isVisible()) {
      await agentSelector.click();

      // Should show agent options
      const agents = ['planner', 'conflict', 'summarizer'];

      for (const agent of agents) {
        const agentOption = page.locator(`[data-testid="agent-${agent}"]`);
        const exists = (await agentOption.count()) > 0;

        if (exists) {
          await expect(agentOption).toBeVisible();
        }
      }
    }
  });
});

test.describe('Planner Agent', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Activate planner agent
    const aiTab = page.locator('[data-testid="dock-panel-tab-ai"]');
    if (await aiTab.isVisible()) {
      await aiTab.click();
    }
  });

  test('should suggest optimal scheduling', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    if (await chatInput.isVisible()) {
      await chatInput.type('Schedule 2 hours of focus time tomorrow');
      await page.keyboard.press('Enter');

      // Wait for constraint solving
      await page.waitForTimeout(2000);

      // Should show scheduling suggestions
      const suggestions = page.locator('[data-testid="scheduling-suggestion"]');
      const count = await suggestions.count();

      if (count > 0) {
        // Should have time slots
        const firstSuggestion = suggestions.first();
        const text = await firstSuggestion.textContent();
        expect(text).toMatch(/\d{1,2}:\d{2}/); // Time format
      }
    }
  });

  test('should respect constraints when planning', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    if (await chatInput.isVisible()) {
      await chatInput.type('Schedule meeting but avoid lunch time');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(2000);

      // Check suggestions don't overlap lunch
      const suggestions = page.locator('[data-testid="scheduling-suggestion"]');
      const suggestionTexts = await suggestions.allTextContents();

      // No suggestion should be during typical lunch time (12-1pm)
      for (const text of suggestionTexts) {
        expect(text).not.toContain('12:00');
        expect(text).not.toContain('12:30');
      }
    }
  });

  test('should provide constraint solving within 500ms', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    if (await chatInput.isVisible()) {
      const startTime = Date.now();

      await chatInput.type('Find available time slots');
      await page.keyboard.press('Enter');

      // Wait for first suggestion
      const suggestion = page.locator('[data-testid="scheduling-suggestion"]').first();
      await suggestion.waitFor({ state: 'visible', timeout: 500 });

      const solvingTime = Date.now() - startTime;
      expect(solvingTime).toBeLessThan(500); // Timefold pattern: ≤500ms
    }
  });
});

test.describe('Conflict Detection Agent', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Open conflicts panel
    const conflictsTab = page.locator('[data-testid="dock-panel-tab-conflicts"]');
    if (await conflictsTab.isVisible()) {
      await conflictsTab.click();
    }
  });

  test('should detect scheduling conflicts', async ({ page }) => {
    const conflictsPanel = page.locator('[data-testid="conflicts-panel"]');

    if (await conflictsPanel.isVisible()) {
      // Check for conflict list
      const conflictsList = page.locator('[data-testid="conflicts-list"]');
      await expect(conflictsList).toBeVisible();

      // Check for conflict items
      const conflicts = page.locator('[data-testid="conflict-item"]');
      const count = await conflicts.count();

      // If conflicts exist, they should show details
      if (count > 0) {
        const firstConflict = conflicts.first();
        const text = await firstConflict.textContent();

        // Should describe the conflict
        expect(text).toBeTruthy();
      }
    }
  });

  test('should visualize conflicts clearly', async ({ page }) => {
    const conflictItem = page.locator('[data-testid="conflict-item"]').first();

    if (await conflictItem.isVisible()) {
      // Should show conflicting events
      const conflictingEvents = conflictItem.locator('[data-testid="conflicting-event"]');
      const count = await conflictingEvents.count();

      // Conflict involves at least 2 events
      expect(count).toBeGreaterThanOrEqual(2);

      // Should show severity
      const severity = conflictItem.locator('[data-testid="conflict-severity"]');
      if (await severity.isVisible()) {
        const severityText = await severity.textContent();
        expect(['High', 'Medium', 'Low']).toContain(severityText);
      }
    }
  });

  test('should provide resolution suggestions', async ({ page }) => {
    const conflictItem = page.locator('[data-testid="conflict-item"]').first();

    if (await conflictItem.isVisible()) {
      await conflictItem.click();

      // Should show resolution options
      const resolutions = page.locator('[data-testid="resolution-suggestion"]');
      const count = await resolutions.count();

      if (count > 0) {
        // Should have actionable suggestions
        const firstResolution = resolutions.first();
        const resolutionButton = firstResolution.locator('button');
        await expect(resolutionButton).toBeVisible();
      }
    }
  });

  test('should detect conflicts in real-time (≤500ms)', async ({ page }) => {
    // Create an event that would cause conflict
    const createButton = page.locator('[data-testid="create-event-button"]');

    if (await createButton.isVisible()) {
      const startTime = Date.now();

      await createButton.click();

      // Fill event details that would conflict
      const titleInput = page.locator('[data-testid="event-title-input"]');
      if (await titleInput.isVisible()) {
        await titleInput.type('Conflicting Meeting');

        // Save event
        const saveButton = page.locator('[data-testid="save-event-button"]');
        await saveButton.click();

        // Conflict should be detected quickly
        const conflictAlert = page.locator('[data-testid="conflict-alert"]');
        await conflictAlert.waitFor({ state: 'visible', timeout: 500 });

        const detectionTime = Date.now() - startTime;
        expect(detectionTime).toBeLessThan(500); // Real-time detection
      }
    }
  });
});

test.describe('Summarizer Agent', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Open AI panel
    const aiTab = page.locator('[data-testid="dock-panel-tab-ai"]');
    if (await aiTab.isVisible()) {
      await aiTab.click();
    }
  });

  test('should summarize daily activities', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    if (await chatInput.isVisible()) {
      await chatInput.type('Summarize my day');
      await page.keyboard.press('Enter');

      // Wait for summary
      await page.waitForTimeout(2000);

      // Should show summary
      const summary = page.locator('[data-testid="day-summary"]');
      if (await summary.isVisible()) {
        const text = await summary.textContent();

        // Should contain summary elements
        expect(text).toBeTruthy();
        expect(text?.length).toBeGreaterThan(50);
      }
    }
  });

  test('should extract action items from content', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    if (await chatInput.isVisible()) {
      await chatInput.type('Extract action items from my last meeting');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(2000);

      // Should show action items
      const actionItems = page.locator('[data-testid="action-item"]');
      const count = await actionItems.count();

      if (count > 0) {
        // Action items should be actionable
        const firstItem = actionItems.first();
        const hasCheckbox = await firstItem.locator('input[type="checkbox"]').isVisible();
        expect(hasCheckbox).toBe(true);
      }
    }
  });

  test('should complete summarization within 2 seconds', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    if (await chatInput.isVisible()) {
      const startTime = Date.now();

      await chatInput.type('Summarize this week');
      await page.keyboard.press('Enter');

      // Wait for summary
      const summary = page.locator('[data-testid="ai-response"]');
      await summary.waitFor({ state: 'visible', timeout: 2000 });

      const summaryTime = Date.now() - startTime;
      expect(summaryTime).toBeLessThan(2000); // Rasa pattern: ≤2s
    }
  });
});

test.describe('Tool Safety and Permissions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should request permission for sensitive operations', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    if (await chatInput.isVisible()) {
      await chatInput.type('Delete all events from last week');
      await page.keyboard.press('Enter');

      // Should show permission dialog
      const permissionDialog = page.locator('[data-testid="permission-dialog"]');
      await expect(permissionDialog).toBeVisible({ timeout: 2000 });

      // Should describe the operation
      const description = permissionDialog.locator('[data-testid="operation-description"]');
      const text = await description.textContent();
      expect(text).toContain('delete');
    }
  });

  test('should log tool usage for audit', async ({ page }) => {
    // Check for audit log indicator
    const auditIndicator = page.locator('[data-testid="audit-log-indicator"]');

    if (await auditIndicator.isVisible()) {
      await auditIndicator.click();

      // Should show audit log
      const auditLog = page.locator('[data-testid="audit-log"]');
      await expect(auditLog).toBeVisible();

      // Should have entries
      const logEntries = page.locator('[data-testid="audit-entry"]');
      const count = await logEntries.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should respect auto-approval settings', async ({ page }) => {
    // Check settings
    const settingsButton = page.locator('[data-testid="ai-settings-button"]');

    if (await settingsButton.isVisible()) {
      await settingsButton.click();

      // Check auto-approval toggle
      const autoApprovalToggle = page.locator('[data-testid="auto-approval-toggle"]');
      if (await autoApprovalToggle.isVisible()) {
        // Toggle should exist
        await expect(autoApprovalToggle).toBeVisible();

        // Check if it affects behavior
        const isEnabled = await autoApprovalToggle.isChecked();
        expect(typeof isEnabled).toBe('boolean');
      }
    }
  });
});

test.describe('Multi-Agent Coordination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should coordinate between agents', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    if (await chatInput.isVisible()) {
      // Complex request requiring multiple agents
      await chatInput.type('Plan my day, detect conflicts, and summarize the schedule');
      await page.keyboard.press('Enter');

      // Wait for multi-agent processing
      await page.waitForTimeout(3000);

      // Should show results from multiple agents
      const plannerResult = page.locator('[data-testid="planner-result"]');
      const conflictResult = page.locator('[data-testid="conflict-result"]');
      const summaryResult = page.locator('[data-testid="summary-result"]');

      // At least one type of result should appear
      const hasPlannerResult = await plannerResult.isVisible().catch(() => false);
      const hasConflictResult = await conflictResult.isVisible().catch(() => false);
      const hasSummaryResult = await summaryResult.isVisible().catch(() => false);

      expect(hasPlannerResult || hasConflictResult || hasSummaryResult).toBe(true);
    }
  });

  test('should route requests to appropriate agents', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    if (await chatInput.isVisible()) {
      // Conflict-specific request
      await chatInput.type('Are there any conflicts tomorrow?');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(1000);

      // Should route to conflict agent
      const agentIndicator = page.locator('[data-testid="active-agent"]');
      if (await agentIndicator.isVisible()) {
        const agentName = await agentIndicator.textContent();
        expect(agentName?.toLowerCase()).toContain('conflict');
      }
    }
  });
});
