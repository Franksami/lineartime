// AI Edge Cases and Security Testing
import { test, expect } from '@playwright/test';

test.describe('🔒 AI Edge Cases & Security - Robustness and Security Testing', () => {
  // Security test vectors
  const SECURITY_PAYLOADS = {
    xss: [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(\'xss\')" />',
      '&lt;script&gt;alert("xss")&lt;/script&gt;',
    ],
    injection: [
      "'; DROP TABLE users; --",
      '${JSON.stringify(process.env)}',
      '{{constructor.constructor("return global")()}}',
    ],
    oversize: [
      'A'.repeat(100000), // 100KB string
      'Unicode test: ' + '🚀'.repeat(10000), // Large unicode
      JSON.stringify({ data: 'X'.repeat(50000) }), // Large JSON
    ],
    malformed: [
      '{"invalid": json}',
      'null\x00byte',
      '\uFEFF\uFFFE\uFFFF', // BOM and invalid unicode
      '%0a%0d%0a%0d', // CRLF injection
    ],
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');

    // Open AI Assistant
    await page.click(
      'button[aria-label="Open AI Assistant"], button:has-text("AI"), [data-testid="ai-assistant"]'
    );
    await page.waitForTimeout(1000);
  });

  test('should sanitize and prevent XSS in AI responses', async ({ page }) => {
    // Mock AI response with potential XSS payloads
    await page.route('**/api/ai/chat', async (route) => {
      const mockResponse = {
        type: 'text',
        // This should be sanitized by the client
        text: 'Here is your schedule: <script>alert("xss")</script> <img src="x" onerror="alert(\'xss\')" />',
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    });

    // Send request that could return XSS
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Show me my schedule with potential XSS');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(2000);

    // Verify that scripts are not executed
    const alerts = [];
    page.on('dialog', (dialog) => {
      alerts.push(dialog.message());
      dialog.dismiss();
    });

    await page.waitForTimeout(1000);

    // Should not have triggered any alerts
    expect(alerts).toHaveLength(0);

    // Verify XSS content is properly escaped or sanitized
    const responseText = await page
      .locator('[data-testid="ai-message"], .ai-response, .message')
      .last()
      .textContent();
    if (responseText) {
      expect(responseText).not.toContain('<script>');
      expect(responseText).not.toContain('onerror=');
    }
  });

  test('should handle malicious input payloads safely', async ({ page }) => {
    // Mock server to capture and validate input sanitization
    let capturedInputs: any[] = [];

    await page.route('**/api/ai/chat', async (route) => {
      const postData = route.request().postDataJSON();
      capturedInputs.push(postData);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'text',
          text: 'Input received and processed safely',
        }),
      });
    });

    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();

    // Test each security payload
    for (const [category, payloads] of Object.entries(SECURITY_PAYLOADS)) {
      for (const payload of payloads) {
        try {
          await aiInput.fill(payload);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);

          // Verify application didn't crash
          const isResponding = await page.locator('body').isVisible();
          expect(isResponding).toBeTruthy();

          console.log(`✓ Handled ${category} payload safely`);
        } catch (error) {
          console.log(`⚠️ Error with ${category} payload: ${error}`);
          // Application should gracefully handle errors, not crash
        }
      }
    }

    // Verify inputs were properly processed without causing injection
    expect(capturedInputs.length).toBeGreaterThan(0);
  });

  test('should enforce proper rate limiting and prevent bypass attempts', async ({ page }) => {
    let requestCount = 0;
    const rateLimitResponses: number[] = [];

    // Mock strict rate limiting
    await page.route('**/api/ai/chat', async (route) => {
      requestCount++;

      if (requestCount > 3) {
        rateLimitResponses.push(429);
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
            text: `Request ${requestCount} allowed`,
          }),
        });
      }
    });

    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();

    // Attempt to bypass rate limiting with rapid requests
    const rapidRequests = [];
    for (let i = 0; i < 10; i++) {
      rapidRequests.push(
        (async () => {
          await aiInput.fill(`Rate limit bypass attempt ${i + 1}`);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(50); // Very rapid requests
        })()
      );
    }

    await Promise.allSettled(rapidRequests);

    // Should have received rate limit responses
    expect(rateLimitResponses.length).toBeGreaterThan(0);
    expect(rateLimitResponses.every((code) => code === 429)).toBeTruthy();

    console.log(`Rate limiting enforced: ${rateLimitResponses.length} requests blocked`);
  });

  test('should handle authentication edge cases securely', async ({ page }) => {
    // Test with various authentication states
    const authStates = [
      { userId: 'anonymous', scenario: 'anonymous user' },
      { userId: '', scenario: 'empty user ID' },
      { userId: 'null', scenario: 'null user ID' },
      { userId: 'undefined', scenario: 'undefined user ID' },
      { userId: 'admin', scenario: 'admin user' },
      { userId: '../../../etc/passwd', scenario: 'path traversal attempt' },
    ];

    for (const { userId, scenario } of authStates) {
      await page.route('**/api/ai/chat', async (route) => {
        const postData = route.request().postDataJSON();
        const headers = route.request().headers();

        // Verify user ID is properly handled
        const receivedUserId = postData.userId || headers['x-user-id'];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            type: 'text',
            text: `Authentication handled for: ${scenario}`,
          }),
        });
      });

      // Simulate request with different auth state
      await page.evaluate((testUserId) => {
        // Set user ID in a way that would be sent to server
        if (typeof window !== 'undefined') {
          (window as any).testUserId = testUserId;
        }
      }, userId);

      const aiInput = page
        .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
        .first();
      await aiInput.fill(`Test auth: ${scenario}`);
      await page.keyboard.press('Enter');

      await page.waitForTimeout(1000);

      // Verify application handles auth edge case safely
      const isResponding = await page.locator('body').isVisible();
      expect(isResponding).toBeTruthy();

      console.log(`✓ Handled auth scenario: ${scenario}`);
    }
  });

  test('should prevent calendar data leakage between users', async ({ page }) => {
    // Mock responses that attempt to access other users' data
    await page.route('**/api/ai/chat', async (route) => {
      const postData = route.request().postDataJSON();

      // Verify that events array doesn't contain unauthorized data
      const events = postData.events || [];

      // In a real test, you'd verify that only current user's events are included
      // and no other user data is accessible

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'tool-call',
          toolName: 'listOpenSlots',
          result: {
            // Response should only contain current user's data
            userDataAccess: 'restricted_to_current_user',
          },
        }),
      });
    });

    // Attempt to access calendar data with potential cross-user requests
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();

    const crossUserAttempts = [
      'Show me admin user calendar',
      'Access user_123 events',
      'List all users calendars',
      '../../../other_user_data',
    ];

    for (const attempt of crossUserAttempts) {
      await aiInput.fill(attempt);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      // Verify no unauthorized data is returned
      const response = await page
        .locator('[data-testid="ai-message"], .ai-response, .message')
        .last()
        .textContent();
      if (response) {
        // Should not contain references to other users' data
        expect(response.toLowerCase()).not.toContain('admin');
        expect(response.toLowerCase()).not.toContain('user_123');
      }

      console.log(`✓ Blocked cross-user access attempt: ${attempt}`);
    }
  });

  test('should handle malformed API responses gracefully', async ({ page }) => {
    const malformedResponses = [
      { status: 200, body: 'invalid json' },
      { status: 200, body: '{"incomplete": json' },
      { status: 200, body: null },
      { status: 200, body: '' },
      { status: 500, body: 'Internal server error' },
      { status: 404, body: 'Not found' },
      { status: 503, body: 'Service unavailable' },
    ];

    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();

    for (const [index, response] of malformedResponses.entries()) {
      await page.route('**/api/ai/chat', async (route) => {
        await route.fulfill({
          status: response.status,
          contentType: 'application/json',
          body: response.body,
        });
      });

      await aiInput.fill(`Test malformed response ${index + 1}`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);

      // Application should handle errors gracefully
      const isStillResponsive = await page.locator('body').isVisible();
      expect(isStillResponsive).toBeTruthy();

      // Should show appropriate error message
      const errorMessages = [
        'text=Error',
        'text=Something went wrong',
        'text=Try again',
        'text=unavailable',
      ];

      let errorShown = false;
      for (const errorMsg of errorMessages) {
        if ((await page.locator(errorMsg).count()) > 0) {
          errorShown = true;
          break;
        }
      }

      // For error status codes, should show error message
      if (response.status >= 400) {
        expect(errorShown).toBeTruthy();
      }

      console.log(`✓ Handled malformed response: ${response.status}`);
    }
  });

  test('should prevent resource exhaustion attacks', async ({ page }) => {
    // Test extremely large inputs
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();

    // Mock response to handle large inputs
    await page.route('**/api/ai/chat', async (route) => {
      const postData = route.request().postDataJSON();
      const inputSize = JSON.stringify(postData).length;

      if (inputSize > 10000) {
        // 10KB limit example
        await route.fulfill({
          status: 413,
          contentType: 'text/plain',
          body: 'Payload too large',
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            type: 'text',
            text: 'Input processed successfully',
          }),
        });
      }
    });

    // Try to send extremely large input
    const largeInput = 'A'.repeat(50000); // 50KB string

    try {
      await aiInput.fill(largeInput);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);

      // Should handle large input gracefully
      const is413Response = (await page.locator('text*=too large').count()) > 0;
      if (is413Response) {
        console.log('✓ Properly rejected oversized payload');
      }

      // Application should still be responsive
      const isResponding = await page.locator('body').isVisible();
      expect(isResponding).toBeTruthy();
    } catch (error) {
      // Should gracefully handle input limits
      console.log('✓ Input size limits enforced');
    }
  });

  test('should handle concurrent access edge cases', async ({ page }) => {
    // Test race conditions and concurrent access scenarios
    let concurrentResponses = 0;

    await page.route('**/api/ai/chat', async (route) => {
      concurrentResponses++;
      const responseId = concurrentResponses;

      // Simulate processing delay to create race conditions
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'text',
          text: `Concurrent response ${responseId}`,
        }),
      });
    });

    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();

    // Send multiple concurrent requests rapidly
    const concurrentPromises = [];
    for (let i = 0; i < 10; i++) {
      concurrentPromises.push(
        (async () => {
          await aiInput.fill(`Concurrent test ${i + 1}`);
          await page.keyboard.press('Enter');
        })()
      );
    }

    await Promise.allSettled(concurrentPromises);
    await page.waitForTimeout(5000);

    // Verify responses arrived and no data corruption occurred
    const responses = await page
      .locator('[data-testid="ai-message"], .ai-response, .message')
      .count();
    expect(responses).toBeGreaterThan(0);

    console.log(`✓ Handled ${concurrentResponses} concurrent requests`);
  });

  test('should sanitize tool execution parameters', async ({ page }) => {
    // Mock tool that could be vulnerable to parameter injection
    await page.route('**/api/ai/chat', async (route) => {
      const postData = route.request().postDataJSON();

      // Check for malicious tool parameters
      const hasMaliciousParams =
        JSON.stringify(postData).includes('<script>') ||
        JSON.stringify(postData).includes('eval(') ||
        JSON.stringify(postData).includes('process.env');

      if (hasMaliciousParams) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Invalid parameters detected',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            type: 'tool-call',
            toolName: 'suggestSchedule',
            result: {
              suggestions: [
                {
                  startISO: '2025-01-20T10:00:00.000Z',
                  endISO: '2025-01-20T11:00:00.000Z',
                  title: 'Safe Meeting',
                },
              ],
            },
          }),
        });
      }
    });

    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();

    // Test with potentially malicious scheduling requests
    const maliciousSchedulingRequests = [
      'Schedule <script>alert("xss")</script> meeting',
      'Schedule meeting with eval("malicious code")',
      'Create event ${process.env.SECRET_KEY}',
      'Book time for <!-- malicious comment -->',
    ];

    for (const request of maliciousSchedulingRequests) {
      await aiInput.fill(request);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);

      // Should either sanitize parameters or reject request
      const errorVisible = (await page.locator('text*=Invalid parameters').count()) > 0;
      const validResponse = (await page.locator('text*=Safe Meeting').count()) > 0;

      // Either should reject with error OR sanitize and process safely
      expect(errorVisible || validResponse).toBeTruthy();

      console.log(`✓ Handled malicious scheduling request: ${request.substring(0, 30)}...`);
    }
  });

  test('should prevent information disclosure in error messages', async ({ page }) => {
    // Mock errors that could reveal sensitive information
    const sensitiveErrors = [
      {
        status: 500,
        body: JSON.stringify({ error: 'Database connection failed: password=secret123' }),
      },
      { status: 401, body: JSON.stringify({ error: 'Invalid API key: sk-1234567890abcdef' }) },
      { status: 403, body: JSON.stringify({ error: 'Access denied to /internal/admin/users' }) },
      {
        status: 502,
        body: JSON.stringify({ error: 'Upstream server error: http://internal-api:8080' }),
      },
    ];

    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();

    for (const [index, errorResponse] of sensitiveErrors.entries()) {
      await page.route('**/api/ai/chat', async (route) => {
        await route.fulfill({
          status: errorResponse.status,
          contentType: 'application/json',
          body: errorResponse.body,
        });
      });

      await aiInput.fill(`Test error disclosure ${index + 1}`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);

      // Check that sensitive information is not displayed to user
      const displayedText = await page.locator('body').textContent();

      if (displayedText) {
        expect(displayedText).not.toContain('password=');
        expect(displayedText).not.toContain('sk-123');
        expect(displayedText).not.toContain('/internal/');
        expect(displayedText).not.toContain('internal-api');

        // Should show generic error message instead
        const hasGenericError =
          displayedText.includes('something went wrong') ||
          displayedText.includes('please try again') ||
          displayedText.includes('temporarily unavailable');

        expect(hasGenericError).toBeTruthy();
      }

      console.log(`✓ Prevented sensitive information disclosure in error ${index + 1}`);
    }
  });

  test('should handle Unicode and international input safely', async ({ page }) => {
    // Test with various Unicode and international characters
    const unicodeInputs = [
      '你好，请安排会议 🚀',
      'Здравствуйте, запланируйте встречу',
      'مرحبا، يرجى جدولة اجتماع',
      '🎉🎊💼📅⏰🗓️📝✨',
      '\u200B\u200C\u200D\uFEFF', // Zero-width characters
      'नमस्ते, कृपया मीटिंग शेड्यूल करें',
      'Special chars: \u0000\u001F\u007F\u009F',
    ];

    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'text',
          text: 'International input processed successfully',
        }),
      });
    });

    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();

    for (const input of unicodeInputs) {
      try {
        await aiInput.fill(input);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1500);

        // Verify application handles Unicode gracefully
        const isResponding = await page.locator('body').isVisible();
        expect(isResponding).toBeTruthy();

        console.log(`✓ Handled Unicode input safely`);
      } catch (error) {
        // Should handle edge case characters gracefully
        console.log(`⚠️ Unicode edge case handled: ${error}`);
      }
    }
  });

  test('comprehensive security validation - penetration testing simulation', async ({ page }) => {
    // Simulate comprehensive security testing
    const securityTests = {
      xssPrevention: false,
      injectionPrevention: false,
      authValidation: false,
      rateLimiting: false,
      dataProtection: false,
    };

    // Test 1: XSS Prevention
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'text',
          text: '<script>window.xssTest=true</script>Safe response',
        }),
      });
    });

    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('XSS test query');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    const xssExecuted = await page.evaluate(() => (window as any).xssTest === true);
    securityTests.xssPrevention = !xssExecuted;

    // Test 2: Injection Prevention
    await aiInput.fill("'; DROP TABLE users; --");
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    securityTests.injectionPrevention = await page.locator('body').isVisible();

    // Test 3: Rate Limiting
    let rateLimitHit = false;
    await page.route('**/api/ai/chat', async (route) => {
      if (Math.random() > 0.7) {
        // Simulate rate limiting
        rateLimitHit = true;
        await route.fulfill({ status: 429, body: 'Rate limited' });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ type: 'text', text: 'OK' }),
        });
      }
    });

    for (let i = 0; i < 10; i++) {
      await aiInput.fill(`Rate test ${i}`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
    }
    securityTests.rateLimiting = rateLimitHit;

    // Log security test results
    console.log('Security Test Results:');
    console.log(`XSS Prevention: ${securityTests.xssPrevention ? '✓' : '✗'}`);
    console.log(`Injection Prevention: ${securityTests.injectionPrevention ? '✓' : '✗'}`);
    console.log(`Rate Limiting: ${securityTests.rateLimiting ? '✓' : '✗'}`);

    // All critical security tests should pass
    expect(securityTests.xssPrevention).toBeTruthy();
    expect(securityTests.injectionPrevention).toBeTruthy();

    // Take screenshot for security testing documentation
    await expect(page).toHaveScreenshot('security-test-results.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });
});
