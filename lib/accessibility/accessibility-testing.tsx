/**
 * Accessibility Testing Framework for Command Center Calendar
 *
 * Comprehensive accessibility testing with axe-core integration.
 * Implements WCAG 2.1 AA compliance checking and automated testing.
 *
 * @see https://github.com/dequelabs/axe-core
 * @see https://www.w3.org/WAI/WCAG21/quickref/
 */

'use client';

import { useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: ViolationNode[];
  tags: string[];
}

export interface ViolationNode {
  target: string[];
  html: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  failureSummary: string;
  any: Check[];
  all: Check[];
  none: Check[];
}

export interface Check {
  id: string;
  message: string;
  impact: string;
  data: any;
}

export interface AccessibilityReport {
  violations: AccessibilityViolation[];
  passes: any[];
  incomplete: any[];
  inapplicable: any[];
  timestamp: number;
  url: string;
  testEnvironment: {
    userAgent: string;
    windowWidth: number;
    windowHeight: number;
    orientationType?: string;
  };
}

export interface AccessibilityTestConfig {
  runOnly?: {
    type: 'tag' | 'rule';
    values: string[];
  };
  rules?: Record<string, { enabled: boolean }>;
  reporter?: string;
  locale?: string;
  axeVersion?: string;
  elementRef?: boolean;
  selectors?: boolean;
  ancestry?: boolean;
  xpath?: boolean;
  absolutePaths?: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * WCAG 2.1 AA Configuration
 * Standard compliance configuration for accessibility testing
 */
export const WCAG21AA_CONFIG: AccessibilityTestConfig = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
  },
  rules: {
    // Ensure all interactive elements are keyboard accessible
    'keyboard-accessible': { enabled: true },
    // Check for proper ARIA usage
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'aria-allowed-attr': { enabled: true },
    'aria-roles': { enabled: true },
    // Color contrast checking
    'color-contrast': { enabled: true },
    // Language and internationalization
    'html-has-lang': { enabled: true },
    'html-lang-valid': { enabled: true },
    // Images and media
    'image-alt': { enabled: true },
    'audio-caption': { enabled: true },
    'video-caption': { enabled: true },
    // Forms and inputs
    label: { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    // Navigation and landmarks
    'landmark-one-main': { enabled: true },
    bypass: { enabled: true },
    // Focus management
    'focus-order-semantics': { enabled: true },
    tabindex: { enabled: true },
  },
};

// ============================================================================
// AXE-CORE LOADER
// ============================================================================

let axeCore: any = null;

/**
 * Dynamically load axe-core library
 */
async function loadAxeCore() {
  if (axeCore) return axeCore;

  try {
    // Dynamic import to avoid SSR issues
    const axe = await import('axe-core');
    axeCore = axe.default;
    return axeCore;
  } catch (error) {
    console.error('Failed to load axe-core:', error);
    throw new Error('Accessibility testing requires axe-core library');
  }
}

// ============================================================================
// ACCESSIBILITY TESTING HOOK
// ============================================================================

/**
 * React hook for accessibility testing
 * Provides automated scanning and reporting
 */
export function useAccessibilityTesting(
  config: AccessibilityTestConfig = WCAG21AA_CONFIG,
  autoRun = false
) {
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const axeRef = useRef<any>(null);

  // Load axe-core on mount
  useEffect(() => {
    loadAxeCore()
      .then((axe) => {
        axeRef.current = axe;

        // Configure axe-core
        if (config.locale) {
          axe.configure({ locale: config.locale });
        }

        // Auto-run if requested
        if (autoRun) {
          runAccessibilityTest();
        }
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  /**
   * Run accessibility test
   */
  const runAccessibilityTest = async (
    context: Element | Document = document,
    customConfig?: AccessibilityTestConfig
  ) => {
    if (!axeRef.current) {
      setError('Axe-core not loaded');
      return null;
    }

    setIsRunning(true);
    setError(null);

    try {
      const testConfig = customConfig || config;

      // Run axe-core analysis
      const results = await axeRef.current.run(context, testConfig);

      // Create comprehensive report
      const report: AccessibilityReport = {
        violations: results.violations,
        passes: results.passes,
        incomplete: results.incomplete,
        inapplicable: results.inapplicable,
        timestamp: Date.now(),
        url: window.location.href,
        testEnvironment: {
          userAgent: navigator.userAgent,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          orientationType: (window.screen as any).orientation?.type,
        },
      };

      setReport(report);

      // Log violations in development
      if (process.env.NODE_ENV === 'development' && results.violations.length > 0) {
        console.group('🚨 Accessibility Violations Detected');
        results.violations.forEach((violation: AccessibilityViolation) => {
          console.error(`[${violation.impact}] ${violation.description}`);
          console.log('Help:', violation.help);
          console.log('Learn more:', violation.helpUrl);
          console.log('Affected nodes:', violation.nodes);
        });
        console.groupEnd();
      }

      return report;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Accessibility test failed:', err);
      return null;
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * Get violation summary
   */
  const getViolationSummary = () => {
    if (!report) return null;

    const summary = {
      total: report.violations.length,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    };

    report.violations.forEach((violation) => {
      violation.nodes.forEach((node) => {
        switch (node.impact) {
          case 'critical':
            summary.critical++;
            break;
          case 'serious':
            summary.serious++;
            break;
          case 'moderate':
            summary.moderate++;
            break;
          case 'minor':
            summary.minor++;
            break;
        }
      });
    });

    return summary;
  };

  /**
   * Export report as JSON
   */
  const exportReport = () => {
    if (!report) return;

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    report,
    isRunning,
    error,
    runAccessibilityTest,
    getViolationSummary,
    exportReport,
  };
}

// ============================================================================
// ACCESSIBILITY TESTING COMPONENT
// ============================================================================

interface AccessibilityTesterProps {
  config?: AccessibilityTestConfig;
  showInProduction?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  autoRun?: boolean;
}

/**
 * Accessibility testing overlay component
 * Provides UI for running tests and viewing results
 */
export function AccessibilityTester({
  config = WCAG21AA_CONFIG,
  showInProduction = false,
  position = 'bottom-right',
  autoRun = false,
}: AccessibilityTesterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  const { report, isRunning, error, runAccessibilityTest, getViolationSummary, exportReport } =
    useAccessibilityTesting(config, autoRun);

  // Don't render in production unless explicitly allowed
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null;
  }

  const summary = getViolationSummary();
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Minimized View */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 /* TODO: Use semantic token */ text-white px-3 py-2 rounded-lg shadow-lg hover:bg-blue-700 /* TODO: Use semantic token */ font-mono text-sm"
          aria-label="Open accessibility tester"
        >
          ♿ A11y
          {summary && summary.total > 0 && (
            <span className="ml-2 bg-red-500 /* TODO: Use semantic token */ text-white px-2 py-1 rounded-full text-xs">
              {summary.total}
            </span>
          )}
        </button>
      )}

      {/* Expanded View */}
      {!isMinimized && (
        <div className="bg-white dark:bg-gray-900 /* TODO: Use semantic token */ rounded-lg shadow-2xl w-96 max-h-[600px] overflow-hidden border border-gray-200 /* TODO: Use semantic token */ dark:border-gray-700 /* TODO: Use semantic token */">
          {/* Header */}
          <div className="bg-blue-600 /* TODO: Use semantic token */ text-white p-4 flex justify-between items-center">
            <h3 className="font-semibold">Accessibility Tester</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-white hover:bg-blue-700 /* TODO: Use semantic token */ px-2 py-1 rounded"
                aria-label={isOpen ? 'Collapse' : 'Expand'}
              >
                {isOpen ? '−' : '+'}
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-white hover:bg-blue-700 /* TODO: Use semantic token */ px-2 py-1 rounded"
                aria-label="Minimize"
              >
                _
              </button>
            </div>
          </div>

          {/* Content */}
          {isOpen && (
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {/* Controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => runAccessibilityTest()}
                  disabled={isRunning}
                  className="flex-1 bg-blue-600 /* TODO: Use semantic token */ text-white px-4 py-2 rounded hover:bg-blue-700 /* TODO: Use semantic token */ disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning ? 'Running...' : 'Run Test'}
                </button>
                <button
                  onClick={exportReport}
                  disabled={!report}
                  className="px-4 py-2 border border-gray-300 /* TODO: Use semantic token */ dark:border-gray-600 /* TODO: Use semantic token */ rounded hover:bg-gray-50 /* TODO: Use semantic token */ dark:hover:bg-gray-800 /* TODO: Use semantic token */ disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 /* TODO: Use semantic token */ dark:bg-red-900 /* TODO: Use semantic token *//20 text-red-700 /* TODO: Use semantic token */ dark:text-red-400 /* TODO: Use semantic token */ p-3 rounded">
                  Error: {error}
                </div>
              )}

              {/* Summary */}
              {summary && (
                <div className="bg-gray-50 /* TODO: Use semantic token */ dark:bg-gray-800 /* TODO: Use semantic token */ p-3 rounded space-y-2">
                  <h4 className="font-semibold mb-2">Violation Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {summary.critical > 0 && (
                      <div className="flex justify-between">
                        <span className="text-red-700 /* TODO: Use semantic token */ dark:text-red-400 /* TODO: Use semantic token */">Critical:</span>
                        <span className="font-semibold">{summary.critical}</span>
                      </div>
                    )}
                    {summary.serious > 0 && (
                      <div className="flex justify-between">
                        <span className="text-orange-700 dark:text-orange-400">Serious:</span>
                        <span className="font-semibold">{summary.serious}</span>
                      </div>
                    )}
                    {summary.moderate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-yellow-700 /* TODO: Use semantic token */ dark:text-yellow-400 /* TODO: Use semantic token */">Moderate:</span>
                        <span className="font-semibold">{summary.moderate}</span>
                      </div>
                    )}
                    {summary.minor > 0 && (
                      <div className="flex justify-between">
                        <span className="text-blue-700 /* TODO: Use semantic token */ dark:text-blue-400 /* TODO: Use semantic token */">Minor:</span>
                        <span className="font-semibold">{summary.minor}</span>
                      </div>
                    )}
                  </div>
                  {summary.total === 0 && (
                    <div className="text-green-600 /* TODO: Use semantic token */ dark:text-green-400 /* TODO: Use semantic token */ font-semibold">
                      ✅ No violations detected!
                    </div>
                  )}
                </div>
              )}

              {/* Violations List */}
              {report && report.violations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Violations</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {report.violations.map((violation, index) => (
                      <details
                        key={index}
                        className="border border-gray-200 /* TODO: Use semantic token */ dark:border-gray-700 /* TODO: Use semantic token */ rounded p-2"
                      >
                        <summary className="cursor-pointer">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs mr-2 ${
                              violation.impact === 'critical'
                                ? 'bg-red-100 /* TODO: Use semantic token */ text-red-700 /* TODO: Use semantic token */'
                                : violation.impact === 'serious'
                                  ? 'bg-orange-100 text-orange-700'
                                  : violation.impact === 'moderate'
                                    ? 'bg-yellow-100 /* TODO: Use semantic token */ text-yellow-700 /* TODO: Use semantic token */'
                                    : 'bg-blue-100 /* TODO: Use semantic token */ text-blue-700 /* TODO: Use semantic token */'
                            }`}
                          >
                            {violation.impact}
                          </span>
                          <span className="text-sm">{violation.description}</span>
                        </summary>
                        <div className="mt-2 pl-4 space-y-2 text-xs">
                          <p className="text-gray-600 /* TODO: Use semantic token */ dark:text-gray-400 /* TODO: Use semantic token */">{violation.help}</p>
                          <p>Affected: {violation.nodes.length} element(s)</p>
                          <a
                            href={violation.helpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 /* TODO: Use semantic token */ dark:text-blue-400 /* TODO: Use semantic token */ hover:underline"
                          >
                            Learn more →
                          </a>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              {report && (
                <div className="text-xs text-gray-500 /* TODO: Use semantic token */ dark:text-gray-400 /* TODO: Use semantic token */">
                  <p>Passed: {report.passes.length} rules</p>
                  <p>Incomplete: {report.incomplete.length} rules</p>
                  <p>Not applicable: {report.inapplicable.length} rules</p>
                  <p>Tested at: {new Date(report.timestamp).toLocaleTimeString()}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// JEST TESTING UTILITIES
// ============================================================================

/**
 * Jest matcher for accessibility testing
 * Usage: expect(element).toHaveNoViolations()
 */
export async function toHaveNoViolations(element: Element) {
  const axe = await loadAxeCore();
  const results = await axe.run(element, WCAG21AA_CONFIG);

  const pass = results.violations.length === 0;

  if (pass) {
    return {
      message: () => 'Expected element to have accessibility violations',
      pass: true,
    };
  } else {
    return {
      message: () => {
        const violations = results.violations
          .map(
            (v: AccessibilityViolation) =>
              `[${v.impact}] ${v.description}\n  ${v.help}\n  ${v.helpUrl}`
          )
          .join('\n\n');

        return `Expected element to have no accessibility violations, but found:\n\n${violations}`;
      },
      pass: false,
    };
  }
}

// ============================================================================
// PLAYWRIGHT TESTING UTILITIES
// ============================================================================

/**
 * Playwright helper for accessibility testing
 * Usage: await testAccessibility(page)
 */
export async function testAccessibility(page: any, config = WCAG21AA_CONFIG) {
  // Inject axe-core
  await page.addScriptTag({
    path: require.resolve('axe-core'),
  });

  // Run accessibility test
  const results = await page.evaluate((config) => {
    return (window as any).axe.run(document, config);
  }, config);

  return results;
}

// ============================================================================
// EXPORT FOR USAGE
// ============================================================================

export default AccessibilityTester;
