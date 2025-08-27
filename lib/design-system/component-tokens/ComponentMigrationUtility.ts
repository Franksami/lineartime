/**
 * Component Token Migration Utility
 *
 * Systematic migration utility for converting existing components to use
 * the Component Token Registry. Implements gradual migration patterns
 * from Design Tokens Community Group best practices.
 *
 * Migration Strategy:
 * 1. Identify hardcoded values in components
 * 2. Map to appropriate component tokens
 * 3. Provide fallback mechanisms during transition
 * 4. Validate token coverage and compliance
 *
 * @see https://design-tokens.github.io/community-group/format/#aliases-references
 */

import { cn } from '@/lib/utils';
import { type CompositeToken, useComponentTokens } from './ComponentTokenRegistry';

// Migration Types
export interface MigrationReport {
  component: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'validated';
  hardcodedValues: string[];
  migratedValues: string[];
  coverage: number; // Percentage of values migrated
  issues: MigrationIssue[];
}

export interface MigrationIssue {
  type: 'missing_token' | 'invalid_reference' | 'performance_impact' | 'breaking_change';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion?: string;
}

export interface ComponentMigrationConfig {
  /** Component name for tracking */
  name: string;
  /** Whether to use fallback values during migration */
  useFallbacks: boolean;
  /** Validate token references */
  validateReferences: boolean;
  /** Performance monitoring during migration */
  monitorPerformance: boolean;
}

/**
 * Component Token Migration Class
 *
 * Provides utilities for migrating components to use design tokens
 */
export class ComponentTokenMigration {
  private config: ComponentMigrationConfig;
  private migrationReports: Map<string, MigrationReport> = new Map();

  constructor(config: ComponentMigrationConfig) {
    this.config = config;
  }

  /**
   * Creates a migration wrapper for gradual token adoption
   *
   * Implements the "expand and contract" pattern:
   * 1. Add new token-based classes alongside existing ones
   * 2. Test thoroughly
   * 3. Remove old hardcoded classes
   */
  createMigrationWrapper<T extends Record<string, any>>(
    componentName: string,
    existingClasses: T,
    tokenMappings: Partial<Record<keyof T, string>>
  ) {
    return (props: { useTokens?: boolean; className?: string } & Partial<T>) => {
      const { useTokens = false, className, ...restProps } = props;
      const { getComponentToken } = useComponentTokens();

      // Migration phase: use tokens if enabled, fallback to existing
      const resolvedClasses: Record<string, string> = {};

      Object.entries(existingClasses).forEach(([key, value]) => {
        if (useTokens && tokenMappings[key as keyof T]) {
          // Use token-based class
          const tokenPath = tokenMappings[key as keyof T]!;
          const tokenValue = getComponentToken(tokenPath);
          resolvedClasses[key] = typeof tokenValue === 'string' ? tokenValue : value;
        } else {
          // Use existing hardcoded class
          resolvedClasses[key] = value;
        }
      });

      // Combine classes with user overrides
      const finalClassName = cn(Object.values(resolvedClasses).filter(Boolean), className);

      // Track migration usage
      this.trackMigrationUsage(componentName, useTokens, Object.keys(tokenMappings));

      return {
        className: finalClassName,
        ...restProps,
      };
    };
  }

  /**
   * EventCard Migration Example
   *
   * Shows how to migrate the EventCard component's hardcoded category colors
   */
  migrateEventCard() {
    const existingCategoryColors = {
      personal: 'bg-primary/10 border-primary/20',
      work: 'bg-secondary/10 border-secondary/20',
      effort: 'bg-accent/10 border-accent/20',
      note: 'bg-muted border-border',
    };

    const existingCategoryAccents = {
      personal: 'bg-primary',
      work: 'bg-secondary',
      effort: 'bg-accent',
      note: 'bg-muted',
    };

    // Token mappings using Component Token Registry
    const categoryColorMappings = {
      personal: 'event.category.personal',
      work: 'event.category.work',
      effort: 'event.category.effort',
      note: 'event.category.note',
    };

    const categoryColorMigration = this.createMigrationWrapper(
      'EventCard.categoryColors',
      existingCategoryColors,
      categoryColorMappings
    );

    const categoryAccentMigration = this.createMigrationWrapper(
      'EventCard.categoryAccents',
      existingCategoryAccents,
      categoryColorMappings
    );

    return {
      categoryColors: categoryColorMigration,
      categoryAccents: categoryAccentMigration,
      // Helper function for component usage
      getCategoryStyles: (category: keyof typeof existingCategoryColors, useTokens = false) => {
        const colors = categoryColorMigration({ useTokens });
        const accents = categoryAccentMigration({ useTokens });

        return {
          containerClass: colors.className,
          accentClass: accents.className,
          category,
        };
      },
    };
  }

  /**
   * Button Migration Example
   *
   * Shows how to migrate button variants (already mostly token-compliant)
   */
  migrateButton() {
    // Most button styles already use tokens, this validates compliance
    const buttonVariantMappings = {
      default: 'button.variant.primary',
      destructive: 'button.variant.destructive',
      outline: 'button.variant.outline',
      secondary: 'button.variant.secondary',
      ghost: 'button.variant.ghost',
      link: 'button.variant.ghost', // Map link to ghost for now
    };

    const buttonSizeMappings = {
      default: 'button.size.default',
      sm: 'button.size.sm',
      lg: 'button.size.lg',
      icon: 'button.size.icon',
    };

    return {
      variantMappings: buttonVariantMappings,
      sizeMappings: buttonSizeMappings,
      // Validation helper
      validateButtonCompliance: (variant: string, size: string) => {
        const hasValidVariant = variant in buttonVariantMappings;
        const hasValidSize = size in buttonSizeMappings;
        return {
          isCompliant: hasValidVariant && hasValidSize,
          issues: [
            ...(!hasValidVariant ? ['Invalid button variant'] : []),
            ...(!hasValidSize ? ['Invalid button size'] : []),
          ],
        };
      },
    };
  }

  /**
   * Card Migration Example
   */
  migrateCard() {
    const cardVariantMappings = {
      default: 'card.variant.default',
      elevated: 'card.variant.elevated',
      outlined: 'card.variant.outlined',
      ghost: 'card.variant.ghost',
    };

    return {
      variantMappings: cardVariantMappings,
      // Helper for generating card classes
      getCardClasses: (variant: keyof typeof cardVariantMappings, useTokens = false) => {
        const { getComponentToken } = useComponentTokens();

        if (useTokens) {
          const tokenPath = cardVariantMappings[variant];
          return getComponentToken(tokenPath);
        }

        // Fallback to existing classes
        const fallbackClasses = {
          default: 'bg-card text-card-foreground border border-border rounded-xl shadow-sm',
          elevated: 'bg-card text-card-foreground border border-border rounded-xl shadow-lg',
          outlined: 'bg-card text-card-foreground border-2 border-border rounded-xl',
          ghost: 'bg-transparent text-foreground border-transparent rounded-xl',
        };

        return fallbackClasses[variant];
      },
    };
  }

  /**
   * Component-wide Migration Scanner
   *
   * Scans a component file for hardcoded values that should be migrated
   */
  scanComponentForMigration(componentCode: string, componentName: string): MigrationReport {
    const hardcodedPatterns = [
      // Color patterns
      /bg-\w+(-\w+)*\/?\d*/g,
      /text-\w+(-\w+)*\/?\d*/g,
      /border-\w+(-\w+)*\/?\d*/g,
      /ring-\w+(-\w+)*\/?\d*/g,

      // Size patterns
      /h-\d+/g,
      /w-\d+/g,
      /p-\d+/g,
      /m-\d+/g,
      /gap-\d+/g,

      // Hex colors
      /#[0-9a-fA-F]{3,8}/g,

      // RGB/HSL colors
      /rgb\([^)]+\)/g,
      /hsl\([^)]+\)/g,
    ];

    const hardcodedValues: string[] = [];

    hardcodedPatterns.forEach((pattern) => {
      const matches = componentCode.match(pattern);
      if (matches) {
        hardcodedValues.push(...matches);
      }
    });

    // Remove duplicates
    const uniqueHardcodedValues = [...new Set(hardcodedValues)];

    // Calculate coverage (for now, assume none are migrated yet)
    const coverage = 0;

    const report: MigrationReport = {
      component: componentName,
      status: uniqueHardcodedValues.length > 0 ? 'not_started' : 'completed',
      hardcodedValues: uniqueHardcodedValues,
      migratedValues: [],
      coverage,
      issues: uniqueHardcodedValues.map((value) => ({
        type: 'missing_token',
        description: `Hardcoded value found: ${value}`,
        severity: this.classifyHardcodedValue(value),
        suggestion: this.suggestTokenReplacement(value),
      })),
    };

    this.migrationReports.set(componentName, report);
    return report;
  }

  /**
   * Generates a comprehensive migration report for all components
   */
  generateMigrationReport(): {
    summary: {
      totalComponents: number;
      completedComponents: number;
      inProgressComponents: number;
      notStartedComponents: number;
      overallCoverage: number;
    };
    componentReports: MigrationReport[];
    priorities: {
      high: MigrationReport[];
      medium: MigrationReport[];
      low: MigrationReport[];
    };
  } {
    const reports = Array.from(this.migrationReports.values());

    const summary = {
      totalComponents: reports.length,
      completedComponents: reports.filter((r) => r.status === 'completed').length,
      inProgressComponents: reports.filter((r) => r.status === 'in_progress').length,
      notStartedComponents: reports.filter((r) => r.status === 'not_started').length,
      overallCoverage: reports.reduce((acc, r) => acc + r.coverage, 0) / reports.length,
    };

    const priorities = {
      high: reports.filter((r) =>
        r.issues.some((i) => i.severity === 'critical' || i.severity === 'high')
      ),
      medium: reports.filter((r) => r.issues.some((i) => i.severity === 'medium')),
      low: reports.filter((r) => r.issues.every((i) => i.severity === 'low')),
    };

    return {
      summary,
      componentReports: reports,
      priorities,
    };
  }

  /**
   * Batch migration utility for processing multiple components
   */
  async batchMigrate(
    componentPaths: string[],
    options: {
      dryRun?: boolean;
      progressCallback?: (progress: { current: number; total: number; component: string }) => void;
    } = {}
  ): Promise<MigrationReport[]> {
    const { dryRun = true, progressCallback } = options;
    const reports: MigrationReport[] = [];

    for (let i = 0; i < componentPaths.length; i++) {
      const componentPath = componentPaths[i];

      progressCallback?.({
        current: i + 1,
        total: componentPaths.length,
        component: componentPath,
      });

      try {
        // In a real implementation, this would read the file
        // For now, we'll simulate with the component name
        const componentName = componentPath.split('/').pop()?.replace('.tsx', '') || componentPath;
        const simulatedCode = `// Component code for ${componentName}`;

        const report = this.scanComponentForMigration(simulatedCode, componentName);

        if (!dryRun) {
          // Apply migrations (implementation would go here)
          report.status = 'in_progress';
        }

        reports.push(report);
      } catch (error) {
        console.error(`Failed to migrate ${componentPath}:`, error);
        reports.push({
          component: componentPath,
          status: 'not_started',
          hardcodedValues: [],
          migratedValues: [],
          coverage: 0,
          issues: [
            {
              type: 'performance_impact',
              description: `Migration failed: ${error}`,
              severity: 'critical',
            },
          ],
        });
      }
    }

    return reports;
  }

  /**
   * Private helper methods
   */
  private trackMigrationUsage(componentName: string, useTokens: boolean, tokenKeys: string[]) {
    // Implementation for analytics/monitoring
    if (this.config.monitorPerformance) {
      console.log(
        `[Migration] ${componentName}: tokens=${useTokens}, keys=[${tokenKeys.join(', ')}]`
      );
    }
  }

  private classifyHardcodedValue(value: string): 'low' | 'medium' | 'high' | 'critical' {
    // Critical: Hex colors and RGB values (brand colors)
    if (value.match(/#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|hsl\([^)]+\)/)) {
      return 'critical';
    }

    // High: Background and text colors
    if (value.match(/^(bg-|text-)/)) {
      return 'high';
    }

    // Medium: Spacing and borders
    if (value.match(/^(p-|m-|gap-|border-)/)) {
      return 'medium';
    }

    // Low: Other utilities
    return 'low';
  }

  private suggestTokenReplacement(value: string): string {
    // Suggest appropriate token replacements
    const suggestions: Record<string, string> = {
      'bg-white': '{colors.background}',
      'bg-black': '{colors.foreground}',
      'text-white': '{colors.background}',
      'text-black': '{colors.foreground}',
      'border-gray-200': '{colors.border}',
      'shadow-sm': '{shadows.sm}',
      'rounded-md': '{radii.md}',
      'p-4': '{spacing.4}',
      'gap-2': '{spacing.2}',
    };

    return suggestions[value] || `Consider using appropriate token for: ${value}`;
  }
}

/**
 * Hook for component migration utilities
 */
export const useComponentMigration = (config: ComponentMigrationConfig) => {
  const migration = new ComponentTokenMigration(config);

  return {
    migration,
    // Common migration helpers
    migrateEventCard: migration.migrateEventCard.bind(migration),
    migrateButton: migration.migrateButton.bind(migration),
    migrateCard: migration.migrateCard.bind(migration),
    scanComponent: migration.scanComponentForMigration.bind(migration),
    generateReport: migration.generateMigrationReport.bind(migration),
    batchMigrate: migration.batchMigrate.bind(migration),
  };
};

/**
 * Quick migration helpers for common patterns
 */
export const quickMigrationHelpers = {
  /**
   * Converts hardcoded Tailwind classes to token references
   */
  tailwindToTokens: (classes: string): string => {
    const tokenMap: Record<string, string> = {
      // Colors
      'bg-white': 'bg-background',
      'bg-gray-50': 'bg-muted',
      'bg-gray-100': 'bg-accent',
      'text-black': 'text-foreground',
      'text-gray-600': 'text-muted-foreground',
      'border-gray-200': 'border-border',

      // Shadows
      'shadow-sm': 'shadow-sm',
      'shadow-md': 'shadow-md',
      'shadow-lg': 'shadow-lg',

      // Radius
      'rounded-md': 'rounded-md',
      'rounded-lg': 'rounded-lg',
      'rounded-xl': 'rounded-xl',
    };

    let result = classes;
    Object.entries(tokenMap).forEach(([hardcoded, token]) => {
      result = result.replace(new RegExp(`\\b${hardcoded}\\b`, 'g'), token);
    });

    return result;
  },

  /**
   * Creates a migration checklist for a component
   */
  createMigrationChecklist: (componentName: string, hardcodedValues: string[]) => {
    return {
      component: componentName,
      tasks: [
        {
          task: 'Identify hardcoded values',
          status: 'completed' as const,
          values: hardcodedValues,
        },
        {
          task: 'Map to component tokens',
          status: 'pending' as const,
          description: 'Create mappings in Component Token Registry',
        },
        {
          task: 'Implement migration wrapper',
          status: 'pending' as const,
          description: 'Use createMigrationWrapper for gradual adoption',
        },
        {
          task: 'Test with tokens enabled',
          status: 'pending' as const,
          description: 'Verify visual consistency and functionality',
        },
        {
          task: 'Remove hardcoded fallbacks',
          status: 'pending' as const,
          description: 'Clean up after successful migration',
        },
        {
          task: 'Validate with governance system',
          status: 'pending' as const,
          description: 'Run accessibility-check.js and token validation',
        },
      ],
    };
  },
};

export default ComponentTokenMigration;
