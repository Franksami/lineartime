#!/usr/bin/env node

// Simple test runner that skips webServer configuration
const { execSync } = require('child_process');

console.log('Running Playwright tests against existing server on http://localhost:3000...\n');

try {
  execSync('npx playwright test --reporter=list', {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Tell Playwright to use the existing server
      PLAYWRIGHT_TEST_BASE_URL: 'http://localhost:3000'
    }
  });
} catch (error) {
  process.exit(1);
}