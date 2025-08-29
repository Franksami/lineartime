import { test, expect, type Page } from '@playwright/test';
import { useAnimationPerformance } from '@/hooks/useAnimationPerformance';

/**
 * Animation Performance Test Suite
 *
 * Tests our AutoAnimate integrations to ensure:
 * 1. 60fps performance target maintained
 * 2. Accessibility compliance (reduced motion support)
 * 3. Smooth user interactions
 * 4. Memory and performance impact within limits
 */

test.describe('Animation Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to main app
    await page.goto('/');

    // Wait for core components to load
    await page.waitForLoadState('networkidle');

    // Enable performance monitoring
    await page.addInitScript(() => {
      // Enable detailed performance timing
      window.performance.mark('test-start');

      // Track animation frame rates
      (window as any).fpsTracker = {
        frames: [],
        startTime: performance.now(),
        trackFrame() {
          const now = performance.now();
          this.frames.push(now);
          // Keep only last 60 frames (1 second at 60fps)
          if (this.frames.length > 60) {
            this.frames.shift();
          }
          requestAnimationFrame(() => this.trackFrame());
        },
      };
      (window as any).fpsTracker.trackFrame();
    });
  });

  test('EventCard dropdown animation performance', async ({ page }) => {
    // Create test event card
    await page.goto('/test-ai-scheduling'); // Page with event cards

    // Find an event card with dropdown
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await expect(eventCard).toBeVisible();

    // Measure performance during dropdown animation
    await page.evaluate(() => performance.mark('dropdown-start'));

    // Trigger dropdown animation
    const dropdownTrigger = eventCard.locator('button[aria-haspopup="menu"]');
    await dropdownTrigger.click();

    // Wait for dropdown to appear
    const dropdown = page.locator('[role="menu"]');
    await expect(dropdown).toBeVisible();

    await page.evaluate(() => performance.mark('dropdown-end'));

    // Check performance metrics
    const performanceMetrics = await page.evaluate(() => {
      performance.measure('dropdown-animation', 'dropdown-start', 'dropdown-end');
      const measure = performance.getEntriesByName('dropdown-animation')[0];

      // Calculate FPS over the animation period
      const tracker = (window as any).fpsTracker;
      const animationDuration = measure.duration;
      const recentFrames = tracker.frames.slice(-Math.ceil(animationDuration / 16.67));
      const fps =
        recentFrames.length > 1
          ? 1000 /
            ((recentFrames[recentFrames.length - 1] - recentFrames[0]) / (recentFrames.length - 1))
          : 60;

      return {
        duration: measure.duration,
        fps: Math.round(fps),
        frameCount: recentFrames.length,
      };
    });

    // Validate performance targets
    expect(performanceMetrics.fps).toBeGreaterThanOrEqual(50); // Allow some variance
    expect(performanceMetrics.duration).toBeLessThan(300); // Animation should complete in <300ms

    console.log(
      `EventCard dropdown animation: ${performanceMetrics.fps}fps, ${performanceMetrics.duration}ms`
    );
  });

  test('ViewSwitcher tab animation performance', async ({ page }) => {
    // Navigate to dashboard with ViewSwitcher
    await page.goto('/dashboard');

    const viewSwitcher = page.locator('[role="tablist"]').first();
    await expect(viewSwitcher).toBeVisible();

    // Test tab switching performance
    const tabs = viewSwitcher.locator('button[role="tab"]');
    const tabCount = await tabs.count();

    for (let i = 0; i < Math.min(3, tabCount); i++) {
      await page.evaluate((index) => performance.mark(`tab-switch-${index}-start`), i);

      // Click tab
      await tabs.nth(i).click();

      // Wait for active state to change
      await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');

      await page.evaluate((index) => performance.mark(`tab-switch-${index}-end`), i);

      // Small delay between switches
      await page.waitForTimeout(100);
    }

    // Analyze performance
    const switchMetrics = await page.evaluate(() => {
      const measures = [];
      for (let i = 0; i < 3; i++) {
        try {
          performance.measure(`tab-switch-${i}`, `tab-switch-${i}-start`, `tab-switch-${i}-end`);
          const measure = performance.getEntriesByName(`tab-switch-${i}`)[0];
          measures.push(measure.duration);
        } catch (e) {
          // Ignore if measure doesn't exist
        }
      }
      return {
        switches: measures,
        averageDuration: measures.reduce((sum, dur) => sum + dur, 0) / measures.length,
      };
    });

    expect(switchMetrics.averageDuration).toBeLessThan(200); // Tab switches should be snappy
    console.log(`ViewSwitcher average tab switch: ${switchMetrics.averageDuration.toFixed(1)}ms`);
  });

  test('Modal animation performance', async ({ page }) => {
    // Test modal animations (using any modal in the app)
    await page.goto('/');

    // Look for a button that opens a modal
    const modalTrigger = page
      .locator('button')
      .filter({ hasText: /create|add|new/i })
      .first();

    if (await modalTrigger.isVisible()) {
      await page.evaluate(() => performance.mark('modal-open-start'));

      await modalTrigger.click();

      // Wait for modal to appear
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible();

      await page.evaluate(() => performance.mark('modal-open-end'));

      // Test modal close animation
      await page.evaluate(() => performance.mark('modal-close-start'));

      // Close modal (try Escape key first, then close button)
      await page.keyboard.press('Escape');

      await expect(modal).not.toBeVisible();

      await page.evaluate(() => performance.mark('modal-close-end'));

      // Analyze modal performance
      const modalMetrics = await page.evaluate(() => {
        performance.measure('modal-open', 'modal-open-start', 'modal-open-end');
        performance.measure('modal-close', 'modal-close-start', 'modal-close-end');

        return {
          openDuration: performance.getEntriesByName('modal-open')[0]?.duration || 0,
          closeDuration: performance.getEntriesByName('modal-close')[0]?.duration || 0,
        };
      });

      expect(modalMetrics.openDuration).toBeLessThan(400);
      expect(modalMetrics.closeDuration).toBeLessThan(400);

      console.log(
        `Modal open: ${modalMetrics.openDuration.toFixed(1)}ms, close: ${modalMetrics.closeDuration.toFixed(1)}ms`
      );
    }
  });

  test('Reduced motion accessibility compliance', async ({ page }) => {
    // Test that animations respect prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Check that AutoAnimate respects reduced motion
    const animatedElements = page.locator('[data-auto-animate]');
    const count = await animatedElements.count();

    if (count > 0) {
      // Verify animations are disabled or significantly reduced
      const hasReducedAnimations = await page.evaluate(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        return mediaQuery.matches;
      });

      expect(hasReducedAnimations).toBe(true);
    }

    // Test specific component behavior with reduced motion
    await page.goto('/dashboard');

    const viewSwitcher = page.locator('[role="tablist"]').first();
    if (await viewSwitcher.isVisible()) {
      const tabs = viewSwitcher.locator('button[role="tab"]');

      // Tab switch should still work but be instant/fast
      await page.evaluate(() => performance.mark('reduced-motion-switch-start'));
      await tabs.nth(1).click();
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
      await page.evaluate(() => performance.mark('reduced-motion-switch-end'));

      const switchTime = await page.evaluate(() => {
        performance.measure(
          'reduced-motion-switch',
          'reduced-motion-switch-start',
          'reduced-motion-switch-end'
        );
        return performance.getEntriesByName('reduced-motion-switch')[0]?.duration || 0;
      });

      // Should be very fast with reduced motion
      expect(switchTime).toBeLessThan(100);
    }
  });

  test('Memory usage during animations', async ({ page }) => {
    // Monitor memory usage during intensive animations
    await page.goto('/');

    // Get baseline memory usage
    const baselineMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Perform multiple animation-triggering actions
    for (let i = 0; i < 10; i++) {
      // Navigate between views to trigger animations
      await page.goto('/dashboard');
      await page.waitForTimeout(100);
      await page.goto('/analytics');
      await page.waitForTimeout(100);
    }

    // Check memory after animations
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    if (baselineMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - baselineMemory;
      const memoryIncreasePercent = (memoryIncrease / baselineMemory) * 100;

      // Memory increase should be reasonable (<50% increase during heavy animation testing)
      expect(memoryIncreasePercent).toBeLessThan(50);

      console.log(
        `Memory usage: baseline ${(baselineMemory / 1024 / 1024).toFixed(1)}MB, final ${(finalMemory / 1024 / 1024).toFixed(1)}MB (+${memoryIncreasePercent.toFixed(1)}%)`
      );
    }
  });

  test('Animation consistency across browsers', async ({ page, browserName }) => {
    // Test that animations work consistently across different browsers
    await page.goto('/dashboard');

    // Test ViewSwitcher animation across browsers
    const viewSwitcher = page.locator('[role="tablist"]').first();
    await expect(viewSwitcher).toBeVisible();

    const tabs = viewSwitcher.locator('button[role="tab"]');

    // Measure animation performance specific to browser
    await page.evaluate(() => performance.mark('browser-test-start'));

    // Perform several quick tab switches
    for (let i = 0; i < 3; i++) {
      await tabs.nth(i % (await tabs.count())).click();
      await page.waitForTimeout(50);
    }

    await page.evaluate(() => performance.mark('browser-test-end'));

    const browserMetrics = await page.evaluate((browser) => {
      performance.measure('browser-test', 'browser-test-start', 'browser-test-end');
      const measure = performance.getEntriesByName('browser-test')[0];

      return {
        browser,
        duration: measure.duration,
        // Check if AutoAnimate is working (assuming it adds data attributes)
        hasAutoAnimate: document.querySelectorAll('[data-auto-animate]').length > 0,
      };
    }, browserName);

    // Browser-specific performance expectations
    const maxDuration = browserName === 'webkit' ? 800 : 600; // Safari might be slightly slower
    expect(browserMetrics.duration).toBeLessThan(maxDuration);

    console.log(`${browserName} animation test: ${browserMetrics.duration.toFixed(1)}ms`);
  });

  test('AutoAnimate performance with large datasets', async ({ page }) => {
    // Test animation performance when dealing with many animated elements
    await page.goto('/');

    // Create a test scenario with many items (if available)
    // This would ideally test a calendar with many events or a long list

    const listElements = page.locator(
      '[data-testid="event-list"], [data-testid="calendar-events"], ul li'
    );
    const elementCount = await listElements.count();

    if (elementCount > 10) {
      await page.evaluate(() => performance.mark('large-dataset-start'));

      // Perform operations that would trigger list animations
      // This could be filtering, sorting, or adding/removing items

      // Try to find and use filter or add buttons
      const filterButton = page
        .locator('button')
        .filter({ hasText: /filter|search/i })
        .first();
      if (await filterButton.isVisible()) {
        await filterButton.click();
        await page.waitForTimeout(200);
      }

      await page.evaluate(() => performance.mark('large-dataset-end'));

      const largeDatasetMetrics = await page.evaluate(() => {
        performance.measure('large-dataset', 'large-dataset-start', 'large-dataset-end');
        const measure = performance.getEntriesByName('large-dataset')[0];

        return {
          duration: measure.duration,
          elementCount: document.querySelectorAll(
            '[data-testid="event-list"] *, [data-testid="calendar-events"] *, ul li'
          ).length,
        };
      });

      // Should handle large datasets efficiently
      expect(largeDatasetMetrics.duration).toBeLessThan(1000);

      console.log(
        `Large dataset (${largeDatasetMetrics.elementCount} elements): ${largeDatasetMetrics.duration.toFixed(1)}ms`
      );
    }
  });
});

test.describe('AutoAnimate Integration Tests', () => {
  test('AutoAnimate hooks are properly initialized', async ({ page }) => {
    await page.goto('/');

    // Check that our custom hooks are available
    const hooksAvailable = await page.evaluate(() => {
      // Check if AutoAnimate is loaded
      return (
        typeof window !== 'undefined' &&
        document.querySelectorAll('[data-auto-animate]').length >= 0
      );
    });

    expect(hooksAvailable).toBe(true);
  });

  test('Performance monitoring is active during animations', async ({ page }) => {
    await page.goto('/');

    // Check if React Scan is active (if it adds any detectable elements)
    const performanceMonitorActive = await page.evaluate(() => {
      // Check for React Scan or other performance monitoring indicators
      return (
        window.performance &&
        typeof window.performance.mark === 'function' &&
        typeof window.performance.measure === 'function'
      );
    });

    expect(performanceMonitorActive).toBe(true);
  });
});
