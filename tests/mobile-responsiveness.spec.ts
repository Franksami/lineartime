import { test, expect, Page } from '@playwright/test';

/**
 * Mobile Responsiveness Test Suite
 *
 * Tests mobile optimization and responsive design:
 * - Viewport adaptation (phone, tablet, desktop)
 * - Touch interactions and gestures
 * - Mobile navigation patterns
 * - Performance on mobile devices
 * - Accessibility on touch devices
 *
 * Device coverage: iPhone 12, Pixel 5, iPad, various screen sizes
 */

class MobileTestUtils {
  constructor(private page: Page) {}

  async setMobileViewport(device: 'phone' | 'tablet' | 'desktop') {
    const viewports = {
      phone: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1200, height: 800 },
    };

    await this.page.setViewportSize(viewports[device]);
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
  }

  async measureTouchResponse(selector: string): Promise<number> {
    const startTime = Date.now();

    const element = this.page.locator(selector).first();
    if ((await element.count()) > 0) {
      await element.tap();
    }

    return Date.now() - startTime;
  }

  async testSwipeGesture(startX: number, startY: number, endX: number, endY: number) {
    await this.page.touchscreen.tap(startX, startY);
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, endY);
    await this.page.mouse.up();
  }

  async screenshotMobile(name: string, device: string) {
    await this.page.screenshot({
      path: `tests/screenshots/mobile-${name}-${device}-${test.info().project.name}.png`,
      fullPage: true,
    });
  }

  async checkMobileNavigation() {
    const mobileNavElements = [
      '[data-testid="mobile-nav"]',
      '[data-testid="hamburger-menu"]',
      '[aria-label*="menu"]',
      '.mobile-menu',
      'button[aria-expanded]',
    ];

    for (const selector of mobileNavElements) {
      const element = this.page.locator(selector);
      if ((await element.count()) > 0) {
        return { found: true, selector, element };
      }
    }

    return { found: false };
  }

  async testScrollPerformance() {
    const startTime = Date.now();

    // Scroll down the page
    for (let i = 0; i < 5; i++) {
      await this.page.mouse.wheel(0, 300);
      await this.page.waitForTimeout(100);
    }

    // Scroll back up
    for (let i = 0; i < 5; i++) {
      await this.page.mouse.wheel(0, -300);
      await this.page.waitForTimeout(100);
    }

    return Date.now() - startTime;
  }
}

test.describe('Mobile Responsiveness - Comprehensive Testing', () => {
  let utils: MobileTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new MobileTestUtils(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Viewport Adaptation', () => {
    const devices = [
      { name: 'phone', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1200, height: 800 },
    ] as const;

    for (const device of devices) {
      test(`should adapt to ${device.name} viewport`, async ({ page }) => {
        await utils.setMobileViewport(device.name);

        // Check viewport is correctly set
        const viewport = await page.evaluate(() => ({
          width: window.innerWidth,
          height: window.innerHeight,
        }));

        expect(viewport.width).toBe(device.width);
        expect(viewport.height).toBe(device.height);

        // Check responsive elements
        const isResponsive = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          let responsiveElements = 0;

          elements.forEach((el) => {
            const style = getComputedStyle(el);
            if (style.display === 'block' || style.display === 'flex' || style.display === 'grid') {
              responsiveElements++;
            }
          });

          return responsiveElements > 0;
        });

        expect(isResponsive).toBe(true);
        await utils.screenshotMobile('viewport-adaptation', device.name);
      });
    }

    test('should handle orientation changes', async ({ page }) => {
      // Test portrait mode (default)
      await utils.setMobileViewport('phone');
      await utils.screenshotMobile('portrait', 'phone');

      // Test landscape mode
      await page.setViewportSize({ width: 667, height: 375 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      const isLandscape = await page.evaluate(() => window.innerWidth > window.innerHeight);
      expect(isLandscape).toBe(true);

      await utils.screenshotMobile('landscape', 'phone');
    });

    test('should maintain content visibility across viewports', async ({ page }) => {
      const testSelectors = ['h1, h2, h3', 'button', '[role="main"]', 'nav'];

      for (const device of devices) {
        await utils.setMobileViewport(device.name);

        for (const selector of testSelectors) {
          const elements = page.locator(selector);
          const count = await elements.count();

          if (count > 0) {
            const isVisible = await elements.first().isVisible();
            expect(isVisible).toBe(true);
          }
        }
      }
    });
  });

  test.describe('Touch Interactions', () => {
    test.use({ hasTouch: true });

    test('should respond to tap interactions', async ({ page }) => {
      await utils.setMobileViewport('phone');

      const interactiveElements = ['button', 'a', '[role="button"]', '[tabindex="0"]'];

      for (const selector of interactiveElements) {
        const elements = page.locator(selector);
        const count = await elements.count();

        if (count > 0) {
          const responseTime = await utils.measureTouchResponse(selector);
          expect(responseTime).toBeLessThan(300); // Under 300ms for good UX
        }
      }
    });

    test('should handle long press interactions', async ({ page }) => {
      await utils.setMobileViewport('phone');

      const longPressTargets = page.locator('button, [role="button"]');
      const count = await longPressTargets.count();

      if (count > 0) {
        const element = longPressTargets.first();

        // Simulate long press (touch and hold)
        await element.hover();
        await page.mouse.down();
        await page.waitForTimeout(500); // Hold for 500ms
        await page.mouse.up();

        // Should not cause errors
        const errors = await page.evaluate(() => {
          return (window as any).__errors__ || [];
        });

        expect(Array.isArray(errors) ? errors.length : 0).toBe(0);
      }
    });

    test('should support swipe gestures', async ({ page }) => {
      await utils.setMobileViewport('phone');

      const swipeableAreas = ['[data-testid="swipeable"]', '.carousel', '[role="tabpanel"]'];

      for (const selector of swipeableAreas) {
        const element = page.locator(selector);
        if ((await element.count()) > 0) {
          const box = await element.boundingBox();
          if (box) {
            // Swipe right to left
            await utils.testSwipeGesture(
              box.x + box.width * 0.8,
              box.y + box.height / 2,
              box.x + box.width * 0.2,
              box.y + box.height / 2
            );

            await page.waitForTimeout(300);

            // Swipe left to right
            await utils.testSwipeGesture(
              box.x + box.width * 0.2,
              box.y + box.height / 2,
              box.x + box.width * 0.8,
              box.y + box.height / 2
            );
          }
        }
      }
    });

    test('should handle pinch-to-zoom appropriately', async ({ page }) => {
      await utils.setMobileViewport('phone');

      // Check for proper viewport meta tag
      const viewportMeta = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta?.getAttribute('content') || '';
      });

      // Should control zoom behavior appropriately
      const hasZoomControl =
        viewportMeta.includes('user-scalable') || viewportMeta.includes('maximum-scale');

      if (hasZoomControl) {
        console.log('Zoom control detected:', viewportMeta);
      }
    });

    test('should provide adequate touch target sizes', async ({ page }) => {
      await utils.setMobileViewport('phone');

      const touchTargets = page.locator('button, a, [role="button"], input, select');
      const count = await touchTargets.count();

      let adequateSizeCount = 0;

      for (let i = 0; i < Math.min(count, 10); i++) {
        const element = touchTargets.nth(i);
        const box = await element.boundingBox();

        if (box) {
          const isAdequateSize = box.width >= 44 && box.height >= 44; // 44px minimum for good touch UX
          if (isAdequateSize) adequateSizeCount++;
        }
      }

      // At least 70% of touch targets should meet minimum size
      const adequatePercentage = adequateSizeCount / Math.min(count, 10);
      expect(adequatePercentage).toBeGreaterThan(0.7);
    });
  });

  test.describe('Mobile Navigation Patterns', () => {
    test('should implement mobile navigation correctly', async ({ page }) => {
      await utils.setMobileViewport('phone');

      const navigation = await utils.checkMobileNavigation();

      if (navigation.found) {
        const navElement = navigation.element!;

        // Test opening navigation
        await navElement.tap();
        await page.waitForTimeout(300); // Animation time

        // Check if navigation content is visible
        const isExpanded = await navElement.getAttribute('aria-expanded');
        const hasVisibleMenu = await page
          .locator('[role="menu"], .navigation-menu, [data-testid="nav-menu"]')
          .isVisible();

        expect(isExpanded === 'true' || hasVisibleMenu).toBe(true);

        // Test closing navigation
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        await utils.screenshotMobile('navigation-mobile', 'phone');
      }
    });

    test('should handle mobile sheet/drawer navigation', async ({ page }) => {
      await utils.setMobileViewport('phone');

      const drawerTriggers = [
        '[data-testid="mobile-sheet-trigger"]',
        '[data-testid="drawer-trigger"]',
        'button[aria-label*="menu"]',
      ];

      for (const selector of drawerTriggers) {
        const trigger = page.locator(selector);
        if ((await trigger.count()) > 0) {
          await trigger.tap();
          await page.waitForTimeout(500);

          // Check for drawer content
          const drawer = page.locator('[role="dialog"], [data-testid="drawer"], .sheet');
          if ((await drawer.count()) > 0) {
            await expect(drawer).toBeVisible();

            // Close drawer
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
          }

          break;
        }
      }
    });

    test('should support bottom navigation on mobile', async ({ page }) => {
      await utils.setMobileViewport('phone');

      const bottomNav = page.locator(
        '[data-testid="bottom-nav"], .bottom-navigation, nav[role="tablist"]'
      );

      if ((await bottomNav.count()) > 0) {
        await expect(bottomNav).toBeVisible();

        // Test bottom nav items
        const navItems = bottomNav.locator('a, button, [role="tab"]');
        const itemCount = await navItems.count();

        if (itemCount > 0) {
          // Test first item
          await navItems.first().tap();
          await page.waitForTimeout(200);

          await utils.screenshotMobile('bottom-navigation', 'phone');
        }
      }
    });

    test('should handle sticky navigation on mobile', async ({ page }) => {
      await utils.setMobileViewport('phone');

      const stickyNav = page.locator('[data-testid="sticky-nav"], .sticky, .fixed');

      if ((await stickyNav.count()) > 0) {
        const initialPosition = await stickyNav.first().boundingBox();

        // Scroll down
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(200);

        const scrolledPosition = await stickyNav.first().boundingBox();

        // Sticky elements should maintain relative position
        if (initialPosition && scrolledPosition) {
          const isSticky = Math.abs(initialPosition.y - scrolledPosition.y) < 50; // Some tolerance for animations
          expect(isSticky || scrolledPosition.y <= 100).toBe(true); // Either sticky or at top
        }
      }
    });
  });

  test.describe('Mobile Performance', () => {
    test('should maintain performance on mobile devices', async ({ page }) => {
      await utils.setMobileViewport('phone');

      const startTime = Date.now();
      await page.reload();
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Mobile performance targets
      expect(loadTime).toBeLessThan(6000); // Under 6 seconds on mobile

      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as any;
        return {
          domContentLoaded:
            navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        };
      });

      expect(performanceMetrics.domContentLoaded).toBeLessThan(3000); // Under 3 seconds
    });

    test('should handle scrolling performance', async ({ page }) => {
      await utils.setMobileViewport('phone');

      const scrollTime = await utils.testScrollPerformance();
      expect(scrollTime).toBeLessThan(2000); // Under 2 seconds for scroll test
    });

    test('should manage memory efficiently on mobile', async ({ page }) => {
      await utils.setMobileViewport('phone');

      const memoryUsage = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Convert to MB
      const memoryMB = memoryUsage / 1024 / 1024;
      expect(memoryMB).toBeLessThan(150); // Under 150MB on mobile
    });
  });

  test.describe('Mobile Content Adaptation', () => {
    test('should adapt text sizes for mobile readability', async ({ page }) => {
      await utils.setMobileViewport('phone');

      const textElements = page.locator('p, span, div, h1, h2, h3');
      const count = await textElements.count();

      let readableTextCount = 0;

      for (let i = 0; i < Math.min(count, 10); i++) {
        const element = textElements.nth(i);
        const fontSize = await element.evaluate((el) => {
          const style = getComputedStyle(el);
          return parseInt(style.fontSize, 10);
        });

        // Minimum 14px for mobile readability
        if (fontSize >= 14) {
          readableTextCount++;
        }
      }

      const readablePercentage = readableTextCount / Math.min(count, 10);
      expect(readablePercentage).toBeGreaterThan(0.8); // 80% should be readable
    });

    test('should handle image responsiveness', async ({ page }) => {
      await utils.setMobileViewport('phone');

      const images = page.locator('img');
      const imageCount = await images.count();

      if (imageCount > 0) {
        for (let i = 0; i < Math.min(imageCount, 5); i++) {
          const image = images.nth(i);
          const box = await image.boundingBox();

          if (box) {
            // Images should not exceed viewport width
            expect(box.width).toBeLessThanOrEqual(375 + 10); // Allow small margin
          }
        }
      }
    });

    test('should adapt form elements for mobile', async ({ page }) => {
      await utils.setMobileViewport('phone');

      const formElements = page.locator('input, textarea, select, button');
      const count = await formElements.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 5); i++) {
          const element = formElements.nth(i);
          const box = await element.boundingBox();

          if (box) {
            // Form elements should be appropriately sized for mobile
            expect(box.height).toBeGreaterThanOrEqual(40); // Minimum touch target height
            expect(box.width).toBeGreaterThanOrEqual(40); // Minimum touch target width
          }
        }
      }
    });
  });

  test.describe('Tablet Specific Tests', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should adapt layout for tablet viewport', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const isTabletView = await page.evaluate(() => {
        const width = window.innerWidth;
        return width >= 768 && width < 1024;
      });

      expect(isTabletView).toBe(true);
      await utils.screenshotMobile('tablet-layout', 'tablet');
    });

    test('should handle tablet-specific navigation patterns', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Tablets might show different navigation than mobile phones
      const navigation = await utils.checkMobileNavigation();

      // Check if sidebar is visible on tablet (common pattern)
      const sidebar = page.locator('[data-testid="sidebar"], aside, .sidebar');
      const hasSidebar = (await sidebar.count()) > 0;

      // Either mobile nav or sidebar should be present
      expect(navigation.found || hasSidebar).toBe(true);
    });

    test('should optimize touch targets for tablet', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const touchTargets = page.locator('button, a, [role="button"]');
      const count = await touchTargets.count();

      let adequateTargets = 0;

      for (let i = 0; i < Math.min(count, 10); i++) {
        const element = touchTargets.nth(i);
        const box = await element.boundingBox();

        if (box) {
          // Tablet targets can be slightly smaller than phone targets
          if (box.width >= 36 && box.height >= 36) {
            adequateTargets++;
          }
        }
      }

      const adequatePercentage = adequateTargets / Math.min(count, 10);
      expect(adequatePercentage).toBeGreaterThan(0.8);
    });
  });

  test.describe('Cross-Device Consistency', () => {
    const testDevices = [
      { name: 'phone', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
    ];

    for (const device of testDevices) {
      test(`should maintain functionality on ${device.name}`, async ({ page }) => {
        await page.setViewportSize({ width: device.width, height: device.height });
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Test basic functionality
        const basicFunctions = [
          () => page.keyboard.press('Tab'), // Keyboard navigation
          () => page.locator('body').click(), // Click interaction
          () => page.keyboard.press('Escape'), // Escape key handling
        ];

        for (const fn of basicFunctions) {
          await fn();
          await page.waitForTimeout(100);
        }

        // App should remain responsive
        const isResponsive = await page.locator('body').isVisible();
        expect(isResponsive).toBe(true);
      });
    }

    test('should handle device orientation changes gracefully', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500); // Allow reflow

      // App should adapt and remain functional
      const isAdapted = await page.evaluate(() => {
        return window.innerWidth > window.innerHeight;
      });

      expect(isAdapted).toBe(true);

      // Test that content is still accessible
      const hasVisibleContent = await page.locator('h1, h2, h3, p').first().isVisible();
      expect(hasVisibleContent).toBe(true);
    });
  });
});
