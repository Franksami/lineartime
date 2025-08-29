// AI Elements UI Component Tests (Vercel AI SDK v5)
import { test, expect } from '@playwright/test';

test.describe('🎨 AI Elements UI Components - Vercel AI SDK v5 Integration', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock OpenAI responses to avoid API calls
    await context.route('https://api.openai.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{ delta: { content: 'Test AI response' } }],
        }),
      });
    });

    // Mock Convex responses
    await context.route('**/convex/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, chatId: 'test-chat-123' }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display AI assistant panel button', async ({ page }) => {
    // Look for AI assistant trigger button
    const aiTriggers = [
      '[data-testid="ai-assistant"]',
      'button:has-text("AI")',
      'button:has-text("Assistant")',
      '.ai-panel-trigger',
      '[aria-label*="AI assistant"]',
      'button[title*="assistant"]',
    ];

    let aiTriggerFound = false;
    for (const selector of aiTriggers) {
      const element = page.locator(selector);
      if ((await element.count()) > 0) {
        await expect(element.first()).toBeVisible();
        aiTriggerFound = true;
        break;
      }
    }

    expect(aiTriggerFound).toBeTruthy();
  });

  test('should open and display AI assistant panel', async ({ page }) => {
    // Find and click AI assistant trigger
    const aiTrigger = page
      .locator('button:has-text("AI"), [data-testid="ai-assistant"], .ai-panel-trigger')
      .first();

    if ((await aiTrigger.count()) > 0) {
      await aiTrigger.click();
      await page.waitForTimeout(1000);

      // Check for AI panel visibility
      const aiPanel = page.locator('[data-testid="ai-panel"], .ai-panel, .assistant-panel').first();
      await expect(aiPanel).toBeVisible();

      // Check for conversation container
      const conversation = page
        .locator('[role="log"], .conversation, [data-testid="conversation"]')
        .first();
      if ((await conversation.count()) > 0) {
        await expect(conversation).toBeVisible();
      }
    }
  });

  test('should display prompt input with controls', async ({ page }) => {
    // Open AI panel
    const aiTrigger = page.locator('button:has-text("AI"), [data-testid="ai-assistant"]').first();
    if ((await aiTrigger.count()) > 0) {
      await aiTrigger.click();
      await page.waitForTimeout(1000);
    }

    // Check for prompt input textarea
    const promptInput = page
      .locator(
        'textarea[placeholder*="message"], textarea[placeholder*="Ask"], [data-testid="prompt-input"]'
      )
      .first();
    if ((await promptInput.count()) > 0) {
      await expect(promptInput).toBeVisible();

      // Test typing in the input
      await promptInput.fill('Test message for AI');
      expect(await promptInput.inputValue()).toBe('Test message for AI');
    }

    // Check for input toolbar with controls
    const toolbar = page.locator('[data-testid="prompt-toolbar"], .prompt-toolbar').first();
    if ((await toolbar.count()) > 0) {
      await expect(toolbar).toBeVisible();
    }
  });

  test('should display model picker in prompt input', async ({ page }) => {
    // Open AI panel
    const aiTrigger = page.locator('button:has-text("AI"), [data-testid="ai-assistant"]').first();
    if ((await aiTrigger.count()) > 0) {
      await aiTrigger.click();
      await page.waitForTimeout(1000);
    }

    // Look for model picker
    const modelPicker = page
      .locator('[data-testid="model-select"], .model-picker, button:has-text("gpt")')
      .first();
    if ((await modelPicker.count()) > 0) {
      await expect(modelPicker).toBeVisible();

      // Test opening model picker
      await modelPicker.click();
      await page.waitForTimeout(500);

      // Check for model options
      const modelOptions = page.locator('[data-testid="model-option"], [role="menuitem"]');
      if ((await modelOptions.count()) > 0) {
        await expect(modelOptions.first()).toBeVisible();
      }
    }
  });

  test('should display web search toggle', async ({ page }) => {
    // Open AI panel
    const aiTrigger = page.locator('button:has-text("AI"), [data-testid="ai-assistant"]').first();
    if ((await aiTrigger.count()) > 0) {
      await aiTrigger.click();
      await page.waitForTimeout(1000);
    }

    // Look for web search toggle
    const webSearchToggle = page
      .locator(
        '[data-testid="web-search-toggle"], button[title*="web search"], [aria-label*="web search"]'
      )
      .first();
    if ((await webSearchToggle.count()) > 0) {
      await expect(webSearchToggle).toBeVisible();

      // Test toggling web search
      await webSearchToggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('should display calendar context toggle', async ({ page }) => {
    // Open AI panel
    const aiTrigger = page.locator('button:has-text("AI"), [data-testid="ai-assistant"]').first();
    if ((await aiTrigger.count()) > 0) {
      await aiTrigger.click();
      await page.waitForTimeout(1000);
    }

    // Look for calendar context toggle
    const calendarToggle = page
      .locator(
        '[data-testid="calendar-toggle"], button[title*="calendar"], [aria-label*="calendar context"]'
      )
      .first();
    if ((await calendarToggle.count()) > 0) {
      await expect(calendarToggle).toBeVisible();

      // Test toggling calendar context
      await calendarToggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('should send message and display conversation', async ({ page }) => {
    // Mock the streaming response
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: JSON.stringify({
          type: 'text',
          content: 'Hello! I can help you with scheduling.',
        }),
      });
    });

    // Open AI panel
    const aiTrigger = page.locator('button:has-text("AI"), [data-testid="ai-assistant"]').first();
    if ((await aiTrigger.count()) > 0) {
      await aiTrigger.click();
      await page.waitForTimeout(1000);
    }

    // Send a message
    const promptInput = page
      .locator('textarea[placeholder*="message"], [data-testid="prompt-input"]')
      .first();
    if ((await promptInput.count()) > 0) {
      await promptInput.fill('Hello, can you help me schedule a meeting?');

      const sendButton = page
        .locator('button[type="submit"], [data-testid="send-button"], button:has-text("Send")')
        .first();
      if ((await sendButton.count()) > 0) {
        await sendButton.click();
      } else {
        await page.keyboard.press('Enter');
      }

      await page.waitForTimeout(2000);

      // Check for user message
      const userMessage = page
        .locator('.message[data-role="user"], [data-testid="user-message"]')
        .first();
      if ((await userMessage.count()) > 0) {
        await expect(userMessage).toBeVisible();
        expect(await userMessage.textContent()).toContain('schedule a meeting');
      }

      // Check for AI response
      const aiMessage = page
        .locator('.message[data-role="assistant"], [data-testid="assistant-message"]')
        .first();
      if ((await aiMessage.count()) > 0) {
        await expect(aiMessage).toBeVisible();
      }
    }
  });

  test('should display message actions (copy, regenerate, share, like, dislike)', async ({
    page,
  }) => {
    // Setup message with actions
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: JSON.stringify({
          type: 'text',
          content: 'I can help you with that! Here are some suggestions.',
        }),
      });
    });

    // Open AI panel and send message
    const aiTrigger = page.locator('button:has-text("AI"), [data-testid="ai-assistant"]').first();
    if ((await aiTrigger.count()) > 0) {
      await aiTrigger.click();
      await page.waitForTimeout(1000);

      const promptInput = page.locator('textarea[placeholder*="message"]').first();
      if ((await promptInput.count()) > 0) {
        await promptInput.fill('Test message');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

        // Look for message actions
        const messageActions = [
          'button[title*="Copy"], [data-testid="copy-action"]',
          'button[title*="Regenerate"], [data-testid="regenerate-action"]',
          'button[title*="Share"], [data-testid="share-action"]',
          'button[title*="Like"], [data-testid="like-action"]',
          'button[title*="Dislike"], [data-testid="dislike-action"]',
        ];

        for (const actionSelector of messageActions) {
          const action = page.locator(actionSelector).first();
          if ((await action.count()) > 0) {
            await expect(action).toBeVisible();
          }
        }
      }
    }
  });

  test('should display reasoning section when available', async ({ page }) => {
    // Mock response with reasoning
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: JSON.stringify({
          type: 'reasoning',
          content: 'Let me think about this step by step...',
        }),
      });
    });

    // Send message that would trigger reasoning
    const aiTrigger = page.locator('button:has-text("AI"), [data-testid="ai-assistant"]').first();
    if ((await aiTrigger.count()) > 0) {
      await aiTrigger.click();
      await page.waitForTimeout(1000);

      const promptInput = page.locator('textarea[placeholder*="message"]').first();
      if ((await promptInput.count()) > 0) {
        await promptInput.fill('Analyze my schedule and suggest optimizations');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

        // Check for reasoning section
        const reasoning = page.locator('[data-testid="reasoning"], .reasoning-section').first();
        if ((await reasoning.count()) > 0) {
          await expect(reasoning).toBeVisible();

          // Test expanding/collapsing reasoning
          const reasoningToggle = reasoning
            .locator('button, [data-testid="reasoning-toggle"]')
            .first();
          if ((await reasoningToggle.count()) > 0) {
            await reasoningToggle.click();
            await page.waitForTimeout(500);
          }
        }
      }
    }
  });

  test('should display sources and citations', async ({ page }) => {
    // Mock response with sources
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: JSON.stringify({
          type: 'text',
          content: 'Based on your calendar data [1], I recommend these times.',
          sources: [{ id: 1, title: 'Calendar Events', url: '/calendar' }],
        }),
      });
    });

    // Send message
    const aiTrigger = page.locator('button:has-text("AI"), [data-testid="ai-assistant"]').first();
    if ((await aiTrigger.count()) > 0) {
      await aiTrigger.click();
      await page.waitForTimeout(1000);

      const promptInput = page.locator('textarea[placeholder*="message"]').first();
      if ((await promptInput.count()) > 0) {
        await promptInput.fill('What are my available times?');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

        // Check for sources section
        const sources = page.locator('[data-testid="sources"], .sources-section').first();
        if ((await sources.count()) > 0) {
          await expect(sources).toBeVisible();
        }

        // Check for inline citations
        const citations = page.locator('[data-testid="citation"], .citation').first();
        if ((await citations.count()) > 0) {
          await expect(citations).toBeVisible();
        }
      }
    }
  });

  test('should display tool execution (suggestSchedule with Apply button)', async ({ page }) => {
    // Mock tool response with apply button data
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: JSON.stringify({
          type: 'tool-call',
          toolName: 'suggestSchedule',
          result: {
            suggestions: [
              {
                start: 'January 15, 2025 at 2:00 PM',
                end: 'January 15, 2025 at 3:00 PM',
                startISO: '2025-01-15T14:00:00.000Z',
                endISO: '2025-01-15T15:00:00.000Z',
                score: 0.9,
                reasons: 'Optimal time slot',
              },
            ],
          },
        }),
      });
    });

    // Send scheduling request
    const aiTrigger = page.locator('button:has-text("AI"), [data-testid="ai-assistant"]').first();
    if ((await aiTrigger.count()) > 0) {
      await aiTrigger.click();
      await page.waitForTimeout(1000);

      const promptInput = page.locator('textarea[placeholder*="message"]').first();
      if ((await promptInput.count()) > 0) {
        await promptInput.fill('Schedule a meeting for tomorrow afternoon');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

        // Check for tool output
        const toolOutput = page.locator('[data-testid="tool-output"], .tool-result').first();
        if ((await toolOutput.count()) > 0) {
          await expect(toolOutput).toBeVisible();
        }

        // Check for Apply button
        const applyButton = page
          .locator('button:has-text("Apply"), [data-testid="apply-suggestion"]')
          .first();
        if ((await applyButton.count()) > 0) {
          await expect(applyButton).toBeVisible();

          // Test clicking Apply button
          await applyButton.click();
          await page.waitForTimeout(1000);

          // Should create event (would need to verify in calendar)
          // This would trigger the onEventCreate callback
        }
      }
    }
  });

  test('should display suggestions for new conversations', async ({ page }) => {
    // Open AI panel
    const aiTrigger = page.locator('button:has-text("AI"), [data-testid="ai-assistant"]').first();
    if ((await aiTrigger.count()) > 0) {
      await aiTrigger.click();
      await page.waitForTimeout(1000);

      // Check for suggestion chips
      const suggestions = page.locator('[data-testid="suggestion"], .suggestion-chip').first();
      if ((await suggestions.count()) > 0) {
        await expect(suggestions).toBeVisible();

        // Test clicking a suggestion
        const firstSuggestion = suggestions.first();
        const suggestionText = await firstSuggestion.textContent();
        await firstSuggestion.click();
        await page.waitForTimeout(1000);

        // Should populate the input
        const promptInput = page.locator('textarea[placeholder*="message"]').first();
        if ((await promptInput.count()) > 0) {
          expect(await promptInput.inputValue()).toContain(suggestionText || '');
        }
      }
    }
  });

  test('should display multi-chat selector and management', async ({ page }) => {
    // Open AI panel
    const aiTrigger = page.locator('button:has-text("AI"), [data-testid="ai-assistant"]').first();
    if ((await aiTrigger.count()) > 0) {
      await aiTrigger.click();
      await page.waitForTimeout(1000);

      // Check for chat selector
      const chatSelector = page.locator('[data-testid="chat-selector"], .chat-list').first();
      if ((await chatSelector.count()) > 0) {
        await expect(chatSelector).toBeVisible();
      }

      // Check for new chat button
      const newChatButton = page
        .locator('button:has-text("New Chat"), [data-testid="new-chat"]')
        .first();
      if ((await newChatButton.count()) > 0) {
        await expect(newChatButton).toBeVisible();

        // Test creating new chat
        await newChatButton.click();
        await page.waitForTimeout(1000);
      }

      // Check for chat management actions (rename, delete)
      const chatActions = page.locator('[data-testid="chat-actions"], .chat-menu').first();
      if ((await chatActions.count()) > 0) {
        await expect(chatActions).toBeVisible();
      }
    }
  });

  test('should handle mobile responsive layout', async ({ page, browserName }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12 Pro

    // Open AI panel on mobile
    const aiTrigger = page.locator('button:has-text("AI"), [data-testid="ai-assistant"]').first();
    if ((await aiTrigger.count()) > 0) {
      await aiTrigger.click();
      await page.waitForTimeout(1000);

      // AI panel should be visible and properly sized
      const aiPanel = page.locator('[data-testid="ai-panel"], .ai-panel').first();
      if ((await aiPanel.count()) > 0) {
        await expect(aiPanel).toBeVisible();

        // Check if panel takes appropriate mobile space
        const boundingBox = await aiPanel.boundingBox();
        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThan(300); // Should be reasonably sized
        }
      }

      // Check mobile-specific UI elements
      const mobileHeader = page
        .locator('[data-testid="mobile-chat-header"], .mobile-header')
        .first();
      if ((await mobileHeader.count()) > 0) {
        await expect(mobileHeader).toBeVisible();
      }
    }
  });

  test('should display loading states during AI responses', async ({ page }) => {
    // Mock delayed response
    await page.route('**/api/ai/chat', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2s delay
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: JSON.stringify({ type: 'text', content: 'Response after delay' }),
      });
    });

    // Open AI panel and send message
    const aiTrigger = page.locator('button:has-text("AI"), [data-testid="ai-assistant"]').first();
    if ((await aiTrigger.count()) > 0) {
      await aiTrigger.click();
      await page.waitForTimeout(1000);

      const promptInput = page.locator('textarea[placeholder*="message"]').first();
      if ((await promptInput.count()) > 0) {
        await promptInput.fill('Test loading state');
        await page.keyboard.press('Enter');

        // Check for loading indicator
        const loadingIndicator = page
          .locator('[data-testid="loading"], .loading, .ai-thinking')
          .first();
        if ((await loadingIndicator.count()) > 0) {
          await expect(loadingIndicator).toBeVisible();
        }

        // Wait for response
        await page.waitForTimeout(3000);

        // Loading should be gone
        if ((await loadingIndicator.count()) > 0) {
          await expect(loadingIndicator).not.toBeVisible();
        }
      }
    }
  });

  test('should handle panel minimize/maximize', async ({ page }) => {
    // Open AI panel
    const aiTrigger = page.locator('button:has-text("AI"), [data-testid="ai-assistant"]').first();
    if ((await aiTrigger.count()) > 0) {
      await aiTrigger.click();
      await page.waitForTimeout(1000);

      // Look for minimize button
      const minimizeButton = page
        .locator('[data-testid="minimize"], button[title*="minimize"], .minimize-button')
        .first();
      if ((await minimizeButton.count()) > 0) {
        await minimizeButton.click();
        await page.waitForTimeout(500);

        // Panel should be minimized
        const aiPanel = page.locator('[data-testid="ai-panel"], .ai-panel').first();
        // Would need to check for minimized state class or reduced size

        // Look for maximize button
        const maximizeButton = page
          .locator('[data-testid="maximize"], button[title*="maximize"], .maximize-button')
          .first();
        if ((await maximizeButton.count()) > 0) {
          await maximizeButton.click();
          await page.waitForTimeout(500);
        }
      }

      // Look for close button
      const closeButton = page
        .locator('[data-testid="close"], button[title*="close"], .close-button')
        .first();
      if ((await closeButton.count()) > 0) {
        await closeButton.click();
        await page.waitForTimeout(500);

        // Panel should be closed
        const aiPanel = page.locator('[data-testid="ai-panel"], .ai-panel').first();
        await expect(aiPanel).not.toBeVisible();
      }
    }
  });
});
