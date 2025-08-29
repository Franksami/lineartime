#!/usr/bin/env node

/**
 * Command Workspace Governance Validator
 * Enforces architectural boundaries and prevents drift from Command Workspace patterns
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

/**
 * Governance rules based on research-validated Command Workspace architecture
 */
const GOVERNANCE_RULES = {
  // 🚨 CRITICAL: LinearCalendarHorizontal import restrictions
  BANNED_CALENDAR_IMPORTS: {
    description: 'LinearCalendarHorizontal can only be imported in year-lens views',
    pattern: /from\s+['"'].*LinearCalendarHorizontal.*['"]|import.*LinearCalendarHorizontal/,
    allowedPaths: [
      'views/year-lens/**/*',
      'components/calendar/LinearCalendarHorizontal.tsx', // Self-reference allowed
    ],
    severity: 'error',
    fixSuggestion: 'Use views/year-lens/YearLensView.tsx for legacy calendar access',
  },

  // Command Workspace shell boundary enforcement
  SHELL_BOUNDARY_VIOLATIONS: {
    description: 'Views must not deep-import shell internals',
    pattern: /from\s+['"'].*components\/shell\/.*\/.*['"]|import.*from.*components\/shell\/.*\/.*/,
    allowedPaths: [
      'components/shell/**/*', // Shell components can import each other
      'app/app/**/*', // App entry point can import shell
    ],
    severity: 'error',
    fixSuggestion: 'Use public shell APIs, not internal shell components',
  },

  // Legacy context usage restrictions
  LEGACY_CONTEXT_USAGE: {
    description: 'Legacy contexts should only be used in year-lens views and backend integration',
    pattern: /CalendarContext|useCommandCenterCalendar(?!.*year-lens)/,
    allowedPaths: ['views/year-lens/**/*', 'hooks/legacy/**/*', 'contexts/legacy/**/*'],
    severity: 'warn',
    fixSuggestion: 'Use new workspace providers (AppShellProvider, CommandProvider, etc.)',
  },

  // Hardcoded color prevention (design system compliance)
  HARDCODED_COLORS: {
    description: 'Use semantic design tokens, not hardcoded colors',
    pattern:
      /(bg-|text-|border-|ring-)(red|blue|green|yellow|purple|pink|indigo|gray)-\d+(?!.*\/\*\s*ok\s*\*\/)/,
    allowedPaths: [],
    severity: 'warn',
    fixSuggestion: 'Use semantic tokens: bg-background, text-foreground, border-border, etc.',
  },
};

/**
 * Scan files for governance violations
 */
async function scanForViolations() {
  console.log(
    `${colors.blue}${colors.bold}🔍 Command Workspace Governance Validation${colors.reset}\\n`
  );

  const violations = [];

  // Get all TypeScript/JavaScript files
  const files = await glob('**/*.{ts,tsx,js,jsx}', {
    cwd: projectRoot,
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'coverage/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.generated.*',
    ],
  });

  for (const file of files) {
    const filePath = path.join(projectRoot, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(projectRoot, filePath);

    // Check each governance rule
    for (const [ruleName, rule] of Object.entries(GOVERNANCE_RULES)) {
      const matches = content.match(rule.pattern);

      if (matches) {
        // Check if file is in allowed paths
        const isAllowed = rule.allowedPaths.some((allowedPath) => {
          const pattern = allowedPath.replace('**/*', '.*').replace('*', '[^/]*');
          const regex = new RegExp(pattern);
          return regex.test(relativePath);
        });

        if (!isAllowed) {
          violations.push({
            file: relativePath,
            rule: ruleName,
            description: rule.description,
            severity: rule.severity,
            fixSuggestion: rule.fixSuggestion,
            match: matches[0],
            line: findLineNumber(content, matches[0]),
          });
        }
      }
    }
  }

  // Report violations
  if (violations.length === 0) {
    console.log(`${colors.green}✅ No governance violations found${colors.reset}`);
    console.log(
      `${colors.green}🏗️ Command Workspace architecture compliance verified${colors.reset}\\n`
    );
    return true;
  }

  console.log(
    `${colors.red}${colors.bold}❌ Found ${violations.length} governance violations:${colors.reset}\\n`
  );

  const errors = violations.filter((v) => v.severity === 'error');
  const warnings = violations.filter((v) => v.severity === 'warn');

  // Group violations by rule
  const violationsByRule = violations.reduce((acc, violation) => {
    if (!acc[violation.rule]) acc[violation.rule] = [];
    acc[violation.rule].push(violation);
    return acc;
  }, {});

  for (const [ruleName, ruleViolations] of Object.entries(violationsByRule)) {
    const rule = GOVERNANCE_RULES[ruleName];
    const severityColor = rule.severity === 'error' ? colors.red : colors.yellow;

    console.log(
      `${severityColor}${colors.bold}${rule.severity.toUpperCase()}: ${rule.description}${colors.reset}`
    );
    console.log(`${colors.blue}Fix: ${rule.fixSuggestion}${colors.reset}\\n`);

    for (const violation of ruleViolations) {
      console.log(`  📁 ${violation.file}:${violation.line}`);
      console.log(`     ${colors.yellow}Found: ${violation.match}${colors.reset}`);
    }
    console.log();
  }

  // Summary
  if (errors.length > 0) {
    console.log(
      `${colors.red}${colors.bold}🚨 ${errors.length} ERRORS must be fixed before deployment${colors.reset}`
    );
  }
  if (warnings.length > 0) {
    console.log(
      `${colors.yellow}⚠️  ${warnings.length} warnings should be addressed${colors.reset}`
    );
  }

  console.log(
    `\\n${colors.blue}Run 'npm run governance:fix' for automated fixes where possible${colors.reset}`
  );

  return errors.length === 0;
}

/**
 * Find line number of matched text
 */
function findLineNumber(content, match) {
  const lines = content.split('\\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(match)) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Auto-fix some violations where safe
 */
async function autoFix() {
  console.log(`${colors.blue}🔧 Auto-fixing governance violations...${colors.reset}\\n`);

  const files = await glob('**/*.{ts,tsx,js,jsx}', {
    cwd: projectRoot,
    ignore: ['node_modules/**', '.next/**', 'dist/**', 'coverage/**'],
  });

  let fixCount = 0;

  for (const file of files) {
    const filePath = path.join(projectRoot, file);
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // Fix hardcoded colors with semantic tokens
    newContent = newContent.replace(
      /(bg-|text-|border-|ring-)(red|blue|green|yellow|purple|pink|indigo|gray)-(\d+)/g,
      (match, prefix, color, shade) => {
        const semanticMapping = {
          'bg-muted': 'bg-muted',
          'bg-muted': 'bg-muted',
          'text-foreground': 'text-foreground',
          'text-muted-foreground': 'text-muted-foreground',
          'border-border': 'border-border',
          'bg-primary': 'bg-primary',
          'text-primary': 'text-primary',
        };

        return semanticMapping[match] || `${match} /* TODO: Use semantic token */`;
      }
    );

    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      fixCount++;
    }
  }

  console.log(`${colors.green}✅ Auto-fixed ${fixCount} files${colors.reset}\\n`);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--fix')) {
    await autoFix();
  }

  const isValid = await scanForViolations();

  if (!isValid && !args.includes('--warn-only')) {
    console.log(`${colors.red}${colors.bold}💥 Governance validation failed${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.green}${colors.bold}🎉 Governance validation complete${colors.reset}`);
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
