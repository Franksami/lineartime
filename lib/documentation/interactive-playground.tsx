/**
 * Interactive Code Playground for Command Center Calendar
 *
 * Live code editor with real-time preview for testing
 * Command Center Calendar APIs and components.
 *
 * @module Documentation
 * @category Developer Tools
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import { Play, Download, Share2, Copy, Check, AlertCircle, BookOpen } from 'lucide-react';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Code example structure
 * @interface
 */
export interface CodeExample {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Description of the example */
  description: string;
  /** Category for grouping */
  category: string;
  /** Programming language */
  language: 'typescript' | 'javascript' | 'tsx' | 'jsx';
  /** Initial code content */
  code: string;
  /** Setup code (hidden from editor) */
  setupCode?: string;
  /** Dependencies required */
  dependencies?: string[];
  /** Tags for searching */
  tags: string[];
  /** Difficulty level */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Playground state
 * @interface
 */
export interface PlaygroundState {
  /** Current code in editor */
  code: string;
  /** Selected example */
  selectedExample: string | null;
  /** Execution result */
  result: any;
  /** Console output */
  console: string[];
  /** Error messages */
  errors: string[];
  /** Is code running */
  isRunning: boolean;
  /** Editor theme */
  theme: 'light' | 'dark';
}

// ============================================================================
// EXAMPLE CATALOG
// ============================================================================

/**
 * Pre-built code examples
 * @const
 */
export const CODE_EXAMPLES: CodeExample[] = [
  // Performance Examples
  {
    id: 'web-vitals-basic',
    title: 'Web Vitals Monitoring',
    description: 'Monitor Core Web Vitals in real-time',
    category: 'Performance',
    language: 'typescript',
    code: `// Web Vitals Monitoring Example
import { WebVitalsMonitor } from '@/lib/performance/web-vitals-monitoring';

// Create monitor instance
const monitor = new WebVitalsMonitor();

// Set up metrics handler
monitor.onMetric((metric) => {
  console.log(\`\${metric.name}: \${metric.value}\${metric.rating}\`);
  
  // Send to analytics
  if (metric.rating === 'poor') {
    console.warn(\`Poor \${metric.name} detected: \${metric.value}\`);
  }
});

// Start monitoring
monitor.start();
console.log('Web Vitals monitoring started!');`,
    tags: ['performance', 'monitoring', 'web-vitals'],
    difficulty: 'beginner',
  },

  {
    id: 'performance-budget',
    title: 'Performance Budget Validation',
    description: 'Check if metrics meet performance budgets',
    category: 'Performance',
    language: 'typescript',
    code: `// Performance Budget Validation
import { validateBudget, BundleSizeBudget } from '@/lib/performance/performance-budgets';

// Define budget
const budget: BundleSizeBudget = {
  name: 'Main Bundle',
  warning: 150000,  // 150KB
  threshold: 200000, // 200KB
  critical: 300000,  // 300KB
  unit: 'bytes'
};

// Current bundle size (mock)
const currentSize = 175000; // 175KB

// Validate
const result = validateBudget(budget, currentSize);

console.log('Budget Validation Result:');
console.log('Status:', result.status);
console.log('Message:', result.message);

if (result.status === 'WARN' || result.status === 'FAIL') {
  console.log('Recommendations:', result.recommendations);
}`,
    tags: ['performance', 'budgets', 'validation'],
    difficulty: 'intermediate',
  },

  // Security Examples
  {
    id: 'input-validation',
    title: 'Input Validation',
    description: 'Validate and sanitize user input',
    category: 'Security',
    language: 'typescript',
    code: `// Input Validation Example
import { validate, emailSchema, passwordSchema } from '@/lib/security/input-validation';

// Test data
const testEmail = 'user@example.com';
const testPassword = 'SecurePass123!';

// Validate email
const emailResult = validate(testEmail, emailSchema);
console.log('Email Validation:');
console.log('  Valid:', emailResult.valid);
if (emailResult.valid) {
  console.log('  Data:', emailResult.data);
} else {
  console.log('  Errors:', emailResult.errors);
}

// Validate password
const passwordResult = validate(testPassword, passwordSchema);
console.log('\\nPassword Validation:');
console.log('  Valid:', passwordResult.valid);
if (!passwordResult.valid) {
  passwordResult.errors?.forEach(err => {
    console.log(\`  - \${err.field}: \${err.message}\`);
  });
}`,
    tags: ['security', 'validation', 'input'],
    difficulty: 'beginner',
  },

  {
    id: 'rate-limiting',
    title: 'API Rate Limiting',
    description: 'Implement rate limiting for API endpoints',
    category: 'Security',
    language: 'typescript',
    code: `// Rate Limiting Example
import { RateLimiter } from '@/lib/security/api-rate-limiting';

// Create rate limiter (10 requests per minute)
const limiter = new RateLimiter({
  strategy: 'sliding-window',
  limit: 10,
  window: 60000, // 1 minute
  keyPrefix: 'api-test'
});

// Simulate API requests
async function simulateRequests() {
  const userId = 'user-123';
  
  for (let i = 0; i < 15; i++) {
    const result = await limiter.limit(userId);
    
    console.log(\`Request \${i + 1}:\`);
    console.log(\`  Allowed: \${result.success}\`);
    console.log(\`  Remaining: \${result.remaining}/\${result.limit}\`);
    
    if (!result.success) {
      console.log(\`  Retry after: \${result.retryAfter}s\`);
      break;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

simulateRequests();`,
    tags: ['security', 'rate-limiting', 'api'],
    difficulty: 'intermediate',
  },

  // Accessibility Examples
  {
    id: 'accessibility-test',
    title: 'Accessibility Testing',
    description: 'Run accessibility tests on components',
    category: 'Accessibility',
    language: 'tsx',
    code: `// Accessibility Testing Example
import { useAccessibilityTesting } from '@/lib/accessibility/accessibility-testing';

function AccessibleComponent() {
  const { runTest, results, showOverlay } = useAccessibilityTesting({
    standard: 'WCAG2AA',
    runOnMount: true
  });
  
  // Check results
  if (results) {
    console.log('Accessibility Test Results:');
    console.log('  Violations:', results.violations.length);
    console.log('  Warnings:', results.incomplete.length);
    console.log('  Passed:', results.passes.length);
    
    // Log violations
    results.violations.forEach(violation => {
      console.error(\`❌ \${violation.id}: \${violation.description}\`);
    });
  }
  
  return (
    <div>
      <h1>Accessible Component</h1>
      <button onClick={runTest}>Run Accessibility Test</button>
      
      {/* Missing alt text - will be caught by test */}
      <img src="example.jpg" />
      
      {/* Low contrast - will be caught by test */}
      <p style={{ color: '#999', backgroundColor: '#eee' }}>
        Low contrast text
      </p>
      
      {showOverlay && <div>Accessibility overlay active</div>}
    </div>
  );
}`,
    tags: ['accessibility', 'testing', 'wcag'],
    difficulty: 'intermediate',
  },

  // Quality Gates Examples
  {
    id: 'quality-gates',
    title: 'Quality Gates Validation',
    description: 'Run quality gates before deployment',
    category: 'Quality',
    language: 'typescript',
    code: `// Quality Gates Example
import { QualityGatesRunner } from '@/lib/quality/quality-gates';

async function runQualityChecks() {
  const runner = new QualityGatesRunner({
    failFast: false,
    parallel: true,
    categories: ['PERFORMANCE', 'SECURITY', 'TESTING']
  });
  
  console.log('Running quality gates...');
  const report = await runner.runAll();
  
  console.log('\\n==== QUALITY GATES REPORT ====');
  console.log('Overall Status:', report.overall);
  console.log('Score:', report.score.toFixed(1) + '%');
  
  console.log('\\nSummary:');
  console.log('  Passed:', report.summary.passed);
  console.log('  Failed:', report.summary.failed);
  console.log('  Warnings:', report.summary.warned);
  
  if (report.blockingIssues.length > 0) {
    console.log('\\n❌ Blocking Issues:');
    report.blockingIssues.forEach(issue => {
      console.log('  -', issue);
    });
  }
  
  if (report.recommendations.length > 0) {
    console.log('\\n💡 Recommendations:');
    report.recommendations.slice(0, 3).forEach(rec => {
      console.log('  -', rec);
    });
  }
  
  return report.overall === 'PASS';
}

runQualityChecks().then(passed => {
  console.log('\\nDeployment', passed ? '✅ APPROVED' : '❌ BLOCKED');
});`,
    tags: ['quality', 'validation', 'ci-cd'],
    difficulty: 'advanced',
  },
];

// ============================================================================
// PLAYGROUND COMPONENT
// ============================================================================

/**
 * Interactive Code Playground Component
 *
 * @component
 * @category Documentation
 *
 * @example
 * ```tsx
 * <InteractivePlayground
 *   examples={CODE_EXAMPLES}
 *   defaultExample="web-vitals-basic"
 * />
 * ```
 */
export function InteractivePlayground({
  examples = CODE_EXAMPLES,
  defaultExample,
  onShareCode,
}: {
  examples?: CodeExample[];
  defaultExample?: string;
  onShareCode?: (code: string) => void;
}) {
  const [state, setState] = useState<PlaygroundState>({
    code: examples[0]?.code || '',
    selectedExample: defaultExample || examples[0]?.id || null,
    result: null,
    console: [],
    errors: [],
    isRunning: false,
    theme: 'dark',
  });

  const [copied, setCopied] = useState(false);
  const editorRef = useRef<any>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Load example
  const loadExample = useCallback(
    (exampleId: string) => {
      const example = examples.find((e) => e.id === exampleId);
      if (example) {
        setState((prev) => ({
          ...prev,
          code: example.code,
          selectedExample: exampleId,
          console: [],
          errors: [],
          result: null,
        }));
      }
    },
    [examples]
  );

  // Run code
  const runCode = useCallback(async () => {
    setState((prev) => ({ ...prev, isRunning: true, console: [], errors: [] }));

    try {
      // Create console proxy
      const consoleOutput: string[] = [];
      const originalConsole = { ...console };

      // Override console methods
      const proxyConsole = {
        log: (...args: any[]) => {
          consoleOutput.push(args.map((a) => String(a)).join(' '));
          originalConsole.log(...args);
        },
        error: (...args: any[]) => {
          consoleOutput.push(`ERROR: ${args.map((a) => String(a)).join(' ')}`);
          originalConsole.error(...args);
        },
        warn: (...args: any[]) => {
          consoleOutput.push(`WARN: ${args.map((a) => String(a)).join(' ')}`);
          originalConsole.warn(...args);
        },
      };

      // Execute code in sandbox (simplified - in production use iframe sandbox)
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const sandboxedCode = new AsyncFunction('console', state.code);

      const result = await sandboxedCode(proxyConsole);

      setState((prev) => ({
        ...prev,
        result,
        console: consoleOutput,
        errors: [],
        isRunning: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        errors: [String(error)],
        console: prev.console,
        isRunning: false,
      }));
    }
  }, [state.code]);

  // Copy code
  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(state.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [state.code]);

  // Download code
  const downloadCode = useCallback(() => {
    const blob = new Blob([state.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.selectedExample || 'playground'}.ts`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.code, state.selectedExample]);

  // Share code
  const shareCode = useCallback(() => {
    if (onShareCode) {
      onShareCode(state.code);
    } else {
      // Default share implementation
      const shareUrl = `${window.location.origin}/playground?code=${encodeURIComponent(state.code)}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [state.code, onShareCode]);

  // Get example by category
  const examplesByCategory = examples.reduce(
    (acc, example) => {
      if (!acc[example.category]) {
        acc[example.category] = [];
      }
      acc[example.category].push(example);
      return acc;
    },
    {} as Record<string, CodeExample[]>
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Interactive Playground</h2>
          <select
            value={state.selectedExample || ''}
            onChange={(e) => loadExample(e.target.value)}
            className="px-3 py-1 rounded border bg-background"
          >
            <option value="">Select Example</option>
            {Object.entries(examplesByCategory).map(([category, examples]) => (
              <optgroup key={category} label={category}>
                {examples.map((example) => (
                  <option key={example.id} value={example.id}>
                    {example.title} ({example.difficulty})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setState((prev) => ({
                ...prev,
                theme: prev.theme === 'dark' ? 'light' : 'dark',
              }))
            }
            className="p-2 rounded hover:bg-accent"
          >
            {state.theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button onClick={copyCode} className="p-2 rounded hover:bg-accent" title="Copy code">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={downloadCode}
            className="p-2 rounded hover:bg-accent"
            title="Download code"
          >
            <Download className="w-4 h-4" />
          </button>

          <button onClick={shareCode} className="p-2 rounded hover:bg-accent" title="Share code">
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={runCode}
            disabled={state.isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {state.isRunning ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        {/* Editor */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Code Editor</h3>
            {state.selectedExample && (
              <span className="text-sm text-muted-foreground">
                {examples.find((e) => e.id === state.selectedExample)?.language}
              </span>
            )}
          </div>

          <div className="flex-1 border rounded overflow-hidden">
            <Editor
              height="100%"
              language={
                examples.find((e) => e.id === state.selectedExample)?.language || 'typescript'
              }
              theme={state.theme === 'dark' ? 'vs-dark' : 'vs'}
              value={state.code}
              onChange={(value) => setState((prev) => ({ ...prev, code: value || '' }))}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
              onMount={(editor) => {
                editorRef.current = editor;
              }}
            />
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Output</h3>
            <button
              onClick={() => setState((prev) => ({ ...prev, console: [], errors: [] }))}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>

          <div
            ref={outputRef}
            className="flex-1 border rounded p-4 overflow-auto font-mono text-sm bg-background"
          >
            {/* Errors */}
            {state.errors.length > 0 && (
              <div className="mb-4">
                {state.errors.map((error, i) => (
                  <div key={i} className="flex items-start gap-2 text-destructive mb-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Console output */}
            {state.console.length > 0 && (
              <div className="space-y-1">
                {state.console.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.startsWith('ERROR:')
                        ? 'text-destructive'
                        : line.startsWith('WARN:')
                          ? 'text-yellow-600'
                          : 'text-foreground'
                    }
                  >
                    {line}
                  </div>
                ))}
              </div>
            )}

            {/* Result */}
            {state.result !== null && state.result !== undefined && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-muted-foreground mb-1">Result:</div>
                <pre className="text-foreground">{JSON.stringify(state.result, null, 2)}</pre>
              </div>
            )}

            {/* Empty state */}
            {state.console.length === 0 && state.errors.length === 0 && !state.result && (
              <div className="text-muted-foreground">Click "Run" to execute the code...</div>
            )}
          </div>
        </div>
      </div>

      {/* Example Description */}
      {state.selectedExample && (
        <div className="p-4 border-t bg-muted/50">
          <div className="flex items-start gap-2">
            <BookOpen className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="font-semibold">
                {examples.find((e) => e.id === state.selectedExample)?.title}
              </div>
              <div className="text-sm text-muted-foreground">
                {examples.find((e) => e.id === state.selectedExample)?.description}
              </div>
              <div className="flex gap-2 mt-2">
                {examples
                  .find((e) => e.id === state.selectedExample)
                  ?.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded bg-primary/10 text-primary"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default InteractivePlayground;
