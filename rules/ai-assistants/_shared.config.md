# Shared AI Assistant Configuration

---
module: shared
version: 1.0.0
applies_to: all_assistants
priority: base
---

## Universal AI Rules

These rules apply to ALL AI assistants (Claude, Cursor, Windsurf, Gemini, etc.) working on the Command Center Calendar project.

## Core Context

### Project Overview

**Command Center Calendar** is a Command Workspace productivity platform featuring:
- Three-pane shell architecture (Sidebar + TabWorkspace + ContextDock)
- Command-first experience with palette and natural language processing
- Privacy-first computer vision and AI integration
- Enterprise-grade calendar integration platform

### Critical Constraints

1. **Architecture**: Command Workspace is PRIMARY - LinearCalendarHorizontal is DEPRECATED
2. **Performance**: 112+ FPS, <500ms render, <120ms keyboard response
3. **Testing**: test:shell and test:governance are MANDATORY before commits
4. **Security**: No AI generation in auth, payments, or encryption paths

## Universal Standards

### Code Style

```typescript
// TypeScript is default
interface ComponentProps {
  // Use interfaces for public APIs
  children: React.ReactNode;
  className?: string;
  onAction: (id: string) => void;
}

// Functional components only
export const Component: FC<ComponentProps> = ({
  children,
  className,
  onAction
}) => {
  // Hooks at top
  const [state, setState] = useState(initialState);
  
  // Early returns for edge cases
  if (!isValid) return null;
  
  // Main render
  return (
    <div className={cn('base-class', className)}>
      {children}
    </div>
  );
};
```

### Import Order

```typescript
// 1. External packages
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal packages  
import { Button } from '@/components/ui/button';

// 3. Relative imports
import { localHelper } from './helper';

// 4. Types
import type { EventType } from '@/types/event';

// 5. Styles (if needed)
import styles from './Component.module.css';
```

### File Structure

```
feature/
├── index.ts              # Public exports only
├── FeatureName.tsx       # Main component
├── FeatureName.types.ts  # TypeScript definitions
├── FeatureName.test.tsx  # Tests (colocated)
├── FeatureName.utils.ts  # Helper functions
└── components/           # Sub-components
    └── SubComponent.tsx
```

## Communication Standards

### Response Format

1. **Be Concise**: Maximum 4 lines unless explicitly asked for detail
2. **Code First**: Show code examples over explanations
3. **Action Oriented**: Focus on what to do, not theory
4. **Evidence Based**: Support claims with measurable data

### Error Handling

When encountering errors:

```typescript
// Always provide:
1. Error type and location (file:line)
2. Root cause analysis
3. Specific fix with code
4. Prevention strategy

// Example:
"TypeError at EventCreator.tsx:45
Cause: Accessing undefined property
Fix: Add optional chaining - event?.date
Prevention: Add TypeScript strict null checks"
```

## Development Workflow

### Task Approach

```markdown
1. Read relevant files first
2. Check existing patterns
3. Validate against rules
4. Implement solution
5. Add/update tests
6. Update documentation
```

### Git Commit Standards

```bash
# Format: type(scope): description

feat(calendar): add multi-provider sync
fix(auth): resolve token refresh issue
docs(api): update webhook guide
perf(shell): optimize tab switching
test(events): add conflict resolution tests
chore(deps): update dependencies
```

## Testing Requirements

### Test Coverage Minimums

| Component Type | Unit | Integration | E2E |
|---------------|------|-------------|-----|
| Views | 80% | 70% | 60% |
| Hooks | 90% | 80% | - |
| Services | 95% | 85% | - |
| Utils | 100% | - | - |

### Test Patterns

```typescript
// AAA Pattern is mandatory
describe('Component', () => {
  test('should behavior description', () => {
    // Arrange
    const props = buildProps();
    
    // Act
    const result = performAction(props);
    
    // Assert
    expect(result).toMatchExpectation();
  });
});
```

## Performance Standards

### Bundle Size Limits

| Component | Max Size | Critical |
|-----------|----------|----------|
| Shell Core | 150KB | Yes |
| Per View | 100KB | Yes |
| Per Panel | 50KB | Yes |
| Total Initial | 500KB | Yes |

### Runtime Metrics

| Metric | Target | Method |
|--------|--------|--------|
| FPS | 60+ | requestAnimationFrame |
| INP | <200ms | web-vitals |
| Memory | <100MB | performance.memory |

## Security Guidelines

### Never Generate

- Authentication logic
- Payment processing
- Encryption/decryption
- Private key handling
- Token management
- Password operations

### Always Include

- Input validation
- Output encoding
- CSRF protection
- Rate limiting
- Error sanitization
- Audit logging

## Documentation Standards

### Code Comments

```typescript
/**
 * Component-level JSDoc only for public APIs
 * @param props - Component properties
 * @returns Rendered component
 */
export const PublicComponent = (props: Props) => {
  // Inline comments only for complex logic
  const complexResult = performComplexOperation();
  
  return <div>{complexResult}</div>;
};
```

### README Updates

When modifying features, update:
1. Feature list if adding/removing
2. Installation steps if dependencies change
3. Configuration if settings change
4. API documentation if interfaces change

## Quality Checklist

Before considering any task complete:

- [ ] Code follows project standards
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No console.logs remaining
- [ ] Performance targets met
- [ ] Accessibility verified
- [ ] Security reviewed
- [ ] Lint/format passing

## Resource Limits

### AI Context Management

- Maximum context: 200K tokens
- Priority files: CLAUDE.md, RULES_MASTER.md
- Exclude: node_modules, dist, .next
- Optimize: Remove comments, minimize whitespace

### Response Limits

- Code blocks: Maximum 200 lines per block
- Total response: Maximum 500 lines
- Explanations: Maximum 4 sentences per concept
- Examples: 1-2 per pattern

## Continuous Learning

### Pattern Recognition

When you identify repeated patterns:
1. Document the pattern
2. Create a reusable solution
3. Add to appropriate rules module
4. Share with team

### Error Tracking

Track common errors and their solutions:
```typescript
const COMMON_ERRORS = {
  'Cannot read property of undefined': 'Add optional chaining or null check',
  'Maximum call stack exceeded': 'Check for infinite recursion',
  'Memory leak detected': 'Clean up effects and subscriptions'
};
```

---

These shared configurations ensure consistency across all AI assistants working on the Command Center Calendar project.