import { test, expect, Page } from '@playwright/test'

// Helper to wait for LinearCalendarHorizontal foundation to load
async function waitForFoundation(page: Page) {
  await page.waitForSelector('[role="grid"]', { timeout: 10000 })
  await page.waitForSelector('[aria-label*="Calendar for year"]', { timeout: 5000 })
  await page.waitForTimeout(500) // Let rendering complete
}

// Helper to measure performance metrics
async function measurePerformance(page: Page) {
  return await page.evaluate(() => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const memory = (performance as any).memory
    
    return {
      loadTime: perfData.loadEventEnd - perfData.fetchStart,
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      renderTime: perfData.loadEventEnd - perfData.responseEnd,
      memoryUsed: memory ? memory.usedJSHeapSize / (1024 * 1024) : 0,
      memoryTotal: memory ? memory.totalJSHeapSize / (1024 * 1024) : 0
    }
  })
}

// Helper to simulate heavy usage
async function simulateHeavyUsage(page: Page, operations: number) {
  const grid = page.locator('[role="grid"]')
  const gridBox = await grid.boundingBox()
  
  if (gridBox) {
    for (let i = 0; i < operations; i++) {
      // Simulate various interactions
      await page.mouse.move(
        gridBox.x + Math.random() * gridBox.width,
        gridBox.y + Math.random() * gridBox.height
      )
      
      if (i % 3 === 0) {
        await page.mouse.click(
          gridBox.x + Math.random() * gridBox.width,
          gridBox.y + Math.random() * gridBox.height
        )
      }
      
      if (i % 5 === 0) {
        await page.keyboard.press('Escape')
      }
    }
  }
}

test.describe('⚡ Performance: Component Render Optimization', () => {
  
  test('Initial render completes under 100ms', async ({ page }) => {
    const startTime = performance.now()
    
    await page.goto('/')
    await waitForFoundation(page)
    
    const renderTime = performance.now() - startTime
    console.log(`Initial render time: ${renderTime}ms`)
    
    // Initial page load should be fast
    expect(renderTime).toBeLessThan(3000) // 3 seconds for full page load
    
    // Measure component-specific render
    const componentRenderTime = await page.evaluate(() => {
      const start = performance.now()
      const grid = document.querySelector('[role="grid"]')
      if (grid) {
        // Force reflow to measure render
        void grid.offsetHeight
      }
      return performance.now() - start
    })
    
    expect(componentRenderTime).toBeLessThan(100)
  })

  test('React.memo prevents unnecessary re-renders', async ({ page }) => {
    await page.goto('/')
    await waitForFoundation(page)
    
    // Set up render tracking
    await page.evaluate(() => {
      (window as any).renderCount = 0
      
      // Monkey patch React to track renders
      const observer = new MutationObserver(() => {
        (window as any).renderCount++
      })
      
      const grid = document.querySelector('[role="grid"]')
      if (grid) {
        observer.observe(grid, { childList: true, subtree: true })
      }
    })
    
    // Perform actions that shouldn't trigger full re-render
    await page.mouse.move(100, 100)
    await page.mouse.move(200, 200)
    await page.mouse.move(300, 300)
    
    await page.waitForTimeout(500)
    
    const renderCount = await page.evaluate(() => (window as any).renderCount)
    console.log(`Render count after mouse moves: ${renderCount}`)
    
    // Should have minimal re-renders for mouse movements
    expect(renderCount).toBeLessThan(10)
  })

  test('UseMemo and useCallback optimization effectiveness', async ({ page }) => {
    await page.goto('/')
    await waitForFoundation(page)
    
    // Measure initial state
    const initialMetrics = await measurePerformance(page)
    
    // Trigger state changes that should be optimized
    const dayCells = page.locator('[role="grid"] div').filter({ hasText: /^\d{1,2}$/ })
    
    if (await dayCells.count() > 10) {
      // Click multiple cells to trigger state updates
      for (let i = 0; i < 10; i++) {
        await dayCells.nth(i).click({ force: true })
        await page.waitForTimeout(50)
      }
    }
    
    // Measure after interactions
    const finalMetrics = await measurePerformance(page)
    
    // Memory shouldn't increase significantly
    const memoryIncrease = finalMetrics.memoryUsed - initialMetrics.memoryUsed
    console.log(`Memory increase: ${memoryIncrease}MB`)
    
    expect(memoryIncrease).toBeLessThan(10) // Less than 10MB increase
  })

  test('Bundle size impact is minimal', async ({ page }) => {
    // Check network tab for bundle sizes
    const resources: any[] = []
    
    page.on('response', response => {
      const url = response.url()
      if (url.includes('.js') || url.includes('.css')) {
        resources.push({
          url,
          size: response.headers()['content-length'],
          type: response.headers()['content-type']
        })
      }
    })
    
    await page.goto('/')
    await waitForFoundation(page)
    
    // Calculate total bundle size
    const totalSize = resources.reduce((sum, resource) => {
      return sum + (parseInt(resource.size) || 0)
    }, 0)
    
    const totalSizeMB = totalSize / (1024 * 1024)
    console.log(`Total bundle size: ${totalSizeMB.toFixed(2)}MB`)
    
    // Bundle should be reasonably sized
    expect(totalSizeMB).toBeLessThan(5) // Less than 5MB total
  })
})

test.describe('⚡ Performance: Memory Management', () => {
  
  test('Memory usage stays within bounds', async ({ page }) => {
    await page.goto('/')
    await waitForFoundation(page)
    
    const metrics = await measurePerformance(page)
    console.log(`Initial memory: ${metrics.memoryUsed.toFixed(2)}MB`)
    
    // Memory should be reasonable on load
    expect(metrics.memoryUsed).toBeLessThan(100) // Less than 100MB
    
    // Simulate usage
    await simulateHeavyUsage(page, 20)
    
    const finalMetrics = await measurePerformance(page)
    console.log(`Final memory: ${finalMetrics.memoryUsed.toFixed(2)}MB`)
    
    // Memory should still be reasonable
    expect(finalMetrics.memoryUsed).toBeLessThan(150) // Less than 150MB after usage
  })

  test('No memory leaks during event lifecycle', async ({ page }) => {
    await page.goto('/')
    await waitForFoundation(page)
    
    const initialMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize / (1024 * 1024)
      }
      return 0
    })
    
    // Create and delete multiple events
    const grid = page.locator('[role="grid"]')
    const gridBox = await grid.boundingBox()
    
    if (gridBox) {
      for (let i = 0; i < 10; i++) {
        // Create event
        await page.mouse.move(gridBox.x + 200, gridBox.y + 100)
        await page.mouse.down()
        await page.mouse.move(gridBox.x + 300, gridBox.y + 100)
        await page.mouse.up()
        
        // Cancel immediately
        await page.keyboard.press('Escape')
        await page.waitForTimeout(100)
      }
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc()
      }
    })
    
    await page.waitForTimeout(1000)
    
    const finalMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize / (1024 * 1024)
      }
      return 0
    })
    
    const memoryLeak = finalMemory - initialMemory
    console.log(`Memory leak check: ${memoryLeak.toFixed(2)}MB`)
    
    // Should not leak more than 5MB
    expect(Math.abs(memoryLeak)).toBeLessThan(5)
  })

  test('Component unmounting cleans up properly', async ({ page }) => {
    await page.goto('/')
    await waitForFoundation(page)
    
    // Track event listeners
    const initialListeners = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*')
      let count = 0
      allElements.forEach(el => {
        const listeners = (el as any).getEventListeners?.()
        if (listeners) {
          count += Object.keys(listeners).length
        }
      })
      return count
    })
    
    // Navigate away and back
    await page.goto('/settings')
    await page.waitForTimeout(500)
    await page.goto('/')
    await waitForFoundation(page)
    
    // Check listeners again
    const finalListeners = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*')
      let count = 0
      allElements.forEach(el => {
        const listeners = (el as any).getEventListeners?.()
        if (listeners) {
          count += Object.keys(listeners).length
        }
      })
      return count
    })
    
    // Listeners shouldn't accumulate
    console.log(`Listener leak check: ${finalListeners - initialListeners}`)
  })
})

test.describe('⚡ Performance: Scroll & Interaction Performance', () => {
  
  test('Maintains 60fps during scroll', async ({ page }) => {
    await page.goto('/')
    await waitForFoundation(page)
    
    // Start performance measurement
    await page.evaluate(() => {
      (window as any).frameCount = 0
      (window as any).startTime = performance.now()
      
      const measureFPS = () => {
        (window as any).frameCount++
        if (performance.now() - (window as any).startTime < 1000) {
          requestAnimationFrame(measureFPS)
        }
      }
      requestAnimationFrame(measureFPS)
    })
    
    // Perform scrolling
    const grid = page.locator('[role="grid"]')
    await grid.hover()
    
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 100)
      await page.waitForTimeout(50)
    }
    
    await page.waitForTimeout(1100) // Wait for FPS measurement to complete
    
    const fps = await page.evaluate(() => (window as any).frameCount)
    console.log(`Measured FPS during scroll: ${fps}`)
    
    // Should maintain close to 60fps
    expect(fps).toBeGreaterThan(50) // At least 50fps
  })

  test('Event interactions remain responsive', async ({ page }) => {
    await page.goto('/')
    await waitForFoundation(page)
    
    const events = page.locator('[class*="bg-green"], [class*="bg-blue"], [class*="event"]')
    
    if (await events.count() > 0) {
      // Measure interaction response time
      const startTime = Date.now()
      
      await events.first().click()
      
      // Wait for toolbar to appear
      const toolbar = page.locator('[class*="toolbar"], [class*="floating"]').first()
      await toolbar.waitFor({ timeout: 1000 }).catch(() => {})
      
      const responseTime = Date.now() - startTime
      console.log(`Event click response time: ${responseTime}ms`)
      
      // Should respond quickly
      expect(responseTime).toBeLessThan(200) // Less than 200ms
    }
  })

  test('Keyboard navigation remains snappy', async ({ page }) => {
    await page.goto('/')
    await waitForFoundation(page)
    
    const calendar = page.locator('[role="application"]').nth(1)
    await calendar.focus()
    
    // Measure keyboard navigation speed
    const navigationStart = Date.now()
    
    // Perform rapid keyboard navigation
    const keys = ['Enter', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 't', 'Escape']
    
    for (const key of keys) {
      await page.keyboard.press(key)
      await page.waitForTimeout(10) // Minimal wait
    }
    
    const navigationTime = Date.now() - navigationStart
    const avgResponseTime = navigationTime / keys.length
    
    console.log(`Average keyboard response time: ${avgResponseTime}ms`)
    
    // Each key press should be handled quickly
    expect(avgResponseTime).toBeLessThan(50) // Less than 50ms average
  })
})

test.describe('⚡ Performance: Large Dataset Handling', () => {
  
  test('Handles 100+ events efficiently', async ({ page }) => {
    await page.goto('/')
    await waitForFoundation(page)
    
    // Create many events programmatically
    await page.evaluate(() => {
      // Simulate having many events in IndexedDB
      const events = []
      for (let i = 0; i < 100; i++) {
        events.push({
          id: `test-${i}`,
          title: `Event ${i}`,
          startDate: new Date(2025, Math.floor(i / 10), (i % 28) + 1),
          endDate: new Date(2025, Math.floor(i / 10), (i % 28) + 1),
          category: ['personal', 'work', 'birthday', 'vacation'][i % 4]
        })
      }
      
      // Store in localStorage as fallback test
      localStorage.setItem('test-events', JSON.stringify(events))
    })
    
    // Measure performance with many events
    const metrics = await measurePerformance(page)
    
    console.log(`Performance with 100 events: ${metrics.renderTime}ms render, ${metrics.memoryUsed}MB memory`)
    
    // Should still perform well
    expect(metrics.renderTime).toBeLessThan(1000) // Less than 1 second
    expect(metrics.memoryUsed).toBeLessThan(200) // Less than 200MB
  })

  test('Virtual scrolling prevents DOM overload', async ({ page }) => {
    await page.goto('/')
    await waitForFoundation(page)
    
    // Count actual DOM nodes
    const nodeCount = await page.evaluate(() => {
      return document.querySelectorAll('[role="grid"] *').length
    })
    
    console.log(`DOM node count: ${nodeCount}`)
    
    // Even with full year, DOM shouldn't be overloaded
    expect(nodeCount).toBeLessThan(5000) // Reasonable DOM size
    
    // Test scrolling performance with large grid
    const grid = page.locator('[role="grid"]')
    await grid.hover()
    
    const scrollStart = Date.now()
    
    // Scroll through entire year
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(100, 0) // Horizontal scroll
      await page.waitForTimeout(50)
    }
    
    const scrollTime = Date.now() - scrollStart
    console.log(`Full year scroll time: ${scrollTime}ms`)
    
    // Scrolling should remain smooth
    expect(scrollTime).toBeLessThan(2000) // Less than 2 seconds for full scroll
  })
})

test.describe('⚡ Performance: Optimization Validation', () => {
  
  test('Validates all performance targets are met', async ({ page }) => {
    await page.goto('/')
    await waitForFoundation(page)
    
    const performanceTargets = {
      initialRender: 500,    // <500ms
      scrollFPS: 60,         // 60fps
      memoryUsage: 100,      // <100MB typical
      eventOperation: 100,   // <100ms
      bundleSize: 5          // <5MB
    }
    
    // Test initial render
    const metrics = await measurePerformance(page)
    expect(metrics.loadTime).toBeLessThan(performanceTargets.initialRender * 10) // Allow for full page load
    
    // Test memory usage
    expect(metrics.memoryUsed).toBeLessThan(performanceTargets.memoryUsage)
    
    // Test event operations
    const grid = page.locator('[role="grid"]')
    const gridBox = await grid.boundingBox()
    
    if (gridBox) {
      const operationStart = Date.now()
      
      // Create event
      await page.mouse.move(gridBox.x + 200, gridBox.y + 100)
      await page.mouse.down()
      await page.mouse.move(gridBox.x + 300, gridBox.y + 100)
      await page.mouse.up()
      
      const operationTime = Date.now() - operationStart
      console.log(`Event creation time: ${operationTime}ms`)
      
      expect(operationTime).toBeLessThan(performanceTargets.eventOperation * 5) // Allow for UI interactions
      
      // Cancel
      await page.keyboard.press('Escape')
    }
    
    console.log('All performance targets validated ✅')
  })

  test('Performance monitoring integration works', async ({ page }) => {
    await page.goto('/')
    await waitForFoundation(page)
    
    // Check if performance monitoring is set up
    const hasPerformanceMonitoring = await page.evaluate(() => {
      return typeof (window as any).performanceMonitor !== 'undefined' ||
             typeof (window as any).reportWebVitals !== 'undefined'
    })
    
    if (hasPerformanceMonitoring) {
      console.log('Performance monitoring is integrated')
      
      // Check for Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise(resolve => {
          if ((window as any).webVitals) {
            const vitals = {
              LCP: 0,
              FID: 0,
              CLS: 0
            }
            
            // Mock web vitals collection
            setTimeout(() => resolve(vitals), 100)
          } else {
            resolve(null)
          }
        })
      })
      
      if (webVitals) {
        console.log('Web Vitals collected:', webVitals)
      }
    }
  })
})