/**
 * Performance Budget System for Command Center Calendar
 *
 * Comprehensive performance budget enforcement based on industry standards.
 * Integrates with Next.js build system and CI/CD pipelines.
 *
 * @see https://web.dev/performance-budgets-101/
 * @see https://nextjs.org/docs/app/api-reference/next-config-js
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface PerformanceBudget {
  name: string;
  type: 'size' | 'count' | 'time' | 'metric';
  threshold: number;
  warning?: number;
  critical?: number;
  unit: string;
  description?: string;
}

export interface BudgetCategory {
  name: string;
  description: string;
  budgets: PerformanceBudget[];
}

export interface BudgetViolation {
  budget: PerformanceBudget;
  actual: number;
  severity: 'warning' | 'error' | 'critical';
  difference: number;
  percentage: number;
}

export interface BudgetReport {
  timestamp: number;
  passed: boolean;
  categories: Map<string, CategoryResult>;
  violations: BudgetViolation[];
  summary: string;
}

export interface CategoryResult {
  name: string;
  passed: boolean;
  budgets: BudgetResult[];
}

export interface BudgetResult {
  budget: PerformanceBudget;
  actual: number;
  passed: boolean;
  severity?: 'warning' | 'error' | 'critical';
}

// ============================================================================
// PERFORMANCE BUDGET DEFINITIONS
// ============================================================================

/**
 * Bundle Size Budgets
 * Based on research: Mobile users on 3G networks
 */
export const BUNDLE_SIZE_BUDGETS: BudgetCategory = {
  name: 'Bundle Sizes',
  description: 'JavaScript and CSS bundle size limits',
  budgets: [
    {
      name: 'Main Bundle (JS)',
      type: 'size',
      warning: 150_000, // 150KB warning
      threshold: 200_000, // 200KB error
      critical: 300_000, // 300KB critical
      unit: 'bytes',
      description: 'Main JavaScript bundle size',
    },
    {
      name: 'Vendor Bundle (JS)',
      type: 'size',
      warning: 200_000, // 200KB warning
      threshold: 300_000, // 300KB error
      critical: 500_000, // 500KB critical
      unit: 'bytes',
      description: 'Third-party library bundle',
    },
    {
      name: 'Per Route Bundle',
      type: 'size',
      warning: 50_000, // 50KB warning
      threshold: 100_000, // 100KB error
      critical: 150_000, // 150KB critical
      unit: 'bytes',
      description: 'Individual route chunk size',
    },
    {
      name: 'CSS Bundle',
      type: 'size',
      warning: 50_000, // 50KB warning
      threshold: 75_000, // 75KB error
      critical: 100_000, // 100KB critical
      unit: 'bytes',
      description: 'Total CSS bundle size',
    },
    {
      name: 'Total Initial Load',
      type: 'size',
      warning: 400_000, // 400KB warning
      threshold: 600_000, // 600KB error
      critical: 1_000_000, // 1MB critical
      unit: 'bytes',
      description: 'Total size of initial page load',
    },
  ],
};

/**
 * Loading Time Budgets
 * Based on Core Web Vitals and industry standards
 */
export const LOADING_TIME_BUDGETS: BudgetCategory = {
  name: 'Loading Times',
  description: 'Page load and interaction timing limits',
  budgets: [
    {
      name: 'Time to Interactive (TTI)',
      type: 'time',
      warning: 3000, // 3s warning
      threshold: 5000, // 5s error
      critical: 8000, // 8s critical
      unit: 'ms',
      description: 'Time until page is fully interactive',
    },
    {
      name: 'First Contentful Paint (FCP)',
      type: 'time',
      warning: 1500, // 1.5s warning
      threshold: 1800, // 1.8s error (Core Web Vitals)
      critical: 3000, // 3s critical
      unit: 'ms',
      description: 'Time to first content render',
    },
    {
      name: 'Largest Contentful Paint (LCP)',
      type: 'time',
      warning: 2000, // 2s warning
      threshold: 2500, // 2.5s error (Core Web Vitals)
      critical: 4000, // 4s critical
      unit: 'ms',
      description: 'Time to largest content element',
    },
    {
      name: 'Total Blocking Time (TBT)',
      type: 'time',
      warning: 200, // 200ms warning
      threshold: 300, // 300ms error
      critical: 600, // 600ms critical
      unit: 'ms',
      description: 'Total time blocked by long tasks',
    },
    {
      name: 'Speed Index',
      type: 'time',
      warning: 3000, // 3s warning
      threshold: 4000, // 4s error
      critical: 6000, // 6s critical
      unit: 'ms',
      description: 'Visual completeness progression',
    },
  ],
};

/**
 * Runtime Performance Budgets
 * Based on 60fps target and memory constraints
 */
export const RUNTIME_BUDGETS: BudgetCategory = {
  name: 'Runtime Performance',
  description: 'Runtime metrics and resource usage',
  budgets: [
    {
      name: 'Main Thread Blocking',
      type: 'time',
      warning: 50, // 50ms warning
      threshold: 100, // 100ms error
      critical: 200, // 200ms critical
      unit: 'ms',
      description: 'Maximum single task duration',
    },
    {
      name: 'Memory Usage',
      type: 'size',
      warning: 50_000_000, // 50MB warning
      threshold: 100_000_000, // 100MB error
      critical: 200_000_000, // 200MB critical
      unit: 'bytes',
      description: 'JavaScript heap size',
    },
    {
      name: 'Frame Rate',
      type: 'metric',
      warning: 55, // 55fps warning
      threshold: 50, // 50fps error
      critical: 30, // 30fps critical
      unit: 'fps',
      description: 'Minimum frame rate during interactions',
    },
    {
      name: 'Interaction to Next Paint (INP)',
      type: 'time',
      warning: 150, // 150ms warning
      threshold: 200, // 200ms error (Core Web Vitals)
      critical: 500, // 500ms critical
      unit: 'ms',
      description: 'Response time to user interactions',
    },
    {
      name: 'Cumulative Layout Shift (CLS)',
      type: 'metric',
      warning: 0.05, // 0.05 warning
      threshold: 0.1, // 0.1 error (Core Web Vitals)
      critical: 0.25, // 0.25 critical
      unit: 'score',
      description: 'Visual stability score',
    },
  ],
};

/**
 * Network Request Budgets
 * Based on HTTP/2 best practices
 */
export const NETWORK_BUDGETS: BudgetCategory = {
  name: 'Network Requests',
  description: 'Network request counts and payload sizes',
  budgets: [
    {
      name: 'Total Requests',
      type: 'count',
      warning: 30, // 30 requests warning
      threshold: 50, // 50 requests error
      critical: 100, // 100 requests critical
      unit: 'requests',
      description: 'Total number of HTTP requests',
    },
    {
      name: 'Third-Party Requests',
      type: 'count',
      warning: 5, // 5 requests warning
      threshold: 10, // 10 requests error
      critical: 20, // 20 requests critical
      unit: 'requests',
      description: 'External domain requests',
    },
    {
      name: 'Total Transfer Size',
      type: 'size',
      warning: 1_000_000, // 1MB warning
      threshold: 2_000_000, // 2MB error
      critical: 5_000_000, // 5MB critical
      unit: 'bytes',
      description: 'Total network transfer',
    },
    {
      name: 'Image Payload',
      type: 'size',
      warning: 500_000, // 500KB warning
      threshold: 1_000_000, // 1MB error
      critical: 2_000_000, // 2MB critical
      unit: 'bytes',
      description: 'Total image payload size',
    },
    {
      name: 'Font Files',
      type: 'count',
      warning: 3, // 3 fonts warning
      threshold: 5, // 5 fonts error
      critical: 10, // 10 fonts critical
      unit: 'files',
      description: 'Number of font files',
    },
  ],
};

/**
 * Accessibility Performance Budgets
 * Based on WCAG 2.1 AA standards
 */
export const ACCESSIBILITY_BUDGETS: BudgetCategory = {
  name: 'Accessibility',
  description: 'Accessibility and usability metrics',
  budgets: [
    {
      name: 'Focus Visible Response',
      type: 'time',
      warning: 50, // 50ms warning
      threshold: 100, // 100ms error
      critical: 200, // 200ms critical
      unit: 'ms',
      description: 'Time to show focus indicator',
    },
    {
      name: 'Keyboard Navigation Delay',
      type: 'time',
      warning: 100, // 100ms warning
      threshold: 200, // 200ms error
      critical: 500, // 500ms critical
      unit: 'ms',
      description: 'Keyboard interaction response',
    },
    {
      name: 'Color Contrast Violations',
      type: 'count',
      warning: 0, // 0 warning
      threshold: 1, // 1 error
      critical: 5, // 5 critical
      unit: 'violations',
      description: 'WCAG contrast violations',
    },
    {
      name: 'Missing Alt Text',
      type: 'count',
      warning: 0, // 0 warning
      threshold: 1, // 1 error
      critical: 5, // 5 critical
      unit: 'images',
      description: 'Images without alt text',
    },
    {
      name: 'Touch Target Size',
      type: 'metric',
      warning: 44, // 44px warning
      threshold: 40, // 40px error
      critical: 30, // 30px critical
      unit: 'px',
      description: 'Minimum touch target dimension',
    },
  ],
};

// ============================================================================
// BUDGET VALIDATION SYSTEM
// ============================================================================

export class PerformanceBudgetValidator {
  private budgetCategories: Map<string, BudgetCategory>;

  constructor() {
    this.budgetCategories = new Map([
      ['bundle', BUNDLE_SIZE_BUDGETS],
      ['loading', LOADING_TIME_BUDGETS],
      ['runtime', RUNTIME_BUDGETS],
      ['network', NETWORK_BUDGETS],
      ['accessibility', ACCESSIBILITY_BUDGETS],
    ]);
  }

  /**
   * Validate a single budget against actual value
   */
  validateBudget(budget: PerformanceBudget, actual: number): BudgetResult {
    let passed = true;
    let severity: 'warning' | 'error' | 'critical' | undefined;

    // Check critical threshold
    if (budget.critical !== undefined) {
      if (budget.type === 'metric' && budget.name.includes('Frame Rate')) {
        // Frame rate is inverse - lower is worse
        if (actual < budget.critical) {
          passed = false;
          severity = 'critical';
        }
      } else if (actual > budget.critical) {
        passed = false;
        severity = 'critical';
      }
    }

    // Check error threshold
    if (!severity && budget.threshold !== undefined) {
      if (budget.type === 'metric' && budget.name.includes('Frame Rate')) {
        if (actual < budget.threshold) {
          passed = false;
          severity = 'error';
        }
      } else if (actual > budget.threshold) {
        passed = false;
        severity = 'error';
      }
    }

    // Check warning threshold
    if (!severity && budget.warning !== undefined) {
      if (budget.type === 'metric' && budget.name.includes('Frame Rate')) {
        if (actual < budget.warning) {
          passed = false;
          severity = 'warning';
        }
      } else if (actual > budget.warning) {
        passed = false;
        severity = 'warning';
      }
    }

    return {
      budget,
      actual,
      passed,
      severity,
    };
  }

  /**
   * Validate all budgets in a category
   */
  validateCategory(category: BudgetCategory, metrics: Map<string, number>): CategoryResult {
    const results: BudgetResult[] = [];
    let categoryPassed = true;

    for (const budget of category.budgets) {
      const actual = metrics.get(budget.name) ?? 0;
      const result = this.validateBudget(budget, actual);
      results.push(result);

      if (!result.passed) {
        categoryPassed = false;
      }
    }

    return {
      name: category.name,
      passed: categoryPassed,
      budgets: results,
    };
  }

  /**
   * Generate a comprehensive budget report
   */
  generateReport(metricsMap: Map<string, Map<string, number>>): BudgetReport {
    const categories = new Map<string, CategoryResult>();
    const violations: BudgetViolation[] = [];
    let allPassed = true;

    // Validate each category
    for (const [key, category] of this.budgetCategories) {
      const metrics = metricsMap.get(key) || new Map();
      const result = this.validateCategory(category, metrics);
      categories.set(key, result);

      if (!result.passed) {
        allPassed = false;

        // Collect violations
        for (const budgetResult of result.budgets) {
          if (!budgetResult.passed && budgetResult.severity) {
            const threshold = this.getThreshold(budgetResult.budget, budgetResult.severity);
            const difference = budgetResult.actual - threshold;
            const percentage = (difference / threshold) * 100;

            violations.push({
              budget: budgetResult.budget,
              actual: budgetResult.actual,
              severity: budgetResult.severity,
              difference,
              percentage,
            });
          }
        }
      }
    }

    // Sort violations by severity and impact
    violations.sort((a, b) => {
      const severityOrder = { critical: 0, error: 1, warning: 2 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.percentage - a.percentage;
    });

    const summary = this.generateSummary(allPassed, violations);

    return {
      timestamp: Date.now(),
      passed: allPassed,
      categories,
      violations,
      summary,
    };
  }

  /**
   * Get threshold value based on severity
   */
  private getThreshold(
    budget: PerformanceBudget,
    severity: 'warning' | 'error' | 'critical'
  ): number {
    switch (severity) {
      case 'critical':
        return budget.critical ?? budget.threshold;
      case 'error':
        return budget.threshold;
      case 'warning':
        return budget.warning ?? budget.threshold;
    }
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(passed: boolean, violations: BudgetViolation[]): string {
    if (passed) {
      return '✅ All performance budgets passed!';
    }

    const critical = violations.filter((v) => v.severity === 'critical').length;
    const errors = violations.filter((v) => v.severity === 'error').length;
    const warnings = violations.filter((v) => v.severity === 'warning').length;

    let summary = '❌ Performance budget violations detected:\n';
    if (critical > 0) summary += `  🚨 ${critical} critical violation(s)\n`;
    if (errors > 0) summary += `  ❌ ${errors} error(s)\n`;
    if (warnings > 0) summary += `  ⚠️  ${warnings} warning(s)\n`;

    if (critical > 0) {
      summary += '\n🔥 Critical issues requiring immediate attention:\n';
      violations
        .filter((v) => v.severity === 'critical')
        .slice(0, 3)
        .forEach((v) => {
          summary += `  - ${v.budget.name}: ${this.formatValue(v.actual, v.budget.unit)} `;
          summary += `(${v.percentage.toFixed(1)}% over limit)\n`;
        });
    }

    return summary;
  }

  /**
   * Format value with appropriate unit
   */
  private formatValue(value: number, unit: string): string {
    switch (unit) {
      case 'bytes':
        if (value > 1_000_000) return `${(value / 1_000_000).toFixed(2)}MB`;
        if (value > 1_000) return `${(value / 1_000).toFixed(2)}KB`;
        return `${value}B`;
      case 'ms':
        if (value > 1000) return `${(value / 1000).toFixed(2)}s`;
        return `${value}ms`;
      case 'fps':
        return `${value}fps`;
      case 'score':
        return value.toFixed(3);
      case 'px':
        return `${value}px`;
      default:
        return `${value} ${unit}`;
    }
  }

  /**
   * Export budgets for CI/CD integration
   */
  exportForCI(): Record<string, any> {
    const config: Record<string, any> = {
      performance: {
        hints: 'error',
        maxAssetSize:
          BUNDLE_SIZE_BUDGETS.budgets.find((b) => b.name === 'Total Initial Load')?.threshold ||
          600_000,
        maxEntrypointSize:
          BUNDLE_SIZE_BUDGETS.budgets.find((b) => b.name === 'Main Bundle (JS)')?.threshold ||
          200_000,
        assetFilter: (assetFilename: string) => {
          // Only check JS and CSS files
          return /\.(js|css)$/.test(assetFilename);
        },
      },
      bundlesize: [],
      lighthouse: {
        performance: 90,
        accessibility: 95,
        'best-practices': 95,
        seo: 90,
      },
    };

    // Generate bundlesize config
    for (const budget of BUNDLE_SIZE_BUDGETS.budgets) {
      if (budget.name !== 'Total Initial Load') {
        config.bundlesize.push({
          path: this.getBundlePath(budget.name),
          maxSize: `${(budget.threshold / 1000).toFixed(0)}KB`,
          compression: 'gzip',
        });
      }
    }

    return config;
  }

  /**
   * Map budget name to file path pattern
   */
  private getBundlePath(budgetName: string): string {
    const pathMap: Record<string, string> = {
      'Main Bundle (JS)': '.next/static/chunks/main-*.js',
      'Vendor Bundle (JS)': '.next/static/chunks/framework-*.js',
      'Per Route Bundle': '.next/static/chunks/pages/**/*.js',
      'CSS Bundle': '.next/static/css/*.css',
    };
    return pathMap[budgetName] || '.next/static/chunks/*.js';
  }
}

// ============================================================================
// NEXT.JS INTEGRATION
// ============================================================================

/**
 * Generate Next.js config with performance budgets
 */
export function generateNextConfig(analyzeBundle = false) {
  return {
    // Webpack configuration
    webpack: (config: any, { dev, isServer }: any) => {
      if (!dev && !isServer) {
        // Add performance hints
        config.performance = {
          hints: 'error',
          maxAssetSize: 250_000,
          maxEntrypointSize: 250_000,
          assetFilter: (assetFilename: string) => {
            return !/\.(map|LICENSE)/.test(assetFilename);
          },
        };

        // Add bundle analyzer if requested
        if (analyzeBundle) {
          const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
          config.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              reportFilename: '../analyze/client.html',
              openAnalyzer: false,
              generateStatsFile: true,
              statsFilename: '../analyze/client.stats.json',
            })
          );
        }
      }
      return config;
    },

    // Experimental features for better performance
    experimental: {
      optimizeCss: true,
      scrollRestoration: true,
    },

    // Image optimization
    images: {
      formats: ['image/avif', 'image/webp'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },

    // Compression
    compress: true,

    // Production optimizations
    productionBrowserSourceMaps: false,
    swcMinify: true,
  };
}

// ============================================================================
// REPORTING UTILITIES
// ============================================================================

/**
 * Generate ASCII chart for budget status
 */
export function generateBudgetChart(report: BudgetReport): string {
  let chart = `
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PERFORMANCE BUDGET REPORT                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}                                                          │
│  Time: ${new Date(report.timestamp).toLocaleString()}                            │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  CATEGORY                │  STATUS  │  PASSED  │  FAILED  │  SCORE           │
├─────────────────────────────────────────────────────────────────────────────┤
`;

  for (const [key, result] of report.categories) {
    const passed = result.budgets.filter((b) => b.passed).length;
    const failed = result.budgets.filter((b) => !b.passed).length;
    const score = ((passed / result.budgets.length) * 100).toFixed(0);
    const status = result.passed ? '✅' : '❌';

    chart += `│  ${result.name.padEnd(23)} │    ${status}    │    ${passed.toString().padEnd(5)} │    ${failed.toString().padEnd(5)} │  ${score}%            │\n`;
  }

  chart += `├─────────────────────────────────────────────────────────────────────────────┤\n`;

  if (report.violations.length > 0) {
    chart += `│  TOP VIOLATIONS                                                              │\n`;
    chart += `├─────────────────────────────────────────────────────────────────────────────┤\n`;

    report.violations.slice(0, 5).forEach((v) => {
      const severity = v.severity === 'critical' ? '🚨' : v.severity === 'error' ? '❌' : '⚠️';
      chart += `│  ${severity} ${v.budget.name.padEnd(30)} │ ${v.percentage.toFixed(1)}% over limit              │\n`;
    });

    chart += `├─────────────────────────────────────────────────────────────────────────────┤\n`;
  }

  chart += `│  ${report.summary.split('\n')[0].padEnd(76)} │\n`;
  chart += `└─────────────────────────────────────────────────────────────────────────────┘`;

  return chart;
}

// ============================================================================
// EXPORT FOR USAGE
// ============================================================================

export default PerformanceBudgetValidator;
