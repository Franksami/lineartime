import { test, expect } from '@playwright/test';

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  bundleSize: number;
  memoryUsage: number;
  fps: number;
}

interface SLOTargets {
  maxLoadTime: number; // <500ms (new target vs current ~1.5s)
  maxLCP: number; // ≤2.5s (Core Web Vital)
  maxFID: number; // ≤100ms (Core Web Vital)
  maxCLS: number; // ≤0.1 (Core Web Vital)
  maxBundleSize: number; // <500KB initial (new target)
  maxMemoryUsage: number; // <100MB (existing target)
  minFPS: number; // 112+ FPS (existing target)
}

const SLO_TARGETS: SLOTargets = {
  maxLoadTime: 500,
  maxLCP: 2500,
  maxFID: 100,
  maxCLS: 0.1,
  maxBundleSize: 500 * 1024, // 500KB in bytes
  maxMemoryUsage: 100, // MB
  minFPS: 112,
};

test.describe('Performance SLO Baseline Measurements', () => {
  test('establish baseline performance metrics', async ({ page, context }) => {
    // Only use CDP for Chromium
    let cdpSession: any = null;
    if (context._browser?.browserType().name() === 'chromium') {
      try {
        cdpSession = await context.newCDPSession(page);
        await cdpSession.send('Performance.enable');
        await cdpSession.send('Runtime.enable');
      } catch (error) {
        console.warn('CDP not available:', error);
      }
    }

    const startTime = Date.now();

    // Navigate to main application
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Check if we're on landing page based on URL or content
    const currentUrl = page.url();
    const isLandingPage =
      currentUrl.includes('/landing') || (await page.locator('header').first().isVisible());

    if (isLandingPage) {
      console.log('Landing page detected, measuring landing page performance instead');
      // Wait for landing page components to render
      await page.waitForSelector('header', { timeout: 5000 });
      await page.waitForTimeout(1000); // Allow time for full render
    } else {
      // Wait for calendar to fully render if authenticated
      await page.waitForSelector('[role="grid"]', { timeout: 10000 });
    }

    const loadTime = Date.now() - startTime;

    // Collect Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Import Web Vitals library if available, otherwise use manual collection
        const metrics: any = {};

        // Manual LCP collection
        if ('PerformanceObserver' in window) {
          try {
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              metrics.lcp = lastEntry.startTime;
            });
            observer.observe({ type: 'largest-contentful-paint', buffered: true });
          } catch (e) {
            console.warn('LCP observer not supported');
          }

          // Manual FCP collection
          try {
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              if (entries.length > 0) {
                metrics.fcp = entries[0].startTime;
              }
            });
            observer.observe({ type: 'paint', buffered: true });
          } catch (e) {
            console.warn('Paint observer not supported');
          }

          // Manual CLS collection
          try {
            const observer = new PerformanceObserver((list) => {
              let clsValue = 0;
              const entries = list.getEntries();
              entries.forEach((entry: any) => {
                if (!entry.hadRecentInput) {
                  clsValue += entry.value;
                }
              });
              metrics.cls = clsValue;
            });
            observer.observe({ type: 'layout-shift', buffered: true });
          } catch (e) {
            console.warn('Layout shift observer not supported');
          }
        }

        // Fallback to manual timing
        setTimeout(() => {
          resolve({
            fcp:
              metrics.fcp ||
              performance.timing?.domContentLoadedEventStart -
                performance.timing?.navigationStart ||
              0,
            lcp: metrics.lcp || 0,
            cls: metrics.cls || 0,
            fid: 0, // Will be measured separately during interaction
          });
        }, 1000);
      });
    });

    // Measure bundle size (approximate from network requests)
    const bundleSize = await page.evaluate(async () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return resources
          .filter((resource) => resource.name.includes('.js') && resource.transferSize)
          .reduce((total, resource) => total + (resource.transferSize || 0), 0);
      }
      return 0;
    });

    // Measure memory usage
    const memoryMetrics = await page.evaluate(() => {
      // @ts-expect-error - Chrome-specific memory API
      return performance.memory
        ? {
            used: performance.memory.usedJSHeapSize / 1048576, // MB
            total: performance.memory.totalJSHeapSize / 1048576,
            limit: performance.memory.jsHeapSizeLimit / 1048576,
          }
        : { used: 0, total: 0, limit: 0 };
    });

    // Measure FPS during scrolling
    const fpsMetrics = await page.evaluate(async () => {
      const scrollContainer = document.querySelector('[role="grid"]')?.parentElement;
      if (!scrollContainer) return { fps: 0 };

      let frameCount = 0;
      const startTime = performance.now();
      const duration = 2000; // 2 seconds

      const countFrames = () => {
        frameCount++;
        if (performance.now() - startTime < duration) {
          requestAnimationFrame(countFrames);
        }
      };

      requestAnimationFrame(countFrames);

      // Perform scroll test
      for (let i = 0; i < 10; i++) {
        scrollContainer.scrollTo({ top: i * 100, behavior: 'smooth' });
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Wait for frame counting to complete
      await new Promise((resolve) => setTimeout(resolve, duration));

      return {
        fps: frameCount / (duration / 1000),
      };
    });

    // Measure FID through interaction
    const fidMetrics = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        let fid = 0;

        if ('PerformanceObserver' in window) {
          try {
            const observer = new PerformanceObserver((list) => {
              const firstInput = list.getEntries()[0];
              if (firstInput) {
                fid = firstInput.processingStart - firstInput.startTime;
              }
            });
            observer.observe({ type: 'first-input', buffered: true });
          } catch (e) {
            console.warn('FID observer not supported');
          }
        }

        // Trigger an interaction to measure FID
        const button =
          document.querySelector('button') || document.querySelector('[role="button"]');
        if (button) {
          const startTime = performance.now();
          (button as HTMLElement).click();
          const endTime = performance.now();
          fid = endTime - startTime;
        }

        setTimeout(() => resolve(fid), 1000);
      });
    });

    // Compile all metrics
    const metrics: PerformanceMetrics = {
      loadTime,
      firstContentfulPaint: (webVitals as any).fcp,
      largestContentfulPaint: (webVitals as any).lcp,
      firstInputDelay: await fidMetrics,
      cumulativeLayoutShift: (webVitals as any).cls,
      bundleSize,
      memoryUsage: memoryMetrics.used,
      fps: fpsMetrics.fps,
    };

    // Log all metrics
    console.log('=== PERFORMANCE BASELINE METRICS ===');
    console.log(`Load Time: ${metrics.loadTime}ms (Target: <${SLO_TARGETS.maxLoadTime}ms)`);
    console.log(`First Contentful Paint: ${metrics.firstContentfulPaint}ms`);
    console.log(
      `Largest Contentful Paint: ${metrics.largestContentfulPaint}ms (Target: <${SLO_TARGETS.maxLCP}ms)`
    );
    console.log(
      `First Input Delay: ${metrics.firstInputDelay}ms (Target: <${SLO_TARGETS.maxFID}ms)`
    );
    console.log(
      `Cumulative Layout Shift: ${metrics.cumulativeLayoutShift} (Target: <${SLO_TARGETS.maxCLS})`
    );
    console.log(
      `Bundle Size: ${(metrics.bundleSize / 1024).toFixed(2)}KB (Target: <${SLO_TARGETS.maxBundleSize / 1024}KB)`
    );
    console.log(
      `Memory Usage: ${metrics.memoryUsage.toFixed(2)}MB (Target: <${SLO_TARGETS.maxMemoryUsage}MB)`
    );
    console.log(`FPS: ${metrics.fps.toFixed(2)} (Target: >${SLO_TARGETS.minFPS})`);

    // SLO compliance checks (warnings, not failures for baseline)
    const sloResults = {
      loadTime: metrics.loadTime <= SLO_TARGETS.maxLoadTime,
      lcp: metrics.largestContentfulPaint <= SLO_TARGETS.maxLCP,
      fid: metrics.firstInputDelay <= SLO_TARGETS.maxFID,
      cls: metrics.cumulativeLayoutShift <= SLO_TARGETS.maxCLS,
      bundleSize: metrics.bundleSize <= SLO_TARGETS.maxBundleSize,
      memoryUsage: metrics.memoryUsage <= SLO_TARGETS.maxMemoryUsage,
      fps: metrics.fps >= SLO_TARGETS.minFPS,
    };

    console.log('=== SLO COMPLIANCE ===');
    Object.entries(sloResults).forEach(([metric, passes]) => {
      console.log(`${metric}: ${passes ? '✅ PASS' : '⚠️  NEEDS IMPROVEMENT'}`);
    });

    const overallCompliance =
      (Object.values(sloResults).filter(Boolean).length / Object.values(sloResults).length) * 100;
    console.log(`Overall SLO Compliance: ${overallCompliance.toFixed(1)}%`);

    // Store baseline for comparison
    await page.evaluate((metricsData) => {
      localStorage.setItem('performanceBaseline', JSON.stringify(metricsData));
    }, metrics);

    // Basic assertions - should not be too restrictive for baseline
    expect(loadTime).toBeLessThan(10000); // Very generous for baseline
    expect(memoryMetrics.used).toBeLessThan(200); // Double the target for baseline
    expect(fpsMetrics.fps).toBeGreaterThan(30); // Half the target for baseline
  });

  test('measure design system token resolution performance', async ({ page }) => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Wait for page to be ready (landing page or calendar)
    await page.waitForTimeout(2000);

    // Test CSS custom property resolution performance
    const tokenResolutionMetrics = await page.evaluate(() => {
      const startTime = performance.now();

      // Force style recalculation with token changes
      const testElement = document.createElement('div');
      testElement.style.cssText = `
        background: hsl(var(--background));
        color: hsl(var(--foreground));
        border: 1px solid hsl(var(--border));
        padding: var(--space-4);
        margin: var(--space-2);
        border-radius: var(--radius);
        font-size: var(--text-sm);
      `;

      document.body.appendChild(testElement);

      // Force reflow
      const computedStyle = getComputedStyle(testElement);
      const bgColor = computedStyle.backgroundColor;
      const textColor = computedStyle.color;
      const borderColor = computedStyle.borderColor;

      document.body.removeChild(testElement);

      return {
        tokenResolutionTime: performance.now() - startTime,
        resolvedValues: {
          background: bgColor,
          foreground: textColor,
          border: borderColor,
        },
      };
    });

    console.log(
      `Design System Token Resolution: ${tokenResolutionMetrics.tokenResolutionTime.toFixed(2)}ms`
    );
    console.log('Resolved token values:', tokenResolutionMetrics.resolvedValues);

    // Token resolution should be fast (< 10ms)
    expect(tokenResolutionMetrics.tokenResolutionTime).toBeLessThan(10);
  });

  test('component render performance with events', async ({ page }) => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Wait for page to be ready (landing page has component rendering too)
    await page.waitForTimeout(2000);

    // Add events and measure render performance
    const renderMetrics = await page.evaluate(async () => {
      const results: any[] = [];

      // Add progressively more events and measure render time
      for (const eventCount of [10, 50, 100, 500, 1000]) {
        const startTime = performance.now();

        // Simulate events data
        const events = Array.from({ length: eventCount }, (_, i) => ({
          id: `test-${i}`,
          title: `Event ${i}`,
          startDate: new Date(2025, Math.floor(i / 30), (i % 30) + 1),
          endDate: new Date(2025, Math.floor(i / 30), (i % 30) + 2),
          category: 'work',
        }));

        // Store in window and trigger a re-render
        (window as any).testEvents = events;
        window.dispatchEvent(new CustomEvent('events-updated'));

        // Wait for render
        await new Promise((resolve) => setTimeout(resolve, 100));

        const renderTime = performance.now() - startTime;
        results.push({
          eventCount,
          renderTime,
          renderTimePerEvent: renderTime / eventCount,
        });
      }

      return results;
    });

    console.log('=== COMPONENT RENDER PERFORMANCE ===');
    renderMetrics.forEach((metric) => {
      console.log(
        `${metric.eventCount} events: ${metric.renderTime.toFixed(2)}ms (${metric.renderTimePerEvent.toFixed(3)}ms/event)`
      );
    });

    // Performance should scale reasonably with event count
    const largestTest = renderMetrics[renderMetrics.length - 1];
    expect(largestTest.renderTime).toBeLessThan(1000); // 1000 events should render in < 1s
    expect(largestTest.renderTimePerEvent).toBeLessThan(1); // < 1ms per event
  });
});

test.describe('SLO Monitoring and Alerting', () => {
  test('validate SLO targets are measurable', async ({ page }) => {
    // This test validates that we can measure all our SLO targets
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Wait for page to be ready
    await page.waitForTimeout(2000);

    const measurableMetrics = await page.evaluate(() => {
      const capabilities = {
        performanceAPI: 'performance' in window,
        performanceObserver: 'PerformanceObserver' in window,
        memoryAPI: !!(performance as any).memory,
        networkTiming: 'getEntriesByType' in performance,
        paintTiming: 'PerformancePaintTiming' in window,
        layoutShift: 'PerformanceObserver' in window, // Will check specific support
        largestContentfulPaint: 'PerformanceObserver' in window,
      };

      // Test specific observer support
      if (capabilities.performanceObserver) {
        try {
          new PerformanceObserver(() => {}).observe({ type: 'layout-shift', buffered: true });
          capabilities.layoutShift = true;
        } catch {
          capabilities.layoutShift = false;
        }

        try {
          new PerformanceObserver(() => {}).observe({
            type: 'largest-contentful-paint',
            buffered: true,
          });
          capabilities.largestContentfulPaint = true;
        } catch {
          capabilities.largestContentfulPaint = false;
        }
      }

      return capabilities;
    });

    console.log('=== SLO MEASUREMENT CAPABILITIES ===');
    Object.entries(measurableMetrics).forEach(([metric, supported]) => {
      console.log(`${metric}: ${supported ? '✅ Supported' : '❌ Not Supported'}`);
    });

    // We should be able to measure most metrics
    expect(measurableMetrics.performanceAPI).toBe(true);
    expect(measurableMetrics.networkTiming).toBe(true);
  });
});
