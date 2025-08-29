# Cursor-Specific Configuration

---
extends: _shared.config.md
assistant: cursor
version: 1.0.0
priority: high
---

## Cursor IDE Integration

### Cursor-Specific Settings

```json
{
  "cursor.aiEnabled": true,
  "cursor.aiModel": "gpt-4-turbo-preview",
  "cursor.contextWindow": 128000,
  "cursor.temperature": 0.7,
  "cursor.maxTokens": 4000,
  "cursor.streaming": true,
  "cursor.autoSuggest": true,
  "cursor.autoSuggestDelay": 300,
  "cursor.inlineCompletions": true,
  "cursor.chatHistory": true
}
```

### Cursor Rules File Structure

```
.cursor/
├── rules/                 # Rule definitions
│   ├── *.mdc             # Rule files
│   └── taskmaster/       # Taskmaster rules
├── templates/            # Prompt templates
│   ├── feature.md
│   ├── bugfix.md
│   └── refactor.md
├── mcp.json             # MCP server config
└── cursor-rules-v2.yaml # Main configuration
```

## Cursor Modes

### Agent Mode (Autonomous)

```yaml
agent_mode:
  capabilities:
    - file_creation
    - file_modification
    - file_deletion
    - command_execution
  
  restrictions:
    - no_auth_files
    - no_payment_files
    - no_env_files
    - require_tests
  
  workflow:
    1. analyze_requirements
    2. plan_implementation
    3. execute_changes
    4. run_tests
    5. validate_results
```

### Ask Mode (Read-Only)

```yaml
ask_mode:
  capabilities:
    - file_reading
    - pattern_searching
    - documentation
    - explanation
    
  use_cases:
    - code_exploration
    - debugging_help
    - learning
    - planning
```

### Inline Mode (Co-pilot)

```yaml
inline_mode:
  features:
    - auto_complete
    - snippet_generation
    - refactoring_suggestions
    - error_fixes
    
  triggers:
    - tab_key
    - explicit_request
    - error_detection
    - comment_completion
```

## Cursor Command Palette

### Custom Commands

```typescript
// .cursor/commands.json
{
  "commands": [
    {
      "name": "Command Center Calendar: Create Component",
      "command": "lineartime.createComponent",
      "template": "templates/component.md"
    },
    {
      "name": "Command Center Calendar: Fix Performance",
      "command": "lineartime.fixPerformance",
      "template": "templates/performance.md"
    },
    {
      "name": "Command Center Calendar: Add Test",
      "command": "lineartime.addTest",
      "template": "templates/test.md"
    }
  ]
}
```

## Cursor MCP Integration

### MCP Server Priority

```yaml
mcp_servers:
  tier_1:  # Always active
    - task-master-ai
    - sequential-thinking
    
  tier_2:  # Context-activated
    - context7        # On library imports
    - magic-ui       # On UI tasks
    - playwright     # On test commands
    
  tier_3:  # Manual activation
    - github
    - postgres
    - filesystem
    - docs
```

### MCP Auto-Activation Rules

```javascript
const mcp_activation = {
  // Pattern-based activation
  patterns: {
    'import.*from.*react': ['context7'],
    'describe\\(|test\\(': ['playwright'],
    'interface.*Props': ['magic-ui'],
    'task-master': ['task-master-ai']
  },
  
  // Complexity-based activation
  complexity: {
    low: [],
    medium: ['context7'],
    high: ['sequential-thinking', 'context7'],
    critical: ['sequential-thinking', 'task-master-ai', 'context7']
  }
};
```

## Cursor Workflow Integration

### Task Management Flow

```bash
# Cursor + Taskmaster workflow

# 1. Start task
cursor> @task-master next

# 2. Get context
cursor> @task-master show TASK-123

# 3. Implementation
cursor> /agent implement [task description]

# 4. Update status
cursor> @task-master update TASK-123 "Implementation complete"

# 5. Testing
cursor> /test create unit tests

# 6. Complete
cursor> @task-master complete TASK-123
```

### Git Integration

```yaml
cursor_git_workflow:
  pre_commit:
    - run: "npm run test:shell"
    - run: "npm run test:governance"
    - check: "rules compliance"
    
  commit_template: |
    type(scope): description
    
    Task: TASK-###
    Changes:
    - Change 1
    - Change 2
    
    Tests: Added/Updated/None needed
    Docs: Updated/None needed
```

## Cursor Performance Optimization

### Context Management

```yaml
context_optimization:
  include:
    - "**/*.{ts,tsx,js,jsx}"
    - "package.json"
    - "tsconfig.json"
    - "CLAUDE.md"
    - "rules/RULES_MASTER.md"
    
  exclude:
    - "**/node_modules/**"
    - "**/dist/**"
    - "**/.next/**"
    - "**/*.min.js"
    - "**/coverage/**"
    
  priority_files:
    high:
      - "CLAUDE.md"
      - "rules/RULES_MASTER.md"
    medium:
      - "app/**/*.tsx"
      - "components/**/*.tsx"
    low:
      - "tests/**/*.ts"
      - "docs/**/*.md"
```

### Response Optimization

```yaml
response_settings:
  max_tokens: 4000
  temperature: 0.7
  streaming: true
  
  format_preferences:
    code_first: true
    explanations: minimal
    comments: essential_only
    
  code_style:
    language: typescript
    formatting: prettier
    linting: eslint
```

## Cursor Shortcuts & Commands

### Essential Shortcuts

```yaml
shortcuts:
  # Navigation
  cmd_p: "Quick file open"
  cmd_shift_p: "Command palette"
  cmd_b: "Toggle sidebar"
  
  # AI Features
  cmd_k: "Inline AI"
  cmd_shift_k: "Open chat"
  cmd_shift_a: "Agent mode"
  tab: "Accept suggestion"
  
  # Code Actions
  cmd_.: "Quick fix"
  f2: "Rename symbol"
  cmd_shift_r: "Refactor"
```

### Custom Keybindings

```json
// keybindings.json
[
  {
    "key": "cmd+shift+t",
    "command": "lineartime.runTests"
  },
  {
    "key": "cmd+shift+g",
    "command": "lineartime.governance"
  },
  {
    "key": "cmd+shift+l",
    "command": "lineartime.lint"
  }
]
```

## Cursor Templates

### Component Template

```markdown
# Create Component: {{ComponentName}}

## Requirements
- Type: {{functional|class}}
- Props: {{PropsList}}
- State: {{StateNeeded}}
- Location: components/{{path}}/

## Architecture
Follow Command Workspace patterns:
- Use AppShell structure
- Implement keyboard navigation
- Include accessibility

## Testing
- Unit tests with Vitest
- E2E tests with Playwright
- Coverage > 80%
```

### Bug Fix Template

```markdown
# Fix Bug: {{BugDescription}}

## Current Behavior
{{WhatHappens}}

## Expected Behavior
{{WhatShouldHappen}}

## Root Cause
{{Analysis}}

## Solution
1. {{Step1}}
2. {{Step2}}

## Testing
- Reproduce bug first
- Apply fix
- Verify resolution
- Add regression test
```

## Cursor Best Practices

### Do's

```yaml
cursor_dos:
  - Use templates for consistency
  - Leverage MCP servers
  - Batch related changes
  - Test incrementally
  - Document as you code
  - Use agent mode for multi-file changes
  - Use ask mode for exploration
  - Commit frequently
```

### Don'ts

```yaml
cursor_donts:
  - Don't skip tests
  - Don't ignore lint errors
  - Don't modify auth/payment code
  - Don't use agent mode for critical paths
  - Don't accept suggestions blindly
  - Don't commit without review
  - Don't bypass governance checks
```

## Cursor + Command Center Calendar Integration

### Project-Specific Rules

```yaml
lineartime_cursor_rules:
  always:
    - Check Command Workspace architecture
    - Run test:shell before commits
    - Run test:governance for compliance
    - Respect performance budgets
    
  never:
    - Import LinearCalendarHorizontal outside Year Lens
    - Skip testing requirements
    - Exceed bundle size limits
    - Ignore accessibility
    
  preferences:
    - Vitest over Jest
    - Zustand over Redux (unless complex)
    - Server Components by default
    - Token-based theming
```

### Cursor Workflow for Command Center Calendar

```bash
# Daily Command Center Calendar workflow in Cursor

# Morning setup
1. Pull latest main
2. cursor> @task-master list
3. cursor> @task-master next

# Development
4. cursor> /agent implement feature
5. Run test:shell continuously
6. cursor> /inline optimize performance

# Afternoon
7. cursor> /test create tests
8. cursor> @task-master update
9. Create PR with proper format

# End of day
10. cursor> @task-master status
11. Plan tomorrow's tasks
```

## Troubleshooting

### Common Issues

```yaml
issues:
  slow_suggestions:
    cause: "Large context"
    fix: "Exclude unnecessary files"
    
  incorrect_completions:
    cause: "Outdated context"
    fix: "Refresh index with Cmd+Shift+P > Reload"
    
  mcp_not_working:
    cause: "Server not started"
    fix: "Check .cursor/mcp.json configuration"
    
  test_failures:
    cause: "Missing governance compliance"
    fix: "Run test:governance and fix issues"
```

---

These Cursor-specific configurations optimize the IDE for Command Center Calendar development workflows.