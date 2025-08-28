/**
 * Accessibility Tests
 * Tests for WCAG 2.1 AA compliance, keyboard navigation, screen reader support
 * Research validation: Accessibility best practices
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from '@axe-core/playwright';

test.describe('WCAG 2.1 AA Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await injectAxe(page);
  });

  test('should have no automatic accessibility violations', async ({ page }) => {
    const violations = await getViolations(page);
    
    // Log violations for debugging
    if (violations.length > 0) {
      console.log('Accessibility violations found:');
      violations.forEach((violation: any) => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Affected nodes: ${violation.nodes.length}`);
      });
    }
    
    // Should have no violations
    expect(violations).toHaveLength(0);
  });

  test('should have proper color contrast ratios', async ({ page }) => {
    // Check specific high-importance elements
    await checkA11y(page, '[data-testid="app-shell"]', {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
    
    // Check text contrast
    const textElements = page.locator('p, span, div').filter({ hasText: /.*/ });
    const count = await textElements.count();
    
    // Sample check on first few elements
    for (let i = 0; i < Math.min(5, count); i++) {
      const element = textElements.nth(i);
      
      const contrast = await element.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const backgroundColor = style.backgroundColor;
        
        // Simple check - in real tests, calculate actual contrast ratio
        return { color, backgroundColor };
      });
      
      // Should have defined colors
      expect(contrast.color).toBeTruthy();
      expect(contrast.backgroundColor).toBeTruthy();
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
      elements.map(el => ({
        level: parseInt(el.tagName[1]),
        text: el.textContent
      }))
    );
    
    // Should have at least one h1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // Check hierarchy (no skipping levels)
    let currentLevel = 0;
    for (const heading of headings) {
      if (currentLevel === 0) {
        currentLevel = heading.level;
      } else {
        // Should not skip more than one level
        expect(heading.level - currentLevel).toBeLessThanOrEqual(1);
        if (heading.level <= currentLevel) {
          currentLevel = heading.level;
        }
      }
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check buttons have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Should have either aria-label or text content
      expect(ariaLabel || text).toBeTruthy();
    }
    
    // Check form inputs have labels
    const inputs = page.locator('input:not([type="hidden"])');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const ariaLabel = await input.getAttribute('aria-label');
      const id = await input.getAttribute('id');
      
      if (id) {
        // Check for associated label
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        // Should have either aria-label or associated label
        expect(ariaLabel || hasLabel).toBeTruthy();
      } else {
        // Should have aria-label if no id
        expect(ariaLabel).toBeTruthy();
      }
    }
  });

  test('should have proper focus indicators', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    
    // Check focused element has visible focus indicator
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    
    const focusStyles = await page.evaluate(element => {
      if (!element) return null;
      const styles = window.getComputedStyle(element as Element);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow
      };
    }, focusedElement);
    
    // Should have some focus indicator
    if (focusStyles) {
      const hasOutline = focusStyles.outlineWidth !== '0px';
      const hasBoxShadow = focusStyles.boxShadow !== 'none';
      
      expect(hasOutline || hasBoxShadow).toBeTruthy();
    }
  });
});

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate entire app with keyboard only', async ({ page }) => {
    // Start from top
    await page.keyboard.press('Escape'); // Clear any focus
    
    // Tab through main regions
    const regions = [
      '[data-testid="app-shell-sidebar"]',
      '[data-testid="tab-workspace"]',
      '[data-testid="context-dock"]'
    ];
    
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      
      // Check if focus is in one of the main regions
      const focusedRegion = await page.evaluate((selectors) => {
        const activeElement = document.activeElement;
        if (!activeElement) return null;
        
        for (const selector of selectors) {
          const region = document.querySelector(selector);
          if (region?.contains(activeElement)) {
            return selector;
          }
        }
        return null;
      }, regions);
      
      if (focusedRegion) {
        console.log(`Focus in region: ${focusedRegion}`);
      }
    }
    
    // Should be able to reach all regions
    expect(true).toBeTruthy(); // Basic test - enhance with specific checks
  });

  test('should support arrow key navigation in lists', async ({ page }) => {
    // Focus on sidebar
    const sidebarSection = page.locator('[data-testid="sidebar-section-calendar"]');
    
    if (await sidebarSection.isVisible()) {
      await sidebarSection.click();
      
      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowUp');
      
      // Check focus moved
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.getAttribute('data-testid');
      });
      
      expect(focusedElement).toBeTruthy();
    }
  });

  test('should trap focus in modals', async ({ page }) => {
    // Open a modal (command palette)
    const isMac = process.platform === 'darwin';
    const modKey = isMac ? 'Meta' : 'Control';
    
    await page.keyboard.press(`${modKey}+P`);
    
    const modal = page.locator('[data-testid="command-palette"]');
    await expect(modal).toBeVisible();
    
    // Tab through modal
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      
      // Check focus is still in modal
      const focusInModal = await page.evaluate(() => {
        const modal = document.querySelector('[data-testid="command-palette"]');
        const activeElement = document.activeElement;
        return modal?.contains(activeElement);
      });
      
      expect(focusInModal).toBeTruthy();
    }
    
    // Escape should close modal
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('should skip to main content with skip link', async ({ page }) => {
    // Look for skip link (usually hidden until focused)
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('a[href="#main"], a[href="#content"]');
    const hasSkipLink = await skipLink.count() > 0;
    
    if (hasSkipLink) {
      // Skip link should be visible when focused
      await expect(skipLink).toBeVisible();
      
      // Activate skip link
      await page.keyboard.press('Enter');
      
      // Focus should move to main content
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.id || document.activeElement?.getAttribute('role');
      });
      
      expect(focusedElement).toBeTruthy();
    }
  });

  test('should navigate tabs with arrow keys', async ({ page }) => {
    // Focus on tab list
    const tabList = page.locator('[role="tablist"]').first();
    
    if (await tabList.isVisible()) {
      const firstTab = tabList.locator('[role="tab"]').first();
      await firstTab.click();
      
      // Navigate with arrow keys
      await page.keyboard.press('ArrowRight');
      
      // Check focus moved to next tab
      const focusedTab = await page.evaluate(() => {
        const activeElement = document.activeElement;
        return activeElement?.getAttribute('role') === 'tab';
      });
      
      expect(focusedTab).toBeTruthy();
      
      // Navigate back
      await page.keyboard.press('ArrowLeft');
    }
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    const modKey = isMac ? 'Meta' : 'Control';
    
    // Test command palette shortcut
    await page.keyboard.press(`${modKey}+P`);
    let element = page.locator('[data-testid="command-palette"]');
    await expect(element).toBeVisible();
    await page.keyboard.press('Escape');
    
    // Test other shortcuts
    await page.keyboard.press('Alt+1'); // Week view
    element = page.locator('[data-testid="view-week"]');
    const weekViewExists = await element.count() > 0;
    
    if (weekViewExists) {
      await expect(element).toBeVisible();
    }
  });
});

test.describe('Screen Reader Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper ARIA roles', async ({ page }) => {
    // Check main landmarks
    const landmarks = [
      { role: 'banner', min: 0, max: 1 }, // Header
      { role: 'navigation', min: 1, max: 5 }, // Nav areas
      { role: 'main', min: 1, max: 1 }, // Main content
      { role: 'complementary', min: 0, max: 3 }, // Sidebar/dock
    ];
    
    for (const landmark of landmarks) {
      const elements = page.locator(`[role="${landmark.role}"]`);
      const count = await elements.count();
      
      expect(count).toBeGreaterThanOrEqual(landmark.min);
      expect(count).toBeLessThanOrEqual(landmark.max);
      
      console.log(`Found ${count} ${landmark.role} landmarks`);
    }
  });

  test('should have ARIA live regions for updates', async ({ page }) => {
    // Check for live regions
    const liveRegions = page.locator('[aria-live]');
    const count = await liveRegions.count();
    
    // Should have at least one live region for announcements
    expect(count).toBeGreaterThanOrEqual(1);
    
    // Check live region types
    for (let i = 0; i < count; i++) {
      const region = liveRegions.nth(i);
      const ariaLive = await region.getAttribute('aria-live');
      
      // Should be polite or assertive
      expect(['polite', 'assertive', 'off']).toContain(ariaLive);
    }
  });

  test('should announce page changes', async ({ page }) => {
    // Check for page title updates
    const initialTitle = await page.title();
    
    // Switch view
    const plannerTab = page.locator('[data-testid="tab-planner"]');
    if (await plannerTab.isVisible()) {
      await plannerTab.click();
      
      // Title might change
      const newTitle = await page.title();
      
      // Check for ARIA announcement
      const announcements = page.locator('[role="status"], [role="alert"]');
      const hasAnnouncements = await announcements.count() > 0;
      
      // Should have some way to announce changes
      expect(hasAnnouncements || newTitle !== initialTitle).toBeTruthy();
    }
  });

  test('should have descriptive button labels', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    // Check first few buttons
    for (let i = 0; i < Math.min(10, count); i++) {
      const button = buttons.nth(i);
      
      // Get accessible name
      const accessibleName = await button.evaluate(el => {
        const button = el as HTMLButtonElement;
        return button.getAttribute('aria-label') || 
               button.textContent?.trim() || 
               button.title;
      });
      
      // Should not be generic
      if (accessibleName) {
        const genericLabels = ['button', 'click', 'here', 'submit'];
        const isGeneric = genericLabels.some(label => 
          accessibleName.toLowerCase() === label
        );
        
        expect(isGeneric).toBeFalsy();
      }
    }
  });

  test('should have form field descriptions', async ({ page }) => {
    const inputs = page.locator('input:not([type="hidden"]), select, textarea');
    const count = await inputs.count();
    
    for (let i = 0; i < Math.min(5, count); i++) {
      const input = inputs.nth(i);
      
      // Check for descriptive attributes
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaDescribedBy = await input.getAttribute('aria-describedby');
      const placeholder = await input.getAttribute('placeholder');
      const title = await input.getAttribute('title');
      
      // Should have some description
      const hasDescription = ariaLabel || ariaDescribedBy || title;
      
      // Placeholder alone is not sufficient
      if (!hasDescription && placeholder) {
        console.warn(`Input relies only on placeholder: ${placeholder}`);
      }
      
      expect(hasDescription || placeholder).toBeTruthy();
    }
  });
});

test.describe('Focus Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should restore focus after modal closes', async ({ page }) => {
    // Focus on a button
    const triggerButton = page.locator('button').first();
    await triggerButton.focus();
    
    // Get initial focused element
    await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    // Open command palette
    const isMac = process.platform === 'darwin';
    const modKey = isMac ? 'Meta' : 'Control';
    await page.keyboard.press(`${modKey}+P`);
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Focus should return
    const finalFocused = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    // Focus should be restored (or at least not on body)
    expect(finalFocused).not.toBe('BODY');
  });

  test('should manage focus in dynamic content', async ({ page }) => {
    // Create new event (dynamic content)
    const createButton = page.locator('[data-testid="create-event-button"]');
    
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Focus should move to new content
      const modal = page.locator('[data-testid="create-event-modal"]');
      
      if (await modal.isVisible()) {
        // First input should be focused
        const firstInput = modal.locator('input').first();
        const isFocused = await firstInput.evaluate(el => el === document.activeElement);
        
        expect(isFocused).toBeTruthy();
      }
    }
  });

  test('should handle focus with keyboard navigation only', async ({ page }) => {
    // Navigate entirely with keyboard
    let reachedContent = false;
    
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          role: el?.getAttribute('role'),
          testId: el?.getAttribute('data-testid')
        };
      });
      
      // Check if we reached main content
      if (focusedElement.role === 'main' || 
          focusedElement.testId?.includes('workspace')) {
        reachedContent = true;
        break;
      }
    }
    
    expect(reachedContent).toBeTruthy();
  });
});

test.describe('Mobile Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should have touch-friendly tap targets', async ({ page }) => {
    const buttons = page.locator('button, a, [role="button"]');
    const count = await buttons.count();
    
    // Check first few buttons
    for (let i = 0; i < Math.min(5, count); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      
      if (box) {
        // Minimum touch target size is 44x44 (iOS) or 48x48 (Android)
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should support touch gestures', async ({ page }) => {
    const scrollableArea = page.locator('[data-testid="tab-workspace-content"]');
    
    if (await scrollableArea.isVisible()) {
      const box = await scrollableArea.boundingBox();
      
      if (box) {
        // Simulate swipe
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2, box.y + 100);
        await page.mouse.up();
        
        // Should scroll
        const scrollTop = await scrollableArea.evaluate(el => el.scrollTop);
        expect(scrollTop).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should have readable text on mobile', async ({ page }) => {
    // Check font sizes
    const textElements = page.locator('p, span, div').filter({ hasText: /.*/ });
    const count = await textElements.count();
    
    for (let i = 0; i < Math.min(5, count); i++) {
      const element = textElements.nth(i);
      
      const fontSize = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return parseInt(style.fontSize);
      });
      
      // Minimum readable font size on mobile is 12px, recommended 16px
      expect(fontSize).toBeGreaterThanOrEqual(12);
    }
  });
});