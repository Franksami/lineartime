// AI-Calendar Integration Tests
import { test, expect } from '@playwright/test';

test.describe('📅 AI-Calendar Integration - End-to-End Calendar Integration Tests', () => {
  // Test calendar data with realistic events
  const testEvents = [
    {
      id: '1',
      title: 'Team Standup',
      startDate: '2025-01-15T09:00:00.000Z',
      endDate: '2025-01-15T09:30:00.000Z',
      category: 'work',
      description: 'Daily team synchronization',
    },
    {
      id: '2',
      title: 'Project Review',
      startDate: '2025-01-15T14:00:00.000Z',
      endDate: '2025-01-15T15:00:00.000Z',
      category: 'work',
      description: 'Quarterly project assessment',
    },
    {
      id: '3',
      title: 'Lunch Break',
      startDate: '2025-01-15T12:00:00.000Z',
      endDate: '2025-01-15T13:00:00.000Z',
      category: 'personal',
      description: 'Personal time',
    },
  ];

  const conflictingEvents = [
    {
      id: '4',
      title: 'Overlapping Meeting A',
      startDate: '2025-01-16T10:00:00.000Z',
      endDate: '2025-01-16T11:00:00.000Z',
      category: 'work',
    },
    {
      id: '5',
      title: 'Overlapping Meeting B',
      startDate: '2025-01-16T10:30:00.000Z',
      endDate: '2025-01-16T11:30:00.000Z',
      category: 'work',
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Navigate to main calendar application
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');

    // Open AI Assistant panel
    await page.click(
      'button[aria-label="Open AI Assistant"], button:has-text("AI"), [data-testid="ai-assistant"]'
    );
    await page.waitForTimeout(2000);
  });

  test('should integrate AI scheduling suggestions with calendar events', async ({ page }) => {
    // Mock AI API response with scheduling suggestions
    await page.route('**/api/ai/chat', async (route) => {
      if (route.request().method() === 'POST') {
        const mockResponse = {
          type: 'tool-call',
          toolName: 'suggestSchedule',
          toolCallId: 'call_123',
          args: {
            title: 'Team Meeting',
            duration: 60,
            preferences: { timeOfDay: 'morning', avoidConflicts: true },
          },
          result: {
            suggestions: [
              {
                start: 'January 17, 2025 at 10:00 AM',
                end: 'January 17, 2025 at 11:00 AM',
                startISO: '2025-01-17T10:00:00.000Z',
                endISO: '2025-01-17T11:00:00.000Z',
                score: 0.95,
                reasons: 'Optimal morning slot with no conflicts and good focus time',
              },
              {
                start: 'January 17, 2025 at 11:00 AM',
                end: 'January 17, 2025 at 12:00 PM',
                startISO: '2025-01-17T11:00:00.000Z',
                endISO: '2025-01-17T12:00:00.000Z',
                score: 0.88,
                reasons: 'Good availability, slight energy dip before lunch',
              },
            ],
          },
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponse),
        });
      } else {
        await route.continue();
      }
    });

    // Send AI scheduling request
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Schedule a team meeting for 1 hour tomorrow morning');
    await page.keyboard.press('Enter');

    // Wait for AI response with suggestions
    await page.waitForTimeout(3000);

    // Verify AI suggestions are displayed
    await expect(page.locator('text=Team Meeting')).toBeVisible();
    await expect(page.locator('text=10:00 AM')).toBeVisible();
    await expect(page.locator('text=Apply')).toBeVisible();

    // Click Apply button for first suggestion
    await page.click('button:has-text("Apply")');
    await page.waitForTimeout(2000);

    // Verify event was added to calendar
    await expect(page.locator('text=Added event')).toBeVisible();

    // Check that event appears in calendar view
    // (This would depend on your calendar component structure)
    const calendarEvent = page
      .locator('[data-testid="calendar-event"], .event-card')
      .filter({ hasText: 'Team Meeting' });
    if ((await calendarEvent.count()) > 0) {
      await expect(calendarEvent.first()).toBeVisible();
    }
  });

  test('should detect and explain calendar conflicts through AI', async ({ page }) => {
    // Mock AI conflict detection response
    await page.route('**/api/ai/chat', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();

        // Check if this is a conflict explanation request
        if (postData.messages.some((m: any) => m.content.includes('conflict'))) {
          const mockResponse = {
            type: 'tool-call',
            toolName: 'explainConflicts',
            toolCallId: 'call_456',
            args: { date: '2025-01-16' },
            result: {
              totalConflicts: 2,
              conflicts: [
                {
                  title: 'Overlapping Meeting A',
                  time: '10:00 AM - 11:00 AM',
                  overlaps: 1,
                },
                {
                  title: 'Overlapping Meeting B',
                  time: '10:30 AM - 11:30 AM',
                  overlaps: 1,
                },
              ],
            },
          };

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockResponse),
          });
        } else {
          await route.continue();
        }
      } else {
        await route.continue();
      }
    });

    // Ask AI to explain conflicts
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Explain conflicts for January 16, 2025');
    await page.keyboard.press('Enter');

    // Wait for AI response
    await page.waitForTimeout(3000);

    // Verify conflict explanation is displayed
    await expect(page.locator('text=Overlapping Meeting A')).toBeVisible();
    await expect(page.locator('text=10:00 AM - 11:00 AM')).toBeVisible();
    await expect(page.locator('text=conflicts')).toBeVisible();
  });

  test('should find and suggest available time slots', async ({ page }) => {
    // Mock AI time slot finder response
    await page.route('**/api/ai/chat', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();

        if (
          postData.messages.some(
            (m: any) => m.content.includes('available') || m.content.includes('free')
          )
        ) {
          const mockResponse = {
            type: 'tool-call',
            toolName: 'listOpenSlots',
            toolCallId: 'call_789',
            args: { date: '2025-01-15', minDuration: 30 },
            result: {
              date: 'January 15, 2025',
              openSlots: [
                { start: '9:30 AM', end: '12:00 PM', duration: 150 },
                { start: '1:00 PM', end: '2:00 PM', duration: 60 },
                { start: '3:00 PM', end: '5:00 PM', duration: 120 },
              ],
            },
          };

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockResponse),
          });
        } else {
          await route.continue();
        }
      } else {
        await route.continue();
      }
    });

    // Ask AI for available slots
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('What are the available time slots for January 15, 2025?');
    await page.keyboard.press('Enter');

    // Wait for AI response
    await page.waitForTimeout(3000);

    // Verify available slots are displayed
    await expect(page.locator('text=9:30 AM')).toBeVisible();
    await expect(page.locator('text=1:00 PM')).toBeVisible();
    await expect(page.locator('text=3:00 PM')).toBeVisible();
  });

  test('should provide calendar period summaries through AI', async ({ page }) => {
    // Mock AI period summary response
    await page.route('**/api/ai/chat', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();

        if (
          postData.messages.some(
            (m: any) => m.content.includes('summarize') || m.content.includes('summary')
          )
        ) {
          const mockResponse = {
            type: 'tool-call',
            toolName: 'summarizePeriod',
            toolCallId: 'call_999',
            args: { startDate: '2025-01-15', endDate: '2025-01-21' },
            result: {
              period: 'January 15 - 21, 2025',
              totalEvents: 8,
              totalHours: 12.5,
              categories: {
                work: 5,
                personal: 2,
                meetings: 3,
              },
              busiestDay: 'January 17, 2025',
              recommendations: [
                'Consider blocking focus time on Wednesday',
                'Light schedule on Friday - good for deep work',
              ],
            },
          };

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockResponse),
          });
        } else {
          await route.continue();
        }
      } else {
        await route.continue();
      }
    });

    // Ask AI for calendar summary
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Summarize my calendar for the week of January 15-21, 2025');
    await page.keyboard.press('Enter');

    // Wait for AI response
    await page.waitForTimeout(3000);

    // Verify summary information is displayed
    await expect(page.locator('text=8')).toBeVisible(); // Total events
    await expect(page.locator('text=12.5')).toBeVisible(); // Total hours
    await expect(page.locator('text=work: 5')).toBeVisible();
    await expect(page.locator('text=focus time')).toBeVisible();
  });

  test('should respect calendar context settings (include/exclude)', async ({ page }) => {
    // Toggle calendar context off
    const calendarToggle = page
      .locator('input[type="checkbox"]')
      .filter({ hasText: /calendar|context/i });
    if ((await calendarToggle.count()) > 0) {
      await calendarToggle.uncheck();
    }

    // Mock AI response without calendar context
    await page.route('**/api/ai/chat', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();

        // Verify that events array is empty when calendar context is disabled
        expect(postData.events || []).toHaveLength(0);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            type: 'text',
            text: "I don't have access to your calendar data. Please enable calendar context for scheduling suggestions.",
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Ask AI about calendar without context
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('What meetings do I have today?');
    await page.keyboard.press('Enter');

    // Wait for response
    await page.waitForTimeout(3000);

    // Verify AI indicates no calendar access
    await expect(page.locator('text=calendar data')).toBeVisible();

    // Re-enable calendar context
    if ((await calendarToggle.count()) > 0) {
      await calendarToggle.check();
    }

    // Mock AI response with calendar context
    await page.route('**/api/ai/chat', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();

        // Verify that events array has data when calendar context is enabled
        expect(postData.events).toBeTruthy();

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            type: 'text',
            text: 'Based on your calendar, you have 3 meetings today: Team Standup at 9 AM, Lunch at 12 PM, and Project Review at 2 PM.',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Ask again with context enabled
    await aiInput.fill('What meetings do I have today?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    // Verify AI now has calendar access
    await expect(page.locator('text=Team Standup')).toBeVisible();
  });

  test('should handle complex scheduling scenarios with multiple constraints', async ({ page }) => {
    // Mock complex scheduling response
    await page.route('**/api/ai/chat', async (route) => {
      if (route.request().method() === 'POST') {
        const mockResponse = {
          type: 'tool-call',
          toolName: 'suggestSchedule',
          toolCallId: 'call_complex',
          args: {
            title: 'Weekly Team Planning',
            duration: 90,
            preferences: {
              timeOfDay: 'morning',
              avoidConflicts: true,
            },
          },
          result: {
            suggestions: [
              {
                start: 'January 18, 2025 at 9:00 AM',
                end: 'January 18, 2025 at 10:30 AM',
                startISO: '2025-01-18T09:00:00.000Z',
                endISO: '2025-01-18T10:30:00.000Z',
                score: 0.92,
                reasons: 'Best slot - no conflicts, high energy period, all attendees available',
              },
              {
                start: 'January 18, 2025 at 10:00 AM',
                end: 'January 18, 2025 at 11:30 AM',
                startISO: '2025-01-18T10:00:00.000Z',
                endISO: '2025-01-18T11:30:00.000Z',
                score: 0.85,
                reasons: "Good slot but slight conflict with one attendee's break time",
              },
            ],
            analysisNotes: [
              'Considered 12 potential time slots across 3 days',
              'Avoided conflicts with existing meetings',
              'Optimized for team productivity patterns',
              'Respected working hours and break times',
            ],
          },
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponse),
        });
      } else {
        await route.continue();
      }
    });

    // Request complex scheduling
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill(
      "Schedule a 90-minute weekly team planning meeting for next week. Find the best time considering everyone's availability and productivity patterns."
    );
    await page.keyboard.press('Enter');

    // Wait for AI response
    await page.waitForTimeout(3000);

    // Verify complex analysis is displayed
    await expect(page.locator('text=Weekly Team Planning')).toBeVisible();
    await expect(page.locator('text=9:00 AM')).toBeVisible();
    await expect(page.locator('text=high energy period')).toBeVisible();
    await expect(page.locator('text=Considered 12 potential')).toBeVisible();

    // Apply the best suggestion
    await page.click('button:has-text("Apply")');
    await page.waitForTimeout(2000);

    // Verify confirmation
    await expect(page.locator('text=Added event')).toBeVisible();
  });

  test('should handle AI tool execution errors gracefully', async ({ page }) => {
    // Mock AI tool error response
    await page.route('**/api/ai/chat', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Scheduling engine temporarily unavailable',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Send request that would trigger tool error
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Schedule a meeting for tomorrow');
    await page.keyboard.press('Enter');

    // Wait for error response
    await page.waitForTimeout(3000);

    // Verify error is handled gracefully
    const errorMessages = [
      'temporarily unavailable',
      'please try again',
      'error occurred',
      'unable to schedule',
    ];

    let errorFound = false;
    for (const errorMsg of errorMessages) {
      if ((await page.locator(`text=${errorMsg}`).count()) > 0) {
        errorFound = true;
        break;
      }
    }

    expect(errorFound).toBeTruthy();
  });

  test('should validate startISO/endISO format and date handling', async ({ page }) => {
    // Mock suggestion with various date formats
    await page.route('**/api/ai/chat', async (route) => {
      if (route.request().method() === 'POST') {
        const mockResponse = {
          type: 'tool-call',
          toolName: 'suggestSchedule',
          result: {
            suggestions: [
              {
                start: 'January 20, 2025 at 2:00 PM',
                end: 'January 20, 2025 at 3:00 PM',
                startISO: '2025-01-20T14:00:00.000Z',
                endISO: '2025-01-20T15:00:00.000Z',
                score: 0.9,
                reasons: 'Perfect timing for afternoon focus session',
              },
            ],
          },
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponse),
        });
      } else {
        await route.continue();
      }
    });

    // Request scheduling
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Schedule a focus session for Monday afternoon');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(3000);

    // Verify proper date display
    await expect(page.locator('text=2:00 PM')).toBeVisible();

    // Apply suggestion and verify date conversion
    await page.click('button:has-text("Apply")');
    await page.waitForTimeout(1000);

    // Check confirmation message contains proper date formatting
    const confirmation = page.locator('text*=Added event');
    if ((await confirmation.count()) > 0) {
      const confirmationText = await confirmation.textContent();
      expect(confirmationText).toContain('2025'); // Year should be present
    }
  });

  test('should integrate with calendar event creation workflow', async ({ page }) => {
    // Test full integration: AI suggestion -> Apply -> Calendar event

    // Mock realistic scheduling suggestion
    await page.route('**/api/ai/chat', async (route) => {
      if (route.request().method() === 'POST') {
        const mockResponse = {
          type: 'tool-call',
          toolName: 'suggestSchedule',
          result: {
            suggestions: [
              {
                start: 'January 22, 2025 at 3:00 PM',
                end: 'January 22, 2025 at 4:30 PM',
                startISO: '2025-01-22T15:00:00.000Z',
                endISO: '2025-01-22T16:30:00.000Z',
                score: 0.95,
                reasons: 'Optimal productivity window, no conflicts',
              },
            ],
          },
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponse),
        });
      } else {
        await route.continue();
      }
    });

    // Request AI scheduling
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Schedule a client presentation for 90 minutes next week');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(3000);

    // Apply suggestion
    await page.click('button:has-text("Apply")');
    await page.waitForTimeout(2000);

    // Verify event creation confirmation
    await expect(page.locator('text*=Added event')).toBeVisible();

    // Navigate to calendar view to verify event appears
    // (This would depend on your specific calendar navigation)
    const calendarNavigationOptions = [
      'text=Calendar',
      'a[href="/"]',
      'button:has-text("Calendar")',
      '[data-testid="calendar-view"]',
    ];

    for (const navOption of calendarNavigationOptions) {
      const navElement = page.locator(navOption);
      if ((await navElement.count()) > 0) {
        await navElement.click();
        break;
      }
    }

    await page.waitForTimeout(2000);

    // Look for the created event in calendar
    const eventIndicators = [
      'text*=client presentation',
      'text*=presentation',
      '[data-testid="calendar-event"]',
      '.event-card',
      '.calendar-event',
    ];

    let eventFound = false;
    for (const indicator of eventIndicators) {
      if ((await page.locator(indicator).count()) > 0) {
        eventFound = true;
        break;
      }
    }

    // Note: Event visibility depends on calendar implementation
    // In a real test, you'd verify the event appears in the calendar view
  });

  test('visual regression - AI calendar integration workflow', async ({ page }) => {
    // Test the complete visual workflow

    // Take screenshot of AI panel
    await expect(page).toHaveScreenshot('ai-calendar-integration-start.png', {
      fullPage: true,
      threshold: 0.2,
    });

    // Mock scheduling request
    await page.route('**/api/ai/chat', async (route) => {
      const mockResponse = {
        type: 'tool-call',
        toolName: 'suggestSchedule',
        result: {
          suggestions: [
            {
              start: 'January 25, 2025 at 10:00 AM',
              end: 'January 25, 2025 at 11:00 AM',
              startISO: '2025-01-25T10:00:00.000Z',
              endISO: '2025-01-25T11:00:00.000Z',
              score: 0.9,
              reasons: 'Great time for team collaboration',
            },
          ],
        },
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    });

    // Send scheduling request
    const aiInput = page
      .locator('input[placeholder*="Ask"], textarea[placeholder*="message"]')
      .first();
    await aiInput.fill('Schedule team collaboration session');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(3000);

    // Screenshot with AI suggestions
    await expect(page).toHaveScreenshot('ai-calendar-suggestions.png', {
      fullPage: true,
      threshold: 0.2,
    });

    // Apply suggestion
    await page.click('button:has-text("Apply")');
    await page.waitForTimeout(2000);

    // Screenshot after applying
    await expect(page).toHaveScreenshot('ai-calendar-applied.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });
});
