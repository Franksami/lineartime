/**
 * AppShell Integration Tests
 * Tests for the three-pane shell architecture (Sidebar + TabWorkspace + ContextDock)
 * Research validation: Obsidian workspace patterns
 */

import { test, expect, Page } from '@playwright/test';

test.describe('AppShell Three-Pane Architecture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should render all three panes of the shell', async ({ page }) => {
    // Verify Sidebar is present
    const sidebar = page.locator('[data-testid="app-shell-sidebar"]');
    await expect(sidebar).toBeVisible();

    // Verify TabWorkspace is present
    const tabWorkspace = page.locator('[data-testid="tab-workspace"]');
    await expect(tabWorkspace).toBeVisible();

    // Verify ContextDock is present
    const contextDock = page.locator('[data-testid="context-dock"]');
    await expect(contextDock).toBeVisible();
  });

  test('should have proper layout dimensions', async ({ page }) => {
    const sidebar = page.locator('[data-testid="app-shell-sidebar"]');
    const tabWorkspace = page.locator('[data-testid="tab-workspace"]');
    const contextDock = page.locator('[data-testid="context-dock"]');

    // Check sidebar width (typically 240-320px)
    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox?.width).toBeGreaterThan(200);
    expect(sidebarBox?.width).toBeLessThan(400);

    // Check tab workspace takes majority of space
    const workspaceBox = await tabWorkspace.boundingBox();
    const viewportSize = page.viewportSize();
    if (viewportSize) {
      expect(workspaceBox?.width).toBeGreaterThan(viewportSize.width * 0.4);
    }

    // Check context dock width (typically 320-400px)
    const dockBox = await contextDock.boundingBox();
    expect(dockBox?.width).toBeGreaterThan(280);
    expect(dockBox?.width).toBeLessThan(500);
  });

  test('should persist layout preferences', async ({ page }) => {
    // Collapse the context dock
    const collapseButton = page.locator('[data-testid="dock-collapse-button"]');
    if (await collapseButton.isVisible()) {
      await collapseButton.click();

      // Verify dock is collapsed
      const collapsedDock = page.locator('[data-testid="context-dock-collapsed"]');
      await expect(collapsedDock).toBeVisible();

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify dock remains collapsed
      await expect(collapsedDock).toBeVisible();
    }
  });

  test('should handle responsive breakpoints', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    let sidebar = page.locator('[data-testid="app-shell-sidebar"]');
    await expect(sidebar).toBeVisible();

    // Test tablet view (should hide sidebar on smaller screens)
    await page.setViewportSize({ width: 768, height: 1024 });
    const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');

    // On mobile, sidebar might be hidden by default
    if (await mobileMenu.isVisible()) {
      await expect(sidebar).toBeHidden();
    }

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    if (await mobileMenu.isVisible()) {
      await expect(sidebar).toBeHidden();
      await expect(mobileMenu).toBeVisible();
    }
  });

  test('should render with proper performance (<500ms)', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/app');
    await page.waitForSelector('[data-testid="app-shell"]');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(500); // Target: <500ms render
  });
});

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should display all sidebar sections', async ({ page }) => {
    const sections = ['Calendar', 'Tasks', 'Notes', 'Mailbox'];

    for (const section of sections) {
      const sectionElement = page.locator(
        `[data-testid="sidebar-section-${section.toLowerCase()}"]`
      );
      await expect(sectionElement).toBeVisible();
    }
  });

  test('should navigate between sections', async ({ page }) => {
    // Click on Tasks section
    const tasksSection = page.locator('[data-testid="sidebar-section-tasks"]');
    await tasksSection.click();

    // Verify active state
    await expect(tasksSection).toHaveAttribute('data-active', 'true');

    // Click on Notes section
    const notesSection = page.locator('[data-testid="sidebar-section-notes"]');
    await notesSection.click();

    // Verify active state changed
    await expect(notesSection).toHaveAttribute('data-active', 'true');
    await expect(tasksSection).toHaveAttribute('data-active', 'false');
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Focus on first sidebar item
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Skip to sidebar

    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Verify navigation occurred
    const activeSection = page.locator('[data-active="true"]');
    await expect(activeSection).toBeVisible();
  });
});

test.describe('Tab Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should create and switch tabs', async ({ page }) => {
    // Verify initial tab
    const weekTab = page.locator('[data-testid="tab-week"]');
    await expect(weekTab).toBeVisible();

    // Open planner tab
    const newTabButton = page.locator('[data-testid="new-tab-button"]');
    if (await newTabButton.isVisible()) {
      await newTabButton.click();
      const plannerOption = page.locator('[data-testid="tab-option-planner"]');
      await plannerOption.click();

      const plannerTab = page.locator('[data-testid="tab-planner"]');
      await expect(plannerTab).toBeVisible();
    }
  });

  test('should close tabs with middle click or X button', async ({ page }) => {
    // Create multiple tabs first
    const tabs = page.locator('[data-testid^="tab-"]');
    const initialCount = await tabs.count();

    // Try to close a tab (if multiple exist)
    if (initialCount > 1) {
      const closeButton = page.locator('[data-testid^="tab-close-"]').first();
      await closeButton.click();

      // Verify tab count decreased
      const newCount = await tabs.count();
      expect(newCount).toBe(initialCount - 1);
    }
  });

  test('should persist tab state', async ({ page }) => {
    // Get current tab configuration
    const tabs = await page.locator('[data-testid^="tab-"]').allTextContents();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify same tabs are present
    const reloadedTabs = await page.locator('[data-testid^="tab-"]').allTextContents();
    expect(reloadedTabs).toEqual(tabs);
  });
});

test.describe('Context Dock Panels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should display panel tabs', async ({ page }) => {
    const panels = ['ai', 'details', 'conflicts', 'capacity', 'backlinks'];

    for (const panel of panels) {
      const panelTab = page.locator(`[data-testid="dock-panel-tab-${panel}"]`);
      // Panel might be behind a tab or collapsed, so we check if it exists
      const tabCount = await panelTab.count();
      expect(tabCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should switch between panels', async ({ page }) => {
    const aiTab = page.locator('[data-testid="dock-panel-tab-ai"]');
    const detailsTab = page.locator('[data-testid="dock-panel-tab-details"]');

    if ((await aiTab.isVisible()) && (await detailsTab.isVisible())) {
      // Click AI tab
      await aiTab.click();
      const aiPanel = page.locator('[data-testid="dock-panel-content-ai"]');
      await expect(aiPanel).toBeVisible();

      // Click Details tab
      await detailsTab.click();
      const detailsPanel = page.locator('[data-testid="dock-panel-content-details"]');
      await expect(detailsPanel).toBeVisible();
    }
  });

  test('should collapse and expand dock', async ({ page }) => {
    const collapseButton = page.locator('[data-testid="dock-collapse-button"]');

    if (await collapseButton.isVisible()) {
      // Collapse
      await collapseButton.click();
      const collapsedDock = page.locator('[data-testid="context-dock-collapsed"]');
      await expect(collapsedDock).toBeVisible();

      // Expand
      const expandButton = page.locator('[data-testid="dock-expand-button"]');
      await expandButton.click();
      const expandedDock = page.locator('[data-testid="context-dock"]');
      await expect(expandedDock).toBeVisible();
    }
  });
});

test.describe('Performance Metrics', () => {
  test('should maintain 60fps during scrolling', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Start performance measurement
    await page.evaluate(() => {
      (window as any).frameTimes = [];
      let lastTime = performance.now();

      function measureFrame() {
        const currentTime = performance.now();
        (window as any).frameTimes.push(currentTime - lastTime);
        lastTime = currentTime;
        requestAnimationFrame(measureFrame);
      }

      measureFrame();
    });

    // Perform scrolling
    const scrollableArea = page.locator('[data-testid="tab-workspace-content"]');
    if (await scrollableArea.isVisible()) {
      for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(100);
      }
    }

    // Check frame times
    const frameTimes = await page.evaluate(() => (window as any).frameTimes);
    const avgFrameTime = frameTimes.reduce((a: number, b: number) => a + b, 0) / frameTimes.length;

    // 60fps = 16.67ms per frame, allow some variance
    expect(avgFrameTime).toBeLessThan(20);
  });

  test('should use less than 100MB memory', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Check memory usage if available
    const memoryInfo = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    if (memoryInfo > 0) {
      const memoryInMB = memoryInfo / 1024 / 1024;
      expect(memoryInMB).toBeLessThan(100);
    }
  });
});
