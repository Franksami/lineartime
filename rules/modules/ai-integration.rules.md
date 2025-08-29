# AI Integration Rules Module

---
extends: ../RULES_MASTER.md
module: ai-integration
version: 1.0.0
priority: high
override: partial  # Can override non-critical rules
---

## AI Development Standards

### AI-M001: MCP Server Configuration

MCP server usage matrix:

| Server | Purpose | Auto-Activation Trigger | Priority |
|--------|---------|------------------------|----------|
| task-master-ai | Project management | Task complexity >0.7 | HIGH |
| context7 | Documentation lookup | Library imports detected | HIGH |
| sequential-thinking | Complex analysis | --think flags, debugging | HIGH |
| playwright | Browser testing | Test commands, e2e | MEDIUM |
| memory | Session persistence | Long tasks, context >100K | MEDIUM |
| shadcn | UI components | Component generation | MEDIUM |
| github | Repository ops | Git commands | LOW |
| postgres | Database queries | DB operations | LOW |
| filesystem | File operations | Bulk file changes | MEDIUM |
| docs | Documentation | Doc generation commands | LOW |
| magic-ui | Advanced UI | Complex components | MEDIUM |
| all-in-one | Multi-tool | Complex workflows | HIGH |

### AI-M002: Cursor AI Configuration

Enhanced Cursor settings:

```yaml
# .cursor/cursor-rules-v2.yaml
version: 2.0.0
extends: "@/rules/RULES_MASTER.md"

modes:
  agent:
    enabled: true
    templates_directory: ".cursor/templates/"
    context_limit: 200000
    auto_context: true
    chunk_size: 50000
    parallel_processing: true
    
  ask:
    enabled: true
    exploration_mode: true
    planning_mode: true
    max_iterations: 5
    confidence_threshold: 0.85
    
  inline:
    enabled: true
    snippets: true
    auto_complete: "enhanced"
    debounce_ms: 300
    context_aware: true
    
enforcement:
  level: "strict"
  auto_fix: true
  block_on_violation: true
  report_violations: true

context_management:
  max_files: 50
  priority_files: [
    "CLAUDE.md",
    "rules/RULES_MASTER.md",
    "package.json",
    "tsconfig.json"
  ]
  exclude_patterns: [
    "node_modules/**",
    "dist/**",
    ".next/**",
    "*.min.js"
  ]
```

### AI-M003: Prompt Engineering Standards

Structured prompt patterns:

```markdown
# Prompt Template Structure

## Context Section
- Project: {project_name}
- Phase: {current_phase}
- Architecture: {architecture_type}
- Tech Stack: {technologies}

## Task Section
- Objective: {clear_objective}
- Constraints: {limitations}
- Success Criteria: {measurable_outcomes}

## Requirements Section
1. {specific_requirement_1}
2. {specific_requirement_2}
3. {specific_requirement_3}

## Examples Section (Few-Shot)
### Good Example:
```code
{positive_example}
```

### Bad Example (Avoid):
```code
{negative_example}
```

## Output Format
- Language: {typescript|javascript|css}
- Style: {style_guide}
- Structure: {expected_structure}
```

### AI-M004: Task Decomposition Strategy

When to use AI vs manual coding:

| Task Type | AI Recommended | Manual Required | Hybrid Approach |
|-----------|---------------|-----------------|-----------------|
| Boilerplate generation | ✅ 100% | ❌ | - |
| Test creation | ✅ 90% | 10% edge cases | Initial AI, manual refinement |
| Documentation | ✅ 80% | 20% context | AI draft, human review |
| Bug fixing | 60% known patterns | ✅ 40% complex | AI diagnosis, manual fix |
| Refactoring | ✅ 70% | 30% architecture | AI suggestions, manual decision |
| Performance optimization | 30% obvious | ✅ 70% critical | AI analysis, manual implementation |
| Security fixes | ❌ 20% | ✅ 80% critical | Manual only for critical |
| Business logic | 40% standard | ✅ 60% unique | AI scaffold, manual logic |
| UI components | ✅ 85% | 15% custom | AI generation, manual polish |
| API integration | ✅ 75% | 25% auth | AI structure, manual security |

## AI Governance

### AI-M005: Security Restrictions

Restricted areas for AI code generation:

```yaml
restricted_paths:
  critical:
    - "/api/auth/**"           # Authentication logic
    - "/api/payments/**"        # Payment processing
    - "/lib/encryption/**"      # Encryption utilities
    - "/lib/security/**"        # Security functions
    - "**/*.key"               # Private keys
    - "**/*.pem"               # Certificates
    - ".env*"                  # Environment files
    
  review_required:
    - "/api/**"                # All API endpoints
    - "/lib/database/**"       # Database operations
    - "/hooks/use*Auth*"       # Auth-related hooks
    
security_patterns:
  block:
    - "eval("
    - "exec("
    - "Function("
    - "innerHTML ="
    - "dangerouslySetInnerHTML"
    - "process.env.SECRET"
    - "require('child_process')"
    
  warn:
    - "JSON.parse("
    - "setTimeout("
    - "setInterval("
    - "__proto__"
    - "prototype"
```

### AI-M006: Code Review Requirements

AI-generated code review checklist:

```markdown
## Security Review
- [ ] No hardcoded secrets or API keys
- [ ] Input validation present
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (output encoding)
- [ ] CSRF tokens implemented
- [ ] Authentication checks in place
- [ ] Authorization verified
- [ ] Rate limiting configured

## Quality Review  
- [ ] Tests included (min 80% coverage)
- [ ] Documentation updated
- [ ] Error handling complete
- [ ] Logging appropriate
- [ ] Types fully defined
- [ ] Naming conventions followed
- [ ] No console.logs remaining
- [ ] Performance impact assessed

## Maintainability Review
- [ ] Code is readable
- [ ] Logic is clear
- [ ] Dependencies minimal
- [ ] Patterns consistent
- [ ] Comments helpful
- [ ] Refactoring potential identified
```

### AI-M007: Audit Logging

AI interaction audit requirements:

```typescript
interface AIAuditLog {
  timestamp: Date;
  user: string;
  sessionId: string;
  model: 'claude' | 'cursor' | 'copilot';
  action: 'generate' | 'modify' | 'review' | 'explain';
  context: {
    files: string[];
    prompt: string;
    tokens: number;
  };
  output: {
    files_modified: string[];
    lines_changed: number;
    security_score: number;
  };
  review: {
    approved: boolean;
    reviewer: string;
    modifications: string[];
  };
}

// Log all AI interactions
const auditLogger = {
  log(entry: AIAuditLog) {
    // Store in database
    db.aiAuditLogs.insert(entry);
    
    // Alert on security concerns
    if (entry.output.security_score < 0.7) {
      alerting.securityTeam(entry);
    }
  }
};
```

## AI Agent Configuration

### AI-M008: Agent Specialization

AI agent role definitions:

```typescript
const AI_AGENTS = {
  planner: {
    role: 'Constraint-based scheduling',
    mcp: ['sequential-thinking', 'context7'],
    context_limit: 100000,
    capabilities: [
      'schedule_optimization',
      'conflict_resolution',
      'capacity_planning'
    ]
  },
  
  conflict: {
    role: 'Real-time conflict detection',
    mcp: ['sequential-thinking'],
    context_limit: 50000,
    capabilities: [
      'overlap_detection',
      'priority_resolution',
      'alternative_suggestions'
    ]
  },
  
  summarizer: {
    role: 'Conversation management',
    mcp: ['memory', 'context7'],
    context_limit: 150000,
    capabilities: [
      'context_extraction',
      'summary_generation',
      'action_items'
    ]
  },
  
  router: {
    role: 'Intent classification',
    mcp: ['task-master-ai'],
    context_limit: 30000,
    capabilities: [
      'intent_detection',
      'confidence_scoring',
      'route_determination'
    ]
  }
};
```

### AI-M009: Context Management

AI context optimization:

```typescript
class AIContextManager {
  private maxTokens = 200000;
  private priorityFiles: string[] = [
    'CLAUDE.md',
    'rules/RULES_MASTER.md',
    'package.json'
  ];
  
  async prepareContext(task: string): Promise<AIContext> {
    const context: AIContext = {
      files: [],
      tokens: 0,
      metadata: {}
    };
    
    // 1. Add priority files first
    for (const file of this.priorityFiles) {
      if (context.tokens < this.maxTokens * 0.3) {
        context.files.push(await this.loadFile(file));
      }
    }
    
    // 2. Add relevant files based on task
    const relevantFiles = await this.findRelevantFiles(task);
    for (const file of relevantFiles) {
      if (context.tokens < this.maxTokens * 0.7) {
        context.files.push(await this.loadFile(file));
      }
    }
    
    // 3. Add recent changes
    const recentChanges = await this.getRecentChanges();
    context.metadata.recentChanges = recentChanges;
    
    return context;
  }
}
```

## AI Tool Integration

### AI-M010: Tool Chaining

AI tool orchestration patterns:

```typescript
// Sequential tool chain
const sequentialChain = async (input: string) => {
  const analysis = await sequential.analyze(input);
  const docs = await context7.getDocs(analysis.topics);
  const solution = await sequential.solve(analysis, docs);
  return solution;
};

// Parallel tool execution
const parallelTools = async (input: string) => {
  const [docs, analysis, tests] = await Promise.all([
    context7.search(input),
    sequential.think(input),
    playwright.generateTests(input)
  ]);
  
  return combineResults(docs, analysis, tests);
};

// Conditional tool selection
const selectTool = (task: Task) => {
  if (task.complexity > 0.8) return 'sequential';
  if (task.type === 'ui') return 'magic-ui';
  if (task.type === 'test') return 'playwright';
  return 'context7';
};
```

### AI-M011: Response Validation

AI output validation requirements:

```typescript
const validateAIResponse = async (response: AIResponse) => {
  const validations = {
    syntax: await validateSyntax(response.code),
    security: await securityScan(response.code),
    performance: await performanceCheck(response.code),
    tests: await testCoverage(response.code),
    style: await lintCheck(response.code)
  };
  
  const score = calculateScore(validations);
  
  if (score < 0.7) {
    throw new Error('AI response failed validation');
  }
  
  return {
    approved: true,
    score,
    validations
  };
};
```

### AI-M012: Fallback Strategies

AI failure handling:

```typescript
const aiWithFallback = async (task: Task) => {
  try {
    // Primary AI attempt
    return await primaryAI.execute(task);
  } catch (error) {
    console.warn('Primary AI failed:', error);
    
    try {
      // Fallback to simpler AI
      return await fallbackAI.execute(simplifyTask(task));
    } catch (fallbackError) {
      console.warn('Fallback AI failed:', fallbackError);
      
      // Manual fallback
      return {
        status: 'manual_required',
        reason: error.message,
        suggestions: await getSuggestions(task)
      };
    }
  }
};
```

## Performance Optimization

### AI-M013: AI Response Caching

Cache AI responses for efficiency:

```typescript
class AICache {
  private cache = new Map<string, CachedResponse>();
  private maxAge = 3600000; // 1 hour
  
  async get(prompt: string, context: Context) {
    const key = this.generateKey(prompt, context);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      return cached.response;
    }
    
    return null;
  }
  
  set(prompt: string, context: Context, response: AIResponse) {
    const key = this.generateKey(prompt, context);
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.cache.size > 1000) {
      const oldest = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)[0];
      this.cache.delete(oldest[0]);
    }
  }
}
```

### AI-M014: Token Optimization

Minimize token usage:

```typescript
const optimizeTokens = (context: string): string => {
  // Remove comments
  context = context.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  
  // Minimize whitespace
  context = context.replace(/\s+/g, ' ');
  
  // Remove non-essential code
  context = context.replace(/console\.(log|debug|info)/g, '');
  
  // Truncate long strings
  context = context.replace(/"[^"]{100,}"/g, '"[TRUNCATED]"');
  
  return context;
};
```

---

These AI integration rules ensure safe, efficient, and effective use of AI assistance throughout the Command Center Calendar project.