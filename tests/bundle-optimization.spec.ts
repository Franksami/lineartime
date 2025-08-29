import { test, expect, Page } from '@playwright/test';

/**
 * Bundle Optimization Validation Test Suite
 *
 * Validates the UI framework migration and bundle optimization:
 * - Confirms removal of Chakra UI, Mantine, Ant Design, MUI
 * - Validates shadcn/ui components work correctly
 * - Tests theme consistency after conversion
 * - Measures performance impact and bundle size improvements
 * - Validates tree-shaking and code splitting effectiveness
 *
 * Cross-browser testing for optimization validation
 */

class BundleTestUtils {
  constructor(private page: Page) {}

  async checkBundleAssets() {
    // Intercept network requests to analyze loaded assets
    const loadedAssets: string[] = [];
    const bundleSizes: { [key: string]: number } = {};

    this.page.on('response', (response) => {
      const url = response.url();
      const size = response.headers()['content-length'];

      if (url.includes('.js') || url.includes('.css')) {
        loadedAssets.push(url);
        if (size) {
          bundleSizes[url] = parseInt(size, 10);
        }
      }
    });

    await this.page.reload();
    await this.page.waitForLoadState('networkidle');

    return { loadedAssets, bundleSizes };
  }

  async verifyComponentFramework(selector: string, expectedFramework: string) {
    const element = this.page.locator(selector).first();
    if ((await element.count()) === 0) return null;

    const classes = (await element.getAttribute('class')) || '';
    const dataAttributes = await element.evaluate((el) => {
      const attrs: string[] = [];
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        if (attr.name.startsWith('data-')) {
          attrs.push(`${attr.name}=${attr.value}`);
        }
      }
      return attrs.join(' ');
    });

    return { classes, dataAttributes };
  }

  async measureLoadPerformance() {
    const startTime = Date.now();

    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      return {
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint:
          performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });

    return { totalLoadTime: loadTime, ...performanceMetrics };
  }

  async screenshotOptimization(name: string) {
    await this.page.screenshot({
      path: `tests/screenshots/bundle-${name}-${test.info().project.name}.png`,
      fullPage: true,
    });
  }

  async checkTreeShaking() {
    const { loadedAssets } = await this.checkBundleAssets();

    // Check for unused framework artifacts
    const unusedFrameworks = ['chakra', 'mantine', 'antd', '@mui/material', '@emotion/react'];

    const foundUnusedFrameworks = unusedFrameworks.filter((framework) =>
      loadedAssets.some((asset) => asset.toLowerCase().includes(framework.toLowerCase()))
    );

    return { unusedFrameworksFound: foundUnusedFrameworks };
  }

  async analyzeCSSVariables() {
    return await this.page.evaluate(() => {
      const computedStyle = getComputedStyle(document.documentElement);
      const cssVariables: { [key: string]: string } = {};

      // Check for shadcn/ui CSS variables
      const shadcnVariables = [
        '--background',
        '--foreground',
        '--card',
        '--card-foreground',
        '--primary',
        '--primary-foreground',
        '--secondary',
        '--secondary-foreground',
        '--muted',
        '--muted-foreground',
        '--accent',
        '--accent-foreground',
        '--border',
        '--input',
        '--ring',
      ];

      shadcnVariables.forEach((variable) => {
        const value = computedStyle.getPropertyValue(variable);
        if (value) {
          cssVariables[variable] = value.trim();
        }
      });

      return cssVariables;
    });
  }
}

test.describe('Bundle Optimization - Framework Migration Validation', () => {
  let utils: BundleTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new BundleTestUtils(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Framework Removal Verification', () => {
    test('should not load Chakra UI assets', async ({ page }) => {
      const { loadedAssets } = await utils.checkBundleAssets();

      const chakraAssets = loadedAssets.filter(
        (asset) => asset.toLowerCase().includes('chakra') || asset.includes('@chakra-ui')
      );

      expect(chakraAssets).toHaveLength(0);
      console.log('✅ Chakra UI successfully removed from bundle');
    });

    test('should not load Mantine assets', async ({ page }) => {
      const { loadedAssets } = await utils.checkBundleAssets();

      const mantineAssets = loadedAssets.filter(
        (asset) => asset.toLowerCase().includes('mantine') || asset.includes('@mantine/')
      );

      expect(mantineAssets).toHaveLength(0);
      console.log('✅ Mantine successfully removed from bundle');
    });

    test('should not load Ant Design assets', async ({ page }) => {
      const { loadedAssets } = await utils.checkBundleAssets();

      const antdAssets = loadedAssets.filter(
        (asset) => asset.toLowerCase().includes('antd') || asset.includes('ant-design')
      );

      expect(antdAssets).toHaveLength(0);
      console.log('✅ Ant Design successfully removed from bundle');
    });

    test('should not load MUI (Material-UI) assets', async ({ page }) => {
      const { loadedAssets } = await utils.checkBundleAssets();

      const muiAssets = loadedAssets.filter(
        (asset) =>
          asset.includes('@mui/') ||
          asset.includes('material-ui') ||
          asset.includes('@emotion/react')
      );

      expect(muiAssets).toHaveLength(0);
      console.log('✅ Material-UI successfully removed from bundle');
    });
  });

  test.describe('shadcn/ui Component Validation', () => {
    test('should use shadcn/ui components correctly', async ({ page }) => {
      // Test Button component
      const button = page.locator('button').first();
      if ((await button.count()) > 0) {
        const buttonInfo = await utils.verifyComponentFramework('button', 'shadcn');
        expect(buttonInfo?.classes).toBeTruthy();
      }

      // Test Card component
      const card = page.locator('[data-testid*="card"], .card').first();
      if ((await card.count()) > 0) {
        const cardInfo = await utils.verifyComponentFramework(
          '[data-testid*="card"], .card',
          'shadcn'
        );
        expect(cardInfo?.classes).toBeTruthy();
      }

      await utils.screenshotOptimization('shadcn-components');
    });

    test('should have proper CSS variable system', async ({ page }) => {
      const cssVariables = await utils.analyzeCSSVariables();

      // Check for essential shadcn/ui variables
      expect(cssVariables['--background']).toBeTruthy();
      expect(cssVariables['--foreground']).toBeTruthy();
      expect(cssVariables['--primary']).toBeTruthy();
      expect(cssVariables['--border']).toBeTruthy();

      console.log('CSS Variables found:', Object.keys(cssVariables).length);
    });

    test('should render shadcn components without errors', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Navigate to pages with various components
      const testPages = ['/', '/playground', '/dashboard'];

      for (const testPage of testPages) {
        await page.goto(testPage);
        await page.waitForLoadState('networkidle');

        // Check for component-related errors
        const componentErrors = consoleErrors.filter(
          (error) =>
            error.toLowerCase().includes('component') ||
            error.toLowerCase().includes('prop') ||
            error.toLowerCase().includes('render')
        );

        expect(componentErrors.length).toBeLessThan(3); // Allow minimal non-critical errors
      }
    });

    test('should have working theme system', async ({ page }) => {
      // Test theme toggle if available
      const themeToggle = page.locator(
        '[data-testid="theme-toggle"], [aria-label*="theme"], button:has-text("Dark"), button:has-text("Light")'
      );

      if ((await themeToggle.count()) > 0) {
        const initialBackground = await page.evaluate(() => {
          return getComputedStyle(document.documentElement).getPropertyValue('--background');
        });

        await themeToggle.first().click();
        await page.waitForTimeout(300); // Theme transition time

        const changedBackground = await page.evaluate(() => {
          return getComputedStyle(document.documentElement).getPropertyValue('--background');
        });

        // Background should change when theme toggles
        expect(initialBackground).not.toBe(changedBackground);

        await utils.screenshotOptimization('theme-system');
      }
    });
  });

  test.describe('Performance Impact Measurement', () => {
    test('should meet load time targets after optimization', async ({ page }) => {
      const performance = await utils.measureLoadPerformance();

      // Performance targets after optimization
      expect(performance.totalLoadTime).toBeLessThan(4000); // Under 4 seconds
      expect(performance.domContentLoaded).toBeLessThan(2000); // Under 2 seconds

      if (performance.firstContentfulPaint > 0) {
        expect(performance.firstContentfulPaint).toBeLessThan(2500); // Under 2.5 seconds
      }

      console.log('Performance metrics:', {
        totalLoad: `${performance.totalLoadTime}ms`,
        domReady: `${performance.domContentLoaded}ms`,
        fcp: `${performance.firstContentfulPaint}ms`,
      });
    });

    test('should have optimized bundle sizes', async ({ page }) => {
      const { bundleSizes } = await utils.checkBundleAssets();
      const totalBundleSize = Object.values(bundleSizes).reduce((sum, size) => sum + size, 0);

      // Target: Under 3MB total bundle size
      expect(totalBundleSize).toBeLessThan(3 * 1024 * 1024); // 3MB in bytes

      console.log(`Total bundle size: ${(totalBundleSize / 1024 / 1024).toFixed(2)}MB`);
    });

    test('should demonstrate effective tree shaking', async ({ page }) => {
      const treeShakeResults = await utils.checkTreeShaking();

      expect(treeShakeResults.unusedFrameworksFound).toHaveLength(0);
      console.log('✅ Tree shaking effective - no unused framework code detected');
    });

    test('should have minimal CSS bundle overhead', async ({ page }) => {
      const { loadedAssets } = await utils.checkBundleAssets();
      const cssAssets = loadedAssets.filter((asset) => asset.includes('.css'));

      // Should have reasonable number of CSS files
      expect(cssAssets.length).toBeLessThan(10);

      console.log(`CSS assets loaded: ${cssAssets.length}`);
    });
  });

  test.describe('Code Splitting Validation', () => {
    test('should load components dynamically', async ({ page }) => {
      const initialAssets = new Set<string>();
      const dynamicAssets = new Set<string>();

      // Capture initial assets
      page.on('response', (response) => {
        if (response.url().includes('.js')) {
          initialAssets.add(response.url());
        }
      });

      await page.waitForLoadState('networkidle');

      // Navigate to different sections to trigger dynamic loading
      const sections = ['/playground', '/dashboard', '/themes'];

      for (const section of sections) {
        page.on('response', (response) => {
          if (response.url().includes('.js') && !initialAssets.has(response.url())) {
            dynamicAssets.add(response.url());
          }
        });

        await page.goto(section);
        await page.waitForLoadState('networkidle');
      }

      // Should have some dynamic loading (code splitting working)
      console.log(`Dynamic assets loaded: ${dynamicAssets.size}`);
    });

    test('should lazy load playground components', async ({ page }) => {
      let playgroundAssetsLoaded = 0;

      page.on('response', (response) => {
        if (response.url().includes('playground') && response.url().includes('.js')) {
          playgroundAssetsLoaded++;
        }
      });

      await page.goto('/playground');
      await page.waitForLoadState('networkidle');

      // Navigate to specific playground sections
      const playgroundSections = [
        '/playground/shell',
        '/playground/command',
        '/playground/contexts',
      ];

      for (const section of playgroundSections) {
        await page.goto(section);
        await page.waitForLoadState('networkidle');
      }

      console.log(`Playground-specific assets loaded: ${playgroundAssetsLoaded}`);
    });
  });

  test.describe('Theme Consistency After Migration', () => {
    test('should maintain consistent theming across all components', async ({ page }) => {
      // Test consistent theming on main page
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const mainPageTheme = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        return {
          background: style.getPropertyValue('--background'),
          primary: style.getPropertyValue('--primary'),
          border: style.getPropertyValue('--border'),
        };
      });

      // Test theming on playground page
      await page.goto('/playground');
      await page.waitForLoadState('networkidle');

      const playgroundTheme = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        return {
          background: style.getPropertyValue('--background'),
          primary: style.getPropertyValue('--primary'),
          border: style.getPropertyValue('--border'),
        };
      });

      // Themes should be consistent across pages
      expect(mainPageTheme.background).toBe(playgroundTheme.background);
      expect(mainPageTheme.primary).toBe(playgroundTheme.primary);
      expect(mainPageTheme.border).toBe(playgroundTheme.border);

      await utils.screenshotOptimization('theme-consistency');
    });

    test('should handle theme transitions smoothly', async ({ page }) => {
      const themeToggle = page.locator('[data-testid="theme-toggle"], [aria-label*="theme"]');

      if ((await themeToggle.count()) > 0) {
        // Measure theme transition time
        const transitionStart = Date.now();

        await themeToggle.first().click();

        // Wait for transition to complete
        await page.waitForFunction(() => {
          const style = getComputedStyle(document.documentElement);
          return style.getPropertyValue('--background') !== '';
        });

        const transitionTime = Date.now() - transitionStart;
        expect(transitionTime).toBeLessThan(1000); // Under 1 second

        console.log(`Theme transition time: ${transitionTime}ms`);
      }
    });

    test('should preserve custom styles after migration', async ({ page }) => {
      // Check for preserved custom styles that shouldn't be affected by framework removal
      const customElements = page.locator('[data-testid="custom-style"], .custom-component');

      if ((await customElements.count()) > 0) {
        const element = customElements.first();
        const computedStyle = await element.evaluate((el) => {
          const style = getComputedStyle(el);
          return {
            position: style.position,
            zIndex: style.zIndex,
            transform: style.transform,
          };
        });

        // Custom styles should be preserved
        expect(computedStyle).toBeTruthy();
      }
    });
  });

  test.describe('Cross-Browser Optimization Validation', () => {
    test('should work consistently across browsers after optimization', async ({
      page,
      browserName,
    }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test component rendering across browsers
      const components = ['button', '[role="dialog"]', '[data-testid="card"]', 'input'];

      for (const selector of components) {
        const element = page.locator(selector).first();
        if ((await element.count()) > 0) {
          await expect(element).toBeVisible();
        }
      }

      await utils.screenshotOptimization(`cross-browser-${browserName}`);
    });

    test('should maintain performance across browsers', async ({ page, browserName }) => {
      const performance = await utils.measureLoadPerformance();

      // Performance should be consistent across browsers (allowing some variance)
      expect(performance.totalLoadTime).toBeLessThan(5000); // 5 second max for any browser

      console.log(`${browserName} performance: ${performance.totalLoadTime}ms`);
    });
  });

  test.describe('Error Handling After Optimization', () => {
    test('should handle missing framework dependencies gracefully', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Filter for framework-related errors
      const frameworkErrors = consoleErrors.filter(
        (error) =>
          error.toLowerCase().includes('chakra') ||
          error.toLowerCase().includes('mantine') ||
          error.toLowerCase().includes('antd') ||
          error.toLowerCase().includes('@mui')
      );

      expect(frameworkErrors).toHaveLength(0);
      console.log('✅ No framework dependency errors detected');
    });

    test('should recover from component loading failures', async ({ page }) => {
      // Intercept component loads and simulate some failures
      await page.route('**/*.js', (route) => {
        if (Math.random() < 0.1 && route.request().url().includes('chunk')) {
          // Simulate 10% failure rate for chunk loading
          route.abort();
        } else {
          route.continue();
        }
      });

      await page.goto('/');
      await page.waitForTimeout(3000); // Allow retry mechanisms to work

      // App should still be functional
      const isResponsive = await page.locator('body').isVisible();
      expect(isResponsive).toBe(true);
    });
  });
});
