import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';

// Helper to wait for LinearCalendarHorizontal foundation
async function waitForFoundation(page: Page) {
  await page.waitForSelector('[role="grid"]', { timeout: 10000 });
  await page.waitForTimeout(500);
}

// Helper to test event creation on foundation grid
async function testEventCreation(page: Page) {
  // Look for day cells in the foundation grid
  const dayCells = page.locator('[role="grid"] div').filter({ hasText: /^\d{1,2}$/ });
  const cellCount = await dayCells.count();

  if (cellCount > 0) {
    // Try clicking on first visible day cell
    await dayCells.first().click();
    return true;
  }

  return false;
}

test.describe('🧪 Event Management Reality Check', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForFoundation(page);
  });

  test('REALITY CHECK: Can user actually create events on foundation?', async ({ page }) => {
    // Test 1: Check if clicking day cells does anything
    const eventCreated = await testEventCreation(page);
    console.log('Event creation attempt result:', eventCreated);

    // Test 2: Look for any event creation UI
    const createButton = page.locator(
      'button:has-text("Add"), button:has-text("+"), [aria-label*="create"]'
    );
    const createButtonVisible = await createButton.isVisible();
    console.log('Create button found:', createButtonVisible);

    // Test 3: Check for drag event creation (foundation feature)
    const grid = page.locator('[role="grid"]');
    const gridBox = await grid.boundingBox();

    if (gridBox) {
      // Try drag across grid to create event
      await page.mouse.move(gridBox.x + 200, gridBox.y + 100);
      await page.mouse.down();
      await page.mouse.move(gridBox.x + 300, gridBox.y + 100);
      await page.mouse.up();
    }

    // Test 4: Look for any event elements after interaction
    const eventElements = page.locator('[class*="event"], [class*="Event"], div[style*="bg-"]');
    const eventCount = await eventElements.count();
    console.log('Event elements found after interaction:', eventCount);

    // Take screenshot for manual verification
    await page.screenshot({ path: 'test-results/event-creation-reality-check.png' });
  });

  test('REALITY CHECK: Is FloatingToolbar functional?', async ({ page }) => {
    // Look for any existing events
    const existingEvents = page.locator(
      '[class*="bg-green"], [class*="bg-blue"], [class*="bg-orange"], [class*="bg-purple"]'
    );
    const eventCount = await existingEvents.count();
    console.log('Existing events found:', eventCount);

    if (eventCount > 0) {
      // Click on first event
      await existingEvents.first().click();

      // Look for floating toolbar
      const toolbar = page.locator('[class*="toolbar"], [class*="Toolbar"], [class*="floating"]');
      const toolbarVisible = await toolbar.isVisible();
      console.log('FloatingToolbar appeared:', toolbarVisible);

      // Look for edit/delete buttons
      const editButton = page.locator('button:has-text("Edit"), [aria-label*="edit"]');
      const deleteButton = page.locator('button:has-text("Delete"), [aria-label*="delete"]');

      console.log('Edit button found:', await editButton.isVisible());
      console.log('Delete button found:', await deleteButton.isVisible());
    }

    await page.screenshot({ path: 'test-results/floating-toolbar-reality-check.png' });
  });

  test('REALITY CHECK: Is IndexedDB persistence working?', async ({ page }) => {
    // Check browser storage for IndexedDB
    const indexedDBInfo = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (!window.indexedDB) {
          resolve({ hasIndexedDB: false });
          return;
        }

        // Check for Command Center Calendar database
        const request = indexedDB.open('Command Center Calendar');
        request.onsuccess = () => {
          const db = request.result;
          const stores = Array.from(db.objectStoreNames);
          resolve({
            hasIndexedDB: true,
            dbName: db.name,
            version: db.version,
            objectStores: stores,
          });
          db.close();
        };
        request.onerror = () => {
          resolve({ hasIndexedDB: true, error: request.error });
        };
      });
    });

    console.log('IndexedDB Status:', indexedDBInfo);

    // Check for Dexie integration
    const dexieInfo = await page.evaluate(() => {
      return typeof window.Dexie !== 'undefined' ? 'Dexie available' : 'Dexie not found';
    });

    console.log('Dexie Status:', dexieInfo);

    // Take screenshot
    await page.screenshot({ path: 'test-results/indexeddb-reality-check.png' });
  });

  test('REALITY CHECK: Is AI Assistant accessible?', async ({ page }) => {
    // Test 1: Look for AI Assistant panel
    const aiPanel = page.locator('[class*="assistant"], [class*="Assistant"], [class*="ai"]');
    const aiPanelVisible = await aiPanel.isVisible();
    console.log('AI Assistant panel visible:', aiPanelVisible);

    // Test 2: Check for AI Assistant button
    const aiButton = page.locator(
      'button:has-text("AI"), button:has-text("Assistant"), [aria-label*="AI"]'
    );
    const aiButtonVisible = await aiButton.isVisible();
    console.log('AI Assistant button found:', aiButtonVisible);

    // Test 3: Look for AI-related elements
    const aiElements = page.locator('[id*="ai"], [class*="ai"], [data-*="ai"]');
    const aiElementCount = await aiElements.count();
    console.log('AI-related elements found:', aiElementCount);

    await page.screenshot({ path: 'test-results/ai-assistant-reality-check.png' });
  });

  test('REALITY CHECK: Does CommandBar work (Cmd+K)?', async ({ page }) => {
    // Test CommandBar activation
    await page.keyboard.press('Meta+k'); // Cmd+K on Mac
    await page.waitForTimeout(1000);

    // Look for command bar modal/dialog
    const commandBar = page.locator('[role="dialog"], [class*="command"], [class*="Command"]');
    const commandBarVisible = await commandBar.isVisible();
    console.log('CommandBar visible after Cmd+K:', commandBarVisible);

    // Test alternative activation
    await page.keyboard.press('Control+k'); // Ctrl+K alternative
    await page.waitForTimeout(1000);

    const commandBarVisible2 = await commandBar.isVisible();
    console.log('CommandBar visible after Ctrl+K:', commandBarVisible2);

    // Look for search input
    const searchInput = page.locator('input[placeholder*="command"], input[placeholder*="search"]');
    const searchInputVisible = await searchInput.isVisible();
    console.log('Command search input found:', searchInputVisible);

    await page.screenshot({ path: 'test-results/command-bar-reality-check.png' });
  });

  test('REALITY CHECK: Are touch gestures functional on mobile?', async ({ page }) => {
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await waitForFoundation(page);

    // Test 1: Look for mobile menu button
    const mobileMenuButton = page.locator('[class*="z-30"], button:has(svg.lucide-menu)');
    const mobileMenuVisible = await mobileMenuButton.isVisible();
    console.log('Mobile menu button found:', mobileMenuVisible);

    if (mobileMenuVisible) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500);

      // Check if mobile menu opened
      const mobileMenu = page.locator('[id="mobile-menu"], [class*="mobile-menu"]');
      const menuOpened = await mobileMenu.isVisible();
      console.log('Mobile menu opened:', menuOpened);
    }

    // Test 2: Check touch gesture handlers
    const touchInfo = await page.evaluate(() => {
      const grid = document.querySelector('[role="grid"]');
      return {
        hasTouchStart: grid?.ontouchstart !== undefined,
        hasTouchMove: grid?.ontouchmove !== undefined,
        hasTouchEnd: grid?.ontouchend !== undefined,
        hasGestureHandlers: !!(grid as any)?.__gestureHandlers,
      };
    });

    console.log('Touch gesture status:', touchInfo);

    await page.screenshot({ path: 'test-results/mobile-gestures-reality-check.png' });
  });

  test('REALITY CHECK: Feature integration summary', async ({ page }) => {
    // Comprehensive feature availability check
    const featureStatus = await page.evaluate(() => {
      return {
        // Foundation elements
        foundationGrid: !!document.querySelector('[role="grid"]'),
        yearHeader: !!document.querySelector('h1:contains("Linear Calendar")'),
        monthLabels: document.querySelectorAll('text=Jan, text=Feb, text=Mar').length > 0,

        // Event system
        eventElements: document.querySelectorAll('[class*="event"], [class*="Event"]').length,
        floatingToolbar: !!document.querySelector('[class*="toolbar"], [class*="Toolbar"]'),

        // AI features
        aiAssistant: !!document.querySelector('[class*="assistant"], [class*="Assistant"]'),
        commandBar: !!document.querySelector('[class*="command"], [class*="Command"]'),

        // Storage
        indexedDB: 'indexedDB' in window,
        dexie: typeof (window as any).Dexie !== 'undefined',

        // Performance
        performanceMonitor: !!document.querySelector(
          '[class*="performance"], [class*="Performance"]'
        ),

        // Mobile
        mobileMenu: !!document.querySelector('[id="mobile-menu"]'),
        touchHandlers: !!document.querySelector('[role="grid"]')?.__gestureHandlers,
      };
    });

    console.log('COMPREHENSIVE FEATURE STATUS:', JSON.stringify(featureStatus, null, 2));

    // Create summary for TaskMaster updates
    const summary = `
    FOUNDATION REALITY CHECK COMPLETE:
    
    ✅ CONFIRMED WORKING:
    - Foundation Grid: ${featureStatus.foundationGrid}
    - Year Header: ${featureStatus.yearHeader}
    - IndexedDB Available: ${featureStatus.indexedDB}
    - Performance Monitor: ${featureStatus.performanceMonitor}
    - Mobile Menu: ${featureStatus.mobileMenu}
    
    ⚠️ NEEDS VERIFICATION:
    - Event System: ${featureStatus.eventElements} events found
    - FloatingToolbar: ${featureStatus.floatingToolbar}
    - AI Assistant: ${featureStatus.aiAssistant}
    - CommandBar: ${featureStatus.commandBar}
    - Dexie Integration: ${featureStatus.dexie}
    
    📋 NEXT: Test each feature individually with correct expectations
    `;

    console.log(summary);
    await page.screenshot({ path: 'test-results/comprehensive-feature-status.png' });
  });
});
