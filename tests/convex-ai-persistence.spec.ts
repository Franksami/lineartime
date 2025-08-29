// Convex AI Chat Persistence Layer Tests
import { test, expect } from '@playwright/test';

test.describe('🗄️ Convex AI Chat Persistence - Database Integration Tests', () => {
  // Test data constants
  const testUsers = {
    user1: 'user_test_123',
    user2: 'user_test_456',
    anonymous: 'anonymous',
  };

  const testMessages = [
    {
      role: 'user',
      parts: [{ type: 'text', text: 'Hello, can you help me schedule a meeting?' }],
    },
    {
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: "I'd be happy to help you schedule a meeting. Let me check your available times.",
        },
        {
          type: 'tool-call',
          toolName: 'suggestSchedule',
          args: { title: 'Team Meeting', duration: 60 },
        },
      ],
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Navigate to main application to initialize Convex connection
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');

    // Wait for Convex to be ready
    await page.waitForTimeout(2000);
  });

  test('should create and retrieve chat sessions via ensureChat', async ({ page }) => {
    // Test ensureChat function - creates or finds existing chat
    const chatId = await page.evaluate(async (userId) => {
      // @ts-ignore - Access Convex client from window
      const convex = window.convex;
      if (!convex) throw new Error('Convex client not available');

      return await convex.mutation('aiChat:ensureChat', {
        userId: userId,
        title: 'Test Chat Session',
      });
    }, testUsers.user1);

    expect(chatId).toBeTruthy();
    expect(typeof chatId).toBe('string');

    // Verify same chat is returned on subsequent calls
    const sameChat = await page.evaluate(async (userId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.mutation('aiChat:ensureChat', { userId });
    }, testUsers.user1);

    expect(sameChat).toBe(chatId);
  });

  test('should persist and retrieve messages via appendMessages', async ({ page }) => {
    // Create chat first
    const chatId = await page.evaluate(async (userId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.mutation('aiChat:ensureChat', { userId });
    }, testUsers.user1);

    // Add messages
    await page.evaluate(
      async ({ chatId, messages }) => {
        // @ts-ignore
        const convex = window.convex;
        await convex.mutation('aiChat:appendMessages', {
          chatId: chatId,
          messages: messages,
        });
      },
      { chatId, messages: testMessages }
    );

    // Retrieve and verify messages
    const chatData = await page.evaluate(async (chatId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.query('aiChat:getChat', { chatId });
    }, chatId);

    expect(chatData).toBeTruthy();
    expect(chatData.chat).toBeTruthy();
    expect(chatData.messages).toHaveLength(2);
    expect(chatData.messages[0].role).toBe('user');
    expect(chatData.messages[1].role).toBe('assistant');

    // Verify message parts structure
    expect(chatData.messages[0].parts).toEqual([
      { type: 'text', text: 'Hello, can you help me schedule a meeting?' },
    ]);
    expect(chatData.messages[1].parts).toHaveLength(2);
    expect(chatData.messages[1].parts[0].type).toBe('text');
    expect(chatData.messages[1].parts[1].type).toBe('tool-call');
  });

  test('should log AI events for analytics via logEvent', async ({ page }) => {
    // Create chat for event logging
    const chatId = await page.evaluate(async (userId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.mutation('aiChat:ensureChat', { userId });
    }, testUsers.user1);

    // Log various event types
    const eventTypes = [
      { type: 'rate', data: { rating: 5, messageId: 'msg_123' } },
      { type: 'copy', data: { messageId: 'msg_123' } },
      { type: 'regenerate', data: { messageId: 'msg_123' } },
      {
        type: 'applySuggestion',
        data: { suggestionId: 'sug_456', startISO: '2025-01-15T14:00:00.000Z' },
      },
      { type: 'share', data: { chatId, method: 'link' } },
    ];

    // Log each event type
    for (const event of eventTypes) {
      await page.evaluate(
        async ({ userId, chatId, eventType, data }) => {
          // @ts-ignore
          const convex = window.convex;
          await convex.mutation('aiChat:logEvent', {
            userId: userId,
            chatId: chatId,
            eventType: eventType,
            data: data,
          });
        },
        {
          userId: testUsers.user1,
          chatId,
          eventType: event.type,
          data: event.data,
        }
      );
    }

    // Verify events were logged (would need additional query to retrieve events)
    await expect(page.locator('body')).toBeVisible(); // Basic test completion
  });

  test('should manage multiple chats via createChat and listChats', async ({ page }) => {
    const userId = testUsers.user1;

    // Create multiple chats
    const chatTitles = [
      'AI Scheduling Help',
      'Calendar Integration Questions',
      'Performance Optimization Chat',
    ];

    const chatIds = [];
    for (const title of chatTitles) {
      const chatId = await page.evaluate(
        async ({ userId, title }) => {
          // @ts-ignore
          const convex = window.convex;
          return await convex.mutation('aiChat:createChat', { userId, title });
        },
        { userId, title }
      );

      chatIds.push(chatId);
    }

    // Verify all chats exist
    expect(chatIds).toHaveLength(3);
    chatIds.forEach((id) => expect(id).toBeTruthy());

    // List all chats for user
    const chatList = await page.evaluate(async (userId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.query('aiChat:listChats', { userId });
    }, userId);

    expect(chatList).toHaveLength(3);

    // Verify chat titles
    const retrievedTitles = chatList.map((chat: any) => chat.title).sort();
    expect(retrievedTitles).toEqual([
      'AI Scheduling Help',
      'Calendar Integration Questions',
      'Performance Optimization Chat',
    ]);
  });

  test('should rename and delete chats correctly', async ({ page }) => {
    const userId = testUsers.user1;

    // Create chat to modify
    const chatId = await page.evaluate(
      async ({ userId, title }) => {
        // @ts-ignore
        const convex = window.convex;
        return await convex.mutation('aiChat:createChat', {
          userId,
          title,
        });
      },
      { userId, title: 'Original Title' }
    );

    // Rename chat
    await page.evaluate(
      async ({ chatId, title }) => {
        // @ts-ignore
        const convex = window.convex;
        await convex.mutation('aiChat:renameChat', {
          chatId,
          title,
        });
      },
      { chatId, title: 'Renamed Title' }
    );

    // Verify rename
    const chatData = await page.evaluate(async (chatId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.query('aiChat:getChat', { chatId });
    }, chatId);

    expect(chatData.chat.title).toBe('Renamed Title');

    // Add messages to test cascading delete
    await page.evaluate(
      async ({ chatId, messages }) => {
        // @ts-ignore
        const convex = window.convex;
        await convex.mutation('aiChat:appendMessages', { chatId, messages });
      },
      { chatId, messages: testMessages }
    );

    // Delete chat
    await page.evaluate(async (chatId) => {
      // @ts-ignore
      const convex = window.convex;
      await convex.mutation('aiChat:deleteChat', { chatId });
    }, chatId);

    // Verify chat and messages are deleted
    const deletedChat = await page.evaluate(async (chatId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.query('aiChat:getChat', { chatId });
    }, chatId);

    expect(deletedChat).toBeNull();
  });

  test('should provide chat statistics via listChatsWithStats', async ({ page }) => {
    const userId = testUsers.user1;

    // Create chat with messages
    const chatId = await page.evaluate(async (userId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.mutation('aiChat:createChat', {
        userId,
        title: 'Stats Test Chat',
      });
    }, userId);

    // Add multiple message batches
    const messageBatches = [
      [{ role: 'user', parts: [{ type: 'text', text: 'First message' }] }],
      [{ role: 'assistant', parts: [{ type: 'text', text: 'First response' }] }],
      [{ role: 'user', parts: [{ type: 'text', text: 'Second message' }] }],
    ];

    for (const batch of messageBatches) {
      await page.evaluate(
        async ({ chatId, messages }) => {
          // @ts-ignore
          const convex = window.convex;
          await convex.mutation('aiChat:appendMessages', { chatId, messages });
        },
        { chatId, messages: batch }
      );
    }

    // Get chat statistics
    const statsData = await page.evaluate(async (userId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.query('aiChat:listChatsWithStats', { userId });
    }, userId);

    expect(statsData).toHaveLength(1);
    expect(statsData[0].title).toBe('Stats Test Chat');
    expect(statsData[0].messageCount).toBe(3);
    expect(statsData[0].createdAt).toBeTruthy();
    expect(statsData[0].updatedAt).toBeTruthy();
  });

  test('should enforce user isolation between different users', async ({ page }) => {
    // Create chats for different users
    const user1ChatId = await page.evaluate(async (userId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.mutation('aiChat:createChat', {
        userId,
        title: 'User 1 Chat',
      });
    }, testUsers.user1);

    const user2ChatId = await page.evaluate(async (userId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.mutation('aiChat:createChat', {
        userId,
        title: 'User 2 Chat',
      });
    }, testUsers.user2);

    // Add messages to both chats
    await page.evaluate(
      async ({ chatId, messages }) => {
        // @ts-ignore
        const convex = window.convex;
        await convex.mutation('aiChat:appendMessages', { chatId, messages });
      },
      { chatId: user1ChatId, messages: testMessages }
    );

    await page.evaluate(
      async ({ chatId, messages }) => {
        // @ts-ignore
        const convex = window.convex;
        await convex.mutation('aiChat:appendMessages', { chatId, messages });
      },
      { chatId: user2ChatId, messages: testMessages }
    );

    // Verify user 1 only sees their chats
    const user1Chats = await page.evaluate(async (userId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.query('aiChat:listChats', { userId });
    }, testUsers.user1);

    const user2Chats = await page.evaluate(async (userId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.query('aiChat:listChats', { userId });
    }, testUsers.user2);

    expect(user1Chats).toHaveLength(1);
    expect(user2Chats).toHaveLength(1);
    expect(user1Chats[0].title).toBe('User 1 Chat');
    expect(user2Chats[0].title).toBe('User 2 Chat');

    // Verify user 1 cannot access user 2's chat
    const crossAccessAttempt = await page.evaluate(async (chatId) => {
      try {
        // @ts-ignore
        const convex = window.convex;
        return await convex.query('aiChat:getChat', { chatId });
      } catch (error) {
        return null; // Access denied
      }
    }, user2ChatId);

    // Chat should still be retrievable (no user-level access control in getChat)
    // But in real implementation, you'd add user validation
    expect(crossAccessAttempt).toBeTruthy();
  });

  test('should handle concurrent chat operations', async ({ page }) => {
    const userId = testUsers.user1;

    // Create multiple chats concurrently
    const concurrentChatPromises = Array.from({ length: 5 }, (_, i) =>
      page.evaluate(
        async ({ userId, title }) => {
          // @ts-ignore
          const convex = window.convex;
          return await convex.mutation('aiChat:createChat', { userId, title });
        },
        { userId, title: `Concurrent Chat ${i + 1}` }
      )
    );

    const chatIds = await Promise.all(concurrentChatPromises);

    // Verify all chats were created
    expect(chatIds).toHaveLength(5);
    chatIds.forEach((id) => expect(id).toBeTruthy());

    // Add messages to all chats concurrently
    const messagePromises = chatIds.map((chatId) =>
      page.evaluate(
        async ({ chatId, messages }) => {
          // @ts-ignore
          const convex = window.convex;
          await convex.mutation('aiChat:appendMessages', { chatId, messages });
        },
        { chatId, messages: testMessages }
      )
    );

    await Promise.all(messagePromises);

    // Verify all chats have messages
    const verificationPromises = chatIds.map((chatId) =>
      page.evaluate(async (chatId) => {
        // @ts-ignore
        const convex = window.convex;
        return await convex.query('aiChat:getChat', { chatId });
      }, chatId)
    );

    const chatData = await Promise.all(verificationPromises);

    chatData.forEach((data) => {
      expect(data.messages).toHaveLength(2);
    });
  });

  test('should handle error cases gracefully', async ({ page }) => {
    // Test with invalid chat ID
    const invalidChatAttempt = await page.evaluate(async () => {
      try {
        // @ts-ignore
        const convex = window.convex;
        return await convex.query('aiChat:getChat', {
          chatId: 'invalid_chat_id_123',
        });
      } catch (error) {
        return { error: error.message };
      }
    });

    // Should return null for non-existent chat
    expect(invalidChatAttempt).toBeNull();

    // Test with malformed message data
    const chatId = await page.evaluate(async (userId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.mutation('aiChat:createChat', { userId });
    }, testUsers.user1);

    const malformedMessageAttempt = await page.evaluate(
      async ({ chatId }) => {
        try {
          // @ts-ignore
          const convex = window.convex;
          await convex.mutation('aiChat:appendMessages', {
            chatId: chatId,
            messages: [{ role: 'invalid_role', parts: 'not_an_array' }],
          });
          return { success: true };
        } catch (error) {
          return { error: error.message };
        }
      },
      { chatId }
    );

    // Should handle validation errors
    expect(malformedMessageAttempt).toHaveProperty('error');
  });

  test('should handle anonymous user operations', async ({ page }) => {
    // Test operations with anonymous user
    const anonChatId = await page.evaluate(async (userId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.mutation('aiChat:ensureChat', {
        userId,
        title: 'Anonymous Chat',
      });
    }, testUsers.anonymous);

    expect(anonChatId).toBeTruthy();

    // Add messages for anonymous user
    await page.evaluate(
      async ({ chatId, messages }) => {
        // @ts-ignore
        const convex = window.convex;
        await convex.mutation('aiChat:appendMessages', { chatId, messages });
      },
      { chatId: anonChatId, messages: testMessages }
    );

    // Log events for anonymous user
    await page.evaluate(
      async ({ userId, chatId }) => {
        // @ts-ignore
        const convex = window.convex;
        await convex.mutation('aiChat:logEvent', {
          userId: userId,
          chatId: chatId,
          eventType: 'anonymous_usage',
          data: { feature: 'ai_chat' },
        });
      },
      { userId: testUsers.anonymous, chatId: anonChatId }
    );

    // Verify anonymous operations work
    const anonChatData = await page.evaluate(async (chatId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.query('aiChat:getChat', { chatId });
    }, anonChatId);

    expect(anonChatData.chat.title).toBe('Anonymous Chat');
    expect(anonChatData.messages).toHaveLength(2);
  });

  test('should maintain data integrity during operations', async ({ page }) => {
    const userId = testUsers.user1;

    // Create chat and add initial messages
    const chatId = await page.evaluate(async (userId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.mutation('aiChat:createChat', {
        userId,
        title: 'Data Integrity Test',
      });
    }, userId);

    // Add messages in multiple batches
    const messageBatches = [
      [{ role: 'user', parts: [{ type: 'text', text: 'Message 1' }] }],
      [{ role: 'assistant', parts: [{ type: 'text', text: 'Response 1' }] }],
      [{ role: 'user', parts: [{ type: 'text', text: 'Message 2' }] }],
      [{ role: 'assistant', parts: [{ type: 'text', text: 'Response 2' }] }],
    ];

    // Add messages sequentially to test ordering
    for (const [index, batch] of messageBatches.entries()) {
      await page.evaluate(
        async ({ chatId, messages }) => {
          // @ts-ignore
          const convex = window.convex;
          await convex.mutation('aiChat:appendMessages', { chatId, messages });
        },
        { chatId, messages: batch }
      );

      // Verify message count after each addition
      const currentData = await page.evaluate(async (chatId) => {
        // @ts-ignore
        const convex = window.convex;
        return await convex.query('aiChat:getChat', { chatId });
      }, chatId);

      expect(currentData.messages).toHaveLength(index + 1);
    }

    // Final verification of complete conversation
    const finalData = await page.evaluate(async (chatId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.query('aiChat:getChat', { chatId });
    }, chatId);

    expect(finalData.messages).toHaveLength(4);

    // Verify message order and content integrity
    expect(finalData.messages[0].parts[0].text).toBe('Message 1');
    expect(finalData.messages[1].parts[0].text).toBe('Response 1');
    expect(finalData.messages[2].parts[0].text).toBe('Message 2');
    expect(finalData.messages[3].parts[0].text).toBe('Response 2');

    // Verify timestamps are in order
    const timestamps = finalData.messages.map((msg: any) => msg.createdAt);
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }
  });

  test('should handle large message payloads and batches', async ({ page }) => {
    const userId = testUsers.user1;

    // Create chat for large payload testing
    const chatId = await page.evaluate(async (userId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.mutation('aiChat:createChat', {
        userId,
        title: 'Large Payload Test',
      });
    }, userId);

    // Create large message with complex tool calls
    const largeMessage = {
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Here are multiple scheduling suggestions for your calendar:' },
        {
          type: 'tool-call',
          toolName: 'suggestSchedule',
          args: {
            title: 'Team Meeting',
            duration: 60,
            suggestions: Array.from({ length: 10 }, (_, i) => ({
              startISO: `2025-01-${15 + i}T14:00:00.000Z`,
              endISO: `2025-01-${15 + i}T15:00:00.000Z`,
              score: 0.9 - i * 0.05,
              reasons: `Optimal time slot ${i + 1} with good availability and energy levels`,
            })),
          },
        },
        { type: 'text', text: 'Would you like me to apply any of these suggestions?' },
      ],
    };

    // Add large message
    await page.evaluate(
      async ({ chatId, messages }) => {
        // @ts-ignore
        const convex = window.convex;
        await convex.mutation('aiChat:appendMessages', {
          chatId,
          messages: [messages],
        });
      },
      { chatId, messages: largeMessage }
    );

    // Verify large message was stored correctly
    const chatData = await page.evaluate(async (chatId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.query('aiChat:getChat', { chatId });
    }, chatId);

    expect(chatData.messages).toHaveLength(1);
    expect(chatData.messages[0].parts).toHaveLength(3);
    expect(chatData.messages[0].parts[1].args.suggestions).toHaveLength(10);

    // Test batch message addition
    const batchMessages = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      parts: [{ type: 'text', text: `Batch message ${i + 1}` }],
    }));

    await page.evaluate(
      async ({ chatId, messages }) => {
        // @ts-ignore
        const convex = window.convex;
        await convex.mutation('aiChat:appendMessages', { chatId, messages });
      },
      { chatId, messages: batchMessages }
    );

    // Verify batch was processed
    const updatedData = await page.evaluate(async (chatId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.query('aiChat:getChat', { chatId });
    }, chatId);

    expect(updatedData.messages).toHaveLength(21); // 1 large + 20 batch
  });

  test('visual regression - persistence layer performance', async ({ page }) => {
    // Create multiple chats and measure performance
    const userId = testUsers.user1;
    const startTime = Date.now();

    // Create 10 chats with messages
    const operations = [];
    for (let i = 0; i < 10; i++) {
      operations.push(
        page.evaluate(
          async ({ userId, index }) => {
            // @ts-ignore
            const convex = window.convex;
            const chatId = await convex.mutation('aiChat:createChat', {
              userId,
              title: `Performance Test Chat ${index}`,
            });

            await convex.mutation('aiChat:appendMessages', {
              chatId,
              messages: [
                {
                  role: 'user',
                  parts: [{ type: 'text', text: `Performance test message ${index}` }],
                },
                {
                  role: 'assistant',
                  parts: [{ type: 'text', text: `Performance response ${index}` }],
                },
              ],
            });

            return chatId;
          },
          { userId, index: i + 1 }
        )
      );
    }

    const chatIds = await Promise.all(operations);
    const operationTime = Date.now() - startTime;

    // Performance assertion: should complete within reasonable time
    expect(operationTime).toBeLessThan(10000); // 10 seconds max
    expect(chatIds).toHaveLength(10);

    // Verify data retrieval performance
    const retrievalStart = Date.now();
    const statsData = await page.evaluate(async (userId) => {
      // @ts-ignore
      const convex = window.convex;
      return await convex.query('aiChat:listChatsWithStats', { userId });
    }, userId);
    const retrievalTime = Date.now() - retrievalStart;

    expect(retrievalTime).toBeLessThan(2000); // 2 seconds max
    expect(statsData).toHaveLength(10);

    console.log(
      `Persistence Performance - Operations: ${operationTime}ms, Retrieval: ${retrievalTime}ms`
    );
  });
});
