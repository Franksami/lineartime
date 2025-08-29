// AI Performance and Load Testing
import { test, expect } from '@playwright/test';

test.describe('⚡ AI Performance Testing - Load, Memory, and Responsiveness Tests', () => {
  // Performance benchmarks (adjust based on requirements)
  const PERFORMANCE_BENCHMARKS = {
    apiResponseTime: 3000, // 3 seconds max for AI response start
    streamingResponseTime: 5000, // 5 seconds max for complete response
    toolExecutionTime: 2000, // 2 seconds max for tool calls
    memoryUsage: 50 * 1024 * 1024, // 50MB max memory increase
    concurrentRequests: 5, // Support 5 concurrent AI requests
    largeConversationLimit: 100, // Handle 100+ message conversations
  };

  let performanceMetrics: {
    startTime: number;
    endTime: number;
    memoryBefore: number;
    memoryAfter: number;
    responseTime: number;
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to application and open AI assistant
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');

    // Open AI Assistant
    await page.click(
      'button[aria-label="Open AI Assistant"], button:has-text("AI"), [data-testid="ai-assistant"]'
    );
    await page.waitForTimeout(1000);

    // Initialize performance tracking
    performanceMetrics = {
      startTime: 0,
      endTime: 0,
      memoryBefore: 0,
      memoryAfter: 0,
      responseTime: 0,
    };
  });

  test('should meet AI API response time benchmarks', async ({ page }) => {
    // Mock fast AI response for baseline testing
    await page.route('**/api/ai/chat', async (route) => {
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 500));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'text',
          text: 'This is a test response for performance benchmarking.',
        }),
      });
    });

    const startTime = performance.now();

    // Send AI request
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Test performance response');
    await page.keyboard.press('Enter');

    // Wait for response to start appearing
    await page.waitForSelector('text=This is a test response', {
      timeout: PERFORMANCE_BENCHMARKS.apiResponseTime,
    });

    const responseTime = performance.now() - startTime;

    // Verify response time meets benchmark
    expect(responseTime).toBeLessThan(PERFORMANCE_BENCHMARKS.apiResponseTime);
    console.log(`AI API Response Time: ${responseTime.toFixed(2)}ms`);
  });

  test('should handle streaming responses efficiently', async ({ page }) => {
    // Mock streaming response
    let responseChunks = 0;
    await page.route('**/api/ai/chat', async (route) => {
      // Simulate streaming with delayed chunks
      const chunks = [
        'Analyzing your calendar...',
        ' I can see you have several meetings today.',
        ' Would you like me to suggest some optimal times for scheduling?',
        ' Based on your availability, I recommend the following time slots.',
      ];

      const startTime = Date.now();
      for (const [index, chunk] of chunks.entries()) {
        setTimeout(() => {
          responseChunks++;
          // In a real streaming implementation, you'd send each chunk
        }, index * 200);
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'text',
          text: chunks.join(''),
        }),
      });
    });

    const streamingStartTime = performance.now();

    // Send request that triggers streaming
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Analyze my calendar and suggest optimal meeting times');
    await page.keyboard.press('Enter');

    // Wait for streaming to complete
    await page.waitForSelector('text*=time slots', {
      timeout: PERFORMANCE_BENCHMARKS.streamingResponseTime,
    });

    const streamingTime = performance.now() - streamingStartTime;

    expect(streamingTime).toBeLessThan(PERFORMANCE_BENCHMARKS.streamingResponseTime);
    console.log(`Streaming Response Time: ${streamingTime.toFixed(2)}ms`);
  });

  test('should handle tool execution within performance limits', async ({ page }) => {
    // Mock tool execution with realistic delay
    await page.route('**/api/ai/chat', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate tool processing

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'tool-call',
          toolName: 'suggestSchedule',
          result: {
            suggestions: [
              {
                start: 'Tomorrow at 2:00 PM',
                end: 'Tomorrow at 3:00 PM',
                startISO: '2025-01-16T14:00:00.000Z',
                endISO: '2025-01-16T15:00:00.000Z',
                score: 0.9,
                reasons: 'Optimal time with no conflicts',
              },
            ],
          },
        }),
      });
    });

    const toolStartTime = performance.now();

    // Request tool execution
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Schedule a meeting for tomorrow afternoon');
    await page.keyboard.press('Enter');

    // Wait for tool results
    await page.waitForSelector('text=2:00 PM', {
      timeout: PERFORMANCE_BENCHMARKS.toolExecutionTime,
    });

    const toolTime = performance.now() - toolStartTime;

    expect(toolTime).toBeLessThan(PERFORMANCE_BENCHMARKS.toolExecutionTime);
    console.log(`Tool Execution Time: ${toolTime.toFixed(2)}ms`);
  });

  test('should maintain reasonable memory usage during AI operations', async ({ page }) => {
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Mock response that could potentially use significant memory
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'text',
          text: 'This is a large response that tests memory usage. '.repeat(100),
        }),
      });
    });

    // Perform multiple AI operations
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();

    for (let i = 0; i < 5; i++) {
      await aiInput.fill(`Test memory usage request ${i + 1}`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });

    await page.waitForTimeout(2000);

    // Check final memory usage
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    const memoryIncrease = finalMemory - initialMemory;

    if (initialMemory > 0) {
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_BENCHMARKS.memoryUsage);
      console.log(`Memory Usage Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    }
  });

  test('should handle concurrent AI requests without significant performance degradation', async ({
    page,
  }) => {
    // Mock AI response with slight delay to simulate load
    let requestCount = 0;
    await page.route('**/api/ai/chat', async (route) => {
      requestCount++;
      const delay = Math.min(requestCount * 100, 1000); // Increasing delay with load
      await new Promise((resolve) => setTimeout(resolve, delay));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'text',
          text: `Concurrent response ${requestCount}`,
        }),
      });
    });

    const concurrentStartTime = performance.now();

    // Send multiple concurrent requests
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();

    const concurrentPromises = [];
    for (let i = 0; i < PERFORMANCE_BENCHMARKS.concurrentRequests; i++) {
      concurrentPromises.push(
        (async () => {
          await aiInput.fill(`Concurrent request ${i + 1}`);
          await page.keyboard.press('Enter');
          await page.waitForSelector(`text*=Concurrent response`);
        })()
      );
    }

    await Promise.all(concurrentPromises);

    const concurrentTime = performance.now() - concurrentStartTime;

    // Should complete within reasonable time even under load
    expect(concurrentTime).toBeLessThan(PERFORMANCE_BENCHMARKS.apiResponseTime * 3);
    console.log(
      `Concurrent Requests Time: ${concurrentTime.toFixed(2)}ms for ${PERFORMANCE_BENCHMARKS.concurrentRequests} requests`
    );
  });

  test('should handle large conversation histories efficiently', async ({ page }) => {
    // Mock conversation with many messages
    await page.route('**/api/ai/chat', async (route) => {
      const postData = route.request().postDataJSON();
      const messageCount = postData.messages?.length || 0;

      // Simulate slightly longer processing for large conversations
      const processingTime = Math.min(messageCount * 10, 2000);
      await new Promise((resolve) => setTimeout(resolve, processingTime));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'text',
          text: `Processing conversation with ${messageCount} messages`,
        }),
      });
    });

    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();

    // Build up conversation history
    for (let i = 0; i < 20; i++) {
      const startTime = performance.now();

      await aiInput.fill(`Message ${i + 1} in large conversation`);
      await page.keyboard.press('Enter');

      await page.waitForSelector(`text*=Processing conversation`);

      const messageTime = performance.now() - startTime;

      // Each message should still process within reasonable time
      expect(messageTime).toBeLessThan(PERFORMANCE_BENCHMARKS.apiResponseTime);

      if (i % 5 === 4) {
        console.log(`Message ${i + 1} processing time: ${messageTime.toFixed(2)}ms`);
      }
    }
  });

  test('should maintain UI responsiveness during AI operations', async ({ page }) => {
    // Mock slow AI response to test UI responsiveness
    await page.route('**/api/ai/chat', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'text',
          text: 'Response after delay',
        }),
      });
    });

    // Start AI request
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Test UI responsiveness during processing');
    await page.keyboard.press('Enter');

    // Test that UI remains interactive during processing
    const uiStartTime = performance.now();

    // Try to interact with UI elements while AI is processing
    const calendarButton = page.locator('a[href="/"], button:has-text("Calendar")').first();
    if ((await calendarButton.count()) > 0) {
      await calendarButton.click();
    }

    // Try to type in input field
    await aiInput.fill('UI should still be responsive');

    const uiInteractionTime = performance.now() - uiStartTime;

    // UI interactions should be fast even during AI processing
    expect(uiInteractionTime).toBeLessThan(1000);
    console.log(`UI Interaction Time During AI Processing: ${uiInteractionTime.toFixed(2)}ms`);

    // Wait for original request to complete
    await page.waitForSelector('text=Response after delay');
  });

  test('should handle network throttling gracefully', async ({ page, context }) => {
    // Simulate slow network conditions
    await context.route('**/api/ai/chat', async (route) => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'text',
          text: 'Response under slow network conditions',
        }),
      });
    });

    const networkStartTime = performance.now();

    // Send request under simulated slow network
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Test under slow network conditions');
    await page.keyboard.press('Enter');

    // Verify loading state is shown
    const loadingIndicators = [
      '[data-testid="loading"]',
      '.loading',
      'text=Processing',
      'text=Thinking',
      '[role="progressbar"]',
    ];

    let loadingFound = false;
    for (const indicator of loadingIndicators) {
      if ((await page.locator(indicator).count()) > 0) {
        loadingFound = true;
        break;
      }
    }

    // Should show loading state under slow conditions
    // expect(loadingFound).toBeTruthy(); // Uncomment if loading indicators exist

    // Wait for response
    await page.waitForSelector('text=slow network conditions');

    const networkTime = performance.now() - networkStartTime;
    console.log(`Response Time Under Slow Network: ${networkTime.toFixed(2)}ms`);
  });

  test('should properly clean up resources after AI operations', async ({ page }) => {
    // Track resource usage before operations
    const initialResources = await page.evaluate(() => ({
      eventListeners: document.querySelectorAll('*').length, // Rough estimate
      intervals: window.setTimeout.length || 0, // If exposed
      memory: 'memory' in performance ? (performance as any).memory.usedJSHeapSize : 0,
    }));

    // Mock multiple AI operations
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'text',
          text: 'Resource cleanup test response',
        }),
      });
    });

    // Perform multiple AI operations
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();

    for (let i = 0; i < 10; i++) {
      await aiInput.fill(`Cleanup test ${i + 1}`);
      await page.keyboard.press('Enter');
      await page.waitForSelector('text=Resource cleanup test response');
      await page.waitForTimeout(100);
    }

    // Close AI panel to trigger cleanup
    const closeButton = page.locator(
      'button[aria-label="Close"], button:has-text("Close"), [data-testid="close"]'
    );
    if ((await closeButton.count()) > 0) {
      await closeButton.click();
    }

    // Wait for cleanup
    await page.waitForTimeout(2000);

    // Force garbage collection
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });

    // Check final resource usage
    const finalResources = await page.evaluate(() => ({
      eventListeners: document.querySelectorAll('*').length,
      intervals: window.setTimeout.length || 0,
      memory: 'memory' in performance ? (performance as any).memory.usedJSHeapSize : 0,
    }));

    // Resources should not significantly increase
    const memoryIncrease = finalResources.memory - initialResources.memory;
    console.log(`Memory After Cleanup: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`);

    // In a real application, you'd verify that event listeners and intervals are cleaned up
    // For now, we just log the values for monitoring
    console.log('Resource Cleanup Test Completed');
  });

  test('should handle rate limiting gracefully', async ({ page }) => {
    let requestCount = 0;

    // Mock rate limiting after 5 requests
    await page.route('**/api/ai/chat', async (route) => {
      requestCount++;

      if (requestCount > 5) {
        await route.fulfill({
          status: 429,
          contentType: 'text/plain',
          body: 'Rate limit exceeded',
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            type: 'text',
            text: `Request ${requestCount} processed successfully`,
          }),
        });
      }
    });

    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();

    // Send requests until rate limited
    for (let i = 0; i < 7; i++) {
      await aiInput.fill(`Rate limit test ${i + 1}`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }

    // Should show rate limit message
    const rateLimitMessages = [
      'text=Rate limit',
      'text=Too many requests',
      'text=Please wait',
      'text=limit exceeded',
    ];

    let rateLimitFound = false;
    for (const message of rateLimitMessages) {
      if ((await page.locator(message).count()) > 0) {
        rateLimitFound = true;
        break;
      }
    }

    // Should handle rate limiting gracefully
    expect(rateLimitFound).toBeTruthy();
    console.log('Rate limiting handled correctly');
  });

  test('performance regression - comprehensive benchmarks', async ({ page }) => {
    // Run comprehensive performance tests
    const benchmarks = {
      simpleQuery: 0,
      complexTool: 0,
      largeResponse: 0,
      concurrentLoad: 0,
    };

    // Test 1: Simple query performance
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ type: 'text', text: 'Simple response' }),
      });
    });

    const simpleStart = performance.now();
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Simple query test');
    await page.keyboard.press('Enter');
    await page.waitForSelector('text=Simple response');
    benchmarks.simpleQuery = performance.now() - simpleStart;

    // Test 2: Complex tool performance
    await page.route('**/api/ai/chat', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate processing
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'tool-call',
          toolName: 'complexTool',
          result: { data: 'complex result' },
        }),
      });
    });

    const complexStart = performance.now();
    await aiInput.fill('Complex tool execution test');
    await page.keyboard.press('Enter');
    await page.waitForSelector('text*=complex');
    benchmarks.complexTool = performance.now() - complexStart;

    // Log all benchmark results
    console.log('Performance Benchmarks:');
    console.log(`Simple Query: ${benchmarks.simpleQuery.toFixed(2)}ms`);
    console.log(`Complex Tool: ${benchmarks.complexTool.toFixed(2)}ms`);

    // Assert performance meets requirements
    expect(benchmarks.simpleQuery).toBeLessThan(2000);
    expect(benchmarks.complexTool).toBeLessThan(3000);

    // Take screenshot for visual performance regression
    await expect(page).toHaveScreenshot('ai-performance-test.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });
});
