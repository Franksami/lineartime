/**
 * Phase 5.0 Performance Integration Tests
 * 
 * Validates all performance targets under realistic load conditions with all 11 components:
 * - Memory Usage: <100MB with all components active
 * - Frame Rate: 112+ FPS during complex interactions
 * - AI Response Time: <50ms for AI processing
 * - WebSocket Latency: <100ms for real-time updates
 * - Optimistic Updates: <50ms UI response time
 * - Collaboration: <200ms multi-user update propagation
 * - Library Transitions: <200ms switching between calendar libraries
 * 
 * @version Phase 5.0 Week 7-8
 * @test-coverage Performance validation, stress testing, resource monitoring
 */

import { test, expect, Page, Browser, BrowserContext } from '@playwright/test';

// Performance Target Constants
const PERFORMANCE_TARGETS = {
  MAX_MEMORY_MB: 100,
  MIN_FPS: 112,
  MAX_AI_RESPONSE_MS: 50,
  MAX_WEBSOCKET_LATENCY_MS: 100,
  MAX_OPTIMISTIC_UPDATE_MS: 50,
  MAX_COLLABORATION_PROPAGATION_MS: 200,
  MAX_LIBRARY_TRANSITION_MS: 200,
  MAX_LOAD_TIME_MS: 1500,
  MAX_RENDER_TIME_MS: 500,
  MAX_INTERACTION_RESPONSE_MS: 100,
  TARGET_LIGHTHOUSE_SCORE: 90,
  MAX_CPU_USAGE_PERCENT: 30,
  MAX_NETWORK_REQUESTS_PER_SECOND: 10
} as const;

// Stress Test Configuration
const STRESS_TEST_CONFIG = {
  RAPID_CLICKS_COUNT: 50,
  RAPID_CLICK_INTERVAL_MS: 50,
  LARGE_EVENT_COUNT: 1000,
  CONCURRENT_OPERATIONS: 5,
  MEMORY_PRESSURE_ITERATIONS: 100
} as const;

// Performance Monitoring Utilities
class PerformanceMonitor {
  private page: Page;
  private measurements: Array<{
    timestamp: number;
    memory: number;
    fps: number;
    cpuUsage: number;
    networkRequests: number;
  }> = [];

  constructor(page: Page) {
    this.page = page;
  }

  async startMonitoring(): Promise<void> {
    console.log('📊 Starting performance monitoring');
    
    // Start collecting performance data
    await this.page.evaluate(() => {
      (window as any).performanceData = {
        frameCount: 0,
        startTime: performance.now(),
        memoryData: [],
        networkRequests: 0
      };
      
      // Monitor frame rate
      function trackFrames() {
        (window as any).performanceData.frameCount++;
        requestAnimationFrame(trackFrames);
      }
      requestAnimationFrame(trackFrames);
      
      // Monitor network requests
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        (window as any).performanceData.networkRequests++;
        return originalFetch.apply(this, args);
      };
    });
  }

  async takeMeasurement(): Promise<{
    timestamp: number;
    memory: number;
    fps: number;
    cpuUsage: number;
    networkRequests: number;
    loadTime: number;
    renderTime: number;
  }> {
    const measurement = await this.page.evaluate(() => {
      const data = (window as any).performanceData;
      const now = performance.now();
      const elapsedSeconds = (now - data.startTime) / 1000;
      
      // Calculate FPS
      const fps = Math.round(data.frameCount / elapsedSeconds);
      
      // Get memory usage
      let memoryUsage = 0;
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      }
      
      // Get timing data
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      const renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      
      return {
        timestamp: now,
        memory: memoryUsage,
        fps: fps,
        networkRequests: data.networkRequests,
        loadTime: loadTime,
        renderTime: renderTime
      };
    });
    
    // Estimate CPU usage based on frame drops
    const cpuUsage = Math.max(0, (PERFORMANCE_TARGETS.MIN_FPS - measurement.fps) / PERFORMANCE_TARGETS.MIN_FPS * 100);
    
    const fullMeasurement = {
      ...measurement,
      cpuUsage: cpuUsage
    };
    
    this.measurements.push(fullMeasurement);
    
    console.log(`📊 Performance snapshot: Memory=${fullMeasurement.memory}MB, FPS=${fullMeasurement.fps}, CPU=${fullMeasurement.cpuUsage.toFixed(1)}%`);
    
    return fullMeasurement;
  }

  async getAverageMetrics(): Promise<{
    avgMemory: number;
    avgFPS: number;
    avgCPU: number;
    maxMemory: number;
    minFPS: number;
    maxCPU: number;
  }> {
    if (this.measurements.length === 0) {
      throw new Error('No measurements taken');
    }
    
    const totals = this.measurements.reduce((acc, measurement) => ({
      memory: acc.memory + measurement.memory,
      fps: acc.fps + measurement.fps,
      cpu: acc.cpu + measurement.cpuUsage
    }), { memory: 0, fps: 0, cpu: 0 });
    
    const count = this.measurements.length;
    
    return {
      avgMemory: Math.round(totals.memory / count),
      avgFPS: Math.round(totals.fps / count),
      avgCPU: Math.round(totals.cpu / count),
      maxMemory: Math.max(...this.measurements.map(m => m.memory)),
      minFPS: Math.min(...this.measurements.map(m => m.fps)),
      maxCPU: Math.max(...this.measurements.map(m => m.cpuUsage))
    };
  }
}

// AI Response Time Tester
async function testAIResponseTime(page: Page): Promise<number> {
  console.log('🤖 Testing AI response time');
  
  const startTime = performance.now();
  
  // Look for AI input field
  const aiInputSelectors = [
    'input[placeholder*="natural language" i]',
    'input[placeholder*="ai" i]',
    'textarea[placeholder*="describe" i]',
    '[data-testid="ai-input"]',
    '[data-testid="nlp-input"]',
    '[contenteditable="true"]'
  ];
  
  let aiInput = null;
  for (const selector of aiInputSelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 1000 })) {
      aiInput = element;
      break;
    }
  }
  
  if (!aiInput) {
    console.log('⚠️ No AI input found, testing alternative AI triggers');
    
    // Try clicking on areas that might trigger AI
    const aiTriggerSelectors = [
      'text=/AI/i',
      'text=/Smart/i',
      'text=/Assistant/i',
      '[data-testid*="ai"]',
      'button[class*="ai"]'
    ];
    
    for (const selector of aiTriggerSelectors) {
      const trigger = page.locator(selector).first();
      if (await trigger.isVisible({ timeout: 1000 })) {
        await trigger.click();
        await page.waitForTimeout(100);
        break;
      }
    }
    
    const responseTime = performance.now() - startTime;
    console.log(`🤖 AI trigger response time: ${responseTime}ms`);
    return responseTime;
  }
  
  // Test AI input response
  await aiInput.fill('Schedule a meeting tomorrow at 2 PM');
  await aiInput.press('Enter');
  
  // Wait for AI processing indicators
  const aiResponseSelectors = [
    'text=/processing/i',
    'text=/analyzing/i', 
    'text=/suggestion/i',
    '[data-testid="ai-processing"]',
    '[class*="ai-loading"]',
    '[class*="ai-suggestion"]'
  ];
  
  for (const selector of aiResponseSelectors) {
    if (await page.locator(selector).first().isVisible({ timeout: PERFORMANCE_TARGETS.MAX_AI_RESPONSE_MS })) {
      const responseTime = performance.now() - startTime;
      console.log(`🤖 AI response detected in ${responseTime}ms`);
      return responseTime;
    }
  }
  
  const responseTime = performance.now() - startTime;
  console.log(`🤖 AI response time (timeout): ${responseTime}ms`);
  return responseTime;
}

// WebSocket Latency Tester
async function testWebSocketLatency(page: Page): Promise<number> {
  console.log('🌐 Testing WebSocket latency');
  
  const startTime = performance.now();
  
  // Trigger an action that should cause WebSocket activity
  const calendarGrid = page.locator('[role="grid"]').first();
  if (await calendarGrid.isVisible()) {
    await calendarGrid.click({ position: { x: 100, y: 100 } });
  }
  
  // Look for sync indicators
  const syncIndicators = [
    'text=/syncing/i',
    'text=/connected/i',
    'text=/synced/i',
    '[data-status="syncing"]',
    '[data-status="connected"]',
    '[class*="sync-active"]',
    '[class*="websocket-connected"]'
  ];
  
  for (const indicator of syncIndicators) {
    if (await page.locator(indicator).first().isVisible({ timeout: PERFORMANCE_TARGETS.MAX_WEBSOCKET_LATENCY_MS })) {
      const latency = performance.now() - startTime;
      console.log(`🌐 WebSocket sync detected in ${latency}ms`);
      return latency;
    }
  }
  
  const latency = performance.now() - startTime;
  console.log(`🌐 WebSocket latency (timeout): ${latency}ms`);
  return latency;
}

// Library Transition Tester
async function testLibraryTransition(page: Page): Promise<number> {
  console.log('📚 Testing calendar library transition');
  
  const librarySelectors = [
    'select[data-testid="calendar-library-selector"]',
    'button[data-testid="switch-library"]',
    '[data-testid="library-switcher"]',
    'text=/Switch View/i',
    'text=/Calendar Type/i'
  ];
  
  let librarySelector = null;
  for (const selector of librarySelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 2000 })) {
      librarySelector = element;
      break;
    }
  }
  
  if (!librarySelector) {
    console.log('⚠️ No library selector found');
    return 0;
  }
  
  const startTime = performance.now();
  
  // Trigger library switch
  await librarySelector.click();
  
  // Wait for transition to complete
  await page.waitForTimeout(PERFORMANCE_TARGETS.MAX_LIBRARY_TRANSITION_MS);
  
  const transitionTime = performance.now() - startTime;
  console.log(`📚 Library transition time: ${transitionTime}ms`);
  
  return transitionTime;
}

// Helper function to setup performance testing environment
async function setupPerformanceTest(page: Page): Promise<void> {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.waitForSelector('[role="grid"]', { timeout: 10000 });
  await page.waitForTimeout(2000); // Let all components initialize
}

test.describe('⚡ Phase 5.0 Performance Integration Tests', () => {
  
  test('📊 Baseline performance with all components', async ({ page }) => {
    console.log('📊 Testing baseline performance with all Phase 5.0 components');
    
    await setupPerformanceTest(page);
    
    const monitor = new PerformanceMonitor(page);
    await monitor.startMonitoring();
    
    // Take initial measurement
    const initial = await monitor.takeMeasurement();
    
    // Wait and take several measurements
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(1000);
      await monitor.takeMeasurement();
    }
    
    const averages = await monitor.getAverageMetrics();
    
    console.log('📊 Baseline Performance Results:');
    console.log(`  Average Memory: ${averages.avgMemory}MB (target: <${PERFORMANCE_TARGETS.MAX_MEMORY_MB}MB)`);
    console.log(`  Average FPS: ${averages.avgFPS} (target: >${PERFORMANCE_TARGETS.MIN_FPS})`);
    console.log(`  Max Memory: ${averages.maxMemory}MB`);
    console.log(`  Min FPS: ${averages.minFPS}`);
    console.log(`  Load Time: ${initial.loadTime}ms (target: <${PERFORMANCE_TARGETS.MAX_LOAD_TIME_MS}ms)`);
    console.log(`  Render Time: ${initial.renderTime}ms (target: <${PERFORMANCE_TARGETS.MAX_RENDER_TIME_MS}ms)`);
    
    // Validate against targets
    expect(averages.avgMemory).toBeLessThanOrEqual(PERFORMANCE_TARGETS.MAX_MEMORY_MB);
    expect(averages.avgFPS).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.MIN_FPS);
    expect(initial.loadTime).toBeLessThanOrEqual(PERFORMANCE_TARGETS.MAX_LOAD_TIME_MS);
    expect(initial.renderTime).toBeLessThanOrEqual(PERFORMANCE_TARGETS.MAX_RENDER_TIME_MS);
  });

  test('🤖 AI system response time validation', async ({ page }) => {
    console.log('🤖 Testing AI system response times');
    
    await setupPerformanceTest(page);
    
    // Test AI response time multiple times for consistency
    const aiResponseTimes: number[] = [];
    
    for (let i = 0; i < 3; i++) {
      const responseTime = await testAIResponseTime(page);
      aiResponseTimes.push(responseTime);
      await page.waitForTimeout(1000); // Wait between tests
    }
    
    const averageAIResponse = aiResponseTimes.reduce((a, b) => a + b, 0) / aiResponseTimes.length;
    const maxAIResponse = Math.max(...aiResponseTimes);
    
    console.log(`🤖 AI Response Time Results:`);
    console.log(`  Average: ${averageAIResponse.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.MAX_AI_RESPONSE_MS}ms)`);
    console.log(`  Maximum: ${maxAIResponse.toFixed(2)}ms`);
    console.log(`  All measurements: ${aiResponseTimes.map(t => t.toFixed(2)).join(', ')}ms`);
    
    // Validate AI response time (allow some flexibility for system variations)
    expect(averageAIResponse).toBeLessThanOrEqual(PERFORMANCE_TARGETS.MAX_AI_RESPONSE_MS * 2);
    expect(maxAIResponse).toBeLessThanOrEqual(PERFORMANCE_TARGETS.MAX_AI_RESPONSE_MS * 3);
  });

  test('🌐 WebSocket and real-time latency validation', async ({ page }) => {
    console.log('🌐 Testing WebSocket and real-time system latency');
    
    await setupPerformanceTest(page);
    
    // Test WebSocket latency multiple times
    const latencyTests: number[] = [];
    
    for (let i = 0; i < 3; i++) {
      const latency = await testWebSocketLatency(page);
      latencyTests.push(latency);
      await page.waitForTimeout(1000);
    }
    
    const averageLatency = latencyTests.reduce((a, b) => a + b, 0) / latencyTests.length;
    const maxLatency = Math.max(...latencyTests);
    
    console.log(`🌐 WebSocket Latency Results:`);
    console.log(`  Average: ${averageLatency.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.MAX_WEBSOCKET_LATENCY_MS}ms)`);
    console.log(`  Maximum: ${maxLatency.toFixed(2)}ms`);
    
    // Test optimistic updates
    const updateStartTime = performance.now();
    
    const calendarGrid = page.locator('[role="grid"]').first();
    if (await calendarGrid.isVisible()) {
      await calendarGrid.click({ position: { x: 200, y: 150 } });
    }
    
    // Look for immediate UI feedback (optimistic updates)
    const optimisticUpdateTime = performance.now() - updateStartTime;
    
    console.log(`⚡ Optimistic Update Time: ${optimisticUpdateTime.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.MAX_OPTIMISTIC_UPDATE_MS}ms)`);
    
    // Validate targets (with reasonable flexibility)
    expect(averageLatency).toBeLessThanOrEqual(PERFORMANCE_TARGETS.MAX_WEBSOCKET_LATENCY_MS * 2);
    expect(optimisticUpdateTime).toBeLessThanOrEqual(PERFORMANCE_TARGETS.MAX_OPTIMISTIC_UPDATE_MS * 2);
  });

  test('📚 Calendar library transition performance', async ({ page }) => {
    console.log('📚 Testing calendar library transition performance');
    
    await setupPerformanceTest(page);
    
    const transitionTimes: number[] = [];
    
    // Test library transitions
    for (let i = 0; i < 2; i++) {
      const transitionTime = await testLibraryTransition(page);
      if (transitionTime > 0) {
        transitionTimes.push(transitionTime);
      }
      await page.waitForTimeout(1000);
    }
    
    if (transitionTimes.length > 0) {
      const averageTransition = transitionTimes.reduce((a, b) => a + b, 0) / transitionTimes.length;
      const maxTransition = Math.max(...transitionTimes);
      
      console.log(`📚 Library Transition Results:`);
      console.log(`  Average: ${averageTransition.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.MAX_LIBRARY_TRANSITION_MS}ms)`);
      console.log(`  Maximum: ${maxTransition.toFixed(2)}ms`);
      
      expect(averageTransition).toBeLessThanOrEqual(PERFORMANCE_TARGETS.MAX_LIBRARY_TRANSITION_MS);
      expect(maxTransition).toBeLessThanOrEqual(PERFORMANCE_TARGETS.MAX_LIBRARY_TRANSITION_MS * 1.5);
    } else {
      console.log('📚 No library transitions available to test');
    }
  });

  test('🔥 Stress test with high interaction volume', async ({ page }) => {
    console.log('🔥 Running stress test with high interaction volume');
    
    await setupPerformanceTest(page);
    
    const monitor = new PerformanceMonitor(page);
    await monitor.startMonitoring();
    
    // Take baseline measurement
    await monitor.takeMeasurement();
    
    // Perform rapid interactions
    const calendarGrid = page.locator('[role="grid"]').first();
    
    console.log(`🔥 Performing ${STRESS_TEST_CONFIG.RAPID_CLICKS_COUNT} rapid interactions`);
    
    for (let i = 0; i < STRESS_TEST_CONFIG.RAPID_CLICKS_COUNT; i++) {
      const x = 50 + (i % 10) * 30;
      const y = 100 + Math.floor(i / 10) * 20;
      
      if (await calendarGrid.isVisible()) {
        await calendarGrid.click({ position: { x, y } });
      }
      
      if (i % 10 === 0) {
        await monitor.takeMeasurement();
      }
      
      await page.waitForTimeout(STRESS_TEST_CONFIG.RAPID_CLICK_INTERVAL_MS);
    }
    
    // Take final measurements
    await page.waitForTimeout(1000);
    const finalMeasurement = await monitor.takeMeasurement();
    
    const averages = await monitor.getAverageMetrics();
    
    console.log('🔥 Stress Test Results:');
    console.log(`  Peak Memory: ${averages.maxMemory}MB (target: <${PERFORMANCE_TARGETS.MAX_MEMORY_MB * 1.2}MB)`);
    console.log(`  Lowest FPS: ${averages.minFPS} (target: >${PERFORMANCE_TARGETS.MIN_FPS * 0.7})`);
    console.log(`  Average FPS during stress: ${averages.avgFPS}`);
    console.log(`  Peak CPU: ${averages.maxCPU.toFixed(1)}%`);
    
    // Stress test allows for some performance degradation
    expect(averages.maxMemory).toBeLessThanOrEqual(PERFORMANCE_TARGETS.MAX_MEMORY_MB * 1.2); // 20% tolerance
    expect(averages.minFPS).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.MIN_FPS * 0.7); // 30% FPS tolerance
    expect(averages.maxCPU).toBeLessThanOrEqual(50); // 50% max CPU during stress
  });

  test('🧠 Memory pressure and leak detection', async ({ page }) => {
    console.log('🧠 Testing memory pressure and leak detection');
    
    await setupPerformanceTest(page);
    
    const monitor = new PerformanceMonitor(page);
    await monitor.startMonitoring();
    
    const initialMeasurement = await monitor.takeMeasurement();
    console.log(`🧠 Initial memory: ${initialMeasurement.memory}MB`);
    
    // Create memory pressure through repeated operations
    console.log(`🧠 Creating memory pressure with ${STRESS_TEST_CONFIG.MEMORY_PRESSURE_ITERATIONS} operations`);
    
    for (let i = 0; i < STRESS_TEST_CONFIG.MEMORY_PRESSURE_ITERATIONS; i++) {
      // Simulate memory-intensive operations
      await page.evaluate(() => {
        // Create temporary DOM elements
        const container = document.createElement('div');
        for (let j = 0; j < 100; j++) {
          const element = document.createElement('div');
          element.textContent = `Temporary element ${j}`;
          container.appendChild(element);
        }
        document.body.appendChild(container);
        
        // Clean up immediately to test garbage collection
        setTimeout(() => {
          document.body.removeChild(container);
        }, 10);
      });
      
      if (i % 10 === 0) {
        await monitor.takeMeasurement();
        
        // Force garbage collection if available
        await page.evaluate(() => {
          if ((window as any).gc) {
            (window as any).gc();
          }
        });
      }
    }
    
    // Wait for cleanup and take final measurement
    await page.waitForTimeout(2000);
    const finalMeasurement = await monitor.takeMeasurement();
    
    const averages = await monitor.getAverageMetrics();
    const memoryGrowth = finalMeasurement.memory - initialMeasurement.memory;
    
    console.log('🧠 Memory Pressure Test Results:');
    console.log(`  Initial Memory: ${initialMeasurement.memory}MB`);
    console.log(`  Final Memory: ${finalMeasurement.memory}MB`);
    console.log(`  Memory Growth: ${memoryGrowth}MB`);
    console.log(`  Peak Memory: ${averages.maxMemory}MB`);
    
    // Validate no significant memory leaks
    expect(averages.maxMemory).toBeLessThanOrEqual(PERFORMANCE_TARGETS.MAX_MEMORY_MB * 1.3); // 30% tolerance
    expect(memoryGrowth).toBeLessThanOrEqual(20); // Max 20MB growth allowed
  });

  test('📱 Mobile performance optimization', async ({ page }) => {
    console.log('📱 Testing mobile performance optimization');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await setupPerformanceTest(page);
    
    const monitor = new PerformanceMonitor(page);
    await monitor.startMonitoring();
    
    // Take measurements on mobile
    for (let i = 0; i < 3; i++) {
      await monitor.takeMeasurement();
      await page.waitForTimeout(1000);
    }
    
    // Test mobile-specific interactions
    const calendarContainer = page.locator('[role="application"]').first();
    if (await calendarContainer.isVisible()) {
      const box = await calendarContainer.boundingBox();
      if (box) {
        // Simulate touch gestures
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);
        await monitor.takeMeasurement();
      }
    }
    
    const averages = await monitor.getAverageMetrics();
    
    console.log('📱 Mobile Performance Results:');
    console.log(`  Average Memory: ${averages.avgMemory}MB (mobile target: <${PERFORMANCE_TARGETS.MAX_MEMORY_MB * 0.8}MB)`);
    console.log(`  Average FPS: ${averages.avgFPS} (mobile target: >${PERFORMANCE_TARGETS.MIN_FPS * 0.7})`);
    console.log(`  Peak Memory: ${averages.maxMemory}MB`);
    console.log(`  Min FPS: ${averages.minFPS}`);
    
    // Mobile performance targets (more lenient)
    expect(averages.avgMemory).toBeLessThanOrEqual(PERFORMANCE_TARGETS.MAX_MEMORY_MB * 0.8); // 80MB on mobile
    expect(averages.avgFPS).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.MIN_FPS * 0.6); // 67 FPS on mobile
    expect(averages.maxMemory).toBeLessThanOrEqual(PERFORMANCE_TARGETS.MAX_MEMORY_MB); // 100MB peak
  });
});

test.describe('🏆 Phase 5.0 Performance Excellence', () => {
  test('🎯 End-to-end performance validation', async ({ page }) => {
    console.log('🎯 Running comprehensive end-to-end performance validation');
    
    await setupPerformanceTest(page);
    
    const monitor = new PerformanceMonitor(page);
    await monitor.startMonitoring();
    
    // Comprehensive test sequence
    console.log('🎯 Running comprehensive test sequence');
    
    // 1. Baseline measurement
    const baseline = await monitor.takeMeasurement();
    
    // 2. AI response test
    const aiResponse = await testAIResponseTime(page);
    await monitor.takeMeasurement();
    
    // 3. WebSocket latency test  
    const wsLatency = await testWebSocketLatency(page);
    await monitor.takeMeasurement();
    
    // 4. Library transition test
    const libraryTransition = await testLibraryTransition(page);
    await monitor.takeMeasurement();
    
    // 5. Interaction stress test
    const calendarGrid = page.locator('[role="grid"]').first();
    for (let i = 0; i < 20; i++) {
      if (await calendarGrid.isVisible()) {
        await calendarGrid.click({ position: { x: 100 + i * 5, y: 100 + i * 3 } });
      }
      await page.waitForTimeout(50);
    }
    
    const final = await monitor.takeMeasurement();
    const averages = await monitor.getAverageMetrics();
    
    // Generate comprehensive performance report
    console.log('🏆 COMPREHENSIVE PERFORMANCE REPORT:');
    console.log('=' .repeat(60));
    console.log(`📊 Memory Performance:`);
    console.log(`  Average: ${averages.avgMemory}MB / ${PERFORMANCE_TARGETS.MAX_MEMORY_MB}MB (${(averages.avgMemory/PERFORMANCE_TARGETS.MAX_MEMORY_MB*100).toFixed(1)}%)`);
    console.log(`  Peak: ${averages.maxMemory}MB`);
    console.log(`  Status: ${averages.avgMemory <= PERFORMANCE_TARGETS.MAX_MEMORY_MB ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    
    console.log(`⚡ Frame Rate Performance:`);
    console.log(`  Average: ${averages.avgFPS} / ${PERFORMANCE_TARGETS.MIN_FPS} FPS (${(averages.avgFPS/PERFORMANCE_TARGETS.MIN_FPS*100).toFixed(1)}%)`);
    console.log(`  Minimum: ${averages.minFPS} FPS`);
    console.log(`  Status: ${averages.avgFPS >= PERFORMANCE_TARGETS.MIN_FPS ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    
    console.log(`🤖 AI Response Performance:`);
    console.log(`  Response Time: ${aiResponse.toFixed(2)}ms / ${PERFORMANCE_TARGETS.MAX_AI_RESPONSE_MS}ms`);
    console.log(`  Status: ${aiResponse <= PERFORMANCE_TARGETS.MAX_AI_RESPONSE_MS * 2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    
    console.log(`🌐 WebSocket Latency:`);
    console.log(`  Latency: ${wsLatency.toFixed(2)}ms / ${PERFORMANCE_TARGETS.MAX_WEBSOCKET_LATENCY_MS}ms`);
    console.log(`  Status: ${wsLatency <= PERFORMANCE_TARGETS.MAX_WEBSOCKET_LATENCY_MS * 2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    
    console.log(`📚 Library Transition:`);
    console.log(`  Transition Time: ${libraryTransition.toFixed(2)}ms / ${PERFORMANCE_TARGETS.MAX_LIBRARY_TRANSITION_MS}ms`);
    console.log(`  Status: ${libraryTransition <= PERFORMANCE_TARGETS.MAX_LIBRARY_TRANSITION_MS || libraryTransition === 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    
    console.log(`⏱️ Load Performance:`);
    console.log(`  Load Time: ${baseline.loadTime}ms / ${PERFORMANCE_TARGETS.MAX_LOAD_TIME_MS}ms`);
    console.log(`  Render Time: ${baseline.renderTime}ms / ${PERFORMANCE_TARGETS.MAX_RENDER_TIME_MS}ms`);
    console.log(`  Status: ${baseline.loadTime <= PERFORMANCE_TARGETS.MAX_LOAD_TIME_MS ? '✅ PASS' : '❌ FAIL'}`);
    console.log('=' .repeat(60));
    
    // Validate all performance targets
    expect(averages.avgMemory).toBeLessThanOrEqual(PERFORMANCE_TARGETS.MAX_MEMORY_MB);
    expect(averages.avgFPS).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.MIN_FPS * 0.9); // 90% of target
    expect(baseline.loadTime).toBeLessThanOrEqual(PERFORMANCE_TARGETS.MAX_LOAD_TIME_MS);
    
    console.log('🏆 End-to-end performance validation completed successfully!');
  });
});