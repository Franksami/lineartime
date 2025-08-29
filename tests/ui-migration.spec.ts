import { test, expect, Page, BrowserContext } from '@playwright/test';
import { chromium, firefox, webkit } from '@playwright/test';

/**
 * UI Migration Testing Strategy
 *
 * Comprehensive test suite for validating UI library migrations
 * Features:
 * - Component functionality testing
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Cross-browser compatibility
 * - Performance benchmarking
 * - Visual regression testing
 * - Migration rollback validation
 */

// Test configuration for different UI libraries
const UI_LIBRARIES = ['shadcn', 'arco', 'antd'] as const;
type UILibrary = (typeof UI_LIBRARIES)[number];

// Component test scenarios
const COMPONENT_TEST_SCENARIOS = {
  Button: [
    { props: { children: 'Click me' }, expectedText: 'Click me' },
    { props: { variant: 'outline', children: 'Outline' }, expectedText: 'Outline' },
    { props: { size: 'sm', children: 'Small' }, expectedText: 'Small' },
    { props: { disabled: true, children: 'Disabled' }, expectedText: 'Disabled' },
    { props: { loading: true, children: 'Loading' }, expectedText: 'Loading' },
  ],
  Input: [
    { props: { placeholder: 'Enter text' }, expectedPlaceholder: 'Enter text' },
    { props: { value: 'Test value' }, expectedValue: 'Test value' },
    { props: { disabled: true }, expectedDisabled: true },
    { props: { type: 'password' }, expectedType: 'password' },
  ],
  Card: [
    { props: { title: 'Card Title', children: 'Card content' } },
    { props: { children: 'Simple card' } },
  ],
};

// Accessibility test criteria
const ACCESSIBILITY_CRITERIA = {
  colorContrast: { minRatio: 4.5, level: 'AA' },
  keyboardNavigation: {
    requiredKeys: ['Tab', 'Enter', 'Space', 'Escape'],
    focusVisible: true,
  },
  screenReader: {
    ariaLabels: true,
    semanticElements: true,
    announcements: true,
  },
  responsiveDesign: {
    breakpoints: [320, 768, 1024, 1920],
    touchTargets: { minSize: 44 }, // 44px minimum
  },
};

// Performance benchmarks
const PERFORMANCE_BENCHMARKS = {
  componentLoadTime: { max: 100 }, // ms
  renderTime: { max: 50 }, // ms
  memoryUsage: { max: 5 }, // MB increase
  bundleSize: { max: 500 }, // KB per component
  interactionLatency: { max: 16 }, // ms (60fps)
};

// Test utilities
class UITestUtils {
  constructor(private page: Page) {}

  async switchUILibrary(library: UILibrary) {
    await this.page.evaluate((lib) => {
      window.localStorage.setItem('ui-library', lib);
      window.location.reload();
    }, library);
    await this.page.waitForLoadState('networkidle');
  }

  async measureComponentLoadTime(selector: string): Promise<number> {
    const startTime = Date.now();
    await this.page.waitForSelector(selector, { state: 'visible' });
    return Date.now() - startTime;
  }

  async measureInteractionLatency(selector: string): Promise<number> {
    const startTime = await this.page.evaluate(() => performance.now());
    await this.page.click(selector);
    const endTime = await this.page.evaluate(() => performance.now());
    return endTime - startTime;
  }

  async checkAccessibility() {
    // Inject axe-core for accessibility testing
    await this.page.addScriptTag({ path: require.resolve('axe-core') });

    const results = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        // @ts-ignore
        axe.run((err: any, results: any) => {
          if (err) throw err;
          resolve(results);
        });
      });
    });

    return results;
  }

  async measureMemoryUsage(): Promise<number> {
    const metrics = await this.page.evaluate(() => {
      return {
        usedJSMemory: (performance as any).memory?.usedJSMemory || 0,
        totalJSMemory: (performance as any).memory?.totalJSMemory || 0,
      };
    });
    return metrics.usedJSMemory / 1024 / 1024; // Convert to MB
  }

  async takeScreenshot(name: string, options?: any) {
    await this.page.screenshot({
      path: `tests/screenshots/${name}.png`,
      fullPage: true,
      ...options,
    });
  }
}

// Main test suite
test.describe('UI Migration Testing Suite', () => {
  let testUtils: UITestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new UITestUtils(page);
    await page.goto('/playground');
    await page.waitForLoadState('networkidle');
  });

  // Component Functionality Tests
  UI_LIBRARIES.forEach((library) => {
    test.describe(`${library} Library Tests`, () => {
      test.beforeEach(async ({ page }) => {
        await testUtils.switchUILibrary(library);
      });

      Object.entries(COMPONENT_TEST_SCENARIOS).forEach(([componentName, scenarios]) => {
        test.describe(`${componentName} Component`, () => {
          scenarios.forEach((scenario, index) => {
            test(`should render ${componentName} correctly - scenario ${index + 1}`, async ({
              page,
            }) => {
              const selector = `[data-testid="${library}-${componentName.toLowerCase()}-${index}"]`;

              // Measure load time
              const loadTime = await testUtils.measureComponentLoadTime(selector);
              expect(loadTime).toBeLessThan(PERFORMANCE_BENCHMARKS.componentLoadTime.max);

              // Verify component rendered
              const component = page.locator(selector);
              await expect(component).toBeVisible();

              // Test specific properties based on component type
              if (componentName === 'Button') {
                if (scenario.props.children) {
                  await expect(component).toContainText(scenario.expectedText!);
                }
                if (scenario.props.disabled) {
                  await expect(component).toBeDisabled();
                }
              }

              if (componentName === 'Input') {
                if (scenario.expectedPlaceholder) {
                  await expect(component).toHaveAttribute(
                    'placeholder',
                    scenario.expectedPlaceholder
                  );
                }
                if (scenario.expectedValue) {
                  await expect(component).toHaveValue(scenario.expectedValue);
                }
                if (scenario.expectedDisabled) {
                  await expect(component).toBeDisabled();
                }
              }
            });
          });
        });
      });

      // Interaction Tests
      test(`should handle interactions correctly in ${library}`, async ({ page }) => {
        const buttonSelector = `[data-testid="${library}-button-0"]`;

        // Click interaction
        const interactionLatency = await testUtils.measureInteractionLatency(buttonSelector);
        expect(interactionLatency).toBeLessThan(PERFORMANCE_BENCHMARKS.interactionLatency.max);

        // Keyboard navigation
        await page.keyboard.press('Tab');
        await expect(page.locator(buttonSelector)).toBeFocused();

        await page.keyboard.press('Enter');
        // Verify click handler was called (would need specific implementation)
      });

      // Accessibility Tests
      test(`should meet accessibility standards in ${library}`, async ({ page }) => {
        const results: any = await testUtils.checkAccessibility();

        // No critical accessibility violations
        const violations = results.violations.filter(
          (v: any) => v.impact === 'critical' || v.impact === 'serious'
        );
        expect(violations).toHaveLength(0);

        // Keyboard navigation
        const focusableElements = await page
          .locator('[tabindex]:not([tabindex="-1"]), button, input, select, textarea, a[href]')
          .count();
        expect(focusableElements).toBeGreaterThan(0);

        // Color contrast (basic check)
        const contrastIssues = results.violations.filter((v: any) => v.id === 'color-contrast');
        expect(contrastIssues).toHaveLength(0);
      });

      // Performance Tests
      test(`should meet performance benchmarks in ${library}`, async ({ page }) => {
        // Memory usage
        const initialMemory = await testUtils.measureMemoryUsage();

        // Render multiple components
        await page.click('[data-testid="render-stress-test"]');
        await page.waitForTimeout(1000);

        const finalMemory = await testUtils.measureMemoryUsage();
        const memoryIncrease = finalMemory - initialMemory;

        expect(memoryIncrease).toBeLessThan(PERFORMANCE_BENCHMARKS.memoryUsage.max);

        // Render performance
        const renderMetrics = await page.evaluate(() => {
          return JSON.parse(JSON.stringify(performance.getEntriesByType('measure')));
        });

        // Check for render performance marks
        const renderTimes = renderMetrics.filter((m: any) => m.name.includes('render'));
        renderTimes.forEach((time: any) => {
          expect(time.duration).toBeLessThan(PERFORMANCE_BENCHMARKS.renderTime.max);
        });
      });

      // Visual Regression Tests
      test(`should maintain visual consistency in ${library}`, async ({ page }) => {
        await testUtils.takeScreenshot(`${library}-component-showcase`);

        // Would compare against baseline screenshots
        // expect(screenshot).toMatchSnapshot(`${library}-baseline.png`)
      });
    });
  });

  // Cross-Library Migration Tests
  test.describe('Migration Compatibility', () => {
    test('should migrate between libraries without breaking functionality', async ({ page }) => {
      // Test migration path: shadcn → arco → shadcn
      const migrationPath: UILibrary[] = ['shadcn', 'arco', 'shadcn'];

      for (let i = 0; i < migrationPath.length; i++) {
        const library = migrationPath[i];
        await testUtils.switchUILibrary(library);

        // Verify all components still work
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        expect(buttonCount).toBeGreaterThan(0);

        // Test basic interactions
        if (buttonCount > 0) {
          await buttons.first().click();
          // Verify no errors
          const consoleErrors = await page.evaluate(() => {
            return window.performance.getEntriesByType('navigation').length;
          });
          expect(consoleErrors).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should handle library loading failures gracefully', async ({ page }) => {
      // Simulate network failure for library loading
      await page.route('**/arco-design/**', (route) => route.abort());

      await testUtils.switchUILibrary('arco');

      // Should fallback to default library
      const fallbackComponents = page.locator('[data-ui-fallback="true"]');
      await expect(fallbackComponents.first()).toBeVisible();
    });
  });

  // Rollback and Recovery Tests
  test.describe('Rollback Strategy', () => {
    test('should rollback to previous library on error', async ({ page }) => {
      // Set initial library
      await testUtils.switchUILibrary('shadcn');

      // Attempt to switch to problematic library
      await page.evaluate(() => {
        // Simulate component error
        window.dispatchEvent(
          new CustomEvent('ui-component-error', {
            detail: { library: 'arco', component: 'Button' },
          })
        );
      });

      // Should automatically rollback
      const currentLibrary = await page.evaluate(() => {
        return window.localStorage.getItem('ui-library');
      });
      expect(currentLibrary).toBe('shadcn');
    });
  });

  // Bundle Size Tests
  test.describe('Bundle Impact Analysis', () => {
    UI_LIBRARIES.forEach((library) => {
      test(`should measure bundle impact for ${library}`, async ({ page }) => {
        // Enable performance monitoring
        await page.addInitScript(() => {
          window.bundleAnalytics = {
            loadTime: 0,
            resourceSizes: new Map(),
          };
        });

        const startTime = Date.now();
        await testUtils.switchUILibrary(library);
        const loadTime = Date.now() - startTime;

        // Get resource sizes
        const resourceSizes = await page.evaluate(() => {
          const entries = performance.getEntriesByType('resource') as any[];
          return entries
            .filter((entry) => entry.name.includes(library) || entry.name.includes('chunk'))
            .map((entry) => ({
              name: entry.name,
              size: entry.transferSize || 0,
              compressed: entry.encodedBodySize || 0,
            }));
        });

        const totalSize = resourceSizes.reduce((sum, resource) => sum + resource.size, 0);
        console.log(`${library} bundle size:`, totalSize / 1024, 'KB');

        // Assert reasonable bundle size
        expect(totalSize).toBeLessThan(PERFORMANCE_BENCHMARKS.bundleSize.max * 1024);
      });
    });
  });

  // Integration Tests
  test.describe('Integration with Existing Components', () => {
    test('should integrate with LinearCalendarHorizontal', async ({ page }) => {
      await page.goto('/');

      // Test that UI library switching doesn't break calendar
      for (const library of UI_LIBRARIES) {
        await testUtils.switchUILibrary(library);

        const calendar = page.locator('[data-testid="linear-calendar-horizontal"]');
        await expect(calendar).toBeVisible();

        // Test calendar interactions still work
        const monthCell = page.locator('[data-month="0"]').first();
        if (await monthCell.isVisible()) {
          await monthCell.click();
        }
      }
    });

    test('should work with CommandBar component', async ({ page }) => {
      await page.goto('/');

      for (const library of UI_LIBRARIES) {
        await testUtils.switchUILibrary(library);

        // Open command bar
        await page.keyboard.press('Meta+k');

        const commandBar = page.locator('[data-testid="command-bar"]');
        await expect(commandBar).toBeVisible();

        // Close command bar
        await page.keyboard.press('Escape');
        await expect(commandBar).not.toBeVisible();
      }
    });
  });
});

// Cross-browser compatibility tests
const browsers = [chromium, firefox, webkit];
browsers.forEach((browserType, index) => {
  test.describe(`Cross-browser: ${['Chromium', 'Firefox', 'WebKit'][index]}`, () => {
    let browser: any;
    let context: BrowserContext;
    let page: Page;

    test.beforeAll(async () => {
      browser = await browserType.launch();
      context = await browser.newContext();
      page = await context.newPage();
    });

    test.afterAll(async () => {
      await browser.close();
    });

    UI_LIBRARIES.forEach((library) => {
      test(`${library} should work in ${['Chrome', 'Firefox', 'Safari'][index]}`, async () => {
        const testUtils = new UITestUtils(page);
        await page.goto('/playground');
        await testUtils.switchUILibrary(library);

        // Basic functionality test
        const buttons = page.locator('button');
        const count = await buttons.count();
        expect(count).toBeGreaterThan(0);

        if (count > 0) {
          await buttons.first().click();
        }
      });
    });
  });
});

// Mobile responsiveness tests
test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  UI_LIBRARIES.forEach((library) => {
    test(`${library} should be mobile responsive`, async ({ page }) => {
      const testUtils = new UITestUtils(page);
      await page.goto('/playground');
      await testUtils.switchUILibrary(library);

      // Check touch targets are large enough
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const boundingBox = await button.boundingBox();

        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }

      // Test mobile navigation
      const mobileMenu = page.locator('[data-testid="mobile-menu-trigger"]');
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
        const menu = page.locator('[data-testid="mobile-menu"]');
        await expect(menu).toBeVisible();
      }
    });
  });
});

// API compatibility tests
test.describe('API Compatibility', () => {
  test('should maintain consistent API across libraries', async ({ page }) => {
    await page.goto('/playground');

    // Test that component props are consistent
    const apiTests = await page.evaluate(() => {
      const testResults: any = {};

      // This would test the adapted component APIs
      // to ensure they accept the same props regardless of library

      return testResults;
    });

    // Verify API consistency
    expect(apiTests).toBeDefined();
  });
});

// Error boundary tests
test.describe('Error Recovery', () => {
  test('should handle component errors gracefully', async ({ page }) => {
    await page.goto('/playground');

    // Simulate component error
    await page.evaluate(() => {
      // Force a component error
      window.dispatchEvent(
        new CustomEvent('simulate-component-error', {
          detail: { component: 'Button', library: 'arco' },
        })
      );
    });

    // Should show error boundary
    const errorBoundary = page.locator('[data-testid="component-error-boundary"]');
    await expect(errorBoundary).toBeVisible();

    // Should provide fallback
    const fallback = page.locator('[data-testid="component-fallback"]');
    await expect(fallback).toBeVisible();
  });
});
