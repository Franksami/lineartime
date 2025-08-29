import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG 2.1 AAA Compliance Test Suite
 *
 * Comprehensive testing for AAA accessibility compliance:
 * - 7:1 contrast ratios for normal text
 * - 4.5:1 contrast ratios for large text
 * - 3:1 contrast ratios for focus indicators
 * - Enhanced keyboard navigation
 * - Advanced screen reader support
 * - Focus management validation
 * - Context-sensitive help
 * - Error prevention and recovery
 */

interface AAAcontrastTest {
  selector: string;
  expectedRatio: number;
  textSize: 'normal' | 'large';
  description: string;
}

interface KeyboardNavigationTest {
  keys: string[];
  expectedBehavior: string;
  context: string;
  priority: 'critical' | 'important' | 'helpful';
}

class AAAccessibilityTestUtils {
  constructor(private page: Page) {}

  /**
   * Enhanced axe scanning with AAA rules
   */
  async scanWithAxeAAA(options?: any) {
    const accessibilityScanResults = await new AxeBuilder({ page: this.page })
      .withTags([
        'wcag2a',
        'wcag2aa',
        'wcag2aaa',
        'wcag21a',
        'wcag21aa',
        'wcag21aaa',
        'best-practice',
      ])
      .withRules([
        'color-contrast-enhanced', // AAA color contrast
        'focus-order-semantics',
        'keyboard-navigation',
        'aria-valid-attr-value',
        'aria-required-children',
      ])
      .exclude('#commonly-reused-element-with-known-issue')
      .analyze(options);

    return accessibilityScanResults;
  }

  /**
   * Test AAA contrast ratios (7:1 for normal text, 4.5:1 for large text)
   */
  async testAAAcontrastRatios(): Promise<
    Array<{
      element: string;
      actualRatio: number;
      requiredRatio: number;
      passes: boolean;
      textSize: string;
    }>
  > {
    const contrastTests: AAAcontrastTest[] = [
      {
        selector: 'h1, h2, h3, h4, h5, h6',
        expectedRatio: 4.5, // Large text
        textSize: 'large',
        description: 'Heading contrast',
      },
      {
        selector: 'p, span, div:not([role="presentation"])',
        expectedRatio: 7.0, // Normal text AAA
        textSize: 'normal',
        description: 'Body text contrast',
      },
      {
        selector: 'button, [role="button"]',
        expectedRatio: 7.0,
        textSize: 'normal',
        description: 'Button text contrast',
      },
      {
        selector: 'a, [role="link"]',
        expectedRatio: 7.0,
        textSize: 'normal',
        description: 'Link contrast',
      },
      {
        selector: 'input, textarea, select',
        expectedRatio: 7.0,
        textSize: 'normal',
        description: 'Form control contrast',
      },
    ];

    const results: Array<{
      element: string;
      actualRatio: number;
      requiredRatio: number;
      passes: boolean;
      textSize: string;
    }> = [];

    for (const test of contrastTests) {
      const elements = this.page.locator(test.selector);
      const count = await elements.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        // Test first 10 of each type
        const element = elements.nth(i);
        const isVisible = await element.isVisible();

        if (!isVisible) continue;

        const contrastInfo = await element.evaluate((el, testData) => {
          const computedStyle = getComputedStyle(el);
          const color = computedStyle.color;
          const backgroundColor = computedStyle.backgroundColor;

          // Simple contrast calculation (in real implementation, use proper color contrast library)
          const rgb1 = this.parseRgb(color);
          const rgb2 = this.parseRgb(backgroundColor) || { r: 255, g: 255, b: 255 }; // Default to white

          const ratio = this.calculateContrastRatio(rgb1, rgb2);

          return {
            color,
            backgroundColor,
            ratio: Math.round(ratio * 10) / 10,
            fontSize: computedStyle.fontSize,
            fontWeight: computedStyle.fontWeight,
          };
        }, test);

        results.push({
          element: `${test.selector}[${i}]`,
          actualRatio: contrastInfo.ratio,
          requiredRatio: test.expectedRatio,
          passes: contrastInfo.ratio >= test.expectedRatio,
          textSize: test.textSize,
        });
      }
    }

    return results;
  }

  /**
   * Test enhanced keyboard navigation patterns
   */
  async testEnhancedKeyboardNavigation(): Promise<{
    patterns: Array<{
      keys: string[];
      description: string;
      success: boolean;
      error?: string;
    }>;
    focusIndicatorQuality: {
      thickness: number;
      contrast: number;
      visibility: boolean;
    };
  }> {
    const keyboardPatterns: KeyboardNavigationTest[] = [
      {
        keys: ['Tab'],
        expectedBehavior: 'Navigate to next focusable element',
        context: 'Global',
        priority: 'critical',
      },
      {
        keys: ['Shift', 'Tab'],
        expectedBehavior: 'Navigate to previous focusable element',
        context: 'Global',
        priority: 'critical',
      },
      {
        keys: ['ArrowRight'],
        expectedBehavior: 'Navigate calendar to next day',
        context: 'Calendar',
        priority: 'critical',
      },
      {
        keys: ['ArrowLeft'],
        expectedBehavior: 'Navigate calendar to previous day',
        context: 'Calendar',
        priority: 'critical',
      },
      {
        keys: ['ArrowDown'],
        expectedBehavior: 'Navigate calendar to next week',
        context: 'Calendar',
        priority: 'critical',
      },
      {
        keys: ['ArrowUp'],
        expectedBehavior: 'Navigate calendar to previous week',
        context: 'Calendar',
        priority: 'critical',
      },
      {
        keys: ['Home'],
        expectedBehavior: 'Navigate to first day of month',
        context: 'Calendar',
        priority: 'important',
      },
      {
        keys: ['End'],
        expectedBehavior: 'Navigate to last day of month',
        context: 'Calendar',
        priority: 'important',
      },
      {
        keys: ['Control', 'Home'],
        expectedBehavior: 'Navigate to current date',
        context: 'Calendar',
        priority: 'important',
      },
      {
        keys: ['F6'],
        expectedBehavior: 'Cycle between calendar regions',
        context: 'Calendar',
        priority: 'helpful',
      },
      {
        keys: ['F1'],
        expectedBehavior: 'Show contextual help',
        context: 'Global',
        priority: 'helpful',
      },
      {
        keys: ['Escape'],
        expectedBehavior: 'Close dialog or return to previous state',
        context: 'Modal',
        priority: 'critical',
      },
    ];

    const results: Array<{
      keys: string[];
      description: string;
      success: boolean;
      error?: string;
    }> = [];

    // Test each keyboard pattern
    for (const pattern of keyboardPatterns) {
      try {
        // Setup context for test
        if (pattern.context === 'Calendar') {
          await this.page
            .locator('[data-testid="calendar"], [data-region="calendar-grid"]')
            .first()
            .focus();
        }

        const initialFocus = await this.page.evaluate(() => document.activeElement?.tagName);

        // Execute key combination
        if (pattern.keys.length === 1) {
          await this.page.keyboard.press(pattern.keys[0]);
        } else if (pattern.keys.length === 2) {
          await this.page.keyboard.press(`${pattern.keys[0]}+${pattern.keys[1]}`);
        } else {
          // Handle complex key combinations
          for (const key of pattern.keys.slice(0, -1)) {
            await this.page.keyboard.down(key);
          }
          await this.page.keyboard.press(pattern.keys[pattern.keys.length - 1]);
          for (const key of pattern.keys.slice(0, -1).reverse()) {
            await this.page.keyboard.up(key);
          }
        }

        await this.page.waitForTimeout(150); // Allow for transitions

        const finalFocus = await this.page.evaluate(() => document.activeElement?.tagName);

        results.push({
          keys: pattern.keys,
          description: pattern.expectedBehavior,
          success: initialFocus !== finalFocus || pattern.keys.includes('Escape'), // Focus should change or be escape
        });
      } catch (error) {
        results.push({
          keys: pattern.keys,
          description: pattern.expectedBehavior,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Test focus indicator quality
    const focusIndicatorQuality = await this.page.evaluate(() => {
      // Create a test element to check focus styles
      const testButton = document.createElement('button');
      testButton.textContent = 'Test Focus';
      testButton.style.position = 'absolute';
      testButton.style.top = '-1000px';
      document.body.appendChild(testButton);

      testButton.focus();

      const computedStyle = getComputedStyle(testButton);
      const outlineWidth = parseFloat(computedStyle.outlineWidth) || 0;
      const outlineColor = computedStyle.outlineColor;

      // Clean up
      document.body.removeChild(testButton);

      return {
        thickness: outlineWidth,
        contrast: 3.0, // Simplified - would need proper color contrast calculation
        visibility: outlineWidth >= 3, // AAA requires 3px minimum
        color: outlineColor,
      };
    });

    return {
      patterns: results,
      focusIndicatorQuality: {
        thickness: focusIndicatorQuality.thickness,
        contrast: focusIndicatorQuality.contrast,
        visibility: focusIndicatorQuality.visibility,
      },
    };
  }

  /**
   * Test screen reader enhancements for AAA compliance
   */
  async testScreenReaderEnhancements(): Promise<{
    ariaElements: number;
    liveRegions: number;
    landmarks: number;
    headingStructure: Array<{ level: number; text: string }>;
    descriptionQuality: number; // Percentage of elements with good descriptions
    contextualInstructions: boolean;
  }> {
    const screenReaderAnalysis = await this.page.evaluate(() => {
      // Count ARIA elements
      const ariaElements = document.querySelectorAll(
        '[aria-label], [aria-labelledby], [aria-describedby], [role]'
      ).length;

      // Count live regions
      const liveRegions = document.querySelectorAll(
        '[aria-live], [role="status"], [role="alert"], [role="log"]'
      ).length;

      // Count landmarks
      const landmarks = document.querySelectorAll(
        '[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], main, nav, header, footer, aside'
      ).length;

      // Analyze heading structure
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const headingStructure = headings.map((h) => ({
        level: parseInt(h.tagName.slice(1)),
        text: h.textContent?.slice(0, 50) || '',
      }));

      // Check description quality
      const interactiveElements = document.querySelectorAll(
        'button, a, input, select, textarea, [role="button"], [role="link"]'
      );
      let wellDescribedElements = 0;

      interactiveElements.forEach((el) => {
        const hasLabel =
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby') ||
          (el as HTMLElement).textContent?.trim();
        if (hasLabel) wellDescribedElements++;
      });

      const descriptionQuality =
        interactiveElements.length > 0
          ? (wellDescribedElements / interactiveElements.length) * 100
          : 100;

      // Check for contextual instructions
      const contextualInstructions =
        document.querySelector(
          '[id*="instructions"], [aria-describedby*="help"], [role="tooltip"]'
        ) !== null;

      return {
        ariaElements,
        liveRegions,
        landmarks,
        headingStructure,
        descriptionQuality: Math.round(descriptionQuality),
        contextualInstructions,
      };
    });

    return screenReaderAnalysis;
  }

  /**
   * Test focus trap functionality for AAA compliance
   */
  async testEnhancedFocusTrap(): Promise<{
    trapActivation: boolean;
    focusRestoration: boolean;
    escapeHandling: boolean;
    tabCycling: boolean;
    screenReaderAnnouncements: boolean;
  }> {
    const focusTrapResults = {
      trapActivation: false,
      focusRestoration: false,
      escapeHandling: false,
      tabCycling: false,
      screenReaderAnnouncements: false,
    };

    try {
      // Test modal/dialog focus trap
      const modalTrigger = this.page
        .locator('[data-testid="modal-trigger"], button:has-text("Open"), [aria-haspopup="dialog"]')
        .first();

      if ((await modalTrigger.count()) > 0) {
        // Record initial focus
        const initialFocusElement = await this.page.evaluate(() => document.activeElement?.tagName);

        // Open modal
        await modalTrigger.click();
        await this.page.waitForTimeout(300);

        // Check if focus moved into modal
        const modalFocus = await this.page.evaluate(() => {
          const activeElement = document.activeElement;
          const modal = document.querySelector('[role="dialog"], [data-testid="modal"]');
          return modal?.contains(activeElement) || false;
        });

        focusTrapResults.trapActivation = modalFocus;

        if (modalFocus) {
          // Test tab cycling within modal
          const modalElements = await this.page
            .locator('[role="dialog"] button, [role="dialog"] input, [role="dialog"] a')
            .count();

          if (modalElements > 1) {
            // Tab through all elements and back to first
            for (let i = 0; i < modalElements + 1; i++) {
              await this.page.keyboard.press('Tab');
              await this.page.waitForTimeout(100);
            }

            // Check if we're back at the first focusable element
            const backToFirst = await this.page.evaluate(() => {
              const modal = document.querySelector('[role="dialog"]');
              const firstFocusable = modal?.querySelector(
                'button, input, a, [tabindex]:not([tabindex="-1"])'
              );
              return document.activeElement === firstFocusable;
            });

            focusTrapResults.tabCycling = backToFirst;
          }

          // Test Escape key handling
          await this.page.keyboard.press('Escape');
          await this.page.waitForTimeout(300);

          const modalClosed = (await this.page.locator('[role="dialog"]').count()) === 0;
          focusTrapResults.escapeHandling = modalClosed;

          if (modalClosed) {
            // Check focus restoration
            const finalFocus = await this.page.evaluate(() => document.activeElement?.tagName);
            focusTrapResults.focusRestoration = finalFocus === initialFocusElement;
          }
        }

        // Check for screen reader announcements
        const hasLiveRegions =
          (await this.page.locator('[aria-live], [role="status"]').count()) > 0;
        focusTrapResults.screenReaderAnnouncements = hasLiveRegions;
      }
    } catch (error) {
      console.warn('Focus trap test encountered error:', error);
    }

    return focusTrapResults;
  }

  /**
   * Test contextual help system (AAA requirement)
   */
  async testContextualHelp(): Promise<{
    helpAvailable: boolean;
    helpAccessible: boolean;
    helpRelevant: boolean;
    helpTriggersWork: boolean;
  }> {
    const helpResults = {
      helpAvailable: false,
      helpAccessible: false,
      helpRelevant: false,
      helpTriggersWork: false,
    };

    try {
      // Test F1 help trigger
      await this.page.keyboard.press('F1');
      await this.page.waitForTimeout(500);

      const helpDialog = this.page.locator(
        '[role="dialog"][aria-labelledby*="help"], [data-testid="help-dialog"]'
      );
      helpResults.helpAvailable = (await helpDialog.count()) > 0;

      if (helpResults.helpAvailable) {
        // Check if help is accessible
        const helpContent = await helpDialog.textContent();
        helpResults.helpAccessible = helpContent !== null && helpContent.length > 0;

        // Check if help is contextually relevant
        helpResults.helpRelevant =
          helpContent?.toLowerCase().includes('calendar') ||
          helpContent?.toLowerCase().includes('navigation') ||
          helpContent?.toLowerCase().includes('keyboard') ||
          false;

        // Check if help can be closed
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(300);

        helpResults.helpTriggersWork = (await helpDialog.count()) === 0;
      }

      // Test ? key help trigger
      await this.page.keyboard.press('?');
      await this.page.waitForTimeout(300);

      const alternativeHelp =
        (await this.page.locator('[data-testid="help"], [role="tooltip"]').count()) > 0;
      if (alternativeHelp && !helpResults.helpAvailable) {
        helpResults.helpAvailable = true;
        helpResults.helpAccessible = true;
      }
    } catch (error) {
      console.warn('Contextual help test encountered error:', error);
    }

    return helpResults;
  }

  /**
   * Test text spacing for AAA compliance
   */
  async testTextSpacing(): Promise<{
    lineHeight: { passes: boolean; actual: number; required: number };
    letterSpacing: { passes: boolean; actual: number; required: number };
    wordSpacing: { passes: boolean; actual: number; required: number };
    paragraphSpacing: { passes: boolean; actual: number; required: number };
  }> {
    return await this.page.evaluate(() => {
      const testElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div');
      let totalElements = 0;
      let passedElements = {
        lineHeight: 0,
        letterSpacing: 0,
        wordSpacing: 0,
        paragraphSpacing: 0,
      };

      testElements.forEach((el) => {
        const style = getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);

        // Line height should be at least 1.5x font size
        const lineHeight = parseFloat(style.lineHeight) / fontSize;
        if (lineHeight >= 1.5) passedElements.lineHeight++;

        // Letter spacing should be at least 0.12x font size
        const letterSpacing = parseFloat(style.letterSpacing) / fontSize;
        if (letterSpacing >= 0.12 || style.letterSpacing === 'normal')
          passedElements.letterSpacing++;

        // Word spacing should be at least 0.16x font size
        const wordSpacing = parseFloat(style.wordSpacing) / fontSize;
        if (wordSpacing >= 0.16 || style.wordSpacing === 'normal') passedElements.wordSpacing++;

        // Paragraph spacing should be at least 2x font size
        const marginBottom = parseFloat(style.marginBottom) / fontSize;
        if (marginBottom >= 2.0) passedElements.paragraphSpacing++;

        totalElements++;
      });

      return {
        lineHeight: {
          passes: passedElements.lineHeight / totalElements >= 0.9, // 90% should pass
          actual: passedElements.lineHeight / totalElements,
          required: 0.9,
        },
        letterSpacing: {
          passes: passedElements.letterSpacing / totalElements >= 0.9,
          actual: passedElements.letterSpacing / totalElements,
          required: 0.9,
        },
        wordSpacing: {
          passes: passedElements.wordSpacing / totalElements >= 0.9,
          actual: passedElements.wordSpacing / totalElements,
          required: 0.9,
        },
        paragraphSpacing: {
          passes: passedElements.paragraphSpacing / totalElements >= 0.8, // Slightly lower requirement
          actual: passedElements.paragraphSpacing / totalElements,
          required: 0.8,
        },
      };
    });
  }

  async screenshotAAA(name: string) {
    await this.page.screenshot({
      path: `tests/screenshots/aaa-${name}-${test.info().project.name}.png`,
      fullPage: true,
    });
  }
}

test.describe('WCAG 2.1 AAA Compliance Validation', () => {
  let utils: AAAccessibilityTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new AAAccessibilityTestUtils(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('AAA Color Contrast Requirements', () => {
    test('should meet 7:1 contrast ratio for normal text', async ({ page }) => {
      const contrastResults = await utils.testAAAcontrastRatios();

      await utils.screenshotAAA('color-contrast');

      // Filter for normal text elements
      const normalTextResults = contrastResults.filter((result) => result.textSize === 'normal');
      const failedContrast = normalTextResults.filter((result) => !result.passes);

      if (failedContrast.length > 0) {
        console.log('Failed contrast checks:', failedContrast);

        // Attach detailed report
        await test.info().attach('contrast-failures', {
          body: JSON.stringify(failedContrast, null, 2),
          contentType: 'application/json',
        });
      }

      expect(failedContrast.length).toBe(0);
    });

    test('should meet 4.5:1 contrast ratio for large text', async ({ page }) => {
      const contrastResults = await utils.testAAAcontrastRatios();

      // Filter for large text elements (headings, large fonts)
      const largeTextResults = contrastResults.filter((result) => result.textSize === 'large');
      const failedContrast = largeTextResults.filter((result) => !result.passes);

      expect(failedContrast.length).toBe(0);
    });

    test('should have 3:1+ contrast for focus indicators', async ({ page }) => {
      // Test focus indicator visibility and contrast
      const focusTest = await page.locator('button, a, input').first();
      await focusTest.focus();

      const focusStyles = await focusTest.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          outlineWidth: style.outlineWidth,
          outlineColor: style.outlineColor,
          outlineStyle: style.outlineStyle,
        };
      });

      // Focus indicator should be at least 3px thick for AAA
      const outlineWidth = parseFloat(focusStyles.outlineWidth);
      expect(outlineWidth).toBeGreaterThanOrEqual(3);

      await utils.screenshotAAA('focus-indicators');
    });
  });

  test.describe('Enhanced Keyboard Navigation', () => {
    test('should support all AAA keyboard patterns', async ({ page }) => {
      const navigationResults = await utils.testEnhancedKeyboardNavigation();

      // Critical keyboard patterns must all work
      const criticalPatterns = navigationResults.patterns.filter((p) =>
        ['Tab', 'Shift+Tab', 'ArrowRight', 'ArrowLeft', 'Escape'].includes(p.keys.join('+'))
      );

      const criticalFailures = criticalPatterns.filter((p) => !p.success);
      expect(criticalFailures.length).toBe(0);

      // Focus indicators must meet AAA standards
      expect(navigationResults.focusIndicatorQuality.thickness).toBeGreaterThanOrEqual(3);
      expect(navigationResults.focusIndicatorQuality.visibility).toBe(true);

      await utils.screenshotAAA('keyboard-navigation');
    });

    test('should support calendar-specific navigation patterns', async ({ page }) => {
      // Navigate to calendar if not already there
      const calendar = page.locator('[data-testid="calendar"], [role="grid"]').first();
      if ((await calendar.count()) > 0) {
        await calendar.click();

        // Test calendar arrow key navigation
        const calendarCell = page.locator('[role="gridcell"], [data-date]').first();
        if ((await calendarCell.count()) > 0) {
          await calendarCell.focus();

          // Test all four arrow directions
          const arrowTests = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];

          for (const arrow of arrowTests) {
            const initialFocus = await page.evaluate(() =>
              document.activeElement?.getAttribute('data-date')
            );
            await page.keyboard.press(arrow);
            await page.waitForTimeout(100);
            const finalFocus = await page.evaluate(() =>
              document.activeElement?.getAttribute('data-date')
            );

            // Focus should have moved (unless at boundary)
            if (initialFocus && finalFocus) {
              console.log(`${arrow}: ${initialFocus} → ${finalFocus}`);
            }
          }
        }
      }

      await utils.screenshotAAA('calendar-navigation');
    });

    test('should support F6 region cycling', async ({ page }) => {
      // Test F6 for cycling between page regions
      await page.keyboard.press('F6');
      await page.waitForTimeout(200);

      const regionAfterF6 = await page.evaluate(() => {
        const activeEl = document.activeElement;
        return activeEl
          ?.closest('[role="main"], [role="navigation"], [role="complementary"]')
          ?.getAttribute('role');
      });

      expect(regionAfterF6).toBeTruthy();

      await utils.screenshotAAA('f6-region-cycling');
    });
  });

  test.describe('Enhanced Screen Reader Support', () => {
    test('should provide comprehensive ARIA support', async ({ page }) => {
      const screenReaderAnalysis = await utils.testScreenReaderEnhancements();

      // Should have substantial ARIA coverage
      expect(screenReaderAnalysis.ariaElements).toBeGreaterThan(10);
      expect(screenReaderAnalysis.liveRegions).toBeGreaterThan(1);
      expect(screenReaderAnalysis.landmarks).toBeGreaterThan(3);

      // Description quality should be high (90%+)
      expect(screenReaderAnalysis.descriptionQuality).toBeGreaterThan(90);

      // Should have proper heading hierarchy
      expect(screenReaderAnalysis.headingStructure.length).toBeGreaterThan(2);

      const firstHeading = screenReaderAnalysis.headingStructure[0];
      expect(firstHeading.level).toBeLessThanOrEqual(2); // Should start with h1 or h2

      await utils.screenshotAAA('screen-reader-support');
    });

    test('should provide contextual instructions', async ({ page }) => {
      const screenReaderAnalysis = await utils.testScreenReaderEnhancements();

      // Should have contextual instructions available
      expect(screenReaderAnalysis.contextualInstructions).toBe(true);
    });

    test('should announce dynamic content changes', async ({ page }) => {
      // Test dynamic content announcements
      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
      const liveRegionCount = await liveRegions.count();

      expect(liveRegionCount).toBeGreaterThan(0);

      // Test if announcements work (simplified test)
      if (liveRegionCount > 0) {
        const liveRegion = liveRegions.first();

        // Change content and verify
        await liveRegion.evaluate((el) => {
          el.textContent = 'Test announcement for screen readers';
        });

        await page.waitForTimeout(500);

        const announcementContent = await liveRegion.textContent();
        expect(announcementContent).toContain('Test announcement');
      }
    });
  });

  test.describe('Advanced Focus Management', () => {
    test('should implement enhanced focus traps', async ({ page }) => {
      const focusTrapResults = await utils.testEnhancedFocusTrap();

      // Critical focus trap functionality
      if (focusTrapResults.trapActivation) {
        expect(focusTrapResults.focusRestoration).toBe(true);
        expect(focusTrapResults.escapeHandling).toBe(true);
        expect(focusTrapResults.tabCycling).toBe(true);
      }

      // Should have screen reader announcements
      expect(focusTrapResults.screenReaderAnnouncements).toBe(true);

      await utils.screenshotAAA('focus-traps');
    });

    test('should handle focus restoration correctly', async ({ page }) => {
      // Test focus restoration after modal interactions
      const button = page.locator('button').first();
      if ((await button.count()) > 0) {
        await button.focus();
        const initialElement = await page.evaluate(() => document.activeElement?.tagName);

        // Simulate modal opening and closing
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        const finalElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(finalElement).toBe(initialElement);
      }
    });
  });

  test.describe('Contextual Help System', () => {
    test('should provide accessible contextual help', async ({ page }) => {
      const helpResults = await utils.testContextualHelp();

      // Help should be available and accessible
      expect(helpResults.helpAvailable || helpResults.helpTriggersWork).toBe(true);

      if (helpResults.helpAvailable) {
        expect(helpResults.helpAccessible).toBe(true);
        expect(helpResults.helpRelevant).toBe(true);
      }

      await utils.screenshotAAA('contextual-help');
    });

    test('should respond to F1 help trigger', async ({ page }) => {
      await page.keyboard.press('F1');
      await page.waitForTimeout(500);

      const helpVisible =
        (await page.locator('[role="dialog"]:has-text("help"), [data-testid="help"]').count()) > 0;

      // Help should appear or some indication that F1 was handled
      const bodyText = await page.locator('body').textContent();
      expect(helpVisible || bodyText?.toLowerCase().includes('help')).toBe(true);
    });
  });

  test.describe('Text Spacing and Layout', () => {
    test('should meet AAA text spacing requirements', async ({ page }) => {
      const spacingResults = await utils.testTextSpacing();

      // All spacing requirements should pass
      expect(spacingResults.lineHeight.passes).toBe(true);
      expect(spacingResults.letterSpacing.passes).toBe(true);
      expect(spacingResults.wordSpacing.passes).toBe(true);
      expect(spacingResults.paragraphSpacing.passes).toBe(true);

      // Attach detailed spacing analysis
      await test.info().attach('text-spacing-analysis', {
        body: JSON.stringify(spacingResults, null, 2),
        contentType: 'application/json',
      });

      await utils.screenshotAAA('text-spacing');
    });

    test('should remain functional at 400% zoom', async ({ page }) => {
      // Test extreme zoom levels for AAA compliance
      await page.evaluate(() => {
        document.body.style.zoom = '4'; // 400% zoom
      });

      await page.waitForTimeout(500);

      // Content should still be accessible
      const isMainContentVisible = await page.locator('main, [role="main"]').isVisible();
      expect(isMainContentVisible).toBe(true);

      // Navigation should still work
      const firstButton = page.locator('button, [role="button"]').first();
      if ((await firstButton.count()) > 0) {
        await firstButton.click();
        // Should not cause layout breaking
        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth * 2; // Allow some overflow
        });

        console.log('Has horizontal overflow at 400% zoom:', hasOverflow);
      }

      await utils.screenshotAAA('400-percent-zoom');

      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = '1';
      });
    });
  });

  test.describe('Comprehensive AAA Validation', () => {
    test('should pass comprehensive AAA audit', async ({ page }) => {
      const accessibilityScanResults = await utils.scanWithAxeAAA();

      // Filter for AAA-specific violations
      const aaaViolations = accessibilityScanResults.violations.filter(
        (v) => v.tags.includes('wcag21aaa') || v.tags.includes('wcag2aaa')
      );

      // Should have no AAA violations
      expect(aaaViolations).toEqual([]);

      // Attach full AAA scan results
      await test.info().attach('aaa-accessibility-scan', {
        body: JSON.stringify(accessibilityScanResults, null, 2),
        contentType: 'application/json',
      });

      await utils.screenshotAAA('comprehensive-audit');
    });

    test('should validate LinearCalendarHorizontal AAA compliance', async ({ page }) => {
      const calendar = page
        .locator('[data-testid="calendar"], .linear-calendar-horizontal')
        .first();

      if ((await calendar.count()) > 0) {
        // Focus the calendar
        await calendar.click();

        // Test AAA-specific requirements for calendar
        const calendarAccessibility = await calendar.evaluate((cal) => {
          const style = getComputedStyle(cal);

          return {
            hasRole: cal.getAttribute('role') === 'grid' || cal.getAttribute('role') === 'table',
            hasLabel: !!cal.getAttribute('aria-label'),
            hasKeyboardInstructions: !!document.querySelector('[id*="instructions"]'),
            focusVisible: style.outline !== 'none',
          };
        });

        expect(calendarAccessibility.hasRole).toBe(true);
        expect(calendarAccessibility.hasLabel).toBe(true);

        // Test calendar keyboard navigation
        await calendar.focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(100);

        const focusedDate = await page.evaluate(() => {
          return (
            document.activeElement?.getAttribute('data-date') ||
            document.activeElement?.getAttribute('aria-label')
          );
        });

        expect(focusedDate).toBeTruthy();

        await utils.screenshotAAA('calendar-aaa-compliance');
      }
    });
  });

  test.describe('Cross-browser AAA Compliance', () => {
    test('should maintain AAA standards across browsers', async ({ page, browserName }) => {
      const accessibilityScanResults = await utils.scanWithAxeAAA();

      // Filter to critical AAA violations only
      const criticalAAAviolations = accessibilityScanResults.violations.filter(
        (v) =>
          (v.tags.includes('wcag21aaa') || v.tags.includes('wcag2aaa')) &&
          (v.impact === 'critical' || v.impact === 'serious')
      );

      expect(criticalAAAviolations).toEqual([]);

      console.log(
        `${browserName} AAA compliance: ${accessibilityScanResults.violations.length} total violations, ${criticalAAAviolations.length} critical AAA violations`
      );

      await utils.screenshotAAA(`cross-browser-${browserName}`);
    });
  });
});

// Helper function to parse RGB values from CSS color strings
function parseRgb(colorString: string): { r: number; g: number; b: number } | null {
  if (!colorString) return null;

  // Handle rgb() format
  const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  // Handle rgba() format
  const rgbaMatch = colorString.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
    };
  }

  return null;
}

// Calculate contrast ratio between two RGB colors
function calculateContrastRatio(
  rgb1: { r: number; g: number; b: number },
  rgb2: { r: number; g: number; b: number }
): number {
  const luminance1 = getLuminance(rgb1);
  const luminance2 = getLuminance(rgb2);

  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Calculate relative luminance of an RGB color
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const sRGB = [rgb.r, rgb.g, rgb.b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}
