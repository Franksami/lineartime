# Developer Onboarding Guide

Welcome to Command Center Calendar! This comprehensive guide will help you get up and running with the Command Center Calendar codebase quickly and efficiently. Follow this checklist to ensure you have everything set up correctly.

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Code Standards](#code-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Documentation](#documentation)
8. [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Day 1 Checklist

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPER ONBOARDING CHECKLIST                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  □ Environment Setup                                                          │
│    □ Node.js 18+ installed                                                   │
│    □ Git configured with SSH keys                                            │
│    □ VS Code or preferred IDE setup                                          │
│    □ Required VS Code extensions installed                                   │
│                                                                               │
│  □ Repository Access                                                          │
│    □ GitHub access granted                                                   │
│    □ Repository cloned locally                                               │
│    □ Correct branch checked out                                              │
│                                                                               │
│  □ Dependencies & Configuration                                               │
│    □ npm install completed                                                   │
│    □ Environment variables configured                                        │
│    □ Convex setup completed                                                  │
│    □ Local development server running                                        │
│                                                                               │
│  □ Initial Tasks                                                             │
│    □ Run test suite                                                          │
│    □ Review documentation                                                    │
│    □ Complete first practice task                                            │
│    □ Submit first PR                                                         │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Quick Setup Commands

```bash
# 1. Clone the repository
git clone git@github.com:lineartime/lineartime.git
cd lineartime

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 4. Set up Convex
npx convex dev

# 5. Run development server
npm run dev

# 6. Run tests
npm run test
npx playwright test

# 7. Run quality checks
npm run lint
npm run typecheck
npm run quality:gates
```

## 🛠 Environment Setup

### Prerequisites

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **Node.js** | 18.17+ | JavaScript runtime | [nodejs.org](https://nodejs.org) |
| **npm** | 9.0+ | Package manager | Comes with Node.js |
| **Git** | 2.30+ | Version control | [git-scm.com](https://git-scm.com) |
| **VS Code** | Latest | Recommended IDE | [code.visualstudio.com](https://code.visualstudio.com) |

### VS Code Extensions

Install these recommended extensions for the best development experience:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-playwright.playwright",
    "christian-kohler.path-intellisense",
    "mikestead.dotenv",
    "usernamehw.errorlens",
    "yoavbls.pretty-ts-errors"
  ]
}
```

### Environment Variables

Create a `.env.local` file with the following structure:

```bash
# Core Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Calendar Integration (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Feature Flags
NEXT_PUBLIC_FEATURE_VIRTUAL_SCROLL=true
NEXT_PUBLIC_FEATURE_CANVAS_RENDER=true
NEXT_PUBLIC_FEATURE_NLP_PARSER=true
```

## 📂 Project Structure

```
lineartime/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (auth)/           # Authentication pages
│   └── (dashboard)/      # Dashboard pages
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── calendar/         # Calendar components
│   └── forms/            # Form components
├── lib/                   # Business logic
│   ├── performance/      # Performance monitoring
│   ├── security/         # Security utilities
│   ├── accessibility/    # A11y testing
│   ├── quality/          # Quality gates
│   └── documentation/    # Documentation tools
├── hooks/                 # Custom React hooks
├── contexts/             # React contexts
├── convex/               # Backend (Convex)
├── tests/                # Test files
└── docs/                 # Documentation
```

### Key Files to Know

| File | Purpose |
|------|---------|
| `CLAUDE.md` | AI assistant context and rules |
| `next.config.ts` | Next.js configuration |
| `convex/schema.ts` | Database schema |
| `middleware.ts` | Request middleware |
| `typedoc.json` | API documentation config |

## 💻 Development Workflow

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Run checks before pushing
npm run lint:fix
npm run typecheck
npm run test

# 4. Push and create PR
git push origin feature/your-feature-name
gh pr create --title "Feature: Your feature" --body "Description"

# 5. After review and approval
# PR will be automatically merged
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve bug in component
docs: update README
style: format code
refactor: restructure module
test: add unit tests
chore: update dependencies
perf: improve performance
```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production server
npm run start

# Linting and formatting
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues

# Type checking
npm run typecheck

# Testing
npm run test          # Unit tests
npx playwright test   # E2E tests

# Documentation
npm run docs:generate # Generate API docs
npm run docs:serve    # Serve documentation

# Quality checks
npm run quality:gates # Run all quality gates
npm run perf:check    # Check performance budgets
```

## 📝 Code Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit types, clear naming
interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
}

async function getUserProfile(userId: string): Promise<UserProfile> {
  // Implementation
}

// ❌ Bad: Any types, unclear naming
function getUser(id: any): any {
  // Implementation
}
```

### React Component Patterns

```tsx
// ✅ Good: Typed props, proper exports
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  onClick, 
  children 
}: ButtonProps) {
  return (
    <button 
      className={cn('btn', `btn-${variant}`)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### File Naming Conventions

```
components/
├── Button.tsx           # PascalCase for components
├── use-theme.ts        # kebab-case for hooks
├── format-date.ts      # kebab-case for utilities
└── types.ts            # lowercase for type files
```

## 🧪 Testing Guidelines

### Unit Testing

```typescript
// Example test file: button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Testing

```typescript
// Example Playwright test
import { test, expect } from '@playwright/test';

test('user can create event', async ({ page }) => {
  await page.goto('/');
  
  // Click on calendar
  await page.click('[data-testid="calendar-grid"]');
  
  // Fill event form
  await page.fill('[name="title"]', 'Team Meeting');
  await page.click('[type="submit"]');
  
  // Verify event created
  await expect(page.locator('text=Team Meeting')).toBeVisible();
});
```

### Test Coverage Requirements

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TEST COVERAGE REQUIREMENTS                           │
├──────────────────┬────────────┬──────────────────────────────────────────────┤
│  Category        │  Required  │  Description                                 │
├──────────────────┼────────────┼──────────────────────────────────────────────┤
│  Statements      │    80%     │  Lines of code executed                     │
│  Branches        │    75%     │  Decision paths covered                     │
│  Functions       │    80%     │  Functions called                           │
│  Lines           │    80%     │  Executable lines covered                   │
└──────────────────┴────────────┴──────────────────────────────────────────────┘
```

## 📚 Documentation

### Code Documentation

Use JSDoc comments for all public APIs:

```typescript
/**
 * Calculate the performance score based on metrics
 * 
 * @param metrics - Web vitals metrics object
 * @param weights - Optional weight configuration
 * @returns Performance score between 0-100
 * 
 * @example
 * ```typescript
 * const score = calculateScore({
 *   FCP: 1500,
 *   LCP: 2000,
 *   CLS: 0.05
 * });
 * console.log(score); // 92.5
 * ```
 */
export function calculateScore(
  metrics: WebVitalsMetrics,
  weights?: ScoreWeights
): number {
  // Implementation
}
```

### Documentation Resources

| Resource | Location | Purpose |
|----------|----------|---------|
| **API Docs** | `/docs/api` | Generated TypeDoc documentation |
| **Playground** | `/docs/playground` | Interactive code examples |
| **Architecture** | `/docs/ARCHITECTURE.md` | System design overview |
| **Contributing** | `/CONTRIBUTING.md` | Contribution guidelines |

### Generating Documentation

```bash
# Generate API documentation
npm run docs:generate

# Start documentation server
npm run docs:serve

# Update examples catalog
npm run docs:examples
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue: Development server won't start

```bash
# Solution 1: Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run dev

# Solution 2: Check port conflicts
lsof -ti:3000 | xargs kill -9
npm run dev
```

#### Issue: Convex connection errors

```bash
# Solution: Ensure Convex is running
npx convex dev

# Check deployment status
npx convex dashboard
```

#### Issue: TypeScript errors

```bash
# Solution 1: Clear TypeScript cache
rm -rf node_modules/.cache/typescript
npm run typecheck

# Solution 2: Restart TS server in VS Code
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

#### Issue: Test failures

```bash
# Solution: Update snapshots
npm run test -- -u

# Run specific test file
npm run test -- button.test.tsx

# Debug Playwright tests
npx playwright test --debug
```

### Getting Help

1. **Documentation**: Check `/docs` folder
2. **README**: Review main README.md
3. **Issues**: Search GitHub issues
4. **Team**: Ask in Slack #dev channel
5. **AI Assistant**: Use CLAUDE.md context

## 🎯 Next Steps

### Week 1 Goals

- [ ] Complete environment setup
- [ ] Run and understand test suite
- [ ] Make first code contribution
- [ ] Review existing PRs
- [ ] Attend team standup

### Week 2 Goals

- [ ] Complete first feature ticket
- [ ] Write tests for new code
- [ ] Update documentation
- [ ] Participate in code review
- [ ] Learn deployment process

### Month 1 Goals

- [ ] Become familiar with major subsystems
- [ ] Contribute to 5+ PRs
- [ ] Identify improvement opportunities
- [ ] Help onboard another developer
- [ ] Lead a feature implementation

## 📊 Progress Tracking

Use this template to track your onboarding progress:

```markdown
## My Onboarding Progress

### Week 1 (Date: ______)
- [x] Environment setup complete
- [ ] First PR submitted
- [ ] Tests passing locally
- Notes: _________________

### Week 2 (Date: ______)
- [ ] Feature ticket completed
- [ ] Code review participated
- [ ] Documentation updated
- Notes: _________________

### Week 3 (Date: ______)
- [ ] Major subsystem understood
- [ ] Performance optimization made
- [ ] Security check passed
- Notes: _________________

### Week 4 (Date: ______)
- [ ] Deployment participated
- [ ] Mentored team member
- [ ] Process improvement suggested
- Notes: _________________
```

## 🎉 Welcome to the Team!

You're now ready to start contributing to Command Center Calendar. Remember:

- **Ask questions** - We're here to help
- **Document as you go** - Help the next person
- **Test thoroughly** - Quality is key
- **Review carefully** - Learn from others
- **Share knowledge** - Teach what you learn

Happy coding! 🚀