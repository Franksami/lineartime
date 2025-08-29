#!/usr/bin/env node
/**
 * Commit Message Governance Check
 * Validates commit messages according to conventional commits standard
 */

const fs = require('fs');
const path = require('path');

const COMMIT_TYPES = [
  'feat', // New feature
  'fix', // Bug fix
  'docs', // Documentation
  'style', // Code style (formatting, missing semicolons, etc)
  'refactor', // Code refactoring
  'perf', // Performance improvement
  'test', // Test addition or modification
  'build', // Build system or external dependencies
  'ci', // CI configuration
  'chore', // Maintenance tasks
  'revert', // Revert previous commit
  'wip', // Work in progress (discouraged for main branch)
];

const SCOPES = [
  'calendar', // Calendar components
  'design-system', // Design system changes
  'tokens', // Design tokens
  'motion', // Animation and motion
  'i18n', // Internationalization
  'accessibility', // Accessibility improvements
  'performance', // Performance optimizations
  'governance', // Governance and quality gates
  'auth', // Authentication
  'api', // API changes
  'ui', // General UI components
  'core', // Core functionality
  'config', // Configuration changes
];

class CommitMessageGovernor {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  validateCommitMessage(message) {
    console.log('📝 Validating commit message format...\n');

    const lines = message.split('\n').filter((line) => line.trim());

    if (lines.length === 0) {
      this.errors.push('Commit message cannot be empty');
      return this.generateResult();
    }

    const subject = lines[0];

    // Validate subject line
    this.validateSubject(subject);

    // Validate body (if present)
    if (lines.length > 1) {
      this.validateBody(lines.slice(1));
    }

    return this.generateResult();
  }

  validateSubject(subject) {
    // Check length
    if (subject.length > 100) {
      this.errors.push(`Subject line too long (${subject.length} chars) - max 100 characters`);
    }

    if (subject.length < 10) {
      this.warnings.push(
        `Subject line quite short (${subject.length} chars) - consider being more descriptive`
      );
    }

    // Check conventional commit format
    const conventionalPattern =
      /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|wip)(\(.+\))?: .+/;

    if (!conventionalPattern.test(subject)) {
      this.errors.push('Subject line does not follow conventional commit format');
      this.errors.push('Format: type(scope): description');
      this.errors.push(`Valid types: ${COMMIT_TYPES.join(', ')}`);
      return;
    }

    // Extract parts
    const match = subject.match(/^(\w+)(\((.+)\))?: (.+)$/);
    if (!match) {
      this.errors.push('Could not parse commit message format');
      return;
    }

    const [, type, , scope, description] = match;

    // Validate type
    if (!COMMIT_TYPES.includes(type)) {
      this.errors.push(`Invalid commit type: "${type}". Valid types: ${COMMIT_TYPES.join(', ')}`);
    }

    // Validate scope (if present)
    if (scope && !SCOPES.includes(scope)) {
      this.warnings.push(`Uncommon scope: "${scope}". Consider using: ${SCOPES.join(', ')}`);
    }

    // Validate description
    if (description.endsWith('.')) {
      this.warnings.push('Subject line should not end with a period');
    }

    if (description[0] !== description[0].toLowerCase()) {
      this.warnings.push('Subject line description should start with lowercase');
    }

    // Check for certain patterns
    if (description.includes('and')) {
      this.warnings.push('Consider splitting into multiple commits if doing multiple things');
    }

    // Governance-specific validations
    this.validateGovernanceRequirements(type, scope, description);
  }

  validateBody(bodyLines) {
    const body = bodyLines.join('\n');

    // Check for blank line after subject
    if (bodyLines[0].trim() !== '') {
      this.warnings.push('Add blank line between subject and body');
    }

    // Check line lengths in body
    bodyLines.forEach((line, index) => {
      if (line.length > 72) {
        this.warnings.push(
          `Body line ${index + 2} too long (${line.length} chars) - wrap at 72 characters`
        );
      }
    });

    // Check for ticket references
    if (!body.includes('#') && !body.includes('fixes') && !body.includes('closes')) {
      this.warnings.push('Consider adding ticket reference or closes/fixes statement');
    }
  }

  validateGovernanceRequirements(type, scope, description) {
    // Design system changes require specific validation
    if (scope === 'design-system' || scope === 'tokens') {
      if (!description.includes('token') && !description.includes('design')) {
        this.warnings.push('Design system changes should mention tokens or design in description');
      }
    }

    // Performance changes should mention metrics
    if (type === 'perf' || scope === 'performance') {
      const performanceKeywords = ['fps', 'memory', 'load', 'bundle', 'optimization', 'cache'];
      const hasPerformanceKeyword = performanceKeywords.some((keyword) =>
        description.toLowerCase().includes(keyword)
      );

      if (!hasPerformanceKeyword) {
        this.warnings.push('Performance changes should mention specific metrics or improvements');
      }
    }

    // Accessibility changes
    if (scope === 'accessibility') {
      const a11yKeywords = ['wcag', 'aria', 'contrast', 'keyboard', 'screen reader', 'focus'];
      const hasA11yKeyword = a11yKeywords.some((keyword) =>
        description.toLowerCase().includes(keyword)
      );

      if (!hasA11yKeyword) {
        this.warnings.push(
          'Accessibility changes should mention specific compliance or improvement'
        );
      }
    }

    // Breaking changes
    if (description.includes('!') || description.toLowerCase().includes('breaking')) {
      if (type !== 'feat' && type !== 'fix') {
        this.warnings.push('Breaking changes should typically use feat! or fix! format');
      }
    }

    // WIP commits on main branch
    if (type === 'wip') {
      this.warnings.push('WIP commits should not be merged to main branch');
    }
  }

  generateResult() {
    if (this.errors.length > 0) {
      console.error('❌ Commit message validation failed!\n');
      this.errors.forEach((error) => console.error(`  • ${error}`));

      if (this.warnings.length > 0) {
        console.warn('\n⚠️  Additional warnings:\n');
        this.warnings.forEach((warning) => console.warn(`  • ${warning}`));
      }

      console.log('\n📖 Commit Message Guidelines:');
      console.log('  Format: type(scope): description');
      console.log('  Example: feat(calendar): add monthly view navigation');
      console.log('  Example: fix(tokens): correct color contrast ratios');
      console.log('  Example: perf(motion): optimize animation performance by 20%');

      return false;
    }

    if (this.warnings.length > 0) {
      console.warn('⚠️  Commit message has warnings:\n');
      this.warnings.forEach((warning) => console.warn(`  • ${warning}`));
      console.log('\n✅ Proceeding with commit...');
    } else {
      console.log('✅ Commit message format is valid!');
    }

    return true;
  }
}

// Main execution
if (require.main === module) {
  const commitMsgFile = process.argv[2];

  if (!commitMsgFile) {
    console.error('Usage: node commit-msg-check.js <commit-msg-file>');
    process.exit(1);
  }

  if (!fs.existsSync(commitMsgFile)) {
    console.error(`Commit message file not found: ${commitMsgFile}`);
    process.exit(1);
  }

  const commitMessage = fs.readFileSync(commitMsgFile, 'utf8').trim();
  const governor = new CommitMessageGovernor();
  const isValid = governor.validateCommitMessage(commitMessage);

  if (!isValid) {
    process.exit(1);
  }
}

module.exports = CommitMessageGovernor;
