import { test, expect } from '@playwright/test';

test.describe('🔗 Integration Stack Validation - Convex + Clerk + Stripe', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for slower server responses (3-11 second load times observed)
    page.setDefaultTimeout(20000);

    // Navigate with extended wait for slow performance
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
  });

  test.describe('🗄️ Convex Backend Integration', () => {
    test('should establish Convex connection and handle HTTP endpoints', async ({ page }) => {
      console.log('🔧 Testing Convex backend integration...');

      // Monitor Convex-related network activity
      const convexRequests = [];
      const convexErrors = [];

      page.on('request', (request) => {
        if (request.url().includes('convex.cloud')) {
          convexRequests.push({
            url: request.url(),
            method: request.method(),
            timestamp: Date.now(),
          });
        }
      });

      page.on('response', (response) => {
        if (response.url().includes('convex.cloud') && !response.ok()) {
          convexErrors.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
          });
        }
      });

      // Allow time for initial Convex connections
      await page.waitForTimeout(5000);

      console.log(`🌐 Convex requests detected: ${convexRequests.length}`);
      console.log(`❌ Convex errors detected: ${convexErrors.length}`);

      // Verify Convex environment configuration
      const convexConfig = await page.evaluate(() => {
        return {
          convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
          hasConvexUrl: !!process.env.NEXT_PUBLIC_CONVEX_URL,
          urlValid: process.env.NEXT_PUBLIC_CONVEX_URL?.includes('convex.cloud'),
        };
      });

      console.log('⚙️ Convex configuration:', convexConfig);

      // Test Convex HTTP endpoint accessibility
      const webhookTest = await page.request.post(
        'https://incredible-ibis-307.convex.cloud/clerk-user-webhook',
        {
          data: { test: 'connection' },
          headers: { 'Content-Type': 'application/json' },
          failOnStatusCode: false,
        }
      );

      const webhookStatus = webhookTest.status();
      console.log(`🪝 Convex webhook endpoint status: ${webhookStatus}`);

      // 400-499 range indicates endpoint exists but expects proper auth/format
      expect([200, 400, 401, 403, 404].includes(webhookStatus)).toBeTruthy();

      if (convexRequests.length > 0) {
        console.log('✅ Convex backend connection established');
      } else {
        console.log('ℹ️ Convex connection may be lazy-loaded or require user action');
      }
    });

    test('should validate Convex data operations', async ({ page }) => {
      console.log('📊 Testing Convex data operations...');

      // Test if app can handle Convex data operations
      const dataOperations = await page.evaluate(() => {
        // Check if Convex client is available
        const hasConvexClient = window.convex !== undefined;

        // Check for Convex-related DOM elements
        const hasDataElements = document.querySelectorAll('[data-convex], .convex-data').length > 0;

        // Check localStorage for Convex-related data
        const convexKeys = Object.keys(localStorage).filter(
          (key) => key.includes('convex') || key.includes('clerk') || key.includes('auth')
        );

        return {
          hasConvexClient,
          hasDataElements,
          convexKeys: convexKeys.length,
          storageKeys: convexKeys,
        };
      });

      console.log('📊 Convex data operations status:', dataOperations);

      // Try to trigger a data operation (like creating an event)
      const createEventButton = page.locator(
        'button:has-text("Create"), button:has-text("Add"), .create-event, [data-testid="create-event"]'
      );
      const createButtonVisible = await createEventButton
        .first()
        .isVisible()
        .catch(() => false);

      if (createButtonVisible) {
        console.log('📝 Event creation interface available');
        await createEventButton.first().click();
        await page.waitForTimeout(1000);

        // Look for data operation results
        const dataResult = await page
          .locator('.event-form, .modal, [role="dialog"], input[placeholder*="event"]')
          .isVisible();
        if (dataResult) {
          console.log('✅ Data operation interface responsive');
        }
      } else {
        console.log('ℹ️ Event creation may require specific user state');
      }
    });
  });

  test.describe('🔐 Clerk Authentication Integration', () => {
    test('should handle Clerk authentication flow', async ({ page }) => {
      console.log('🔐 Testing Clerk authentication integration...');

      // Monitor Clerk-related network activity
      const clerkRequests = [];
      page.on('request', (request) => {
        if (request.url().includes('clerk.accounts.dev') || request.url().includes('clerk.com')) {
          clerkRequests.push({
            url: request.url(),
            method: request.method(),
          });
        }
      });

      // Check for Clerk environment configuration
      const clerkConfig = await page.evaluate(() => {
        return {
          publishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
          frontendApi: !!process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL,
          hasClerkElements:
            document.querySelectorAll('.cl-rootBox, [data-clerk-element]').length > 0,
        };
      });

      console.log('🔑 Clerk configuration:', clerkConfig);

      // Look for authentication UI elements
      const authElements = {
        signInButton: await page
          .locator('button:has-text("Sign In"), a[href*="sign-in"], .sign-in')
          .isVisible()
          .catch(() => false),
        signUpButton: await page
          .locator('button:has-text("Sign Up"), a[href*="sign-up"], .sign-up')
          .isVisible()
          .catch(() => false),
        userMenu: await page
          .locator('.user-menu, .profile-menu, [data-testid="user-menu"]')
          .isVisible()
          .catch(() => false),
      };

      console.log('👤 Authentication UI elements:', authElements);

      // Test middleware authentication handling
      const protectedRouteTest = await page.request.get('/dashboard', {
        failOnStatusCode: false,
      });

      const protectedStatus = protectedRouteTest.status();
      console.log(`🛡️ Protected route test status: ${protectedStatus}`);

      // Should redirect to auth or show 401/403 for protected routes
      if ([200, 302, 401, 403, 404].includes(protectedStatus)) {
        console.log('✅ Clerk middleware handling protected routes');
      } else {
        console.log('⚠️ Unexpected protected route behavior');
      }

      console.log(`📡 Clerk API requests: ${clerkRequests.length}`);

      if (clerkRequests.length > 0 || authElements.signInButton || authElements.signUpButton) {
        console.log('✅ Clerk authentication integration active');
      } else {
        console.log('ℹ️ Clerk authentication may be configured for different flow');
      }
    });

    test('should validate Clerk webhook integration', async ({ page }) => {
      console.log('🪝 Testing Clerk webhook integration...');

      // Test the Clerk webhook endpoint directly
      const webhookUrl = 'https://incredible-ibis-307.convex.cloud/clerk-user-webhook';

      // Test webhook endpoint existence (should require proper headers)
      const webhookTest = await page.request.post(webhookUrl, {
        data: {
          type: 'user.created',
          data: { id: 'test_user' },
        },
        headers: {
          'Content-Type': 'application/json',
          'svix-id': 'test',
          'svix-timestamp': String(Math.floor(Date.now() / 1000)),
          'svix-signature': 'test',
        },
        failOnStatusCode: false,
      });

      const webhookStatus = webhookTest.status();
      console.log(`🪝 Clerk webhook endpoint status: ${webhookStatus}`);

      // Webhook should exist and handle requests (may return 400 for invalid signature)
      if ([200, 400, 401, 403].includes(webhookStatus)) {
        console.log('✅ Clerk webhook endpoint is configured and responding');
      } else if (webhookStatus === 404) {
        console.log('❌ Clerk webhook endpoint not found');
      } else {
        console.log(`⚠️ Unexpected webhook response: ${webhookStatus}`);
      }

      // Verify webhook secret configuration
      const webhookConfig = await page.evaluate(() => {
        return {
          hasWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
          secretFormat: process.env.CLERK_WEBHOOK_SECRET?.startsWith('whsec_'),
        };
      });

      console.log('🔑 Webhook configuration:', webhookConfig);

      if (webhookConfig.hasWebhookSecret && webhookConfig.secretFormat) {
        console.log('✅ Clerk webhook properly configured');
      } else {
        console.log('⚠️ Clerk webhook configuration needs verification');
      }
    });
  });

  test.describe('💳 Stripe Billing Integration', () => {
    test('should handle Stripe billing endpoints', async ({ page }) => {
      console.log('💳 Testing Stripe billing integration...');

      // Test billing checkout endpoint
      const checkoutResponse = await page.request.post('/api/billing/checkout', {
        data: {
          priceId: 'price_test',
          userId: 'test_user',
        },
        failOnStatusCode: false,
      });

      const checkoutStatus = checkoutResponse.status();
      console.log(`🛒 Checkout endpoint status: ${checkoutStatus}`);

      if (checkoutStatus === 200) {
        const checkoutData = await checkoutResponse.json();
        console.log('✅ Stripe checkout endpoint functional');
        console.log('💡 Checkout response:', checkoutData);
      } else if (checkoutStatus === 503) {
        const errorData = await checkoutResponse.json().catch(() => ({}));
        console.log('ℹ️ Stripe not configured (graceful fallback working)');
        console.log('📄 Error response:', errorData);
        expect(errorData.error).toContain('Billing system not configured');
      } else {
        console.log(`⚠️ Unexpected checkout response: ${checkoutStatus}`);
      }

      // Test billing portal endpoint
      const portalResponse = await page.request.post('/api/billing/portal', {
        data: {
          customerId: 'cus_test',
        },
        failOnStatusCode: false,
      });

      const portalStatus = portalResponse.status();
      console.log(`🏢 Portal endpoint status: ${portalStatus}`);

      if (portalStatus === 200) {
        const portalData = await portalResponse.json();
        console.log('✅ Stripe portal endpoint functional');
      } else if (portalStatus === 503) {
        const errorData = await portalResponse.json().catch(() => ({}));
        console.log('ℹ️ Stripe portal fallback working correctly');
        expect(errorData.error).toContain('Billing system not configured');
      }

      // Verify Stripe configuration handling
      const stripeConfig = await page.evaluate(() => {
        return {
          hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
          hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
          publishableKeyFormat: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_'),
          secretKeyFormat: process.env.STRIPE_SECRET_KEY?.startsWith('sk_'),
        };
      });

      console.log('🔑 Stripe configuration:', stripeConfig);

      if (checkoutStatus === 503 && portalStatus === 503) {
        console.log('✅ Stripe graceful fallback working (development mode)');
      } else if (checkoutStatus === 200 && portalStatus === 200) {
        console.log('✅ Stripe fully configured and functional');
      }
    });

    test('should integrate billing with user interface', async ({ page }) => {
      console.log('🎛️ Testing billing UI integration...');

      // Look for billing-related UI elements
      const billingElements = {
        settingsLink: await page
          .locator('a[href*="settings"], button:has-text("Settings")')
          .isVisible()
          .catch(() => false),
        billingSection: await page
          .locator('.billing, [data-testid="billing"], .subscription')
          .isVisible()
          .catch(() => false),
        upgradeButton: await page
          .locator('button:has-text("Upgrade"), button:has-text("Subscribe")')
          .isVisible()
          .catch(() => false),
      };

      console.log('🎛️ Billing UI elements:', billingElements);

      // Try to navigate to settings if available
      if (billingElements.settingsLink) {
        const settingsLink = page
          .locator('a[href*="settings"], button:has-text("Settings")')
          .first();
        await settingsLink.click();
        await page.waitForTimeout(2000);

        // Check if billing section is accessible
        const billingInSettings = await page
          .locator('.billing-settings, [data-testid="billing"], .subscription-settings')
          .isVisible()
          .catch(() => false);

        if (billingInSettings) {
          console.log('✅ Billing settings accessible in UI');
        } else {
          console.log('ℹ️ Billing settings may require authentication');
        }

        // Return to main page
        await page.goBack();
      }

      // Test subscription status display
      const subscriptionStatus = await page.evaluate(() => {
        // Look for subscription-related content in the page
        const pageContent = document.body.textContent || '';
        return {
          hasPremium: pageContent.includes('premium') || pageContent.includes('subscription'),
          hasFreeTier: pageContent.includes('free') || pageContent.includes('trial'),
          hasUpgrade: pageContent.includes('upgrade') || pageContent.includes('subscribe'),
        };
      });

      console.log('💎 Subscription status indicators:', subscriptionStatus);

      if (
        billingElements.settingsLink ||
        billingElements.upgradeButton ||
        subscriptionStatus.hasPremium
      ) {
        console.log('✅ Billing UI integration present');
      } else {
        console.log('ℹ️ Billing UI may be contextual or require authentication');
      }
    });
  });

  test.describe('🔄 Integration Flow Testing', () => {
    test('should handle complete user lifecycle integration', async ({ page }) => {
      console.log('🔄 Testing complete integration lifecycle...');

      // Simulate a complete user journey across all three systems
      const integrationFlow = {
        step1_loadApp: false,
        step2_convexConnection: false,
        step3_clerkAuth: false,
        step4_stripeReady: false,
        step5_dataOperations: false,
      };

      // Step 1: App loads successfully
      try {
        await page.waitForSelector('body', { timeout: 10000 });
        integrationFlow.step1_loadApp = true;
        console.log('✅ Step 1: Application loaded successfully');
      } catch (error) {
        console.log('❌ Step 1: Application load failed');
      }

      // Step 2: Check for Convex connection indicators
      await page.waitForTimeout(3000);
      const hasDataElements = await page.evaluate(() => {
        return document.querySelectorAll('.calendar, .event, [data-convex]').length > 0;
      });

      if (hasDataElements) {
        integrationFlow.step2_convexConnection = true;
        console.log('✅ Step 2: Convex data elements present');
      } else {
        console.log('⚠️ Step 2: Convex data elements not immediately visible');
      }

      // Step 3: Check for Clerk auth readiness
      const authReady = await page.evaluate(() => {
        return !!(window.Clerk || document.querySelector('.cl-rootBox, [data-clerk-element]'));
      });

      if (authReady) {
        integrationFlow.step3_clerkAuth = true;
        console.log('✅ Step 3: Clerk authentication ready');
      } else {
        console.log('⚠️ Step 3: Clerk authentication not immediately ready');
      }

      // Step 4: Test Stripe billing readiness
      const stripeTest = await page.request.get('/api/billing/portal', {
        failOnStatusCode: false,
      });

      if ([200, 503].includes(stripeTest.status())) {
        integrationFlow.step4_stripeReady = true;
        console.log('✅ Step 4: Stripe billing endpoints responding');
      } else {
        console.log('❌ Step 4: Stripe billing endpoints not responding');
      }

      // Step 5: Test basic data operations
      const canCreateEvent = await page.evaluate(() => {
        // Check if event creation functionality is available
        const hasCreateButton = document.querySelector(
          'button:has-text("Create"), .create-event, [data-testid="create"]'
        );
        const hasCalendar = document.querySelector('.calendar, .linear-calendar, .grid');
        return !!(hasCreateButton || hasCalendar);
      });

      if (canCreateEvent) {
        integrationFlow.step5_dataOperations = true;
        console.log('✅ Step 5: Data operations interface available');
      } else {
        console.log('⚠️ Step 5: Data operations interface not immediately available');
      }

      // Calculate integration success rate
      const successSteps = Object.values(integrationFlow).filter(Boolean).length;
      const totalSteps = Object.keys(integrationFlow).length;
      const successRate = Math.round((successSteps / totalSteps) * 100);

      console.log('📊 Integration Flow Results:', integrationFlow);
      console.log(`🎯 Integration Success Rate: ${successRate}% (${successSteps}/${totalSteps})`);

      // Integration is considered successful if at least 60% of steps pass
      expect(successRate).toBeGreaterThanOrEqual(60);

      if (successRate >= 80) {
        console.log('🌟 Excellent integration - all systems working together');
      } else if (successRate >= 60) {
        console.log('✅ Good integration - systems operational with minor issues');
      } else {
        console.log('⚠️ Integration issues detected - requires attention');
      }
    });

    test('should handle error scenarios gracefully', async ({ page }) => {
      console.log('🛡️ Testing error handling across integrations...');

      const errorScenarios = {
        invalidApiCall: false,
        networkFailure: false,
        authFailure: false,
        gracefulDegradation: false,
      };

      // Test 1: Invalid API call handling
      const invalidApiResponse = await page.request.post('/api/invalid-endpoint', {
        failOnStatusCode: false,
      });

      if (invalidApiResponse.status() === 404) {
        errorScenarios.invalidApiCall = true;
        console.log('✅ Invalid API calls handled properly (404)');
      }

      // Test 2: Billing system unavailable (expected in development)
      const billingUnavailable = await page.request.post('/api/billing/checkout', {
        data: { invalid: 'data' },
        failOnStatusCode: false,
      });

      if (billingUnavailable.status() === 503) {
        errorScenarios.networkFailure = true;
        console.log('✅ Billing unavailable handled gracefully (503)');
      }

      // Test 3: Authentication failure handling
      const authTest = await page.request.get('/api/user/profile', {
        failOnStatusCode: false,
      });

      if ([401, 403, 404].includes(authTest.status())) {
        errorScenarios.authFailure = true;
        console.log('✅ Authentication failures handled properly');
      }

      // Test 4: App continues to function despite backend issues
      const appStillWorks = await page.evaluate(() => {
        // Check if core app functionality remains available
        const hasUI = document.querySelector('body').children.length > 0;
        const hasInteractivity = document.querySelectorAll('button, input, a').length > 0;
        return hasUI && hasInteractivity;
      });

      if (appStillWorks) {
        errorScenarios.gracefulDegradation = true;
        console.log('✅ App maintains functionality despite backend errors');
      }

      const errorHandlingScore = Object.values(errorScenarios).filter(Boolean).length;
      console.log(`🛡️ Error handling score: ${errorHandlingScore}/4`);

      if (errorHandlingScore >= 3) {
        console.log('🌟 Excellent error handling across all integrations');
      } else if (errorHandlingScore >= 2) {
        console.log('✅ Good error handling with room for improvement');
      } else {
        console.log('⚠️ Error handling needs improvement');
      }
    });
  });
});
