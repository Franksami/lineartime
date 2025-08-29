# Claude-Specific Configuration

---
extends: _shared.config.md
assistant: claude
version: 1.0.0
priority: high
---

## Claude-Specific Optimizations

### Context Window Management

Claude has a 200K token context window. Optimize usage:

```yaml
context_allocation:
  system_prompt: 5%    # ~10K tokens
  rules: 10%          # ~20K tokens  
  code_context: 60%   # ~120K tokens
  conversation: 20%   # ~40K tokens
  buffer: 5%          # ~10K tokens
```

### Claude Command Integration

Claude-specific commands in `.claude/commands/`:

```markdown
# Available Claude Commands
/analyze - Deep code analysis with sequential thinking
/build - Component generation with Magic UI
/test - Test generation with Playwright
/docs - Documentation with Context7
/task - Task management with Taskmaster
```

### MCP Server Preferences

Claude's optimal MCP server configuration:

```yaml
primary_servers:
  - sequential-thinking  # Complex reasoning
  - context7            # Documentation
  - task-master-ai      # Project management
  
secondary_servers:
  - magic-ui           # UI generation
  - playwright         # Testing
  - memory            # Long conversations
  
auto_activate:
  complexity_high: [sequential-thinking, context7]
  ui_tasks: [magic-ui, context7]
  testing: [playwright, sequential-thinking]
```

## Claude Response Patterns

### Structured Thinking

When using `--think` flags:

```markdown
## Sequential Analysis

### 1. Understanding the Problem
[Concise problem statement]

### 2. Identifying Key Components
- Component A: [Role]
- Component B: [Role]

### 3. Solution Approach
[Step-by-step approach]

### 4. Implementation
```code
[Actual implementation]
```

### 5. Validation
[How to verify success]
```

### Code Generation Format

```typescript
// Claude prefers complete, runnable examples

// ✅ GOOD - Complete component
export const CalendarEvent: FC<CalendarEventProps> = ({
  event,
  onEdit,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  
  return (
    <div className="calendar-event" onClick={handleToggle}>
      <h3>{event.title}</h3>
      {isExpanded && (
        <div className="event-details">
          <p>{event.description}</p>
          <button onClick={() => onEdit(event.id)}>Edit</button>
          <button onClick={() => onDelete(event.id)}>Delete</button>
        </div>
      )}
    </div>
  );
};

// ❌ AVOID - Partial snippets
const handleClick = () => {
  // ... some logic
};
```

## Claude Tool Usage

### Tool Chaining Patterns

```python
# Claude's preferred tool chain order
1. Read → Understand context
2. Grep → Find patterns
3. Sequential → Think through solution
4. Context7 → Get best practices
5. Edit/Write → Implement solution
6. Test → Validate changes
```

### Parallel Tool Execution

Claude can execute multiple tools in parallel:

```yaml
parallel_patterns:
  research:
    - [Grep, "pattern1"]
    - [Glob, "*.tsx"]
    - [Context7, "react patterns"]
    
  implementation:
    - [Edit, "file1.tsx"]
    - [Edit, "file2.tsx"]
    - [Write, "newfile.tsx"]
```

## Claude Personality Traits

### Communication Style

1. **Professional**: Technical but accessible
2. **Thorough**: Complete solutions, not fragments
3. **Evidence-Based**: Always backs claims with data
4. **Structured**: Clear organization and flow

### Problem-Solving Approach

```markdown
1. Analyze thoroughly before acting
2. Consider multiple solutions
3. Choose optimal approach
4. Implement completely
5. Validate thoroughly
```

### Error Handling

When Claude encounters errors:

```typescript
// Claude's error response format
interface ClaudeError {
  error: {
    type: 'syntax' | 'runtime' | 'logic' | 'performance';
    location: `${filename}:${line}:${column}`;
    message: string;
    cause: string;
    fix: {
      description: string;
      code: string;
    };
    prevention: string;
  };
}
```

## Claude Optimization Tips

### Performance Optimizations

1. **Batch Operations**: Claude performs better with batched edits
2. **Context Pruning**: Remove unnecessary files from context
3. **Structured Prompts**: Use templates for consistent results
4. **Tool Hints**: Explicitly mention which tools to use

### Quality Improvements

```yaml
quality_hints:
  - Always run test:shell before completing
  - Use TodoWrite for multi-step tasks
  - Batch related file reads
  - Prefer Edit over Write for existing files
  - Use sequential thinking for complex problems
```

## Claude-Specific Templates

### Feature Implementation Template

```markdown
# Task: Implement [FEATURE NAME]

## Context
- Component: [Component location]
- Dependencies: [Required packages]
- Architecture: Command Workspace

## Requirements
1. [Requirement 1]
2. [Requirement 2]

## Implementation Plan
1. Read existing code
2. Create/modify components
3. Add tests
4. Update documentation

## Validation
- [ ] test:shell passes
- [ ] test:governance passes
- [ ] Performance targets met
```

### Bug Fix Template

```markdown
# Bug: [DESCRIPTION]

## Symptoms
- What: [Observable behavior]
- Where: [Location]
- When: [Conditions]

## Root Cause Analysis
[Use sequential thinking]

## Solution
[Specific fix with code]

## Prevention
[How to prevent recurrence]
```

## Claude Integration with Command Center Calendar

### Project-Specific Optimizations

```yaml
lineartime_optimizations:
  command_workspace:
    - Always preserve AppShell structure
    - Respect three-pane architecture
    - Never import LinearCalendarHorizontal outside Year Lens
    
  performance:
    - Monitor 112+ FPS requirement
    - Check <500ms shell render
    - Validate <120ms keyboard response
    
  testing:
    - Always run test:shell
    - Always run test:governance
    - Include Playwright E2E tests
```

### Claude Command Workflow

```bash
# Optimal Claude workflow for Command Center Calendar

# 1. Load context
Read CLAUDE.md rules/RULES_MASTER.md

# 2. Understand task
--think analyze requirements

# 3. Research
Context7 best practices
Grep existing patterns

# 4. Implement
Edit components/...
Write tests/...

# 5. Validate
Bash npm run test:shell
Bash npm run test:governance

# 6. Document
Update README.md
Update CHANGELOG.md
```

## Claude Limitations & Workarounds

### Known Limitations

1. **Large File Edits**: May timeout on files >1000 lines
   - Workaround: Split into multiple edits
   
2. **Complex Refactoring**: May miss edge cases
   - Workaround: Use sequential thinking first
   
3. **Visual Testing**: Cannot see actual UI
   - Workaround: Use Playwright for visual validation

### Best Practices

```yaml
claude_best_practices:
  - Read before writing
  - Think before implementing
  - Test after changing
  - Document while working
  - Use appropriate tools
  - Batch similar operations
  - Provide clear context
  - Use structured prompts
```

---

These Claude-specific configurations optimize the AI assistant for the Command Center Calendar project environment.