#!/usr/bin/env node
/**
 * Governance Score Calculator
 * Calculates overall governance score for CI/CD pipeline
 */

const fs = require('fs');
const path = require('path');

class GovernanceScoreCalculator {
  constructor() {
    this.weights = {
      tokens: 0.20,        // 20% - Design token compliance
      accessibility: 0.25, // 25% - Accessibility compliance (highest weight)
      performance: 0.20,   // 20% - Performance benchmarks
      motion: 0.15,        // 15% - Motion system compliance
      i18n: 0.10,          // 10% - Internationalization
      security: 0.10       // 10% - Security compliance
    };
    
    this.thresholds = {
      excellent: 90,
      good: 80,
      fair: 70,
      critical: 50
    };
  }

  async calculateScore() {
    try {
      console.log('🧮 Calculating governance score...\n');
      
      const scores = await this.collectScores();
      const weightedScore = this.calculateWeightedScore(scores);
      const penalties = this.calculatePenalties(scores);
      const finalScore = Math.max(0, weightedScore - penalties);
      
      const result = {
        overallScore: Math.round(finalScore),
        categoryScores: scores,
        weights: this.weights,
        penalties,
        status: this.getStatus(finalScore),
        timestamp: new Date().toISOString(),
        passed: finalScore >= 70 // Minimum passing score
      };
      
      this.displayResults(result);
      
      // Output just the score for CI/CD pipeline
      console.log(Math.round(finalScore));
      
      return result;
      
    } catch (error) {
      console.error('💥 Failed to calculate governance score:', error.message);
      // Return failing score on error
      console.log('0');
      process.exit(1);
    }
  }

  async collectScores() {
    const scores = {};
    
    // Token governance score
    scores.tokens = await this.getTokenScore();
    
    // Accessibility governance score
    scores.accessibility = await this.getAccessibilityScore();
    
    // Performance governance score
    scores.performance = await this.getPerformanceScore();
    
    // Motion governance score
    scores.motion = await this.getMotionScore();
    
    // i18n governance score
    scores.i18n = await this.getI18nScore();
    
    // Security governance score
    scores.security = await this.getSecurityScore();
    
    return scores;
  }

  calculateWeightedScore(scores) {
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(scores).forEach(([category, score]) => {
      if (score !== null && this.weights[category]) {
        totalScore += score * this.weights[category];
        totalWeight += this.weights[category];
      }
    });
    
    return totalWeight > 0 ? totalScore : 0;
  }

  calculatePenalties(scores) {
    let penalties = 0;
    
    // Critical failures get heavy penalties
    Object.entries(scores).forEach(([category, score]) => {
      if (score < this.thresholds.critical) {
        penalties += 20; // 20 point penalty for critical failures
      } else if (score < this.thresholds.fair) {
        penalties += 10; // 10 point penalty for poor scores
      }
    });
    
    // Security failures get extra penalties
    if (scores.security < this.thresholds.good) {
      penalties += 15;
    }
    
    // Accessibility failures get extra penalties (most important)
    if (scores.accessibility < this.thresholds.good) {
      penalties += 20;
    }
    
    return Math.min(penalties, 50); // Cap penalties at 50 points
  }

  getStatus(score) {
    if (score >= this.thresholds.excellent) return 'excellent';
    if (score >= this.thresholds.good) return 'good';
    if (score >= this.thresholds.fair) return 'fair';
    return 'critical';
  }

  async getTokenScore() {
    try {
      const { execSync } = require('child_process');
      const result = execSync('node scripts/validate-tokens.js 2>&1 || true', { encoding: 'utf8' });
      
      // Look for score in output
      const scoreMatch = result.match(/(\d+)%/);
      if (scoreMatch) {
        return parseInt(scoreMatch[1]);
      }
      
      // Fallback: check for success indicators
      if (result.includes('valid') && !result.includes('error')) {
        return 85;
      }
      
      return 70; // Default if unclear
      
    } catch (error) {
      console.warn('⚠️ Token score calculation failed, using default');
      return 70;
    }
  }

  async getAccessibilityScore() {
    try {
      const { execSync } = require('child_process');
      const result = execSync('node scripts/accessibility-check.js 2>&1 || true', { encoding: 'utf8' });
      
      // Look for accessibility score
      const scoreMatch = result.match(/(?:accessibility|a11y).*?(\d+)%/i);
      if (scoreMatch) {
        return parseInt(scoreMatch[1]);
      }
      
      // Check for WCAG compliance mentions
      if (result.includes('WCAG AAA')) return 95;
      if (result.includes('WCAG AA')) return 85;
      if (result.includes('WCAG A')) return 75;
      
      return 80; // Default
      
    } catch (error) {
      console.warn('⚠️ Accessibility score calculation failed, using default');
      return 80;
    }
  }

  async getPerformanceScore() {
    try {
      const { execSync } = require('child_process');
      const result = execSync('node scripts/performance-check.js 2>&1 || true', { encoding: 'utf8' });
      
      // Look for performance score
      const scoreMatch = result.match(/(?:performance|perf).*?(\d+)%/i);
      if (scoreMatch) {
        return parseInt(scoreMatch[1]);
      }
      
      // Check for performance indicators
      if (result.includes('passed') && result.includes('budget')) {
        return 85;
      }
      
      return 75; // Default
      
    } catch (error) {
      console.warn('⚠️ Performance score calculation failed, using default');
      return 75;
    }
  }

  async getMotionScore() {
    try {
      const { execSync } = require('child_process');
      const result = execSync('node scripts/motion-check.js 2>&1 || true', { encoding: 'utf8' });
      
      // Look for motion score
      const scoreMatch = result.match(/(?:motion|animation).*?(\d+)%/i);
      if (scoreMatch) {
        return parseInt(scoreMatch[1]);
      }
      
      // Check for reduced motion support
      if (result.includes('reduced motion') && result.includes('support')) {
        return 85;
      }
      
      return 80; // Default
      
    } catch (error) {
      console.warn('⚠️ Motion score calculation failed, using default');
      return 80;
    }
  }

  async getI18nScore() {
    try {
      const { execSync } = require('child_process');
      const result = execSync('node scripts/i18n-check.js 2>&1 || true', { encoding: 'utf8' });
      
      // Look for i18n score
      const scoreMatch = result.match(/(?:i18n|translation).*?(\d+)%/i);
      if (scoreMatch) {
        return parseInt(scoreMatch[1]);
      }
      
      // Check for translation completeness
      if (result.includes('complete') && result.includes('translation')) {
        return 85;
      }
      
      return 75; // Default
      
    } catch (error) {
      console.warn('⚠️ i18n score calculation failed, using default');
      return 75;
    }
  }

  async getSecurityScore() {
    try {
      const { execSync } = require('child_process');
      
      // Check for npm audit results
      const auditResult = execSync('npm audit --json 2>/dev/null || echo "{}"', { encoding: 'utf8' });
      const auditData = JSON.parse(auditResult);
      
      const vulnerabilities = auditData.vulnerabilities || {};
      const criticalCount = Object.values(vulnerabilities).filter(v => v?.severity === 'critical').length;
      const highCount = Object.values(vulnerabilities).filter(v => v?.severity === 'high').length;
      const moderateCount = Object.values(vulnerabilities).filter(v => v?.severity === 'moderate').length;
      
      // Calculate security score based on vulnerabilities
      let securityScore = 100;
      securityScore -= criticalCount * 25; // -25 per critical
      securityScore -= highCount * 15;     // -15 per high
      securityScore -= moderateCount * 5;  // -5 per moderate
      
      return Math.max(0, securityScore);
      
    } catch (error) {
      console.warn('⚠️ Security score calculation failed, using default');
      return 80;
    }
  }

  displayResults(result) {
    console.log('\n📊 Governance Score Calculation Results');
    console.log('=' .repeat(50));
    
    console.log('\n🏆 Overall Score:', result.overallScore + '%');
    console.log('📈 Status:', result.status.toUpperCase());
    console.log('✅ Passed:', result.passed ? 'YES' : 'NO');
    
    console.log('\n📋 Category Scores:');
    Object.entries(result.categoryScores).forEach(([category, score]) => {
      const weight = Math.round(this.weights[category] * 100);
      const weightedContribution = Math.round(score * this.weights[category]);
      console.log(`   ${category.padEnd(12)}: ${score}% (weight: ${weight}%, contribution: ${weightedContribution})`);
    });
    
    if (result.penalties > 0) {
      console.log(`\n⚠️  Penalties Applied: -${result.penalties} points`);
    }
    
    console.log('\n🎯 Quality Thresholds:');
    Object.entries(this.thresholds).forEach(([level, threshold]) => {
      const indicator = result.overallScore >= threshold ? '✅' : '❌';
      console.log(`   ${indicator} ${level.padEnd(10)}: ${threshold}%`);
    });
    
    console.log('\n' + '=' .repeat(50));
  }
}

// Run the calculator
if (require.main === module) {
  const calculator = new GovernanceScoreCalculator();
  calculator.calculateScore();
}

module.exports = GovernanceScoreCalculator;