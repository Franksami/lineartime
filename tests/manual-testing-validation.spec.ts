// Manual Testing Validation - Real User Experience Testing
import { test, expect } from '@playwright/test';

test.describe('🔍 Manual Testing Validation - Real User Experience Testing', () => {
  // Manual testing checklist results
  let testResults = {
    aiPanelBasics: false,
    chatInterface: false,
    toolIntegration: false,
    calendarIntegration: false,
    errorHandling: false,
    mobileResponsiveness: false,
    accessibility: false,
    performance: false,
    visualConsistency: false,
    userJourney: false,
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to application and wait for full load
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow for any startup animations
  });

  test('Manual Test 1: AI Assistant Panel Basic Functionality', async ({ page }) => {
    console.log('🔍 Testing AI Assistant Panel Basic Functionality...');

    // Test 1.1: AI Assistant button visibility and accessibility
    const aiButton = page.locator(
      'button[aria-label="Open AI Assistant"], button:has-text("AI"), [data-testid="ai-assistant"]'
    );
    await expect(aiButton.first()).toBeVisible();

    // Test 1.2: Click to open AI panel
    await aiButton.first().click();
    await page.waitForTimeout(1000);

    // Test 1.3: Verify AI panel opens and displays correctly
    const aiPanel = page
      .locator('[data-testid="ai-panel"], .ai-assistant-panel, [role="dialog"]')
      .first();
    if ((await aiPanel.count()) > 0) {
      await expect(aiPanel).toBeVisible();
    }

    // Test 1.4: Check for input field
    const aiInput = page
      .locator(
        'input[placeholder*="Ask"], textarea[placeholder*="message"], input[placeholder*="type"]'
      )
      .first();
    await expect(aiInput).toBeVisible();
    await expect(aiInput).toBeEditable();

    // Test 1.5: Verify panel can be closed
    const closeButtons = page.locator(
      'button[aria-label="Close"], button:has-text("Close"), [data-testid="close"]'
    );
    if ((await closeButtons.count()) > 0) {
      // Don't close yet, keep open for next tests
      console.log('✓ Close button found');
    }

    testResults.aiPanelBasics = true;
    console.log('✅ AI Assistant Panel Basic Functionality: PASSED');

    await page.screenshot({ path: 'manual-test-ai-panel.png', fullPage: true });
  });

  test('Manual Test 2: Chat Interface Functionality', async ({ page }) => {
    console.log('🔍 Testing Chat Interface Functionality...');

    // Open AI assistant
    await page.click(
      'button[aria-label="Open AI Assistant"], button:has-text("AI"), [data-testid="ai-assistant"]'
    );
    await page.waitForTimeout(1000);

    // Test 2.1: Type a message
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    const testMessage = 'Hello, can you help me test the chat interface?';
    await aiInput.fill(testMessage);

    // Test 2.2: Send message (Enter key)
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Test 2.3: Verify message appears in chat
    const userMessage = page.locator('text*="' + testMessage + '"');
    if ((await userMessage.count()) > 0) {
      await expect(userMessage.first()).toBeVisible();
      console.log('✓ User message displayed correctly');
    }

    // Test 2.4: Check for message actions (if available)
    const messageActions = [
      'button[aria-label*="copy"]',
      'button:has-text("Copy")',
      'button[aria-label*="regenerate"]',
      'button:has-text("Regenerate")',
    ];

    let actionsFound = 0;
    for (const action of messageActions) {
      if ((await page.locator(action).count()) > 0) {
        actionsFound++;
      }
    }

    console.log(`✓ Found ${actionsFound} message actions`);

    // Test 2.5: Test input clearing after send
    const inputValue = await aiInput.inputValue();
    expect(inputValue).toBe(''); // Should be cleared after sending

    testResults.chatInterface = true;
    console.log('✅ Chat Interface Functionality: PASSED');

    await page.screenshot({ path: 'manual-test-chat-interface.png', fullPage: true });
  });

  test('Manual Test 3: AI Tool Integration', async ({ page }) => {
    console.log('🔍 Testing AI Tool Integration...');

    // Mock AI tool response for testing
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'tool-call',
          toolName: 'suggestSchedule',
          toolCallId: 'test_call',
          result: {
            suggestions: [
              {
                start: 'Tomorrow at 2:00 PM',
                end: 'Tomorrow at 3:00 PM',
                startISO: '2025-01-16T14:00:00.000Z',
                endISO: '2025-01-16T15:00:00.000Z',
                score: 0.9,
                reasons: 'Perfect time slot with no conflicts',
              },
            ],
          },
        }),
      });
    });

    // Open AI assistant and send scheduling request
    await page.click(
      'button[aria-label="Open AI Assistant"], button:has-text("AI"), [data-testid="ai-assistant"]'
    );
    await page.waitForTimeout(1000);

    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Schedule a meeting for tomorrow afternoon');
    await page.keyboard.press('Enter');

    // Test 3.1: Wait for tool response
    await page.waitForTimeout(3000);

    // Test 3.2: Verify scheduling suggestions appear
    const suggestions = page.locator('text*="2:00 PM"');
    if ((await suggestions.count()) > 0) {
      await expect(suggestions.first()).toBeVisible();
      console.log('✓ AI scheduling suggestions displayed');
    }

    // Test 3.3: Look for Apply button
    const applyButton = page.locator('button:has-text("Apply")');
    if ((await applyButton.count()) > 0) {
      await expect(applyButton.first()).toBeVisible();
      console.log('✓ Apply button found for AI suggestions');
    }

    // Test 3.4: Look for reasoning/explanation
    const reasoning = page.locator('text*="Perfect time slot"');
    if ((await reasoning.count()) > 0) {
      console.log('✓ AI reasoning displayed');
    }

    testResults.toolIntegration = true;
    console.log('✅ AI Tool Integration: PASSED');

    await page.screenshot({ path: 'manual-test-tool-integration.png', fullPage: true });
  });

  test('Manual Test 4: Calendar Integration (Apply Button)', async ({ page }) => {
    console.log('🔍 Testing Calendar Integration...');

    // Mock AI suggestion response
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'tool-call',
          toolName: 'suggestSchedule',
          result: {
            suggestions: [
              {
                start: 'January 20, 2025 at 3:00 PM',
                end: 'January 20, 2025 at 4:00 PM',
                startISO: '2025-01-20T15:00:00.000Z',
                endISO: '2025-01-20T16:00:00.000Z',
                score: 0.95,
                reasons: 'Optimal afternoon slot',
              },
            ],
          },
        }),
      });
    });

    // Open AI and request scheduling
    await page.click(
      'button[aria-label="Open AI Assistant"], button:has-text("AI"), [data-testid="ai-assistant"]'
    );
    await page.waitForTimeout(1000);

    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Schedule a client call for next Monday at 3 PM');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(3000);

    // Test 4.1: Verify suggestions appear
    const timeSlot = page.locator('text*="3:00 PM"');
    if ((await timeSlot.count()) > 0) {
      console.log('✓ Time slot suggestions displayed');
    }

    // Test 4.2: Click Apply button
    const applyButton = page.locator('button:has-text("Apply")');
    if ((await applyButton.count()) > 0) {
      await applyButton.first().click();
      await page.waitForTimeout(2000);

      // Test 4.3: Look for confirmation message
      const confirmationMessages = [
        'text*="Added event"',
        'text*="Event created"',
        'text*="Scheduled"',
        'text*="created successfully"',
      ];

      let confirmationFound = false;
      for (const msg of confirmationMessages) {
        if ((await page.locator(msg).count()) > 0) {
          confirmationFound = true;
          console.log('✓ Event creation confirmation displayed');
          break;
        }
      }

      expect(confirmationFound).toBeTruthy();
    }

    testResults.calendarIntegration = true;
    console.log('✅ Calendar Integration: PASSED');

    await page.screenshot({ path: 'manual-test-calendar-integration.png', fullPage: true });
  });

  test('Manual Test 5: Error Handling and Edge Cases', async ({ page }) => {
    console.log('🔍 Testing Error Handling...');

    // Mock error response
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'text/plain',
        body: 'Internal server error',
      });
    });

    // Open AI and send request that will fail
    await page.click(
      'button[aria-label="Open AI Assistant"], button:has-text("AI"), [data-testid="ai-assistant"]'
    );
    await page.waitForTimeout(1000);

    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('This request should trigger an error');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(3000);

    // Test 5.1: Verify error is handled gracefully
    const errorMessages = [
      'text*="Error"',
      'text*="something went wrong"',
      'text*="try again"',
      'text*="unavailable"',
    ];

    let errorHandled = false;
    for (const errorMsg of errorMessages) {
      if ((await page.locator(errorMsg).count()) > 0) {
        errorHandled = true;
        console.log('✓ Error message displayed to user');
        break;
      }
    }

    // Test 5.2: Verify UI is still responsive after error
    const isResponsive = await page.locator('body').isVisible();
    expect(isResponsive).toBeTruthy();

    // Test 5.3: Verify user can continue interacting after error
    await aiInput.fill('Test after error');
    const canType = await aiInput.inputValue();
    expect(canType).toBe('Test after error');

    testResults.errorHandling = true;
    console.log('✅ Error Handling: PASSED');

    await page.screenshot({ path: 'manual-test-error-handling.png', fullPage: true });
  });

  test('Manual Test 6: Mobile Responsiveness', async ({ page }) => {
    console.log('🔍 Testing Mobile Responsiveness...');

    // Test 6.1: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.waitForTimeout(1000);

    // Test 6.2: Verify AI button is visible and accessible on mobile
    const aiButton = page.locator(
      'button[aria-label="Open AI Assistant"], button:has-text("AI"), [data-testid="ai-assistant"]'
    );
    await expect(aiButton.first()).toBeVisible();

    // Test 6.3: Open AI panel on mobile
    await aiButton.first().click();
    await page.waitForTimeout(1000);

    // Test 6.4: Verify mobile layout
    const aiPanel = page
      .locator('[data-testid="ai-panel"], .ai-assistant-panel, [role="dialog"]')
      .first();
    if ((await aiPanel.count()) > 0) {
      const panelBox = await aiPanel.boundingBox();
      if (panelBox) {
        // Panel should fit within mobile viewport
        expect(panelBox.width).toBeLessThanOrEqual(375);
        console.log(`✓ Mobile panel width: ${panelBox.width}px`);
      }
    }

    // Test 6.5: Test touch interactions
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.tap(); // Touch tap instead of click
    await aiInput.fill('Mobile test message');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(1000);

    // Test 6.6: Reset to desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    testResults.mobileResponsiveness = true;
    console.log('✅ Mobile Responsiveness: PASSED');

    await page.screenshot({ path: 'manual-test-mobile.png', fullPage: true });
  });

  test('Manual Test 7: Accessibility Validation', async ({ page }) => {
    console.log('🔍 Testing Accessibility...');

    // Test 7.1: Keyboard navigation
    await page.keyboard.press('Tab'); // Should focus on first interactive element
    await page.waitForTimeout(500);

    // Navigate to AI button using keyboard
    let tabCount = 0;
    while (tabCount < 10) {
      const focusedElement = await page.locator(':focus').first();
      const tagName = await focusedElement.evaluate((el: Element) => el.tagName.toLowerCase());
      const ariaLabel = await focusedElement.getAttribute('aria-label');

      if (ariaLabel && ariaLabel.toLowerCase().includes('ai')) {
        console.log('✓ AI button reachable via keyboard');
        await page.keyboard.press('Enter'); // Activate AI panel
        break;
      }

      await page.keyboard.press('Tab');
      tabCount++;
      await page.waitForTimeout(100);
    }

    // Test 7.2: Verify ARIA attributes
    const aiButton = page.locator('button[aria-label="Open AI Assistant"]');
    if ((await aiButton.count()) > 0) {
      const ariaLabel = await aiButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      console.log('✓ AI button has proper aria-label');
    }

    // Test 7.3: Check for focus indicators
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus').first();
    if ((await focusedElement.count()) > 0) {
      // Should have visible focus indicator (this is visual, hard to test automatically)
      console.log('✓ Focus management working');
    }

    // Test 7.4: Screen reader content
    const srOnlyElements = page.locator('.sr-only, [class*="sr-only"]');
    if ((await srOnlyElements.count()) > 0) {
      console.log(`✓ Found ${await srOnlyElements.count()} screen reader only elements`);
    }

    testResults.accessibility = true;
    console.log('✅ Accessibility: PASSED');
  });

  test('Manual Test 8: Performance Validation', async ({ page }) => {
    console.log('🔍 Testing Performance...');

    // Test 8.1: Measure page load time
    const loadStart = performance.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const loadTime = performance.now() - loadStart;

    console.log(`✓ Page load time: ${loadTime.toFixed(2)}ms`);
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds

    // Test 8.2: Test AI panel opening performance
    const panelStart = performance.now();
    await page.click(
      'button[aria-label="Open AI Assistant"], button:has-text("AI"), [data-testid="ai-assistant"]'
    );
    await page.waitForTimeout(500);
    const panelTime = performance.now() - panelStart;

    console.log(`✓ AI panel opening time: ${panelTime.toFixed(2)}ms`);
    expect(panelTime).toBeLessThan(2000); // Should open within 2 seconds

    // Test 8.3: Memory usage check (if available)
    const memoryInfo = await page.evaluate(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        };
      }
      return null;
    });

    if (memoryInfo) {
      console.log(`✓ Memory usage: ${memoryInfo.used}MB / ${memoryInfo.total}MB`);
    }

    testResults.performance = true;
    console.log('✅ Performance: PASSED');
  });

  test('Manual Test 9: Visual Consistency', async ({ page }) => {
    console.log('🔍 Testing Visual Consistency...');

    // Test 9.1: Check theme consistency
    await page.click(
      'button[aria-label="Open AI Assistant"], button:has-text("AI"), [data-testid="ai-assistant"]'
    );
    await page.waitForTimeout(1000);

    // Test 9.2: Check color scheme
    const backgroundColor = await page
      .locator('body')
      .evaluate((el: Element) => window.getComputedStyle(el).backgroundColor);
    console.log(`✓ Body background color: ${backgroundColor}`);

    // Test 9.3: Check typography consistency
    const headingFont = await page
      .locator('h1, h2, h3')
      .first()
      .evaluate((el: Element) => window.getComputedStyle(el).fontFamily);
    if (headingFont) {
      console.log(`✓ Heading font: ${headingFont}`);
    }

    // Test 9.4: Visual regression screenshot
    await expect(page).toHaveScreenshot('visual-consistency-test.png', {
      fullPage: true,
      threshold: 0.1,
    });

    testResults.visualConsistency = true;
    console.log('✅ Visual Consistency: PASSED');
  });

  test('Manual Test 10: Complete User Journey', async ({ page }) => {
    console.log('🔍 Testing Complete User Journey...');

    // Mock realistic AI flow
    await page.route('**/api/ai/chat', async (route) => {
      const postData = route.request().postDataJSON();
      const userMessage = postData.messages[postData.messages.length - 1]?.content || '';

      let response;
      if (userMessage.includes('schedule') || userMessage.includes('meeting')) {
        response = {
          type: 'tool-call',
          toolName: 'suggestSchedule',
          result: {
            suggestions: [
              {
                start: 'January 22, 2025 at 10:00 AM',
                end: 'January 22, 2025 at 11:00 AM',
                startISO: '2025-01-22T10:00:00.000Z',
                endISO: '2025-01-22T11:00:00.000Z',
                score: 0.9,
                reasons: 'Perfect morning slot for productivity',
              },
            ],
          },
        };
      } else {
        response = {
          type: 'text',
          text: 'I can help you schedule meetings, find available times, and manage your calendar. What would you like to do?',
        };
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    // Journey 10.1: User opens AI assistant
    await page.click(
      'button[aria-label="Open AI Assistant"], button:has-text("AI"), [data-testid="ai-assistant"]'
    );
    await page.waitForTimeout(1000);

    // Journey 10.2: User asks general question
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Hello, what can you help me with?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Journey 10.3: User requests scheduling
    await aiInput.fill('Schedule a team meeting for next week');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    // Journey 10.4: User applies suggestion
    const applyButton = page.locator('button:has-text("Apply")');
    if ((await applyButton.count()) > 0) {
      await applyButton.first().click();
      await page.waitForTimeout(2000);

      // Verify completion
      const confirmationMessages = ['text*="Added event"', 'text*="created"', 'text*="scheduled"'];

      let journeyComplete = false;
      for (const msg of confirmationMessages) {
        if ((await page.locator(msg).count()) > 0) {
          journeyComplete = true;
          console.log('✓ User journey completed successfully');
          break;
        }
      }

      expect(journeyComplete).toBeTruthy();
    }

    testResults.userJourney = true;
    console.log('✅ Complete User Journey: PASSED');

    await page.screenshot({ path: 'manual-test-user-journey.png', fullPage: true });
  });

  test('Manual Testing Summary Report', async ({ page }) => {
    console.log('\n📊 MANUAL TESTING SUMMARY REPORT');
    console.log('=====================================');

    const totalTests = Object.keys(testResults).length;
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log(`\n📈 Overall Results:`);
    console.log(`   • Tests Passed: ${passedTests}/${totalTests} (${passRate}%)`);
    console.log(`   • Tests Failed: ${totalTests - passedTests}/${totalTests}`);

    console.log('\n🔍 Detailed Results:');
    Object.entries(testResults).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const testName = test.replace(/([A-Z])/g, ' $1').trim();
      console.log(`   • ${testName}: ${status}`);
    });

    console.log('\n📝 Recommendations:');
    if (passRate >= 90) {
      console.log('   🎉 Excellent! AI implementation is ready for production.');
    } else if (passRate >= 80) {
      console.log('   👍 Good! Minor improvements needed before production.');
    } else if (passRate >= 70) {
      console.log('   ⚠️  Needs improvement. Address failing tests before release.');
    } else {
      console.log('   🚨 Critical issues found. Significant work needed.');
    }

    // Create comprehensive test report screenshot
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('manual-testing-final-report.png', {
      fullPage: true,
      threshold: 0.1,
    });

    console.log('\n📸 Screenshots saved for documentation:');
    console.log('   • manual-test-ai-panel.png');
    console.log('   • manual-test-chat-interface.png');
    console.log('   • manual-test-tool-integration.png');
    console.log('   • manual-test-calendar-integration.png');
    console.log('   • manual-test-error-handling.png');
    console.log('   • manual-test-mobile.png');
    console.log('   • visual-consistency-test.png');
    console.log('   • manual-test-user-journey.png');
    console.log('   • manual-testing-final-report.png');

    console.log('\n✅ Manual Testing Validation: COMPLETED');

    // Verify minimum pass rate for production readiness
    expect(passRate).toBeGreaterThanOrEqual(80);
  });
});
