# Command Center Calendar FAQ & Troubleshooting Guide

Comprehensive FAQ and troubleshooting system for Command Center Calendar developers.

## 📚 Table of Contents

1. [Frequently Asked Questions](#frequently-asked-questions)
2. [Common Issues & Solutions](#common-issues--solutions)
3. [Error Reference Guide](#error-reference-guide)
4. [Performance Troubleshooting](#performance-troubleshooting)
5. [Integration Issues](#integration-issues)
6. [Development Environment Problems](#development-environment-problems)
7. [Advanced Debugging Techniques](#advanced-debugging-techniques)
8. [Quick Fix Scripts](#quick-fix-scripts)

## ❓ Frequently Asked Questions

### General Questions

<details>
<summary><strong>Q: What is Command Center Calendar and what problems does it solve?</strong></summary>

**A:** Command Center Calendar is an enterprise-grade calendar integration platform that provides:
- Unified calendar management across multiple providers (Google, Microsoft, Apple, CalDAV)
- Real-time synchronization with conflict resolution
- AI-powered scheduling suggestions
- Enterprise security with AES-256-GCM encryption
- Performance optimization for handling 10,000+ events

Key problems solved:
- Calendar fragmentation across providers
- Manual scheduling conflicts
- Security concerns with third-party integrations
- Performance issues with large event datasets
</details>

<details>
<summary><strong>Q: What are the system requirements for development?</strong></summary>

**A:** Minimum requirements:
- **Node.js**: 18.17.0 or higher
- **npm**: 9.0.0 or higher
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 2GB free space
- **OS**: macOS 10.15+, Windows 10+, Ubuntu 20.04+
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+
</details>

<details>
<summary><strong>Q: How do I get access to calendar provider APIs?</strong></summary>

**A:** Follow these steps for each provider:

**Google Calendar:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Calendar API
4. Create OAuth 2.0 credentials
5. Add redirect URIs

**Microsoft Graph:**
1. Visit [Azure Portal](https://portal.azure.com)
2. Register new application
3. Add Calendar API permissions
4. Create client secret
5. Configure redirect URIs

**Apple CalDAV:**
- Uses standard CalDAV protocol
- Requires app-specific password
- No API registration needed

**Generic CalDAV:**
- Compatible with any CalDAV server
- Requires server URL and credentials
</details>

### Architecture Questions

<details>
<summary><strong>Q: How does the real-time sync system work?</strong></summary>

**A:** The sync system uses a multi-layered approach:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REAL-TIME SYNC ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  1. WEBHOOK LAYER                                                            │
│     Provider → Webhook → Convex → Event Processing                           │
│                                                                               │
│  2. POLLING FALLBACK                                                         │
│     Scheduled Jobs → API Calls → Delta Sync                                  │
│                                                                               │
│  3. CONFLICT RESOLUTION                                                      │
│     Vector Clocks → Three-way Merge → User Override                          │
│                                                                               │
│  4. OPTIMIZATION                                                             │
│     Batch Processing → Rate Limiting → Exponential Backoff                   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```
</details>

<details>
<summary><strong>Q: What is the database schema structure?</strong></summary>

**A:** Key Convex tables:

```typescript
// Simplified schema overview
const schema = {
  users: {
    id: string,
    email: string,
    subscriptionTier: string,
    settings: object
  },
  
  providers: {
    id: string,
    userId: string,
    type: 'google' | 'microsoft' | 'apple' | 'caldav',
    encryptedTokens: string, // AES-256-GCM encrypted
    lastSync: Date
  },
  
  events: {
    id: string,
    userId: string,
    providerId: string,
    title: string,
    startTime: Date,
    endTime: Date,
    sync: {
      version: number,
      vectorClock: Map<string, number>,
      lastModified: Date
    }
  },
  
  syncJobs: {
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    retryCount: number,
    nextRetry: Date
  }
};
```
</details>

### Development Questions

<details>
<summary><strong>Q: How do I add a new calendar provider?</strong></summary>

**A:** Steps to add a new provider:

1. **Create provider adapter** (`lib/providers/new-provider.ts`):
```typescript
export class NewProviderAdapter implements CalendarProvider {
  async authenticate(credentials: any): Promise<AuthToken> {}
  async fetchEvents(token: AuthToken): Promise<Event[]> {}
  async createEvent(token: AuthToken, event: Event): Promise<string> {}
  async updateEvent(token: AuthToken, eventId: string, event: Event): Promise<void> {}
  async deleteEvent(token: AuthToken, eventId: string): Promise<void> {}
}
```

2. **Add to provider registry** (`lib/providers/index.ts`)
3. **Create OAuth flow** if needed
4. **Add webhook handler** in `convex/http.ts`
5. **Update UI** in `components/settings/CalendarIntegrations.tsx`
6. **Add tests** in `tests/providers/`
</details>

<details>
<summary><strong>Q: How do I optimize performance for large datasets?</strong></summary>

**A:** Performance optimization strategies:

1. **Virtual Scrolling**: Already implemented for event lists
2. **Lazy Loading**: Use dynamic imports for routes
3. **Memoization**: Apply React.memo and useMemo
4. **Batch Operations**: Group API calls
5. **IndexedDB Caching**: Leverage local storage
6. **Web Workers**: Offload heavy computations

Example optimization:
```typescript
// Before
const events = allEvents.filter(e => isInMonth(e, month));

// After (with memoization)
const events = useMemo(
  () => allEvents.filter(e => isInMonth(e, month)),
  [allEvents, month]
);
```
</details>

## 🔧 Common Issues & Solutions

### Installation Issues

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INSTALLATION PROBLEMS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ISSUE: npm install fails with EACCES error                                  │
│  ────────────────────────────────────────────                                │
│  CAUSE: Permission issues with npm global directory                          │
│                                                                               │
│  SOLUTION:                                                                    │
│  1. Change npm's default directory:                                          │
│     mkdir ~/.npm-global                                                      │
│     npm config set prefix '~/.npm-global'                                    │
│     echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc                  │
│     source ~/.bashrc                                                         │
│                                                                               │
│  2. Or use a Node version manager:                                           │
│     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash │
│     nvm install 18                                                           │
│     nvm use 18                                                               │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ISSUE: Module not found errors after installation                           │
│  ────────────────────────────────────────────────                            │
│  SOLUTION:                                                                    │
│  rm -rf node_modules package-lock.json                                       │
│  npm cache clean --force                                                     │
│  npm install                                                                 │
│                                                                               │
│  If persists:                                                                │
│  npm ls  # Check for unmet dependencies                                      │
│  npm audit fix  # Fix vulnerabilities                                        │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Runtime Errors

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ISSUE: "Cannot read property 'x' of undefined"                              │
│  ────────────────────────────────────────────────                            │
│  COMMON CAUSES:                                                              │
│  1. Missing null checks                                                      │
│  2. Async data not loaded                                                    │
│  3. Incorrect destructuring                                                  │
│                                                                               │
│  DEBUGGING STEPS:                                                            │
│  1. Add console.log before error line                                        │
│  2. Check component props in React DevTools                                  │
│  3. Verify data fetching completion                                          │
│                                                                               │
│  SOLUTION PATTERN:                                                           │
│  // Before                                                                   │
│  const value = data.nested.property;                                         │
│                                                                               │
│  // After (with optional chaining)                                           │
│  const value = data?.nested?.property;                                       │
│                                                                               │
│  // Or with default value                                                    │
│  const value = data?.nested?.property ?? defaultValue;                       │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Build Errors

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ISSUE: TypeScript compilation errors                                        │
│  ────────────────────────────────────────────────                            │
│  ERROR: "Type 'X' is not assignable to type 'Y'"                            │
│                                                                               │
│  SOLUTIONS:                                                                   │
│  1. Check type definitions:                                                  │
│     npm run typecheck                                                       │
│                                                                               │
│  2. Update type imports:                                                     │
│     // Ensure correct import                                                 │
│     import type { EventType } from '@/types';                                │
│                                                                               │
│  3. Fix type mismatches:                                                     │
│     // Use type assertions carefully                                         │
│     const event = data as EventType;                                         │
│                                                                               │
│  4. Restart TypeScript server:                                               │
│     VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"                  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📋 Error Reference Guide

### Error Code Dictionary

| Error Code | Description | Solution |
|------------|-------------|----------|
| **LT-001** | Convex connection failed | Check NEXT_PUBLIC_CONVEX_URL in .env |
| **LT-002** | Provider authentication failed | Verify OAuth credentials |
| **LT-003** | Sync job timeout | Check provider API status |
| **LT-004** | Encryption key missing | Set CONVEX_ENCRYPTION_MASTER_KEY |
| **LT-005** | Rate limit exceeded | Implement exponential backoff |
| **LT-006** | Webhook signature invalid | Verify webhook secret |
| **LT-007** | Calendar conflict detected | Implement conflict resolution |
| **LT-008** | Memory limit exceeded | Enable virtual scrolling |
| **LT-009** | Bundle size too large | Implement code splitting |
| **LT-010** | CORS policy violation | Configure API headers |

### Detailed Error Solutions

```typescript
// Error Handler Utility
export class ErrorHandler {
  static handle(error: any): ErrorSolution {
    const errorCode = this.identifyError(error);
    
    switch (errorCode) {
      case 'LT-001':
        return {
          message: 'Failed to connect to Convex backend',
          steps: [
            '1. Check internet connection',
            '2. Verify NEXT_PUBLIC_CONVEX_URL in .env',
            '3. Run: npx convex dev',
            '4. Check Convex dashboard for issues'
          ],
          code: `
            // .env.local
            NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
          `
        };
        
      case 'LT-002':
        return {
          message: 'OAuth authentication failed',
          steps: [
            '1. Verify provider credentials',
            '2. Check redirect URI configuration',
            '3. Ensure scopes are correct',
            '4. Test in provider playground'
          ],
          code: `
            // OAuth configuration
            const config = {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              redirectUri: \`\${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback\`,
              scope: 'calendar.events calendar.readonly'
            };
          `
        };
        
      // Additional error cases...
    }
  }
}
```

## ⚡ Performance Troubleshooting

### Performance Diagnostics Checklist

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PERFORMANCE DIAGNOSTICS CHECKLIST                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  □ Measure Core Web Vitals                                                   │
│    ├─ Run Lighthouse audit                                                   │
│    ├─ Check FCP < 1.8s                                                       │
│    ├─ Check LCP < 2.5s                                                       │
│    └─ Check CLS < 0.1                                                        │
│                                                                               │
│  □ Analyze Bundle Size                                                       │
│    ├─ Run: npm run analyze                                                   │
│    ├─ Check main bundle < 500KB                                              │
│    ├─ Identify large dependencies                                            │
│    └─ Implement code splitting                                               │
│                                                                               │
│  □ Profile React Performance                                                 │
│    ├─ Use React DevTools Profiler                                           │
│    ├─ Identify unnecessary re-renders                                        │
│    ├─ Check component render time                                            │
│    └─ Apply memoization                                                      │
│                                                                               │
│  □ Monitor Memory Usage                                                      │
│    ├─ Take heap snapshots                                                    │
│    ├─ Check for memory leaks                                                 │
│    ├─ Monitor garbage collection                                             │
│    └─ Implement cleanup functions                                            │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Performance Solutions

```typescript
// Performance Optimization Patterns

// 1. Debounced Search
import { useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

function SearchableEventList({ events }) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const filteredEvents = useMemo(
    () => events.filter(e => 
      e.title.toLowerCase().includes(debouncedSearch.toLowerCase())
    ),
    [events, debouncedSearch]
  );
  
  return (
    <>
      <input onChange={(e) => setSearchTerm(e.target.value)} />
      <VirtualList items={filteredEvents} />
    </>
  );
}

// 2. Lazy Component Loading
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => 
  import(/* webpackChunkName: "heavy" */ './HeavyComponent')
);

function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <HeavyComponent />
    </Suspense>
  );
}

// 3. Image Optimization
import Image from 'next/image';

function OptimizedAvatar({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

## 🔌 Integration Issues

### Provider-Specific Issues

#### Google Calendar Issues

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GOOGLE CALENDAR ISSUES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ISSUE: "401 Unauthorized" when fetching events                              │
│  ──────────────────────────────────────────────                              │
│  CAUSES:                                                                      │
│  • Expired access token                                                      │
│  • Revoked permissions                                                       │
│  • Incorrect scope                                                           │
│                                                                               │
│  SOLUTION:                                                                    │
│  1. Implement token refresh:                                                 │
│     async function refreshGoogleToken(refreshToken: string) {                │
│       const response = await fetch('https://oauth2.googleapis.com/token', {  │
│         method: 'POST',                                                      │
│         body: JSON.stringify({                                               │
│           refresh_token: refreshToken,                                       │
│           client_id: process.env.GOOGLE_CLIENT_ID,                           │
│           client_secret: process.env.GOOGLE_CLIENT_SECRET,                   │
│           grant_type: 'refresh_token'                                        │
│         })                                                                    │
│       });                                                                     │
│       return response.json();                                                │
│     }                                                                         │
│                                                                               │
│  2. Handle token expiration:                                                 │
│     if (error.code === 401) {                                                │
│       const newToken = await refreshGoogleToken(user.refreshToken);          │
│       // Retry request with new token                                        │
│     }                                                                         │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Microsoft Graph Issues

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MICROSOFT GRAPH ISSUES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ISSUE: "Subscription validation failed"                                     │
│  ──────────────────────────────────────────────                              │
│  CAUSE: Webhook endpoint not responding correctly                            │
│                                                                               │
│  SOLUTION:                                                                    │
│  // Webhook validation handler                                               │
│  export async function POST(request: Request) {                              │
│    const url = new URL(request.url);                                         │
│    const validationToken = url.searchParams.get('validationToken');          │
│                                                                               │
│    if (validationToken) {                                                    │
│      // Respond with validation token for subscription setup                 │
│      return new Response(validationToken, {                                  │
│        status: 200,                                                          │
│        headers: { 'Content-Type': 'text/plain' }                             │
│      });                                                                      │
│    }                                                                          │
│                                                                               │
│    // Handle actual webhook notification                                     │
│    const body = await request.json();                                        │
│    // Process notification...                                                │
│  }                                                                            │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 💻 Development Environment Problems

### Common Development Issues

```bash
# Issue: Port 3000 already in use
# Solution 1: Kill the process
lsof -ti:3000 | xargs kill -9

# Solution 2: Use different port
PORT=3001 npm run dev

# Issue: Convex dev server not starting
# Solution:
npx convex dev --once  # Run migrations
npx convex deploy      # Deploy to cloud
npx convex dev         # Start dev server

# Issue: Hot reload not working
# Solution:
# Check next.config.ts for watchOptions
module.exports = {
  watchOptions: {
    poll: 1000,
    aggregateTimeout: 300,
  }
}

# Issue: TypeScript server crashes
# Solution:
# Increase memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
```

### VS Code Configuration Issues

```json
// .vscode/settings.json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## 🔍 Advanced Debugging Techniques

### Debug Configuration

```typescript
// lib/debug.ts
export const debug = {
  // Enable detailed logging
  verbose: process.env.NODE_ENV === 'development',
  
  // Log performance metrics
  performance: true,
  
  // Log API calls
  api: true,
  
  // Log state changes
  state: true,
  
  log: (category: string, message: string, data?: any) => {
    if (!debug.verbose) return;
    
    const timestamp = new Date().toISOString();
    const color = {
      api: '\x1b[36m',      // Cyan
      state: '\x1b[33m',    // Yellow
      performance: '\x1b[35m', // Magenta
      error: '\x1b[31m'     // Red
    }[category] || '\x1b[0m';
    
    console.log(
      `${color}[${timestamp}] [${category.toUpperCase()}] ${message}\x1b[0m`,
      data || ''
    );
  }
};

// Usage
debug.log('api', 'Fetching events', { userId, startDate, endDate });
debug.log('performance', 'Render time', { component: 'CalendarGrid', ms: 45 });
```

### Browser DevTools Snippets

```javascript
// DevTools Console Snippets

// 1. Find memory leaks
(() => {
  const events = [];
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      events.push(entry);
    }
  });
  observer.observe({ entryTypes: ['measure', 'navigation'] });
  
  // Check after navigation
  setTimeout(() => {
    console.table(events);
  }, 5000);
})();

// 2. Monitor re-renders
(() => {
  let renderCount = 0;
  const originalRender = React.createElement;
  React.createElement = function(...args) {
    renderCount++;
    console.log(`Render #${renderCount}:`, args[0]);
    return originalRender.apply(this, args);
  };
})();

// 3. Track API calls
(() => {
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    console.log('API Call:', args[0]);
    const start = performance.now();
    const response = await originalFetch.apply(this, args);
    const duration = performance.now() - start;
    console.log(`Response (${duration.toFixed(2)}ms):`, response.status);
    return response;
  };
})();
```

## ⚡ Quick Fix Scripts

### Automated Fix Scripts

```bash
#!/bin/bash
# fix-common-issues.sh

echo "🔧 Command Center Calendar Quick Fix Script"
echo "=============================="

# Function to fix npm issues
fix_npm() {
  echo "📦 Fixing npm issues..."
  rm -rf node_modules package-lock.json
  npm cache clean --force
  npm install
  echo "✅ npm issues fixed"
}

# Function to fix TypeScript issues
fix_typescript() {
  echo "📝 Fixing TypeScript issues..."
  rm -rf .next
  npx tsc --noEmit
  echo "✅ TypeScript issues fixed"
}

# Function to fix Convex issues
fix_convex() {
  echo "☁️ Fixing Convex issues..."
  npx convex dev --once
  npx convex deploy
  echo "✅ Convex issues fixed"
}

# Function to fix port conflicts
fix_ports() {
  echo "🔌 Fixing port conflicts..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null
  lsof -ti:3001 | xargs kill -9 2>/dev/null
  echo "✅ Port conflicts fixed"
}

# Main menu
echo "Select issue to fix:"
echo "1) npm installation issues"
echo "2) TypeScript compilation errors"
echo "3) Convex connection problems"
echo "4) Port conflicts"
echo "5) Fix all"

read -p "Enter choice (1-5): " choice

case $choice in
  1) fix_npm ;;
  2) fix_typescript ;;
  3) fix_convex ;;
  4) fix_ports ;;
  5) 
    fix_npm
    fix_typescript
    fix_convex
    fix_ports
    ;;
  *) echo "Invalid choice" ;;
esac

echo ""
echo "🎉 Fix script completed!"
```

### Environment Validation Script

```typescript
// scripts/validate-env.ts
import { z } from 'zod';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Define schema
const envSchema = z.object({
  // Required variables
  NEXT_PUBLIC_CONVEX_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  
  // Optional but recommended
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  
  // Feature flags
  NEXT_PUBLIC_FEATURE_VIRTUAL_SCROLL: z.enum(['true', 'false']).optional(),
  NEXT_PUBLIC_FEATURE_CANVAS_RENDER: z.enum(['true', 'false']).optional(),
});

// Validate
try {
  const env = envSchema.parse(process.env);
  console.log(chalk.green('✅ Environment variables validated successfully!'));
  
  // Check optional features
  if (!env.GOOGLE_CLIENT_ID) {
    console.log(chalk.yellow('⚠️  Google Calendar integration not configured'));
  }
  if (!env.MICROSOFT_CLIENT_ID) {
    console.log(chalk.yellow('⚠️  Microsoft Calendar integration not configured'));
  }
  
} catch (error) {
  console.log(chalk.red('❌ Environment validation failed:'));
  if (error instanceof z.ZodError) {
    error.errors.forEach(err => {
      console.log(chalk.red(`  - ${err.path}: ${err.message}`));
    });
  }
  process.exit(1);
}
```

## 📞 Getting Help

### Support Channels

1. **Documentation**: `/docs` folder
2. **GitHub Issues**: Report bugs and feature requests
3. **Slack**: `#lineartime-dev` channel
4. **Office Hours**: Weekly Q&A sessions
5. **Email**: dev-support@lineartime.app

### Before Asking for Help

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BEFORE REQUESTING SUPPORT                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  □ Check this FAQ document                                                   │
│  □ Search existing GitHub issues                                             │
│  □ Review error logs                                                         │
│  □ Try quick fix scripts                                                     │
│  □ Validate environment setup                                                │
│  □ Test in incognito/private browsing                                        │
│  □ Clear browser cache and cookies                                           │
│  □ Update to latest version                                                  │
│                                                                               │
│  When reporting issues, include:                                             │
│  • Error messages and stack traces                                           │
│  • Steps to reproduce                                                        │
│  • Environment details (OS, Node version, etc.)                              │
│  • Relevant code snippets                                                    │
│  • What you've already tried                                                 │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🎯 Quick Reference

### Essential Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Testing
npm run test            # Run unit tests
npm run test:e2e        # Run E2E tests
npm run test:coverage   # Generate coverage report

# Code Quality
npm run lint            # Check linting
npm run lint:fix        # Fix linting issues
npm run typecheck       # Check TypeScript

# Convex
npx convex dev          # Start Convex dev server
npx convex deploy       # Deploy to production
npx convex dashboard    # Open Convex dashboard

# Debugging
npm run analyze         # Analyze bundle size
npm run debug           # Start with debugging enabled
```

### Useful Links

- [Command Center Calendar Documentation](docs/)
- [Convex Documentation](https://docs.convex.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

*Last updated: Phase 5 - Documentation & Training Implementation*  
*Version: 1.0.0*  
*Maintainer: Command Center Calendar Development Team*