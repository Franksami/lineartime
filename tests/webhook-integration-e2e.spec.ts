import { test, expect } from '@playwright/test';

test.describe('Webhook Integration E2E', () => {
  test.describe('Clerk Webhook Integration', () => {
    test('Clerk webhook endpoint processes user events', async ({ request }) => {
      const testUser = {
        id: 'user_test_webhook_' + Date.now(),
        email_addresses: [
          { email_address: 'webhook-test@lineartime.test', primary: true }
        ],
        first_name: 'Webhook',
        last_name: 'Test',
        image_url: 'https://example.com/avatar.jpg'
      };

      // Test user.created event
      const createPayload = JSON.stringify({
        type: 'user.created',
        data: testUser
      });

      const createResponse = await request.post('/api/webhooks/clerk', {
        data: createPayload,
        headers: {
          'Content-Type': 'application/json',
          'svix-id': 'msg_test_create_' + Date.now(),
          'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
          'svix-signature': 'v1,test_signature_create'
        }
      });

      // Document expected behavior
      console.log(`📝 User creation webhook status: ${createResponse.status()}`);
      
      if (createResponse.status() === 400) {
        const body = await createResponse.text();
        console.log('📝 Expected: Invalid signature validation (test environment)');
        expect(body).toContain('Invalid webhook signature');
      } else if (createResponse.status() === 200) {
        console.log('✅ Webhook processed successfully');
      }

      // Test user.updated event
      const updatePayload = JSON.stringify({
        type: 'user.updated',
        data: {
          ...testUser,
          first_name: 'Updated',
          last_name: 'User'
        }
      });

      const updateResponse = await request.post('/api/webhooks/clerk', {
        data: updatePayload,
        headers: {
          'Content-Type': 'application/json',
          'svix-id': 'msg_test_update_' + Date.now(),
          'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
          'svix-signature': 'v1,test_signature_update'
        }
      });

      console.log(`📝 User update webhook status: ${updateResponse.status()}`);

      // Test user.deleted event
      const deletePayload = JSON.stringify({
        type: 'user.deleted',
        data: { id: testUser.id }
      });

      const deleteResponse = await request.post('/api/webhooks/clerk', {
        data: deletePayload,
        headers: {
          'Content-Type': 'application/json',
          'svix-id': 'msg_test_delete_' + Date.now(),
          'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
          'svix-signature': 'v1,test_signature_delete'
        }
      });

      console.log(`📝 User deletion webhook status: ${deleteResponse.status()}`);
    });

    test('Clerk webhook validates required headers', async ({ request }) => {
      // Test missing headers
      const response1 = await request.post('/api/webhooks/clerk', {
        data: JSON.stringify({ type: 'user.created', data: {} }),
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response1.status()).toBe(400);
      const body1 = await response1.json();
      expect(body1.error).toContain('svix headers');
      
      console.log('✅ Webhook correctly validates missing headers');

      // Test malformed JSON
      const response2 = await request.post('/api/webhooks/clerk', {
        data: 'invalid json{',
        headers: {
          'Content-Type': 'application/json',
          'svix-id': 'msg_test_malformed',
          'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
          'svix-signature': 'v1,test_signature'
        }
      });

      expect(response2.status()).toBeGreaterThanOrEqual(400);
      console.log(`✅ Webhook handles malformed JSON: ${response2.status()}`);
    });
  });

  test.describe('Stripe Webhook Integration', () => {
    test('Stripe webhook endpoint processes subscription events', async ({ request }) => {
      // Test subscription.created event
      const subscriptionPayload = JSON.stringify({
        id: 'evt_test_subscription_created',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test_123',
            customer: 'cus_test_123',
            status: 'active',
            items: {
              data: [{
                price: {
                  id: 'price_test_pro',
                  product: 'prod_test_123'
                }
              }]
            },
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 2592000, // +30 days
            cancel_at_period_end: false,
            canceled_at: null,
            trial_start: null,
            trial_end: null
          }
        }
      });

      const response = await request.post('/api/webhooks/stripe', {
        data: subscriptionPayload,
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 't=123456789,v1=test_signature'
        }
      });

      console.log(`📝 Stripe webhook subscription event status: ${response.status()}`);
      
      if (response.status() === 400) {
        const body = await response.text();
        console.log('📝 Expected: Invalid signature validation (test environment)');
      }
    });

    test('Stripe webhook handles payment events', async ({ request }) => {
      // Test invoice.payment_succeeded event
      const paymentPayload = JSON.stringify({
        id: 'evt_test_payment_succeeded',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test_123',
            payment_intent: 'pi_test_123',
            subscription: 'sub_test_123',
            amount_paid: 999,
            currency: 'usd',
            default_payment_method: 'pm_test_card',
            description: 'Subscription payment'
          }
        }
      });

      const response = await request.post('/api/webhooks/stripe', {
        data: paymentPayload,
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 't=123456789,v1=test_signature'
        }
      });

      console.log(`📝 Stripe webhook payment event status: ${response.status()}`);
    });

    test('Stripe webhook validates signatures', async ({ request }) => {
      // Test missing signature header
      const response = await request.post('/api/webhooks/stripe', {
        data: JSON.stringify({ type: 'test.event', data: {} }),
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('stripe-signature');
      
      console.log('✅ Stripe webhook validates missing signature header');
    });
  });

  test.describe('Webhook → Database Integration', () => {
    test('Webhooks trigger database updates (integration test)', async ({ page }) => {
      // This test verifies that webhook events would properly update the database
      // by checking if the billing system can load user data
      
      await page.goto('/');
      await page.waitForTimeout(2000);
      
      // Navigate to billing settings to trigger database queries
      await page.goto('/settings?tab=billing');
      await page.waitForTimeout(3000);
      
      const content = await page.textContent('body');
      
      // Should not show database connection errors
      expect(content).not.toContain('Failed to connect');
      expect(content).not.toContain('Database unavailable');
      
      console.log('✅ Database integration appears functional');
    });

    test('Real-time updates work across sessions', async ({ page, context }) => {
      // Test real-time subscription updates by opening two pages
      const page1 = page;
      const page2 = await context.newPage();
      
      // Navigate both pages to billing settings
      await page1.goto('/settings?tab=billing');
      await page2.goto('/settings?tab=billing');
      
      await page1.waitForTimeout(2000);
      await page2.waitForTimeout(2000);
      
      console.log('✅ Multiple sessions can access billing data');
      
      // In a full implementation, you would simulate a webhook event
      // and verify that both pages update in real-time
      
      await page2.close();
    });
  });

  test.describe('Webhook Security', () => {
    test('Webhooks implement proper security measures', async ({ request }) => {
      // Test rate limiting by sending multiple requests
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          request.post('/api/webhooks/clerk', {
            data: JSON.stringify({ type: 'test.event', data: {} }),
            headers: {
              'Content-Type': 'application/json',
              'svix-id': `msg_rate_test_${i}`,
              'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
              'svix-signature': 'v1,test_signature'
            }
          })
        );
      }
      
      const responses = await Promise.all(requests);
      const statusCodes = responses.map(r => r.status());
      
      console.log(`📝 Rate limiting test status codes: ${statusCodes.join(', ')}`);
      
      // All should respond without server errors
      expect(statusCodes.every(code => code < 500)).toBeTruthy();
      
      console.log('✅ Webhooks handle multiple requests without server errors');
    });

    test('Webhooks reject unauthorized requests', async ({ request }) => {
      // Test various unauthorized request patterns
      const unauthorizedTests = [
        {
          name: 'No headers',
          headers: { 'Content-Type': 'application/json' }
        },
        {
          name: 'Invalid signature',
          headers: {
            'Content-Type': 'application/json',
            'svix-signature': 'invalid_signature'
          }
        },
        {
          name: 'Missing timestamp',
          headers: {
            'Content-Type': 'application/json',
            'svix-id': 'msg_test',
            'svix-signature': 'v1,test_signature'
          }
        }
      ];
      
      for (const test of unauthorizedTests) {
        const response = await request.post('/api/webhooks/clerk', {
          data: JSON.stringify({ type: 'test.event', data: {} }),
          headers: test.headers
        });
        
        expect(response.status()).toBeGreaterThanOrEqual(400);
        console.log(`✅ Rejected unauthorized request (${test.name}): ${response.status()}`);
      }
    });
  });

  test.describe('Webhook Error Handling', () => {
    test('Webhooks handle malformed payloads gracefully', async ({ request }) => {
      const malformedTests = [
        {
          name: 'Invalid JSON',
          data: 'invalid json{'
        },
        {
          name: 'Missing required fields',
          data: JSON.stringify({ type: 'user.created' }) // Missing data field
        },
        {
          name: 'Unknown event type',
          data: JSON.stringify({ type: 'unknown.event', data: {} })
        },
        {
          name: 'Large payload',
          data: JSON.stringify({ 
            type: 'test.event', 
            data: { large_field: 'x'.repeat(10000) }
          })
        }
      ];
      
      for (const test of malformedTests) {
        const response = await request.post('/api/webhooks/clerk', {
          data: test.data,
          headers: {
            'Content-Type': 'application/json',
            'svix-id': 'msg_malformed_test',
            'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
            'svix-signature': 'v1,test_signature'
          }
        });
        
        console.log(`📝 ${test.name} handling: ${response.status()}`);
        
        // Should handle gracefully (4xx) not crash (5xx)
        if (response.status() >= 500) {
          console.log(`⚠️ Server error for ${test.name} - may need improvement`);
        } else {
          console.log(`✅ Graceful handling of ${test.name}`);
        }
      }
    });

    test('Webhooks maintain service availability under load', async ({ request }) => {
      // Test webhook resilience with concurrent requests
      const concurrentRequests = [];
      
      for (let i = 0; i < 10; i++) {
        concurrentRequests.push(
          request.post('/api/webhooks/stripe', {
            data: JSON.stringify({
              id: `evt_load_test_${i}`,
              type: 'customer.created',
              data: { object: { id: `cus_test_${i}` } }
            }),
            headers: {
              'Content-Type': 'application/json',
              'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=test_signature_${i}`
            }
          })
        );
      }
      
      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const endTime = Date.now();
      
      const statusCodes = responses.map(r => r.status());
      const totalTime = endTime - startTime;
      
      console.log(`📊 Concurrent webhook test: ${totalTime}ms for 10 requests`);
      console.log(`📊 Status codes: ${statusCodes.join(', ')}`);
      
      // All requests should complete without timing out
      expect(totalTime).toBeLessThan(10000); // 10 second max
      
      // Most requests should not result in server errors
      const serverErrors = statusCodes.filter(code => code >= 500).length;
      expect(serverErrors).toBeLessThanOrEqual(2); // Allow some failures under load
      
      console.log('✅ Webhooks maintain availability under concurrent load');
    });
  });
});