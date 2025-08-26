import { test, expect } from '@playwright/test';

test.describe('Viewport Utilization Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Wait for calendar to be fully loaded
    await page.waitForSelector('[role="grid"]', { timeout: 10000 });
  });

  test('calendar uses at least 95% of viewport height', async ({ page }) => {
    // Get viewport dimensions
    const viewportSize = page.viewportSize();
    const viewportHeight = viewportSize?.height || 900;
    
    // Get calendar grid element
    const calendarGrid = await page.locator('[role="grid"]');
    const gridBox = await calendarGrid.boundingBox();
    
    // Get navigation header height
    const navHeader = await page.locator('header, [role="navigation"]').first();
    const navBox = await navHeader.boundingBox();
    const navHeight = navBox?.height || 60;
    
    // Calculate calendar content height (excluding navigation)
    const calendarContentHeight = gridBox?.height || 0;
    const availableHeight = viewportHeight - navHeight;
    
    // Calendar should use at least 95% of available viewport height
    const utilizationPercentage = (calendarContentHeight / availableHeight) * 100;
    console.log(`Viewport utilization: ${utilizationPercentage.toFixed(2)}%`);
    
    expect(utilizationPercentage).toBeGreaterThanOrEqual(95);
  });

  test('all 12 months are visible without empty space', async ({ page }) => {
    // Count visible month rows
    const monthRows = await page.locator('[class*="border-b-2"]').count();
    expect(monthRows).toBe(12);
    
    // Check that there's no excessive empty space at bottom
    const lastMonth = await page.locator('[class*="border-b-2"]').last();
    const lastMonthBox = await lastMonth.boundingBox();
    
    const viewportSize = page.viewportSize();
    const viewportHeight = viewportSize?.height || 900;
    
    // Bottom of last month should be close to viewport bottom
    const bottomPosition = (lastMonthBox?.y || 0) + (lastMonthBox?.height || 0);
    const unusedSpace = viewportHeight - bottomPosition;
    
    // Should have less than 100px of unused space at bottom
    expect(unusedSpace).toBeLessThan(100);
  });

  test('month row heights are properly distributed', async ({ page }) => {
    const viewportSize = page.viewportSize();
    const viewportHeight = viewportSize?.height || 900;
    
    // Get navigation header height
    const navHeader = await page.locator('header, [role="navigation"]').first();
    const navBox = await navHeader.boundingBox();
    const navHeight = navBox?.height || 60;
    
    // Calculate expected month height
    const expectedMonthHeight = Math.floor((viewportHeight - navHeight) / 12);
    
    // Get all month rows
    const monthRows = await page.locator('[class*="border-b-2"]').all();
    
    for (const monthRow of monthRows) {
      const box = await monthRow.boundingBox();
      const actualHeight = box?.height || 0;
      
      // Each month should be close to the expected height (within 10px tolerance)
      expect(Math.abs(actualHeight - expectedMonthHeight)).toBeLessThan(10);
    }
  });

  test('day cells have proper touch targets on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await page.waitForSelector('[role="grid"]', { timeout: 10000 });
    
    // Get a day cell
    const dayCell = await page.locator('[class*="border-r"][class*="hover:bg-accent"]').first();
    const box = await dayCell.boundingBox();
    
    // On mobile, touch targets should be at least 44x44px (WCAG recommendation)
    // In fullYear view, width might be smaller but height should compensate
    const minDimension = Math.min(box?.width || 0, box?.height || 0);
    const area = (box?.width || 0) * (box?.height || 0);
    
    // Either minimum dimension is 44px or total area is sufficient for touch
    expect(minDimension >= 44 || area >= 1936).toBeTruthy(); // 44*44 = 1936
  });

  test('visual hierarchy is properly established', async ({ page }) => {
    // Check month labels are visible and styled
    const monthLabel = await page.locator('[class*="bg-muted"][class*="font-semibold"]').first();
    await expect(monthLabel).toBeVisible();
    
    // Check month label has proper styling
    const monthLabelStyles = await monthLabel.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontWeight: styles.fontWeight,
        backgroundColor: styles.backgroundColor
      };
    });
    
    // Font should be semibold (600) or bold (700)
    expect(parseInt(monthLabelStyles.fontWeight)).toBeGreaterThanOrEqual(600);
    
    // Check borders are visible
    const monthRow = await page.locator('[class*="border-b-2"]').first();
    const borderStyle = await monthRow.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.borderBottomWidth;
    });
    
    // Border should be 2px as specified
    expect(borderStyle).toBe('2px');
  });

  test('hover effects work properly', async ({ page }) => {
    // Get a day cell
    const dayCell = await page.locator('[class*="border-r"][class*="hover:bg-accent"]').first();
    
    // Get initial background
    const initialBg = await dayCell.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // Hover over the cell
    await dayCell.hover();
    await page.waitForTimeout(100); // Wait for transition
    
    // Get hover background
    const hoverBg = await dayCell.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // Background should change on hover
    expect(initialBg).not.toBe(hoverBg);
  });

  test('today indicator is clearly visible', async ({ page }) => {
    // Find today's cell
    const todayCell = await page.locator('[class*="bg-blue-500/15"]').first();
    
    if (await todayCell.count() > 0) {
      await expect(todayCell).toBeVisible();
      
      // Check it has distinctive styling
      const styles = await todayCell.evaluate(el => {
        const computedStyles = window.getComputedStyle(el);
        return {
          backgroundColor: computedStyles.backgroundColor,
          borderColor: computedStyles.borderColor
        };
      });
      
      // Should have blue-tinted background
      expect(styles.backgroundColor).toContain('rgba');
    }
  });
});

test.describe('Responsive Layout Tests', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 812 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Large Desktop', width: 2560, height: 1440 }
  ];

  for (const viewport of viewports) {
    test(`proper layout on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://localhost:3000');
      await page.waitForSelector('[role="grid"]', { timeout: 10000 });
      
      // Get calendar grid
      const calendarGrid = await page.locator('[role="grid"]');
      const gridBox = await calendarGrid.boundingBox();
      
      // Calendar should be visible
      await expect(calendarGrid).toBeVisible();
      
      // Calendar should use most of viewport
      const viewportUtilization = (gridBox?.height || 0) / viewport.height * 100;
      expect(viewportUtilization).toBeGreaterThan(80); // At least 80% on all devices
      
      // Check month rows are visible
      const visibleMonths = await page.locator('[class*="border-b-2"]').count();
      expect(visibleMonths).toBe(12);
      
      // Take screenshot for visual regression
      await page.screenshot({ 
        path: `tests/screenshots/layout-${viewport.name.toLowerCase()}.png`,
        fullPage: false // Only viewport to see actual user view
      });
    });
  }
});

test.describe('Performance with Improved Layout', () => {
  test('scrolling remains smooth with full viewport usage', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[role="grid"]', { timeout: 10000 });
    
    // Measure scroll performance
    const metrics = await page.evaluate(async () => {
      const scrollContainer = document.querySelector('[role="grid"]')?.parentElement;
      if (!scrollContainer) return { fps: 0, scrollTime: 0 };
      
      const startTime = performance.now();
      let frameCount = 0;
      const lastFrameTime = startTime;
      
      // Create animation frame counter
      const countFrames = () => {
        frameCount++;
        const currentTime = performance.now();
        if (currentTime - startTime < 1000) {
          requestAnimationFrame(countFrames);
        }
      };
      requestAnimationFrame(countFrames);
      
      // Perform scroll
      scrollContainer.scrollTo({ top: 500, behavior: 'smooth' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const fps = frameCount / (duration / 1000);
      
      return { fps, scrollTime: duration };
    });
    
    // Should maintain at least 30fps
    expect(metrics.fps).toBeGreaterThan(30);
    
    // Scroll should complete within 1.5 seconds
    expect(metrics.scrollTime).toBeLessThan(1500);
  });

  test('memory usage remains reasonable with expanded layout', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[role="grid"]', { timeout: 10000 });
    
    // Get memory usage if available
    const metrics = await page.evaluate(() => {
      // performance.memory is Chrome-specific API not in standard TypeScript definitions
      // @ts-expect-error - Chrome-specific memory API
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize / 1048576, // Convert to MB
          totalJSHeapSize: performance.memory.totalJSHeapSize / 1048576
        };
      }
      return null;
    });
    
    if (metrics) {
      // Memory usage should be reasonable (less than 200MB)
      expect(metrics.usedJSHeapSize).toBeLessThan(200);
      console.log(`Memory usage: ${metrics.usedJSHeapSize.toFixed(2)}MB / ${metrics.totalJSHeapSize.toFixed(2)}MB`);
    }
  });
});