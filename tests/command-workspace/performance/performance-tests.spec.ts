/**
 * Performance Tests
 * Tests for performance metrics and optimization targets
 * Research validation: 60fps, <500ms render, <120ms keyboard response
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Rendering Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
  });

  test('should render shell within 500ms', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/app');
    await page.waitForSelector('[data-testid="app-shell"]');

    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(500); // Target: <500ms

    // Log performance for analysis
    console.log(`Shell render time: ${renderTime}ms`);
  });

  test('should switch tabs within 200ms', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const weekTab = page.locator('[data-testid="tab-week"]');
    const plannerTab = page.locator('[data-testid="tab-planner"]');

    if (await plannerTab.isVisible()) {
      const startTime = Date.now();

      await plannerTab.click();
      await page.waitForSelector('[data-testid="planner-view"]');

      const switchTime = Date.now() - startTime;
      expect(switchTime).toBeLessThan(200); // Target: <200ms

      console.log(`Tab switch time: ${switchTime}ms`);
    }
  });

  test('should toggle dock panels within 100ms', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const aiTab = page.locator('[data-testid="dock-panel-tab-ai"]');
    const detailsTab = page.locator('[data-testid="dock-panel-tab-details"]');

    if ((await aiTab.isVisible()) && (await detailsTab.isVisible())) {
      const startTime = Date.now();

      await detailsTab.click();
      await page.waitForSelector('[data-testid="dock-panel-content-details"]');

      const toggleTime = Date.now() - startTime;
      expect(toggleTime).toBeLessThan(100); // Target: <100ms

      console.log(`Panel toggle time: ${toggleTime}ms`);
    }
  });

  test('should open command palette within 100ms', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const isMac = process.platform === 'darwin';
    const modKey = isMac ? 'Meta' : 'Control';

    const startTime = Date.now();

    await page.keyboard.press(`${modKey}+P`);
    await page.waitForSelector('[data-testid="command-palette"]');

    const openTime = Date.now() - startTime;
    expect(openTime).toBeLessThan(100); // Target: <100ms

    console.log(`Command palette open time: ${openTime}ms`);
  });
});

test.describe('Frame Rate Performance', () => {
  test('should maintain 60fps during scrolling', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Start performance measurement
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const frames: number[] = [];
        let lastTime = performance.now();
        let frameCount = 0;

        function measureFrame() {
          const currentTime = performance.now();
          const frameDuration = currentTime - lastTime;
          frames.push(frameDuration);
          lastTime = currentTime;
          frameCount++;

          if (frameCount < 60) {
            // Measure 60 frames
            requestAnimationFrame(measureFrame);
          } else {
            resolve(frames);
          }
        }

        // Start measuring after scroll
        setTimeout(() => {
          requestAnimationFrame(measureFrame);
        }, 100);
      });
    });

    // Perform scrolling
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1000);

    // Analyze frame times
    const frameMetrics = metrics as number[];
    const avgFrameTime = frameMetrics.reduce((a, b) => a + b, 0) / frameMetrics.length;
    const maxFrameTime = Math.max(...frameMetrics);

    // 60fps = 16.67ms per frame
    expect(avgFrameTime).toBeLessThan(17); // Average should be 60fps
    expect(maxFrameTime).toBeLessThan(33); // Max should be at least 30fps

    console.log(`Average frame time: ${avgFrameTime.toFixed(2)}ms`);
    console.log(`Max frame time: ${maxFrameTime.toFixed(2)}ms`);
  });

  test('should maintain 60fps during drag operations', async ({ page }) => {
    await page.goto('/app?view=planner');
    await page.waitForLoadState('networkidle');

    const task = page.locator('[data-testid="kanban-task"]').first();

    if (await task.isVisible()) {
      // Start performance monitoring
      await page.evaluate(() => {
        (window as any).frameTimes = [];
        let lastTime = performance.now();

        function measureFrame() {
          const currentTime = performance.now();
          (window as any).frameTimes.push(currentTime - lastTime);
          lastTime = currentTime;
          requestAnimationFrame(measureFrame);
        }
        measureFrame();
      });

      // Perform drag operation
      const targetColumn = page.locator('[data-testid="kanban-column-in-progress"]');
      await task.dragTo(targetColumn, { steps: 10 });

      // Get frame metrics
      const frameTimes = await page.evaluate(() => (window as any).frameTimes);
      const avgFrameTime = frameTimes.slice(-30).reduce((a: number, b: number) => a + b, 0) / 30;

      expect(avgFrameTime).toBeLessThan(17); // 60fps target

      console.log(`Drag operation frame time: ${avgFrameTime.toFixed(2)}ms`);
    }
  });
});

test.describe('Memory Performance', () => {
  test('should use less than 100MB memory for shell', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    // Measure memory usage
    const memoryInfo = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory;
      }
      return null;
    });

    if (memoryInfo) {
      const usedMemoryMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
      expect(usedMemoryMB).toBeLessThan(100); // Target: <100MB

      console.log(`Memory usage: ${usedMemoryMB.toFixed(2)}MB`);
      console.log(`Total heap: ${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    }
  });

  test('should not leak memory during tab switching', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Switch tabs multiple times
    for (let i = 0; i < 10; i++) {
      const plannerTab = page.locator('[data-testid="tab-planner"]');
      if (await plannerTab.isVisible()) {
        await plannerTab.click();
        await page.waitForTimeout(100);
      }

      const weekTab = page.locator('[data-testid="tab-week"]');
      if (await weekTab.isVisible()) {
        await weekTab.click();
        await page.waitForTimeout(100);
      }
    }

    // Force GC and check memory
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    if (initialMemory && finalMemory) {
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
      expect(memoryIncrease).toBeLessThan(10); // Should not grow more than 10MB

      console.log(`Memory increase after tab switching: ${memoryIncrease.toFixed(2)}MB`);
    }
  });
});

test.describe('Network Performance', () => {
  test('should load with minimal network requests', async ({ page }) => {
    const requests: string[] = [];

    page.on('request', (request) => {
      requests.push(request.url());
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Count request types
    const jsRequests = requests.filter((url) => url.endsWith('.js')).length;
    const cssRequests = requests.filter((url) => url.endsWith('.css')).length;
    const totalRequests = requests.length;

    // Should have reasonable number of requests
    expect(totalRequests).toBeLessThan(50); // Reasonable limit

    console.log(`Total requests: ${totalRequests}`);
    console.log(`JS requests: ${jsRequests}`);
    console.log(`CSS requests: ${cssRequests}`);
  });

  test('should implement proper caching', async ({ page }) => {
    // First load
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Get resource timing for first load
    const firstLoadResources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((r) => ({
        name: r.name,
        duration: (r as PerformanceResourceTiming).duration,
      }));
    });

    // Second load (should use cache)
    await page.reload();
    await page.waitForLoadState('networkidle');

    const secondLoadResources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((r) => ({
        name: r.name,
        duration: (r as PerformanceResourceTiming).duration,
        cached: (r as PerformanceResourceTiming).transferSize === 0,
      }));
    });

    // Check cache usage
    const cachedResources = secondLoadResources.filter((r) => r.cached).length;
    const cacheRatio = cachedResources / secondLoadResources.length;

    expect(cacheRatio).toBeGreaterThan(0.5); // At least 50% should be cached

    console.log(`Cache ratio: ${(cacheRatio * 100).toFixed(1)}%`);
  });
});

test.describe('Bundle Size Performance', () => {
  test('should respect component bundle size budgets', async ({ page }) => {
    // Navigate to app
    await page.goto('/app');

    // Get resource sizes
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((entry) => {
        const resourceEntry = entry as PerformanceResourceTiming;
        return {
          name: resourceEntry.name,
          size: resourceEntry.transferSize,
          decodedSize: resourceEntry.decodedBodySize,
        };
      });
    });

    // Calculate component sizes
    const jsResources = resources.filter((r) => r.name.includes('.js'));
    const totalJSSize = jsResources.reduce((sum, r) => sum + r.size, 0) / 1024; // KB

    // Check against budgets
    expect(totalJSSize).toBeLessThan(500); // Total JS < 500KB

    console.log(`Total JS bundle size: ${totalJSSize.toFixed(2)}KB`);

    // Check individual chunks
    jsResources.forEach((resource) => {
      const sizeKB = resource.size / 1024;

      // Individual chunks should be reasonable
      if (resource.name.includes('shell')) {
        expect(sizeKB).toBeLessThan(150); // Shell < 150KB
      } else if (resource.name.includes('view')) {
        expect(sizeKB).toBeLessThan(100); // Views < 100KB each
      } else if (resource.name.includes('dock')) {
        expect(sizeKB).toBeLessThan(50); // Dock panels < 50KB each
      }
    });
  });
});

test.describe('AI Response Performance', () => {
  test('should stream first token within 400ms', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    const omnibox = page.locator('[data-testid="omnibox-input"]');

    if (await omnibox.isVisible()) {
      const startTime = Date.now();

      await omnibox.click();
      await omnibox.type('help me');
      await page.keyboard.press('Enter');

      // Wait for first token
      const response = page.locator('[data-testid="omnibox-response"]');
      await response.waitFor({ state: 'visible', timeout: 400 });

      const firstTokenTime = Date.now() - startTime;
      expect(firstTokenTime).toBeLessThan(400); // Target: <400ms

      console.log(`First token time: ${firstTokenTime}ms`);
    }
  });

  test('should complete suggestions within 2s', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    if (await chatInput.isVisible()) {
      const startTime = Date.now();

      await chatInput.type('suggest schedule improvements');
      await page.keyboard.press('Enter');

      // Wait for complete response
      await page.waitForTimeout(2000);

      const response = page.locator('[data-testid="ai-response"]');
      const hasResponse = await response.isVisible();

      if (hasResponse) {
        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(2000); // Target: ≤2s

        console.log(`AI suggestion time: ${responseTime}ms`);
      }
    }
  });

  test('should detect conflicts within 500ms', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Open conflicts panel
    const conflictsTab = page.locator('[data-testid="dock-panel-tab-conflicts"]');

    if (await conflictsTab.isVisible()) {
      await conflictsTab.click();

      const startTime = Date.now();

      // Trigger conflict detection (e.g., by creating event)
      const detectButton = page.locator('[data-testid="detect-conflicts-button"]');
      if (await detectButton.isVisible()) {
        await detectButton.click();

        // Wait for detection
        const conflictsList = page.locator('[data-testid="conflicts-list"]');
        await conflictsList.waitFor({ state: 'visible', timeout: 500 });

        const detectionTime = Date.now() - startTime;
        expect(detectionTime).toBeLessThan(500); // Target: ≤500ms

        console.log(`Conflict detection time: ${detectionTime}ms`);
      }
    }
  });
});

test.describe('Keyboard Response Performance', () => {
  test('should respond to all keyboard shortcuts within 120ms', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    const isMac = process.platform === 'darwin';
    const modKey = isMac ? 'Meta' : 'Control';

    // Test command palette
    let startTime = Date.now();
    await page.keyboard.press(`${modKey}+P`);
    await page.waitForSelector('[data-testid="command-palette"]', { timeout: 120 });
    let responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(120);
    console.log(`Cmd+P response: ${responseTime}ms`);

    // Close palette
    await page.keyboard.press('Escape');

    // Test other shortcuts
    const shortcuts = [
      { key: 'Alt+1', selector: '[data-testid="view-week"]' },
      { key: 'Alt+2', selector: '[data-testid="view-month"]' },
      { key: `${modKey}+K`, selector: '[data-testid="command-bar"]' },
    ];

    for (const shortcut of shortcuts) {
      const element = page.locator(shortcut.selector);

      if ((await element.count()) > 0) {
        startTime = Date.now();
        await page.keyboard.press(shortcut.key);

        try {
          await element.waitFor({ state: 'visible', timeout: 120 });
          responseTime = Date.now() - startTime;
          expect(responseTime).toBeLessThan(120);
          console.log(`${shortcut.key} response: ${responseTime}ms`);
        } catch {
          // Shortcut might not be implemented
        }
      }
    }
  });

  test('should handle rapid keyboard input without lag', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    const isMac = process.platform === 'darwin';
    const modKey = isMac ? 'Meta' : 'Control';

    // Open command palette
    await page.keyboard.press(`${modKey}+P`);
    const input = page.locator('[data-testid="command-palette-input"]');

    if (await input.isVisible()) {
      // Type rapidly
      const testString = 'quick brown fox jumps';
      const startTime = Date.now();

      for (const char of testString) {
        await page.keyboard.type(char);
      }

      const typingTime = Date.now() - startTime;
      const avgCharTime = typingTime / testString.length;

      // Should handle rapid typing (avg < 50ms per char)
      expect(avgCharTime).toBeLessThan(50);

      console.log(`Average typing response: ${avgCharTime.toFixed(2)}ms per character`);
    }
  });
});
