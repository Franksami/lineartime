# RULES_MASTER.md - Command Center Calendar Unified Rules System

---
version: 2.0.0
extends: null
priority: highest
created: 2024-12-28
author: Command Center Calendar Development Team
---

## 🎯 Master Rule Configuration

This is the single source of truth for all Command Center Calendar development rules. All other rule files inherit from or extend this master configuration.

## 📋 Table of Contents

1. [Core Immutable Rules](#core-immutable-rules)
2. [Architecture Rules](#architecture-rules)
3. [Development Workflow](#development-workflow)
4. [Testing Standards](#testing-standards)
5. [Performance Targets](#performance-targets)
6. [AI Integration](#ai-integration)
7. [Module Imports](#module-imports)

## Core Immutable Rules

These rules are **NEVER** to be overridden and form the foundation of the Command Center Calendar project.

### 1. Command Workspace Architecture

**Rule ID**: CORE-001  
**Priority**: CRITICAL  
**Enforcement**: Automatic via ESLint + CI

The primary architecture is the **Command Workspace Three-Pane Shell System**:

```typescript
// ✅ MANDATORY ARCHITECTURE
<AppShell>
  <Sidebar sections={['Calendar', 'Tasks', 'Notes', 'Mailbox']} />
  <TabWorkspace>
    <Tab view="week|planner|notes|mailbox" />
  </TabWorkspace>
  <ContextDock panels={['ai', 'details', 'conflicts', 'capacity']} />
</AppShell>
```

**Violations**:
- ❌ Using LinearCalendarHorizontal outside `views/year-lens/`
- ❌ Creating standalone pages outside the shell system
- ❌ Bypassing the Command Workspace for new features

### 2. Foundation Protection

**Rule ID**: CORE-002  
**Priority**: CRITICAL  
**Enforcement**: Dependency cruiser + Build guards

LinearCalendarHorizontal is **DEPRECATED** and relegated to Year Lens view only:

```javascript
// ❌ PROHIBITED
import { LinearCalendarHorizontal } from '@/components/calendar/LinearCalendarHorizontal';

// ✅ ALLOWED (Year Lens only)
// views/year-lens/YearLensView.tsx
import { LinearCalendarHorizontal } from '@/components/calendar/LinearCalendarHorizontal';
```

### 3. Performance Requirements

**Rule ID**: CORE-003  
**Priority**: HIGH  
**Enforcement**: Performance budgets + monitoring

Non-negotiable performance targets:

| Metric | Target | Critical |
|--------|--------|----------|
| FPS | 112+ | Yes |
| Shell Render | <500ms | Yes |
| Tab Switch | <200ms | Yes |
| Keyboard Response | <120ms | Yes |
| Memory Usage | <100MB | Yes |
| INP (Interaction to Next Paint) | <200ms | Yes |

### 4. Testing Requirements

**Rule ID**: CORE-004  
**Priority**: CRITICAL  
**Enforcement**: Git hooks + CI/CD

Before EVERY commit:

```bash
npm run test:shell        # MANDATORY - Command Workspace validation
npm run test:governance   # MANDATORY - Architecture compliance
npx playwright test       # Feature tests
npm run build            # Build validation
```

## Architecture Rules

### Component Organization

**Rule ID**: ARCH-001  
**Priority**: HIGH

Follow component-based architecture:

```
components/
├── shell/           # Core shell components (AppShell, Sidebar, etc.)
├── commands/        # Command system (Palette, Registry, Omnibox)
├── dock/           # Context dock panels
└── views/          # View components (Week, Planner, Notes, etc.)
```

### State Management

**Rule ID**: ARCH-002  
**Priority**: HIGH

State management hierarchy:

1. **React Context** - Simple prop drilling solutions
2. **Zustand** - Default for most state management needs
3. **Redux Toolkit** - Only for large enterprise features

### Design System

**Rule ID**: ARCH-003  
**Priority**: HIGH

Token-only theming with shadcn/Vercel:

```css
/* ✅ ALLOWED */
bg-background, bg-card, text-foreground, border-border

/* ❌ PROHIBITED */
bg-blue-500, backdrop-blur, bg-opacity-50
```

## Development Workflow

### Git Workflow

**Rule ID**: WORK-001  
**Priority**: CRITICAL

Trunk-based development is **MANDATORY**:

```bash
# ❌ NEVER
git push origin main

# ✅ REQUIRED
git checkout -b feature/task-[ID]-[description]
# Work on feature (max 24 hours)
git commit -m "feat: [description]"  # Conventional commits
git push origin feature/[branch]
gh pr create                         # Create PR
# Wait for CodeRabbit review
# Merge only after approval
```

### Commit Standards

**Rule ID**: WORK-002  
**Priority**: HIGH

Conventional Commits format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `perf:` Performance improvement
- `test:` Testing
- `chore:` Maintenance

### PR Requirements

**Rule ID**: WORK-003  
**Priority**: HIGH

- Maximum 400 lines per PR
- Must pass all automated checks
- Requires CodeRabbit review
- Includes test coverage

## Testing Standards

### Testing Strategy

**Rule ID**: TEST-001  
**Priority**: HIGH

Testing pyramid:

- **70%** Unit tests (Vitest)
- **20%** Integration tests
- **10%** E2E tests (Playwright)

### Coverage Requirements

**Rule ID**: TEST-002  
**Priority**: HIGH

Minimum coverage thresholds:

```javascript
{
  branches: 80,
  functions: 80,
  lines: 80,
  statements: 80
}
```

### Accessibility Testing

**Rule ID**: TEST-003  
**Priority**: HIGH

WCAG 2.2 Level AA compliance is mandatory:

- Automated testing with axe-core
- Keyboard navigation testing
- Screen reader compatibility

## Performance Targets

### Bundle Size Budgets

**Rule ID**: PERF-001  
**Priority**: HIGH

| Component | Budget | Critical |
|-----------|--------|----------|
| Shell Core | <150KB | Yes |
| Per View | <100KB | Yes |
| Per Dock Panel | <50KB | Yes |
| Command System | <75KB | Yes |
| AI Agents | <200KB | Yes |

### Core Web Vitals

**Rule ID**: PERF-002  
**Priority**: HIGH

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP | <2.5s | Largest Contentful Paint |
| INP | <200ms | Interaction to Next Paint |
| CLS | <0.1 | Cumulative Layout Shift |

## AI Integration

### MCP Server Usage

**Rule ID**: AI-001  
**Priority**: HIGH

Available MCP servers and their purposes:

| Server | Purpose | Auto-activate |
|--------|---------|---------------|
| task-master-ai | Project management | Complex tasks |
| context7 | Documentation | Library imports |
| sequential-thinking | Complex analysis | --think flags |
| playwright | Testing | Test commands |
| magic-ui | UI components | Component creation |

### AI Governance

**Rule ID**: AI-002  
**Priority**: CRITICAL

- Mandatory security scanning for AI-generated code
- Restricted areas: `/api/auth/`, `/api/payments/`
- Code review required for all AI output
- Audit logging for all AI interactions

### Cursor Configuration

**Rule ID**: AI-003  
**Priority**: HIGH

Cursor rules location: `.cursor/rules/`

Required configurations:
- Agent mode templates
- Context limits (200K tokens)
- Auto-fix enabled
- Strict enforcement

## Module Imports

The following modules extend this master configuration:

```yaml
modules:
  - path: modules/architecture.rules.md
    priority: high
    override: false
    
  - path: modules/workflow.rules.md
    priority: high
    override: false
    
  - path: modules/testing.rules.md
    priority: medium
    override: false
    
  - path: modules/performance.rules.md
    priority: medium
    override: false
    
  - path: modules/ai-integration.rules.md
    priority: high
    override: partial  # Can override non-critical rules
```

## Rule Validation

All rules are validated automatically via:

1. **ESLint** - Code compliance
2. **Dependency Cruiser** - Import restrictions
3. **CI Guards** - Build-time validation
4. **Git Hooks** - Pre-commit checks

## Enforcement Levels

| Level | Description | Action on Violation |
|-------|-------------|-------------------|
| CRITICAL | Core architecture rules | Build fails, commit blocked |
| HIGH | Important standards | Warning, PR review required |
| MEDIUM | Best practices | Warning, can be overridden |
| LOW | Recommendations | Info only |

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2024-12-28 | Unified rule system implementation |
| 1.0.0 | 2024-01-01 | Initial CLAUDE.md configuration |

## Contributing

To propose rule changes:

1. Create ADR (Architecture Decision Record)
2. Submit PR with justification
3. Requires 2+ reviewer approval
4. Update version and changelog

---

**Remember**: These rules ensure consistency, quality, and maintainability across the Command Center Calendar project. When in doubt, refer to this master configuration.