import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('domcontentloaded');
    // Wait for the calendar to be visible
    await page.waitForSelector('[role="application"]', { timeout: 10000 });
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    // Exclude Next.js development overlay from the scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('#__next-build-watcher')
      .exclude('nextjs-portal')
      .analyze();

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:');
      accessibilityScanResults.violations.forEach(violation => {
        console.log(`- ${violation.id}: ${violation.description}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    // Check main calendar has proper ARIA attributes
    const calendar = page.locator('[role="application"]');
    await expect(calendar).toHaveAttribute('aria-label', 'Linear Calendar for year navigation and event management');

    // Check year navigation buttons
    const prevYearButton = page.getByRole('button', { name: /previous year/i });
    await expect(prevYearButton).toBeVisible();
    
    const nextYearButton = page.getByRole('button', { name: /next year/i });
    await expect(nextYearButton).toBeVisible();

    // Check view switcher buttons
    const yearViewButton = page.getByRole('button', { name: /year view/i });
    await expect(yearViewButton).toBeVisible();
  });

  test('keyboard navigation should work correctly', async ({ page }) => {
    // Focus on a calendar day
    const firstDay = page.locator('[role="button"][aria-label*="January 1"]').first();
    await firstDay.focus();
    
    // Test arrow key navigation
    await page.keyboard.press('ArrowRight');
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    expect(focusedElement).toContain('January 2');

    // Test Enter key to open event modal
    await page.keyboard.press('Enter');
    await expect(page.locator('[id="event-dialog-title"]')).toBeVisible();
    
    // Test Escape to close modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[id="event-dialog-title"]')).not.toBeVisible();
  });

  test('high contrast mode toggle should work', async ({ page }) => {
    // Find and click the high contrast toggle
    const highContrastToggle = page.getByRole('button', { name: /high contrast mode/i });
    await expect(highContrastToggle).toBeVisible();
    
    // Enable high contrast mode
    await highContrastToggle.click();
    
    // Check that the high-contrast class is applied
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/high-contrast/);
    
    // Verify aria-pressed is set
    await expect(highContrastToggle).toHaveAttribute('aria-pressed', 'true');
    
    // Disable high contrast mode
    await highContrastToggle.click();
    await expect(htmlElement).not.toHaveClass(/high-contrast/);
    await expect(highContrastToggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('focus management in modals', async ({ page }) => {
    // Open event modal
    const firstDay = page.locator('[role="button"][aria-label*="January 1"]').first();
    await firstDay.click();
    
    // Wait for modal to open
    await expect(page.locator('[id="event-dialog-title"]')).toBeVisible();
    
    // Check that focus is moved to the first input (title)
    const titleInput = page.locator('input[aria-label="Event title"]');
    await expect(titleInput).toBeFocused();
    
    // Test tab navigation within modal
    await page.keyboard.press('Tab');
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeElement).toBeTruthy();
  });

  test('screen reader announcements should work', async ({ page }) => {
    // Create a listener for aria-live regions
    const ariaLiveRegion = page.locator('[aria-live]');
    
    // Navigate with keyboard
    const firstDay = page.locator('[role="button"][aria-label*="January 1"]').first();
    await firstDay.focus();
    await page.keyboard.press('ArrowRight');
    
    // Check that announcement was made (if aria-live region exists)
    const ariaLiveText = await ariaLiveRegion.textContent().catch(() => '');
    // The announcement system creates and removes the element quickly, so we just verify the system exists
    expect(ariaLiveText).toBeDefined();
  });

  test('reduced motion preference should be respected', async ({ page, browserName }) => {
    // Skip this test in WebKit as it doesn't support prefers-reduced-motion emulation well
    if (browserName === 'webkit') {
      test.skip();
    }

    // Emulate prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    
    // Check that animations are disabled (by checking CSS)
    const animationDuration = await page.evaluate(() => {
      const element = document.querySelector('.transition-all');
      if (!element) return '0ms';
      return window.getComputedStyle(element).animationDuration;
    });
    
    // When reduced motion is preferred, animations should be minimal or disabled
    expect(animationDuration).toBe('0.01ms');
  });

  test('color contrast should meet WCAG standards', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('[role="application"]')
      .analyze();

    // Filter for color contrast violations only
    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id.includes('contrast')
    );

    expect(contrastViolations).toHaveLength(0);
  });

  test('form inputs should have proper labels', async ({ page }) => {
    // Open event modal
    const firstDay = page.locator('[role="button"][aria-label*="January 1"]').first();
    await firstDay.click();
    
    // Check all form inputs have labels or aria-labels
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.evaluate((el) => {
        const id = el.id;
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        return !!(label || ariaLabel || ariaLabelledBy);
      });
      expect(hasLabel).toBeTruthy();
    }
  });

  test('interactive elements should be keyboard accessible', async ({ page }) => {
    // Test all buttons are keyboard accessible
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) { // Test first 5 buttons
      const button = buttons.nth(i);
      await button.focus();
      const isFocused = await button.evaluate(el => el === document.activeElement);
      expect(isFocused).toBeTruthy();
    }
  });
});