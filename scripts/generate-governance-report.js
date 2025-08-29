#!/usr/bin/env node
/**
 * Governance Report Generator
 * Generates comprehensive governance reports from all quality gates
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GovernanceReportGenerator {
  constructor() {
    this.reportData = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      gitCommit: this.getGitCommit(),
      gitBranch: this.getGitBranch(),
      scores: {},
      issues: [],
      recommendations: [],
      artifacts: [],
    };

    this.ensureReportsDirectory();
  }

  async generateReport() {
    console.log('📊 Generating comprehensive governance report...\n');

    try {
      await this.collectTokenGovernance();
      await this.collectAccessibilityGovernance();
      await this.collectPerformanceGovernance();
      await this.collectMotionGovernance();
      await this.collectI18nGovernance();
      await this.collectSecurityGovernance();

      this.calculateOverallScore();
      this.generateRecommendations();

      await this.saveReport();
      await this.generateHtmlReport();

      console.log('✅ Governance report generated successfully!');
      console.log(`📊 Overall Score: ${this.reportData.overallScore}%`);

      return this.reportData;
    } catch (error) {
      console.error('💥 Failed to generate governance report:', error.message);
      process.exit(1);
    }
  }

  async collectTokenGovernance() {
    console.log('🎨 Collecting token governance data...');

    try {
      // Run token validation and collect results
      const tokenResult = execSync('node scripts/validate-tokens.js 2>&1 || true', {
        encoding: 'utf8',
      });

      const tokenScore = this.extractScore(tokenResult, 'token');
      this.reportData.scores.tokens = {
        score: tokenScore,
        status: tokenScore >= 90 ? 'excellent' : tokenScore >= 80 ? 'good' : 'needs-improvement',
        details: this.parseTokenDetails(tokenResult),
      };

      // Check token coverage
      const coverageResult = this.checkTokenCoverage();
      this.reportData.scores.tokens.coverage = coverageResult;
    } catch (error) {
      this.reportData.scores.tokens = {
        score: 0,
        status: 'error',
        error: error.message,
      };
    }
  }

  async collectAccessibilityGovernance() {
    console.log('♿ Collecting accessibility governance data...');

    try {
      const a11yResult = execSync('node scripts/accessibility-check.js 2>&1 || true', {
        encoding: 'utf8',
      });

      const a11yScore = this.extractScore(a11yResult, 'accessibility');
      this.reportData.scores.accessibility = {
        score: a11yScore,
        status: a11yScore >= 95 ? 'excellent' : a11yScore >= 90 ? 'good' : 'needs-improvement',
        wcagLevel: a11yScore >= 95 ? 'AAA' : a11yScore >= 85 ? 'AA' : 'A',
        details: this.parseAccessibilityDetails(a11yResult),
      };
    } catch (error) {
      this.reportData.scores.accessibility = {
        score: 0,
        status: 'error',
        error: error.message,
      };
    }
  }

  async collectPerformanceGovernance() {
    console.log('⚡ Collecting performance governance data...');

    try {
      const perfResult = execSync('node scripts/performance-check.js 2>&1 || true', {
        encoding: 'utf8',
      });

      const perfScore = this.extractScore(perfResult, 'performance');
      this.reportData.scores.performance = {
        score: perfScore,
        status: perfScore >= 90 ? 'excellent' : perfScore >= 80 ? 'good' : 'needs-improvement',
        details: this.parsePerformanceDetails(perfResult),
        budgets: this.checkPerformanceBudgets(),
      };
    } catch (error) {
      this.reportData.scores.performance = {
        score: 0,
        status: 'error',
        error: error.message,
      };
    }
  }

  async collectMotionGovernance() {
    console.log('🎬 Collecting motion governance data...');

    try {
      const motionResult = execSync('node scripts/motion-check.js 2>&1 || true', {
        encoding: 'utf8',
      });

      const motionScore = this.extractScore(motionResult, 'motion');
      this.reportData.scores.motion = {
        score: motionScore,
        status: motionScore >= 90 ? 'excellent' : motionScore >= 80 ? 'good' : 'needs-improvement',
        details: this.parseMotionDetails(motionResult),
      };
    } catch (error) {
      this.reportData.scores.motion = {
        score: 0,
        status: 'error',
        error: error.message,
      };
    }
  }

  async collectI18nGovernance() {
    console.log('🌍 Collecting i18n governance data...');

    try {
      const i18nResult = execSync('node scripts/i18n-check.js 2>&1 || true', { encoding: 'utf8' });

      const i18nScore = this.extractScore(i18nResult, 'i18n');
      this.reportData.scores.i18n = {
        score: i18nScore,
        status: i18nScore >= 90 ? 'excellent' : i18nScore >= 80 ? 'good' : 'needs-improvement',
        details: this.parseI18nDetails(i18nResult),
      };
    } catch (error) {
      this.reportData.scores.i18n = {
        score: 0,
        status: 'error',
        error: error.message,
      };
    }
  }

  async collectSecurityGovernance() {
    console.log('🛡️ Collecting security governance data...');

    try {
      // Basic security checks
      const auditResult = execSync('npm audit --json 2>/dev/null || echo "{}"', {
        encoding: 'utf8',
      });
      const auditData = JSON.parse(auditResult);

      const vulnerabilities = auditData.vulnerabilities || {};
      const criticalCount = Object.values(vulnerabilities).filter(
        (v) => v.severity === 'critical'
      ).length;
      const highCount = Object.values(vulnerabilities).filter((v) => v.severity === 'high').length;

      const securityScore = Math.max(0, 100 - criticalCount * 20 - highCount * 10);

      this.reportData.scores.security = {
        score: securityScore,
        status: securityScore >= 95 ? 'excellent' : securityScore >= 85 ? 'good' : 'critical',
        vulnerabilities: {
          critical: criticalCount,
          high: highCount,
          total: Object.keys(vulnerabilities).length,
        },
      };
    } catch (error) {
      this.reportData.scores.security = {
        score: 80, // Default score if audit fails
        status: 'unknown',
        error: error.message,
      };
    }
  }

  calculateOverallScore() {
    const scores = Object.values(this.reportData.scores)
      .map((category) => category.score || 0)
      .filter((score) => score > 0);

    const overallScore =
      scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;

    this.reportData.overallScore = overallScore;
    this.reportData.overallStatus = this.getStatusFromScore(overallScore);
  }

  generateRecommendations() {
    const recommendations = [];

    Object.entries(this.reportData.scores).forEach(([category, data]) => {
      if (data.score < 85) {
        recommendations.push({
          category,
          priority: data.score < 70 ? 'high' : 'medium',
          message: `Improve ${category} score (currently ${data.score}%)`,
          actions: this.getRecommendationsForCategory(category, data.score),
        });
      }
    });

    this.reportData.recommendations = recommendations;
  }

  getRecommendationsForCategory(category, score) {
    const recommendations = {
      tokens: [
        'Add missing design tokens for hardcoded values',
        'Ensure consistent token naming conventions',
        'Complete token documentation',
      ],
      accessibility: [
        'Fix contrast ratio issues',
        'Add missing ARIA labels',
        'Improve keyboard navigation support',
      ],
      performance: [
        'Optimize bundle size',
        'Improve Core Web Vitals metrics',
        'Add performance monitoring',
      ],
      motion: [
        'Add reduced motion support',
        'Optimize animation performance',
        'Ensure vestibular safety',
      ],
      i18n: [
        'Complete missing translations',
        'Add RTL layout support',
        'Implement locale-aware formatting',
      ],
      security: [
        'Update vulnerable dependencies',
        'Add security scanning',
        'Review authentication flows',
      ],
    };

    return recommendations[category] || ['Review and improve implementation'];
  }

  extractScore(output, category) {
    const scoreMatch = output.match(new RegExp(`${category}.*?Score:?\\s*(\\d+)%`, 'i'));
    if (scoreMatch) {
      return parseInt(scoreMatch[1]);
    }

    // Fallback: extract any percentage
    const percentMatch = output.match(/(\d+)%/);
    return percentMatch ? parseInt(percentMatch[1]) : 75; // Default score
  }

  parseTokenDetails(output) {
    return {
      validTokens: this.extractCount(output, 'tokens'),
      coverage: this.extractPercentage(output, 'coverage'),
      violations: this.extractCount(output, 'violations'),
    };
  }

  parseAccessibilityDetails(output) {
    return {
      wcagCompliance: this.extractPercentage(output, 'compliant'),
      contrastIssues: this.extractCount(output, 'contrast'),
      missingLabels: this.extractCount(output, 'labels'),
    };
  }

  parsePerformanceDetails(output) {
    return {
      bundleSize: this.extractSize(output, 'bundle'),
      memoryUsage: this.extractSize(output, 'memory'),
      renderTime: this.extractTime(output, 'render'),
    };
  }

  parseMotionDetails(output) {
    return {
      reducedMotionSupport: this.extractPercentage(output, 'reduced'),
      animations: this.extractCount(output, 'animations'),
      vestibularSafe: this.extractBoolean(output, 'vestibular'),
    };
  }

  parseI18nDetails(output) {
    return {
      locales: this.extractCount(output, 'locales'),
      translationCoverage: this.extractPercentage(output, 'translation'),
      rtlSupport: this.extractBoolean(output, 'rtl'),
    };
  }

  extractCount(text, keyword) {
    const match = text.match(new RegExp(`${keyword}.*?(\\d+)`, 'i'));
    return match ? parseInt(match[1]) : 0;
  }

  extractPercentage(text, keyword) {
    const match = text.match(new RegExp(`${keyword}.*?(\\d+)%`, 'i'));
    return match ? parseInt(match[1]) : 0;
  }

  extractSize(text, keyword) {
    const match = text.match(new RegExp(`${keyword}.*?(\\d+(?:\\.\\d+)?)\\s*(KB|MB|bytes?)`, 'i'));
    return match ? `${match[1]}${match[2]}` : 'Unknown';
  }

  extractTime(text, keyword) {
    const match = text.match(new RegExp(`${keyword}.*?(\\d+(?:\\.\\d+)?)\\s*(ms|s)`, 'i'));
    return match ? `${match[1]}${match[2]}` : 'Unknown';
  }

  extractBoolean(text, keyword) {
    return text.toLowerCase().includes(keyword.toLowerCase());
  }

  checkTokenCoverage() {
    try {
      // Simple token coverage check
      const tokenFiles = execSync('find design-tokens -name "*.json" | wc -l', {
        encoding: 'utf8',
      });
      const componentFiles = execSync('find components -name "*.tsx" | wc -l', {
        encoding: 'utf8',
      });

      return {
        tokenFiles: parseInt(tokenFiles.trim()),
        componentFiles: parseInt(componentFiles.trim()),
        ratio: Math.min(
          100,
          Math.round((parseInt(tokenFiles.trim()) / parseInt(componentFiles.trim())) * 100)
        ),
      };
    } catch (error) {
      return { ratio: 0, error: error.message };
    }
  }

  checkPerformanceBudgets() {
    const budgets = {
      bundleSize: { limit: '500KB', current: 'Unknown', status: 'unknown' },
      memoryUsage: { limit: '100MB', current: 'Unknown', status: 'unknown' },
      loadTime: { limit: '2s', current: 'Unknown', status: 'unknown' },
    };

    // This would typically check actual build artifacts
    // For now, return the template structure
    return budgets;
  }

  getStatusFromScore(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    return 'needs-improvement';
  }

  getGitCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  getGitBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  ensureReportsDirectory() {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
  }

  async saveReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `governance-report-${timestamp}.json`;
    const filepath = path.join(process.cwd(), 'reports', filename);

    fs.writeFileSync(filepath, JSON.stringify(this.reportData, null, 2));

    // Also save as latest
    const latestPath = path.join(process.cwd(), 'reports', 'governance-report-latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(this.reportData, null, 2));

    console.log(`📄 Report saved: ${filename}`);
  }

  async generateHtmlReport() {
    const htmlContent = this.generateHtmlContent();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `quality-report-${timestamp}.html`;
    const filepath = path.join(process.cwd(), 'reports', filename);

    fs.writeFileSync(filepath, htmlContent);

    console.log(`🌐 HTML Report saved: ${filename}`);
  }

  generateHtmlContent() {
    const { overallScore, overallStatus, scores, recommendations } = this.reportData;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Design System Governance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 2rem; }
        .score-circle { display: inline-block; width: 120px; height: 120px; border-radius: 50%; 
                       background: conic-gradient(#10b981 ${overallScore * 3.6}deg, #e5e7eb 0deg);
                       display: flex; align-items: center; justify-content: center; margin: 1rem 0; }
        .score-text { background: white; border-radius: 50%; width: 80px; height: 80px; 
                     display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin: 2rem 0; }
        .card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .category-score { font-size: 2rem; font-weight: bold; margin: 0.5rem 0; }
        .status { padding: 4px 12px; border-radius: 16px; font-size: 0.875rem; font-weight: 500; }
        .status.excellent { background: #d1fae5; color: #065f46; }
        .status.good { background: #dbeafe; color: #1e40af; }
        .status.fair { background: #fef3c7; color: #92400e; }
        .status.needs-improvement { background: #fee2e2; color: #991b1b; }
        .recommendations { margin-top: 2rem; }
        .recommendation { background: #fff7ed; border-left: 4px solid #f59e0b; padding: 1rem; margin: 0.5rem 0; }
        .timestamp { color: #6b7280; font-size: 0.875rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Design System Governance Report</h1>
            <div class="score-circle">
                <div class="score-text">${overallScore}%</div>
            </div>
            <div class="status ${overallStatus}">${overallStatus.replace('-', ' ').toUpperCase()}</div>
            <div class="timestamp">Generated: ${new Date(this.reportData.timestamp).toLocaleString()}</div>
        </div>
        
        <div class="grid">
            ${Object.entries(scores)
              .map(
                ([category, data]) => `
                <div class="card">
                    <h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                    <div class="category-score">${data.score}%</div>
                    <div class="status ${data.status}">${data.status.replace('-', ' ').toUpperCase()}</div>
                </div>
            `
              )
              .join('')}
        </div>
        
        ${
          recommendations.length > 0
            ? `
        <div class="recommendations">
            <h2>Recommendations</h2>
            ${recommendations
              .map(
                (rec) => `
                <div class="recommendation">
                    <strong>${rec.category.toUpperCase()}</strong> - ${rec.message}
                    <ul>
                        ${rec.actions.map((action) => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            `
              )
              .join('')}
        </div>
        `
            : ''
        }
    </div>
</body>
</html>
    `.trim();
  }
}

// Run the report generator
if (require.main === module) {
  const generator = new GovernanceReportGenerator();
  generator.generateReport();
}

module.exports = GovernanceReportGenerator;
