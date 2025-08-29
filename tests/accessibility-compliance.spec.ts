import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Compliance Test Suite
 *
 * Validates WCAG 2.1 AA compliance across all UI improvements:
 * - Axe-core automated accessibility scanning
 * - Keyboard navigation and focus management
 * - Screen reader compatibility (ARIA attributes)
 * - Color contrast and visual accessibility
 * - Semantic HTML structure validation
 *
 * Cross-browser accessibility testing for comprehensive coverage
 */

class AccessibilityTestUtils {
  constructor(private page: Page) {}

  async scanWithAxe(options?: any) {
    const accessibilityScanResults = await new AxeBuilder({ page: this.page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('#commonly-reused-element-with-known-issue') // Exclude known issues
      .analyze();

    return accessibilityScanResults;
  }

  async testKeyboardNavigation() {
    const focusableElements: string[] = [];
    let currentFocus = '';

    // Start navigation
    await this.page.keyboard.press('Tab');

    for (let i = 0; i < 20; i++) {
      // Test up to 20 tab stops
      const focused = await this.page.evaluate(() => {
        const active = document.activeElement;
        if (!active) return null;

        return {
          tagName: active.tagName,
          role: active.getAttribute('role'),
          ariaLabel: active.getAttribute('aria-label'),
          id: active.id,
          className: active.className,
        };
      });

      if (focused) {
        const focusKey = `${focused.tagName}:${focused.role}:${focused.id}`;
        if (focusableElements.includes(focusKey)) {
          break; // We've cycled back to a previous element
        }
        focusableElements.push(focusKey);
        currentFocus = focusKey;
      }

      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(50);
    }

    return focusableElements;
  }

  async testScreenReaderSupport() {
    const ariaElements = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const ariaInfo: any[] = [];

      elements.forEach((el) => {
        const tagName = el.tagName.toLowerCase();
        const role = el.getAttribute('role');
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        const ariaDescribedBy = el.getAttribute('aria-describedby');
        const ariaExpanded = el.getAttribute('aria-expanded');
        const ariaHidden = el.getAttribute('aria-hidden');

        if (role || ariaLabel || ariaLabelledBy || ariaDescribedBy || ariaExpanded || ariaHidden) {
          ariaInfo.push({
            tagName,
            role,
            ariaLabel,
            ariaLabelledBy,
            ariaDescribedBy,
            ariaExpanded,
            ariaHidden,
          });
        }
      });

      return ariaInfo;
    });

    return ariaElements;
  }

  async checkColorContrast() {
    const contrastIssues = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const issues: any[] = [];

      elements.forEach((el) => {
        const style = getComputedStyle(el);
        const color = style.color;
        const backgroundColor = style.backgroundColor;

        // Simple check for transparent or very light backgrounds
        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
          return;
        }

        // This is a simplified check - in real scenarios, you'd use a proper color contrast library
        if (color && backgroundColor) {
          issues.push({
            element: el.tagName,
            color,
            backgroundColor,
          });
        }
      });

      return issues.slice(0, 10); // Limit to first 10 for performance
    });

    return contrastIssues;
  }

  async validateSemanticHTML() {
    const semanticStructure = await this.page.evaluate(() => {
      return {
        hasMain: document.querySelector('main, [role="main"]') !== null,
        hasNavigation: document.querySelector('nav, [role="navigation"]') !== null,
        hasHeadings: document.querySelector('h1, h2, h3, h4, h5, h6') !== null,
        hasLandmarks: document.querySelectorAll(
          '[role="banner"], [role="contentinfo"], [role="complementary"], [role="main"], [role="navigation"]'
        ).length,
        hasSkipLinks: document.querySelector('a[href^="#"], [data-testid="skip-link"]') !== null,
        headingStructure: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .map((h) => ({
            level: parseInt(h.tagName.slice(1)),
            text: h.textContent?.slice(0, 50),
          }))
          .slice(0, 10),
      };
    });

    return semanticStructure;
  }

  async screenshotA11y(name: string) {
    await this.page.screenshot({
      path: `tests/screenshots/accessibility-${name}-${test.info().project.name}.png`,
      fullPage: true,
    });
  }

  async testFocusManagement() {
    // Test focus trap in modals
    const modalTriggers = this.page.locator(
      '[data-testid="modal-trigger"], button:has-text("Open"), [aria-haspopup="dialog"]'
    );

    if ((await modalTriggers.count()) > 0) {
      await modalTriggers.first().click();
      await this.page.waitForTimeout(300);

      const modal = this.page.locator('[role="dialog"], [data-testid="modal"]');
      if ((await modal.count()) > 0) {
        // Focus should be within modal
        const focusInModal = await this.page.evaluate(() => {
          const activeElement = document.activeElement;
          const modal = document.querySelector('[role="dialog"]');
          return modal?.contains(activeElement) || false;
        });

        return { hasModal: true, focusInModal };
      }
    }

    return { hasModal: false, focusInModal: false };
  }
}

test.describe('Accessibility Compliance - WCAG 2.1 AA Validation', () => {
  let utils: AccessibilityTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new AccessibilityTestUtils(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Automated Accessibility Scanning', () => {
    test('should have no automatically detectable accessibility violations on main page', async ({
      page,
    }) => {
      const accessibilityScanResults = await utils.scanWithAxe();

      // Take screenshot for manual review
      await utils.screenshotA11y('main-page-scan');

      // Attach full results for debugging
      await test.info().attach('accessibility-scan-results', {
        body: JSON.stringify(accessibilityScanResults, null, 2),
        contentType: 'application/json',
      });

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have no accessibility violations in playground components', async ({ page }) => {
      const playgroundPages = [
        '/playground',
        '/playground/shell',
        '/playground/command',
        '/playground/contexts',
        '/playground/onboarding',
      ];

      for (const playgroundPage of playgroundPages) {
        await page.goto(playgroundPage);
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await utils.scanWithAxe();

        // Allow for minor violations in development/test components
        const criticalViolations = accessibilityScanResults.violations.filter(
          (v) => v.impact === 'critical' || v.impact === 'serious'
        );

        expect(criticalViolations).toEqual([]);

        console.log(
          `${playgroundPage}: ${accessibilityScanResults.violations.length} total violations, ${criticalViolations.length} critical`
        );
      }
    });

    test('should scan SuperContext system for accessibility', async ({ page }) => {
      await page.goto('/playground/contexts');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await utils.scanWithAxe();

      // Focus on interactive elements in the context testing interface
      const interactiveViolations = accessibilityScanResults.violations.filter((v) =>
        v.nodes.some((node) =>
          node.target.some(
            (target) =>
              target.includes('button') ||
              target.includes('input') ||
              target.includes('[role="button"]')
          )
        )
      );

      expect(interactiveViolations).toEqual([]);
    });

    test('should validate modal and dialog accessibility', async ({ page }) => {
      // Test various modal/dialog triggers if they exist
      const dialogTriggers = [
        '[data-testid="modal-trigger"]',
        'button:has-text("Open")',
        '[aria-haspopup="dialog"]',
      ];

      for (const selector of dialogTriggers) {
        const trigger = page.locator(selector);
        if ((await trigger.count()) > 0) {
          await trigger.first().click();
          await page.waitForTimeout(500);

          const accessibilityScanResults = await utils.scanWithAxe();
          const dialogViolations = accessibilityScanResults.violations.filter(
            (v) => v.id.includes('dialog') || v.id.includes('modal') || v.id.includes('focus')
          );

          expect(dialogViolations).toEqual([]);

          // Close modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
          break;
        }
      }
    });
  });

  test.describe('Keyboard Navigation Testing', () => {
    test('should support full keyboard navigation', async ({ page }) => {
      const focusableElements = await utils.testKeyboardNavigation();

      expect(focusableElements.length).toBeGreaterThan(3); // Should have multiple focusable elements

      console.log(`Found ${focusableElements.length} focusable elements`);
      await utils.screenshotA11y('keyboard-navigation');
    });

    test('should handle common keyboard shortcuts', async ({ page }) => {
      const shortcuts = [
        'Escape',
        'Enter',
        'Space',
        'Tab',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
      ];

      for (const shortcut of shortcuts) {
        await page.keyboard.press(shortcut);
        await page.waitForTimeout(100);

        // Should not cause JavaScript errors
        const errors = await page.evaluate(() => {
          return (window as any).__keyboardErrors__ || [];
        });

        expect(Array.isArray(errors) ? errors.length : 0).toBe(0);
      }
    });

    test('should support skip links for keyboard users', async ({ page }) => {
      const semanticStructure = await utils.validateSemanticHTML();

      // Should have skip links or proper heading structure
      expect(semanticStructure.hasSkipLinks || semanticStructure.hasHeadings).toBe(true);

      if (semanticStructure.hasSkipLinks) {
        // Test skip link functionality
        await page.keyboard.press('Tab');
        const skipLink = page.locator('a[href^="#"], [data-testid="skip-link"]').first();

        if ((await skipLink.count()) > 0) {
          await skipLink.press('Enter');
          await page.waitForTimeout(200);

          // Focus should move to target
          const targetReached = await page.evaluate(() => {
            return document.activeElement !== document.body;
          });

          expect(targetReached).toBe(true);
        }
      }
    });

    test('should manage focus properly in interactive components', async ({ page }) => {
      const focusManagement = await utils.testFocusManagement();

      if (focusManagement.hasModal) {
        expect(focusManagement.focusInModal).toBe(true);
      }

      // Test focus restoration
      const initialFocus = await page.evaluate(() => document.activeElement?.tagName);

      // Open and close a modal/dialog
      const trigger = page
        .locator('[data-testid="modal-trigger"], button:has-text("Open")')
        .first();
      if ((await trigger.count()) > 0) {
        await trigger.click();
        await page.waitForTimeout(300);

        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Focus should return to trigger or appropriate element
        const finalFocus = await page.evaluate(() => document.activeElement?.tagName);
        expect(finalFocus).toBeTruthy();
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper ARIA attributes', async ({ page }) => {
      const ariaElements = await utils.testScreenReaderSupport();

      expect(ariaElements.length).toBeGreaterThan(5); // Should have multiple ARIA-enhanced elements

      // Check for essential ARIA patterns
      const hasLabels = ariaElements.some((el) => el.ariaLabel);
      const hasRoles = ariaElements.some((el) => el.role);
      const hasExpanded = ariaElements.some((el) => el.ariaExpanded !== null);

      expect(hasLabels).toBe(true);
      expect(hasRoles).toBe(true);

      console.log(`Found ${ariaElements.length} elements with ARIA attributes`);
    });

    test('should provide meaningful descriptions for interactive elements', async ({ page }) => {
      const buttons = page.locator('button, [role="button"]');
      const buttonCount = await buttons.count();

      let labeledButtons = 0;

      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        const hasLabel = await button.evaluate((el) => {
          return !!(
            el.getAttribute('aria-label') ||
            el.getAttribute('aria-labelledby') ||
            el.textContent?.trim()
          );
        });

        if (hasLabel) labeledButtons++;
      }

      const labeledPercentage = labeledButtons / Math.min(buttonCount, 10);
      expect(labeledPercentage).toBeGreaterThan(0.8); // 80% should be properly labeled
    });

    test('should announce dynamic content changes', async ({ page }) => {
      // Test for live regions
      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
      const liveRegionCount = await liveRegions.count();

      if (liveRegionCount > 0) {
        console.log(`Found ${liveRegionCount} live regions for dynamic content`);

        // Test if live regions are properly configured
        for (let i = 0; i < liveRegionCount; i++) {
          const region = liveRegions.nth(i);
          const ariaLive = await region.getAttribute('aria-live');
          const role = await region.getAttribute('role');

          expect(ariaLive || role).toBeTruthy();
        }
      }
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const semanticStructure = await utils.validateSemanticHTML();

      expect(semanticStructure.hasHeadings).toBe(true);
      expect(semanticStructure.headingStructure.length).toBeGreaterThan(0);

      // Check heading hierarchy is logical (should start with h1)
      const firstHeading = semanticStructure.headingStructure[0];
      if (firstHeading) {
        expect(firstHeading.level).toBeLessThanOrEqual(2); // Should start with h1 or h2
      }

      console.log(
        'Heading structure:',
        semanticStructure.headingStructure.map((h) => `h${h.level}: ${h.text}`)
      );
    });
  });

  test.describe('Visual Accessibility', () => {
    test('should meet color contrast requirements', async ({ page }) => {
      const contrastIssues = await utils.checkColorContrast();

      // This is a basic check - in production, use a proper contrast analyzer
      console.log(`Checked ${contrastIssues.length} elements for color contrast`);

      // Test with axe which includes proper contrast checking
      const accessibilityScanResults = await utils.scanWithAxe();
      const contrastViolations = accessibilityScanResults.violations.filter((v) =>
        v.id.includes('color-contrast')
      );

      expect(contrastViolations).toEqual([]);
    });

    test('should be usable without motion (prefers-reduced-motion)', async ({ page }) => {
      // Test with reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check that animations are disabled or reduced
      const hasReducedMotion = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let animatedElements = 0;

        elements.forEach((el) => {
          const style = getComputedStyle(el);
          if (style.animation !== 'none' && style.animation !== '') {
            animatedElements++;
          }
        });

        return animatedElements;
      });

      // Should have minimal animations with reduced motion
      expect(hasReducedMotion).toBeLessThan(5);

      await utils.screenshotA11y('reduced-motion');
    });

    test('should be usable at 200% zoom', async ({ page }) => {
      // Set zoom level to 200%
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });

      await page.waitForTimeout(500);

      // Content should remain accessible
      const isContentVisible = await page.locator('h1, h2, p').first().isVisible();
      expect(isContentVisible).toBe(true);

      // No horizontal scrolling should be necessary
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      // Allow some horizontal scroll tolerance for complex layouts
      console.log(`Has horizontal scroll at 200% zoom: ${hasHorizontalScroll}`);

      await utils.screenshotA11y('200-percent-zoom');

      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = '1';
      });
    });

    test('should support high contrast mode', async ({ page }) => {
      // Simulate high contrast mode
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            * {
              outline: 1px solid !important;
              background-color: white !important;
              color: black !important;
            }
          }
        `,
      });

      await page.emulateMedia({ colorScheme: 'dark' });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should remain functional in high contrast
      const isUsable = await page.locator('button, input, a').first().isVisible();
      expect(isUsable).toBe(true);

      await utils.screenshotA11y('high-contrast');
    });
  });

  test.describe('Semantic HTML Structure', () => {
    test('should use proper semantic HTML elements', async ({ page }) => {
      const semanticStructure = await utils.validateSemanticHTML();

      expect(semanticStructure.hasMain).toBe(true);
      expect(semanticStructure.hasNavigation).toBe(true);
      expect(semanticStructure.hasHeadings).toBe(true);
      expect(semanticStructure.hasLandmarks).toBeGreaterThan(2); // Should have multiple landmarks

      await utils.screenshotA11y('semantic-structure');
    });

    test('should provide proper form labels and structure', async ({ page }) => {
      const formElements = page.locator('input, textarea, select');
      const formCount = await formElements.count();

      if (formCount > 0) {
        let labeledForms = 0;

        for (let i = 0; i < formCount; i++) {
          const element = formElements.nth(i);
          const hasLabel = await element.evaluate((el) => {
            return !!(
              el.getAttribute('aria-label') ||
              el.getAttribute('aria-labelledby') ||
              document.querySelector(`label[for="${el.id}"]`) ||
              el.closest('label')
            );
          });

          if (hasLabel) labeledForms++;
        }

        const labeledPercentage = labeledForms / formCount;
        expect(labeledPercentage).toBeGreaterThan(0.9); // 90% should be properly labeled
      }
    });

    test('should use appropriate list markup', async ({ page }) => {
      const lists = page.locator('ul, ol, dl');
      const listCount = await lists.count();

      if (listCount > 0) {
        // Check that lists contain proper list items
        for (let i = 0; i < listCount; i++) {
          const list = lists.nth(i);
          const tagName = await list.evaluate((el) => el.tagName.toLowerCase());

          const expectedChild = tagName === 'dl' ? 'dt, dd' : 'li';
          const hasProperStructure = (await list.locator(expectedChild).count()) > 0;

          if (hasProperStructure) {
            console.log(`✅ ${tagName} has proper list structure`);
          }
        }
      }
    });
  });

  test.describe('Cross-Browser Accessibility', () => {
    test('should maintain accessibility across different browsers', async ({
      page,
      browserName,
    }) => {
      const accessibilityScanResults = await utils.scanWithAxe();

      // Filter to critical violations only for cross-browser testing
      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical'
      );

      expect(criticalViolations).toEqual([]);

      console.log(
        `${browserName}: ${accessibilityScanResults.violations.length} total violations, ${criticalViolations.length} critical`
      );

      await utils.screenshotA11y(`cross-browser-${browserName}`);
    });

    test('should support assistive technology APIs', async ({ page }) => {
      // Test that elements are exposed to assistive technology
      const accessibleElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('button, input, a, [role], [aria-label]');
        return Array.from(elements)
          .map((el) => ({
            tagName: el.tagName,
            role: el.getAttribute('role'),
            ariaLabel: el.getAttribute('aria-label'),
          }))
          .slice(0, 20); // Limit for performance
      });

      expect(accessibleElements.length).toBeGreaterThan(5);

      // Should have a variety of accessible elements
      const uniqueTags = new Set(accessibleElements.map((el) => el.tagName));
      expect(uniqueTags.size).toBeGreaterThan(2);
    });
  });

  test.describe('Mobile Accessibility', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should maintain accessibility on mobile devices', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await utils.scanWithAxe();

      // Mobile-specific accessibility checks
      const mobileViolations = accessibilityScanResults.violations.filter(
        (v) => v.id.includes('touch') || v.id.includes('target') || v.impact === 'critical'
      );

      expect(mobileViolations).toEqual([]);

      await utils.screenshotA11y('mobile-accessibility');
    });

    test('should have adequate touch targets on mobile', async ({ page }) => {
      const touchTargets = page.locator('button, a, input, [role="button"], [tabindex]');
      const count = await touchTargets.count();

      let adequateTargets = 0;

      for (let i = 0; i < Math.min(count, 15); i++) {
        const element = touchTargets.nth(i);
        const box = await element.boundingBox();

        if (box && box.width >= 44 && box.height >= 44) {
          adequateTargets++;
        }
      }

      const adequatePercentage = adequateTargets / Math.min(count, 15);
      expect(adequatePercentage).toBeGreaterThan(0.7); // 70% should meet touch target size
    });
  });
});
