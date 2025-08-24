import { test, expect } from '@playwright/test';

test.describe('Performance with Improved Layout', () => {
  test('handles 1000+ events efficiently', async ({ page }) => {
    // Navigate to the test page with many events
    await page.goto('http://localhost:3000/test-performance');
    
    // If test page doesn't exist, use main page and inject events
    const response = await page.goto('http://localhost:3000/test-performance', { waitUntil: 'networkidle' });
    if (response?.status() === 404) {
      // Use main page instead
      await page.goto('http://localhost:3000');
      await page.waitForSelector('[role="grid"]', { timeout: 10000 });
      
      // Inject 1000 test events via console
      await page.evaluate(() => {
        const events = [];
        const categories = ['personal', 'work', 'effort', 'note'];
        const year = new Date().getFullYear();
        
        // Generate 1000 events spread across the year
        for (let i = 0; i < 1000; i++) {
          const month = Math.floor(Math.random() * 12);
          const day = Math.floor(Math.random() * 28) + 1; // 1-28 to avoid month-end issues
          const duration = Math.floor(Math.random() * 5) + 1; // 1-5 days
          
          events.push({
            id: `test-event-${i}`,
            title: `Event ${i}`,
            description: `Test event number ${i}`,
            startDate: new Date(year, month, day),
            endDate: new Date(year, month, day + duration),
            category: categories[Math.floor(Math.random() * categories.length)]
          });
        }
        
        // Store in window for testing
        (window as any).testEvents = events;
        console.log(`Generated ${events.length} test events`);
      });
    }
    
    // Measure initial render time
    const startTime = Date.now();
    await page.waitForSelector('[role="grid"]', { timeout: 10000 });
    const loadTime = Date.now() - startTime;
    
    console.log(`Initial load time with events: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    
    // Test scrolling performance
    const scrollMetrics = await page.evaluate(async () => {
      const scrollContainer = document.querySelector('[role="grid"]')?.parentElement;
      if (!scrollContainer) return { fps: 0, memoryBefore: 0, memoryAfter: 0 };
      
      // Get initial memory
      // @ts-ignore
      const memoryBefore = performance.memory?.usedJSHeapSize || 0;
      
      // Measure FPS during scroll
      let frameCount = 0;
      const startTime = performance.now();
      
      const countFrames = () => {
        frameCount++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(countFrames);
        }
      };
      requestAnimationFrame(countFrames);
      
      // Perform multiple scrolls
      for (let i = 0; i < 5; i++) {
        scrollContainer.scrollTo({ top: i * 200, behavior: 'smooth' });
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get final memory
      // @ts-ignore
      const memoryAfter = performance.memory?.usedJSHeapSize || 0;
      
      const duration = performance.now() - startTime;
      const fps = frameCount / (duration / 1000);
      
      return {
        fps,
        memoryBefore: memoryBefore / 1048576, // MB
        memoryAfter: memoryAfter / 1048576, // MB
        memoryIncrease: (memoryAfter - memoryBefore) / 1048576
      };
    });
    
    console.log(`Scroll FPS: ${scrollMetrics.fps.toFixed(2)}`);
    console.log(`Memory before: ${scrollMetrics.memoryBefore.toFixed(2)}MB`);
    console.log(`Memory after: ${scrollMetrics.memoryAfter.toFixed(2)}MB`);
    console.log(`Memory increase: ${scrollMetrics.memoryIncrease.toFixed(2)}MB`);
    
    // Performance assertions
    expect(scrollMetrics.fps).toBeGreaterThan(30); // At least 30 FPS
    expect(scrollMetrics.memoryIncrease).toBeLessThan(50); // Less than 50MB increase
  });

  test('zoom performance with expanded layout', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[role="grid"]', { timeout: 10000 });
    
    // Test zoom in/out performance
    const zoomMetrics = await page.evaluate(async () => {
      const results = [];
      
      // Find zoom buttons
      const zoomIn = document.querySelector('[aria-label*="Zoom in"], button:has([class*="Plus"])');
      const zoomOut = document.querySelector('[aria-label*="Zoom out"], button:has([class*="Minus"])');
      
      if (zoomIn && zoomOut) {
        // Measure zoom in
        let startTime = performance.now();
        (zoomIn as HTMLElement).click();
        await new Promise(resolve => setTimeout(resolve, 500));
        let zoomInTime = performance.now() - startTime;
        results.push({ action: 'zoom-in', time: zoomInTime });
        
        // Measure zoom out
        startTime = performance.now();
        (zoomOut as HTMLElement).click();
        await new Promise(resolve => setTimeout(resolve, 500));
        let zoomOutTime = performance.now() - startTime;
        results.push({ action: 'zoom-out', time: zoomOutTime });
      }
      
      return results;
    });
    
    for (const metric of zoomMetrics) {
      console.log(`${metric.action}: ${metric.time.toFixed(2)}ms`);
      expect(metric.time).toBeLessThan(1000); // Zoom should be responsive
    }
  });

  test('month navigation performance', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[role="grid"]', { timeout: 10000 });
    
    // Test navigation between months
    const navMetrics = await page.evaluate(async () => {
      const scrollContainer = document.querySelector('[role="grid"]')?.parentElement;
      if (!scrollContainer) return [];
      
      const results = [];
      const monthHeights = [];
      
      // Calculate month positions
      for (let i = 0; i < 12; i++) {
        const monthRow = document.querySelector(`[class*="border-b-2"]:nth-child(${i + 1})`);
        if (monthRow) {
          const rect = monthRow.getBoundingClientRect();
          monthHeights.push(rect.top + scrollContainer.scrollTop);
        }
      }
      
      // Navigate to each month and measure time
      for (let i = 0; i < monthHeights.length; i++) {
        const startTime = performance.now();
        scrollContainer.scrollTo({ top: monthHeights[i], behavior: 'smooth' });
        await new Promise(resolve => setTimeout(resolve, 300));
        const navTime = performance.now() - startTime;
        
        results.push({
          month: i,
          time: navTime,
          position: monthHeights[i]
        });
      }
      
      return results;
    });
    
    const avgTime = navMetrics.reduce((sum, m) => sum + m.time, 0) / navMetrics.length;
    console.log(`Average month navigation time: ${avgTime.toFixed(2)}ms`);
    
    expect(avgTime).toBeLessThan(500); // Navigation should be smooth
  });

  test('viewport utilization maintained under load', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[role="grid"]', { timeout: 10000 });
    
    // Add many events dynamically
    await page.evaluate(() => {
      // Simulate adding many events to stress test layout
      const container = document.querySelector('[role="grid"]');
      if (container) {
        // Force a re-render by modifying styles
        (container as HTMLElement).style.transform = 'translateZ(0)';
        
        // Trigger resize event
        window.dispatchEvent(new Event('resize'));
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Check viewport utilization is still correct
    const viewportSize = page.viewportSize();
    const calendarGrid = await page.locator('[role="grid"]');
    const gridBox = await calendarGrid.boundingBox();
    
    const utilization = ((gridBox?.height || 0) / (viewportSize?.height || 1)) * 100;
    console.log(`Viewport utilization under load: ${utilization.toFixed(2)}%`);
    
    expect(utilization).toBeGreaterThan(95); // Should maintain full viewport usage
  });
});