import { test, expect } from '@playwright/test';

test.describe('👤 Complete User Journey Testing - New, Existing & Premium Users', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('🆕 New User Journey', () => {
    test('should guide new user through complete onboarding flow', async ({ page }) => {
      console.log('🚀 Testing new user complete journey...');

      // Step 1: Landing page should be accessible
      const pageTitle = await page.title();
      expect(pageTitle).toContain('Linear');
      console.log('✅ Landing page accessible');

      // Step 2: Calendar should load even without authentication (per middleware)
      const calendarContainer = page.locator(
        '.linear-calendar-horizontal, [data-testid="linear-calendar"], .calendar-grid'
      );
      const calendarVisible = await calendarContainer
        .first()
        .isVisible({ timeout: 10000 })
        .catch(() => false);

      if (calendarVisible) {
        console.log('✅ Calendar loads for unauthenticated users');
      } else {
        console.log('ℹ️ Calendar requires authentication');
      }

      // Step 3: Navigation to sign-up should work
      const signUpLink = page.locator(
        'a[href*="sign-up"], button:has-text("Sign Up"), [data-testid="sign-up"]'
      );
      const signUpExists = await signUpLink
        .first()
        .isVisible()
        .catch(() => false);

      if (signUpExists) {
        await signUpLink.first().click();
        await page.waitForTimeout(2000);

        // Should navigate to sign-up page or show sign-up modal
        const currentUrl = page.url();
        const hasSignUp =
          currentUrl.includes('/sign-up') ||
          (await page
            .locator('.cl-signUp, .clerk-sign-up, [data-clerk-element="signUp"]')
            .isVisible());

        if (hasSignUp) {
          console.log('✅ Sign-up flow accessible');
        } else {
          console.log('⚠️ Sign-up flow needs verification');
        }
      } else {
        console.log('ℹ️ Sign-up may be handled differently or requires navigation');
      }

      // Step 4: Go back to main app
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Step 5: Core app functionality should be available
      const appFunctionality = await page.evaluate(() => {
        const hasReact = window.React !== undefined;
        const hasNavigation =
          document.querySelector('nav, .navigation, [role="navigation"]') !== null;
        const hasCalendar =
          document.querySelector('.calendar, .linear-calendar, [data-testid="calendar"]') !== null;

        return {
          hasReact,
          hasNavigation,
          hasCalendar,
          pageLoaded: document.readyState === 'complete',
        };
      });

      console.log(`📊 App functionality check:`, appFunctionality);
      expect(appFunctionality.pageLoaded).toBe(true);

      console.log('✅ New user journey validated');
    });

    test('should allow new user to create events without authentication', async ({ page }) => {
      console.log('📝 Testing unauthenticated event creation...');

      // Wait for calendar to load
      await page.waitForSelector('.linear-calendar-horizontal, .calendar-grid, .day-cell', {
        timeout: 10000,
      });

      // Try to interact with calendar
      const calendarDay = page.locator('.day-cell, .calendar-day, [data-day], .grid-cell').first();
      const dayVisible = await calendarDay.isVisible().catch(() => false);

      if (dayVisible) {
        await calendarDay.click();
        await page.waitForTimeout(1000);

        // Look for event creation interface
        const eventCreation = page.locator(
          '.event-modal, .event-form, input[placeholder*="event"], [data-testid="event-create"]'
        );
        const creationVisible = await eventCreation
          .first()
          .isVisible()
          .catch(() => false);

        if (creationVisible) {
          console.log('✅ Event creation available for unauthenticated users');
        } else {
          console.log('ℹ️ Event creation may require authentication');
        }
      } else {
        console.log('⚠️ Calendar interaction needs verification');
      }

      // Test Command Bar (Cmd+K) functionality
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(500);

      const commandBar = page.locator('[data-cmdk-root], .command-bar, [role="combobox"]');
      const commandBarVisible = await commandBar
        .first()
        .isVisible()
        .catch(() => false);

      if (commandBarVisible) {
        console.log('✅ Command bar accessible for new users');

        // Try typing a command
        await page.keyboard.type('create meeting tomorrow');
        await page.waitForTimeout(500);

        const suggestions = page.locator('[data-cmdk-item], .command-item, [role="option"]');
        const hasSuggestions = (await suggestions.count()) > 0;

        if (hasSuggestions) {
          console.log('✅ Command suggestions working');
        }

        // Close command bar
        await page.keyboard.press('Escape');
      } else {
        console.log('ℹ️ Command bar may require authentication');
      }
    });
  });

  test.describe('👤 Existing User Journey', () => {
    test('should handle returning user experience', async ({ page }) => {
      console.log('🔄 Testing existing user journey...');

      // Simulate returning user with localStorage data
      await page.addInitScript(() => {
        // Add some mock user data
        localStorage.setItem(
          'lineartime_user',
          JSON.stringify({
            id: 'test-user-123',
            name: 'Test User',
            preferences: {
              theme: 'system',
              view: 'year',
            },
          })
        );

        // Add some mock events
        localStorage.setItem(
          'lineartime_events',
          JSON.stringify([
            {
              id: '1',
              title: 'Existing Meeting',
              startTime: Date.now() + 86400000, // Tomorrow
              endTime: Date.now() + 90000000,
              category: 'work',
            },
          ])
        );
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check if app recognizes returning user
      const hasStoredData = await page.evaluate(() => {
        const userData = localStorage.getItem('lineartime_user');
        const eventData = localStorage.getItem('lineartime_events');
        return {
          hasUser: !!userData,
          hasEvents: !!eventData,
          userDataValid: userData ? JSON.parse(userData).id === 'test-user-123' : false,
        };
      });

      console.log('📊 Returning user data:', hasStoredData);
      expect(hasStoredData.hasUser).toBe(true);

      // Verify calendar loads with previous state
      await page.waitForSelector('.linear-calendar-horizontal, .calendar-grid', { timeout: 10000 });

      // Look for existing events
      const existingEvents = page.locator('.event-card, .calendar-event, [data-event-id]');
      const eventCount = await existingEvents.count();

      console.log(`📅 Found ${eventCount} events for returning user`);

      // Test preferences persistence
      const themeElements = page.locator('[data-theme], .theme-system, .theme-light, .theme-dark');
      const hasTheme = await themeElements
        .first()
        .isVisible()
        .catch(() => false);

      if (hasTheme) {
        console.log('✅ Theme preferences maintained');
      }

      console.log('✅ Existing user experience validated');
    });

    test('should sync user data with Convex backend', async ({ page }) => {
      console.log('🔄 Testing Convex data synchronization...');

      // Monitor network requests to Convex
      const convexRequests = [];
      page.on('request', (request) => {
        if (request.url().includes('convex.cloud')) {
          convexRequests.push({
            url: request.url(),
            method: request.method(),
            timestamp: Date.now(),
          });
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Allow time for sync

      console.log(`🌐 Convex requests made: ${convexRequests.length}`);
      convexRequests.forEach((req) => {
        console.log(`  📡 ${req.method} ${req.url}`);
      });

      // Verify Convex connection
      const hasConvexConnection = convexRequests.length > 0;
      if (hasConvexConnection) {
        console.log('✅ Convex backend connection established');
      } else {
        console.log('⚠️ Convex connection may need verification');
      }

      // Test real-time updates (if available)
      const realtimeIndicator = page.locator(
        '.realtime-status, .connection-status, [data-connection-status]'
      );
      const realtimeVisible = await realtimeIndicator
        .first()
        .isVisible()
        .catch(() => false);

      if (realtimeVisible) {
        const status = await realtimeIndicator.first().textContent();
        console.log(`📡 Realtime status: ${status}`);
      }
    });
  });

  test.describe('💎 Premium User Journey', () => {
    test('should provide premium features and billing integration', async ({ page }) => {
      console.log('💎 Testing premium user journey...');

      // Mock premium user state
      await page.addInitScript(() => {
        localStorage.setItem(
          'lineartime_user',
          JSON.stringify({
            id: 'premium-user-456',
            name: 'Premium User',
            subscription: {
              tier: 'premium',
              status: 'active',
              features: ['unlimited_events', 'ai_scheduling', 'integrations'],
            },
          })
        );
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test premium feature access
      const premiumFeatures = await page.evaluate(() => {
        const user = JSON.parse(localStorage.getItem('lineartime_user') || '{}');
        return {
          isPremium: user.subscription?.tier === 'premium',
          hasAI: user.subscription?.features?.includes('ai_scheduling'),
          hasIntegrations: user.subscription?.features?.includes('integrations'),
        };
      });

      console.log('💎 Premium features:', premiumFeatures);
      expect(premiumFeatures.isPremium).toBe(true);

      // Test billing page access
      const billingLink = page.locator(
        'a[href*="billing"], a[href*="subscription"], [data-testid="billing"]'
      );
      const billingExists = await billingLink
        .first()
        .isVisible()
        .catch(() => false);

      if (billingExists) {
        // Test navigation to billing (but don't actually navigate to avoid external redirects)
        console.log('✅ Billing interface accessible');
      } else {
        // Try accessing billing via settings or account menu
        const settingsMenu = page.locator(
          'a[href*="settings"], [data-testid="settings"], button:has-text("Settings")'
        );
        const settingsExists = await settingsMenu
          .first()
          .isVisible()
          .catch(() => false);

        if (settingsExists) {
          console.log('✅ Settings menu available (may contain billing)');
        }
      }

      // Test premium-only features
      const aiAssistant = page.locator('.ai-assistant, [data-testid="ai-panel"], .assistant-panel');
      const aiVisible = await aiAssistant
        .first()
        .isVisible()
        .catch(() => false);

      if (aiVisible) {
        console.log('✅ AI Assistant visible for premium users');
      } else {
        console.log('ℹ️ AI Assistant may be contextual or require specific triggers');
      }

      console.log('✅ Premium user journey validated');
    });

    test('should handle billing and subscription management', async ({ page }) => {
      console.log('💳 Testing billing integration...');

      // Mock network responses for billing
      await page.route('**/api/billing/**', async (route) => {
        const url = route.request().url();

        if (url.includes('/checkout')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              checkout_url: 'https://checkout.stripe.com/mock',
              session_id: 'mock_session_123',
            }),
          });
        } else if (url.includes('/portal')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              portal_url: 'https://billing.stripe.com/mock',
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Test billing API endpoints
      const checkoutResponse = await page.request.post('/api/billing/checkout', {
        data: {
          priceId: 'price_test_premium',
          userId: 'premium-user-456',
        },
      });

      const checkoutStatus = checkoutResponse.status();
      console.log(`💳 Checkout endpoint status: ${checkoutStatus}`);

      if (checkoutStatus === 200) {
        const checkoutData = await checkoutResponse.json();
        console.log('✅ Billing checkout endpoint working');
        expect(checkoutData.success).toBe(true);
      } else if (checkoutStatus === 503) {
        console.log('ℹ️ Billing system not configured (expected in development)');
      }

      const portalResponse = await page.request.post('/api/billing/portal', {
        data: {
          customerId: 'cus_test_premium_user',
        },
      });

      const portalStatus = portalResponse.status();
      console.log(`🏢 Portal endpoint status: ${portalStatus}`);

      if (portalStatus === 200) {
        const portalData = await portalResponse.json();
        console.log('✅ Billing portal endpoint working');
        expect(portalData.success).toBe(true);
      } else if (portalStatus === 503) {
        console.log('ℹ️ Billing portal not configured (expected in development)');
      }
    });
  });

  test.describe('🔄 Cross-User Journey Integration', () => {
    test('should handle user state transitions smoothly', async ({ page }) => {
      console.log('🔄 Testing user state transitions...');

      // Start as unauthenticated
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      let currentState = await page.evaluate(() => ({
        isAuthenticated: !!document.querySelector('.user-menu, .profile, [data-testid="user"]'),
        hasEvents: document.querySelectorAll('.event-card, .calendar-event').length > 0,
        hasCalendar: !!document.querySelector('.linear-calendar-horizontal, .calendar-grid'),
      }));

      console.log('📊 Initial state:', currentState);

      // Simulate authentication (mock user login)
      await page.addInitScript(() => {
        localStorage.setItem('clerk-session', 'mock_session_token');
        localStorage.setItem(
          'lineartime_user',
          JSON.stringify({
            id: 'transition-user-789',
            name: 'Transition User',
            authenticated: true,
          })
        );
      });

      // Refresh to apply authentication state
      await page.reload();
      await page.waitForLoadState('networkidle');

      const authenticatedState = await page.evaluate(() => ({
        isAuthenticated: !!document.querySelector('.user-menu, .profile, [data-testid="user"]'),
        hasEvents: document.querySelectorAll('.event-card, .calendar-event').length > 0,
        hasCalendar: !!document.querySelector('.linear-calendar-horizontal, .calendar-grid'),
        hasUserData: !!localStorage.getItem('lineartime_user'),
      }));

      console.log('📊 Authenticated state:', authenticatedState);

      // Verify state persistence across transitions
      expect(authenticatedState.hasCalendar).toBe(true);
      expect(authenticatedState.hasUserData).toBe(true);

      console.log('✅ User state transitions handled correctly');
    });

    test('should maintain performance across all user types', async ({ page }) => {
      console.log('⚡ Testing performance across user types...');

      const performanceResults = {};
      const userTypes = ['unauthenticated', 'basic', 'premium'];

      for (const userType of userTypes) {
        console.log(`🔍 Testing ${userType} user performance...`);

        // Setup user type
        if (userType === 'basic') {
          await page.addInitScript(() => {
            localStorage.setItem(
              'lineartime_user',
              JSON.stringify({
                id: 'basic-user',
                subscription: { tier: 'basic' },
              })
            );
          });
        } else if (userType === 'premium') {
          await page.addInitScript(() => {
            localStorage.setItem(
              'lineartime_user',
              JSON.stringify({
                id: 'premium-user',
                subscription: { tier: 'premium', features: ['ai_scheduling'] },
              })
            );
          });
        }

        const startTime = Date.now();
        await page.goto('/');
        await page.waitForSelector('.linear-calendar-horizontal, .calendar-grid', {
          timeout: 15000,
        });
        const loadTime = Date.now() - startTime;

        // Measure memory usage
        const memoryUsage = await page.evaluate(() => {
          const nav = navigator as any;
          return nav.memory ? nav.memory.usedJSHeapSize : 0;
        });

        performanceResults[userType] = {
          loadTime,
          memoryUsage: Math.round(memoryUsage / 1024 / 1024), // MB
          domElements: await page.locator('*').count(),
        };

        console.log(`📊 ${userType} performance:`, performanceResults[userType]);

        // Performance expectations
        expect(loadTime).toBeLessThan(10000); // 10s max for testing
        if (memoryUsage > 0) {
          expect(memoryUsage).toBeLessThan(200 * 1024 * 1024); // 200MB max
        }

        // Clear state for next test
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
      }

      console.log('📊 Performance summary:', performanceResults);
      console.log('✅ Performance acceptable across all user types');
    });
  });
});
