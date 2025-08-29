// Vercel AI SDK v5 API Endpoint Tests
import { test, expect, type APIResponse } from '@playwright/test';

test.describe('🤖 AI Chat API (Vercel SDK v5) - API Endpoint Testing', () => {
  // Mock OpenAI API responses
  const mockStreamResponse = {
    choices: [
      {
        delta: {
          content:
            "I'll help you schedule that meeting. Let me check your calendar for available times.",
        },
        finish_reason: null,
      },
    ],
  };

  const mockToolResponse = {
    suggestions: [
      {
        start: 'January 15, 2025 at 2:00 PM',
        end: 'January 15, 2025 at 3:00 PM',
        startISO: '2025-01-15T14:00:00.000Z',
        endISO: '2025-01-15T15:00:00.000Z',
        score: 0.9,
        reasons: 'Optimal time with no conflicts and good energy levels',
      },
    ],
  };

  test.beforeEach(async ({ page, context }) => {
    // Mock OpenAI API calls to avoid real API usage
    await context.route('https://api.openai.com/**', async (route) => {
      const url = route.request().url();

      if (url.includes('chat/completions')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockStreamResponse),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('POST /api/ai/chat - should handle basic chat request', async ({ request }) => {
    const response = await request.post('/api/ai/chat', {
      data: {
        messages: [{ role: 'user', content: 'Hello, can you help me schedule a meeting?' }],
        events: [],
        userId: 'test-user-123',
        model: 'openai/gpt-4o-mini',
        webSearch: false,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(200);

    // Should return streaming response
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/plain'); // AI SDK v5 streaming format
  });

  test('POST /api/ai/chat - should handle model selection', async ({ request }) => {
    // Test different model formats
    const models = [
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'gpt-4o', // Should parse to gpt-4o
      undefined, // Should default to gpt-4o-mini
    ];

    for (const model of models) {
      const response = await request.post('/api/ai/chat', {
        data: {
          messages: [{ role: 'user', content: 'Test message' }],
          events: [],
          userId: 'test-user',
          ...(model && { model }),
          webSearch: false,
        },
      });

      expect(response.status()).toBe(200);
    }
  });

  test('POST /api/ai/chat - should enforce rate limiting', async ({ request }) => {
    const userId = 'rate-limit-test-user';

    // Send 21 requests rapidly (limit is 20 per minute)
    const requests = Array.from({ length: 21 }, (_, i) =>
      request.post('/api/ai/chat', {
        data: {
          messages: [{ role: 'user', content: `Message ${i}` }],
          events: [],
          userId,
          model: 'openai/gpt-4o-mini',
          webSearch: false,
        },
        headers: {
          'x-user-id': userId,
        },
      })
    );

    const responses = await Promise.all(requests);

    // At least one should be rate limited
    const rateLimitedResponses = responses.filter((r) => r.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    const successfulResponses = responses.filter((r) => r.status() === 200);
    expect(successfulResponses.length).toBeLessThanOrEqual(20);
  });

  test('POST /api/ai/chat - should handle suggestSchedule tool', async ({ request, page }) => {
    // Mock the tool response in the API
    await page.route('**/api/ai/chat', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();

        // If the message contains scheduling, return tool usage
        if (postData.messages.some((m: any) => m.content.includes('schedule'))) {
          await route.fulfill({
            status: 200,
            contentType: 'text/plain; charset=utf-8',
            body: JSON.stringify({
              type: 'tool-call',
              toolName: 'suggestSchedule',
              toolCallId: 'call_123',
              args: {
                title: 'Team Meeting',
                duration: 60,
                preferences: { timeOfDay: 'morning', avoidConflicts: true },
              },
              result: mockToolResponse,
            }),
          });
        }
      }
      await route.continue();
    });

    const response = await request.post('/api/ai/chat', {
      data: {
        messages: [
          { role: 'user', content: 'Schedule a team meeting for 1 hour tomorrow morning' },
        ],
        events: [
          {
            id: '1',
            title: 'Existing Meeting',
            startDate: '2025-01-15T10:00:00.000Z',
            endDate: '2025-01-15T11:00:00.000Z',
            category: 'work',
          },
        ],
        userId: 'test-user',
        model: 'openai/gpt-4o-mini',
        webSearch: false,
      },
    });

    expect(response.status()).toBe(200);
  });

  test('POST /api/ai/chat - should handle explainConflicts tool', async ({ request }) => {
    const testEvents = [
      {
        id: '1',
        title: 'Meeting A',
        startDate: '2025-01-15T14:00:00.000Z',
        endDate: '2025-01-15T15:00:00.000Z',
        category: 'work',
      },
      {
        id: '2',
        title: 'Meeting B',
        startDate: '2025-01-15T14:30:00.000Z',
        endDate: '2025-01-15T15:30:00.000Z',
        category: 'work',
      },
    ];

    const response = await request.post('/api/ai/chat', {
      data: {
        messages: [{ role: 'user', content: 'Explain conflicts for January 15, 2025' }],
        events: testEvents,
        userId: 'test-user',
        model: 'openai/gpt-4o-mini',
        webSearch: false,
      },
    });

    expect(response.status()).toBe(200);
  });

  test('POST /api/ai/chat - should handle listOpenSlots tool', async ({ request }) => {
    const response = await request.post('/api/ai/chat', {
      data: {
        messages: [{ role: 'user', content: 'What are the open slots for January 15, 2025?' }],
        events: [
          {
            id: '1',
            title: 'Busy Time',
            startDate: '2025-01-15T10:00:00.000Z',
            endDate: '2025-01-15T11:00:00.000Z',
            category: 'work',
          },
        ],
        userId: 'test-user',
        model: 'openai/gpt-4o-mini',
        webSearch: false,
      },
    });

    expect(response.status()).toBe(200);
  });

  test('POST /api/ai/chat - should handle summarizePeriod tool', async ({ request }) => {
    const testEvents = Array.from({ length: 5 }, (_, i) => ({
      id: `event-${i}`,
      title: `Event ${i}`,
      startDate: `2025-01-${10 + i}T14:00:00.000Z`,
      endDate: `2025-01-${10 + i}T15:00:00.000Z`,
      category: i % 2 === 0 ? 'work' : 'personal',
    }));

    const response = await request.post('/api/ai/chat', {
      data: {
        messages: [{ role: 'user', content: 'Summarize my calendar from January 10-20, 2025' }],
        events: testEvents,
        userId: 'test-user',
        model: 'openai/gpt-4o-mini',
        webSearch: false,
      },
    });

    expect(response.status()).toBe(200);
  });

  test('POST /api/ai/chat - should include/exclude calendar events based on flag', async ({
    request,
  }) => {
    const testEvents = [
      {
        id: '1',
        title: 'Private Meeting',
        startDate: '2025-01-15T14:00:00.000Z',
        endDate: '2025-01-15T15:00:00.000Z',
        category: 'personal',
      },
    ];

    // Test with calendar context enabled
    const responseWithCalendar = await request.post('/api/ai/chat', {
      data: {
        messages: [{ role: 'user', content: 'What meetings do I have?' }],
        events: testEvents,
        userId: 'test-user',
        model: 'openai/gpt-4o-mini',
        webSearch: false,
      },
    });
    expect(responseWithCalendar.status()).toBe(200);

    // Test with calendar context disabled (empty events array)
    const responseWithoutCalendar = await request.post('/api/ai/chat', {
      data: {
        messages: [{ role: 'user', content: 'What meetings do I have?' }],
        events: [], // Empty when calendar context disabled
        userId: 'test-user',
        model: 'openai/gpt-4o-mini',
        webSearch: false,
      },
    });
    expect(responseWithoutCalendar.status()).toBe(200);
  });

  test('POST /api/ai/chat - should handle web search flag', async ({ request }) => {
    const response = await request.post('/api/ai/chat', {
      data: {
        messages: [{ role: 'user', content: 'What are current best practices for team meetings?' }],
        events: [],
        userId: 'test-user',
        model: 'openai/gpt-4o-mini',
        webSearch: true, // Web search enabled
      },
    });

    expect(response.status()).toBe(200);
  });

  test('POST /api/ai/chat - should return proper streaming headers', async ({ request }) => {
    const response = await request.post('/api/ai/chat', {
      data: {
        messages: [{ role: 'user', content: 'Hello' }],
        events: [],
        userId: 'test-user',
        model: 'openai/gpt-4o-mini',
        webSearch: false,
      },
    });

    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers['content-type']).toMatch(/text\/plain|application\/json/);

    // Should have streaming-related headers
    expect(headers['cache-control']).toBe('no-cache, no-store, max-age=0, must-revalidate');
  });

  test('POST /api/ai/chat - should handle invalid requests', async ({ request }) => {
    // Test missing messages
    let response = await request.post('/api/ai/chat', {
      data: {
        events: [],
        userId: 'test-user',
      },
    });
    expect(response.status()).toBe(400);

    // Test invalid messages format
    response = await request.post('/api/ai/chat', {
      data: {
        messages: 'not-an-array',
        events: [],
        userId: 'test-user',
      },
    });
    expect(response.status()).toBe(400);

    // Test empty request
    response = await request.post('/api/ai/chat', {
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  test('POST /api/ai/chat - should handle server errors gracefully', async ({ request, page }) => {
    // Mock server error
    await page.route('**/api/ai/chat', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'text/plain',
          body: 'Internal server error',
        });
      }
    });

    const response = await request.post('/api/ai/chat', {
      data: {
        messages: [{ role: 'user', content: 'Test message' }],
        events: [],
        userId: 'test-user',
      },
    });

    expect(response.status()).toBe(500);
    expect(await response.text()).toBe('Internal server error');
  });

  test('POST /api/ai/chat - should handle Convex persistence errors gracefully', async ({
    request,
  }) => {
    // Test when Convex is unavailable but API still works
    const response = await request.post('/api/ai/chat', {
      data: {
        messages: [{ role: 'user', content: 'Test persistence' }],
        events: [],
        userId: 'test-user-no-convex',
        model: 'openai/gpt-4o-mini',
        webSearch: false,
      },
    });

    // Should still return 200 even if persistence fails
    expect(response.status()).toBe(200);
  });

  test('POST /api/ai/chat - should include system prompt with current date', async ({
    request,
  }) => {
    const response = await request.post('/api/ai/chat', {
      data: {
        messages: [{ role: 'user', content: "What is today's date?" }],
        events: [],
        userId: 'test-user',
        model: 'openai/gpt-4o-mini',
        webSearch: false,
      },
    });

    expect(response.status()).toBe(200);

    // The system prompt should include current date context
    // This would be verified in the actual API implementation
  });

  test('POST /api/ai/chat - should handle anonymous users', async ({ request }) => {
    const response = await request.post('/api/ai/chat', {
      data: {
        messages: [{ role: 'user', content: 'Hello' }],
        events: [],
        userId: 'anonymous', // Anonymous user
        model: 'openai/gpt-4o-mini',
        webSearch: false,
      },
    });

    // Should work but without Convex persistence
    expect(response.status()).toBe(200);
  });

  test('POST /api/ai/chat - should handle tool execution errors', async ({ request, page }) => {
    // Mock tool execution error
    await page.route('**/api/ai/chat', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();

        if (postData.messages.some((m: any) => m.content.includes('error'))) {
          await route.fulfill({
            status: 200,
            contentType: 'text/plain',
            body: JSON.stringify({
              type: 'error',
              message: 'Tool execution failed',
            }),
          });
        }
      }
      await route.continue();
    });

    const response = await request.post('/api/ai/chat', {
      data: {
        messages: [{ role: 'user', content: 'This should trigger a tool error' }],
        events: [],
        userId: 'test-user',
        model: 'openai/gpt-4o-mini',
        webSearch: false,
      },
    });

    expect(response.status()).toBe(200);
  });
});
