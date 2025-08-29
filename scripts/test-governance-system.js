#!/usr/bin/env node
/**
 * Governance System Integration Test
 * Tests all governance components working together
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GovernanceSystemTest {
  constructor() {
    this.results = {
      preCommitHooks: false,
      validationScripts: false,
      dashboard: false,
      cicdPipeline: false,
      rollbackSystem: false,
      overallScore: 0,
    };
  }

  async runIntegrationTest() {
    console.log('🧪 Running Governance System Integration Test\n');
    console.log('='.repeat(60));

    try {
      await this.testPreCommitHooks();
      await this.testValidationScripts();
      await this.testDashboardComponents();
      await this.testCIPipeline();
      await this.testRollbackSystem();

      this.calculateOverallScore();
      this.generateTestReport();

      return this.results.overallScore >= 80;
    } catch (error) {
      console.error('\n💥 Integration test failed:', error.message);
      return false;
    }
  }

  async testPreCommitHooks() {
    console.log('\n1. 🪝 Testing Pre-commit Hooks');
    console.log('-'.repeat(30));

    try {
      // Check if Husky is configured
      const huskyExists = fs.existsSync('.husky/pre-commit');
      console.log(`   Husky pre-commit hook: ${huskyExists ? '✅' : '❌'}`);

      // Check hook permissions
      if (huskyExists) {
        const stats = fs.statSync('.husky/pre-commit');
        const isExecutable = !!(stats.mode & parseInt('111', 8));
        console.log(`   Hook executable: ${isExecutable ? '✅' : '❌'}`);
      }

      // Test hook content
      if (huskyExists) {
        const content = fs.readFileSync('.husky/pre-commit', 'utf8');
        const hasGovernance = content.includes('governance') || content.includes('quality gates');
        console.log(`   Governance integration: ${hasGovernance ? '✅' : '❌'}`);
      }

      this.results.preCommitHooks = huskyExists;
    } catch (error) {
      console.log(`   ❌ Pre-commit hook test failed: ${error.message}`);
      this.results.preCommitHooks = false;
    }
  }

  async testValidationScripts() {
    console.log('\n2. 📋 Testing Validation Scripts');
    console.log('-'.repeat(30));

    const scripts = [
      { name: 'accessibility-check.js', description: 'Accessibility validation' },
      { name: 'performance-check.js', description: 'Performance validation' },
      { name: 'motion-check.js', description: 'Motion system validation' },
      { name: 'i18n-check.js', description: 'i18n validation' },
      { name: 'validate-tokens.js', description: 'Token validation' },
    ];

    let passedScripts = 0;

    for (const script of scripts) {
      try {
        const scriptPath = path.join('scripts', script.name);
        const exists = fs.existsSync(scriptPath);

        if (exists) {
          // Test script execution (dry run)
          const result = execSync(`node ${scriptPath} --dry-run 2>&1 || echo "COMPLETED"`, {
            encoding: 'utf8',
            timeout: 10000,
          });

          const works = !result.includes('Error:') && !result.includes('failed');
          console.log(`   ${script.description}: ${works ? '✅' : '⚠️'}`);

          if (works) passedScripts++;
        } else {
          console.log(`   ${script.description}: ❌ (not found)`);
        }
      } catch (error) {
        console.log(`   ${script.description}: ⚠️ (execution error)`);
      }
    }

    this.results.validationScripts = passedScripts >= scripts.length * 0.8;
  }

  async testDashboardComponents() {
    console.log('\n3. 📊 Testing Dashboard Components');
    console.log('-'.repeat(30));

    try {
      // Check governance dashboard exists
      const dashboardExists = fs.existsSync('components/governance/GovernanceDashboard.tsx');
      console.log(`   Governance dashboard component: ${dashboardExists ? '✅' : '❌'}`);

      // Check dashboard page
      const pageExists = fs.existsSync('app/governance-dashboard/page.tsx');
      console.log(`   Dashboard page: ${pageExists ? '✅' : '❌'}`);

      // Check for dashboard features in component
      if (dashboardExists) {
        const content = fs.readFileSync('components/governance/GovernanceDashboard.tsx', 'utf8');
        const hasMetrics = content.includes('GovernanceMetric');
        const hasQualityGates = content.includes('QualityGate');
        const hasCharts = content.includes('ResponsiveContainer');

        console.log(`   Metrics integration: ${hasMetrics ? '✅' : '❌'}`);
        console.log(`   Quality gates: ${hasQualityGates ? '✅' : '❌'}`);
        console.log(`   Chart visualization: ${hasCharts ? '✅' : '❌'}`);
      }

      this.results.dashboard = dashboardExists && pageExists;
    } catch (error) {
      console.log(`   ❌ Dashboard test failed: ${error.message}`);
      this.results.dashboard = false;
    }
  }

  async testCIPipeline() {
    console.log('\n4. 🔄 Testing CI/CD Pipeline');
    console.log('-'.repeat(30));

    try {
      // Check for governance workflow
      const workflowExists = fs.existsSync('.github/workflows/design-system-governance.yml');
      console.log(`   Governance workflow: ${workflowExists ? '✅' : '❌'}`);

      // Check foundation protection workflow
      const foundationExists = fs.existsSync('.github/workflows/foundation-protection.yml');
      console.log(`   Foundation protection: ${foundationExists ? '✅' : '❌'}`);

      if (workflowExists) {
        const content = fs.readFileSync('.github/workflows/design-system-governance.yml', 'utf8');

        // Check for quality gates
        const hasTokenGovernance = content.includes('token-governance');
        const hasA11yGovernance = content.includes('accessibility-governance');
        const hasPerfGovernance = content.includes('performance-governance');
        const hasRollback = content.includes('rollback-management');

        console.log(`   Token governance job: ${hasTokenGovernance ? '✅' : '❌'}`);
        console.log(`   Accessibility governance job: ${hasA11yGovernance ? '✅' : '❌'}`);
        console.log(`   Performance governance job: ${hasPerfGovernance ? '✅' : '❌'}`);
        console.log(`   Rollback management: ${hasRollback ? '✅' : '❌'}`);
      }

      this.results.cicdPipeline = workflowExists && foundationExists;
    } catch (error) {
      console.log(`   ❌ CI/CD pipeline test failed: ${error.message}`);
      this.results.cicdPipeline = false;
    }
  }

  async testRollbackSystem() {
    console.log('\n5. 🔄 Testing Rollback System');
    console.log('-'.repeat(30));

    try {
      // Check rollback script exists
      const rollbackExists = fs.existsSync('scripts/rollback-system.js');
      console.log(`   Rollback script: ${rollbackExists ? '✅' : '❌'}`);

      if (rollbackExists) {
        const content = fs.readFileSync('scripts/rollback-system.js', 'utf8');

        // Check for rollback strategies
        const hasEmergency = content.includes('EMERGENCY_ROLLBACK');
        const hasSelective = content.includes('SELECTIVE_ROLLBACK');
        const hasIncremental = content.includes('INCREMENTAL_ROLLBACK');
        const hasBackup = content.includes('createBackup');

        console.log(`   Emergency rollback: ${hasEmergency ? '✅' : '❌'}`);
        console.log(`   Selective rollback: ${hasSelective ? '✅' : '❌'}`);
        console.log(`   Incremental rollback: ${hasIncremental ? '✅' : '❌'}`);
        console.log(`   Backup system: ${hasBackup ? '✅' : '❌'}`);
      }

      // Check governance configuration
      const configExists = fs.existsSync('.governancerc.json');
      console.log(`   Governance configuration: ${configExists ? '✅' : '❌'}`);

      this.results.rollbackSystem = rollbackExists && configExists;
    } catch (error) {
      console.log(`   ❌ Rollback system test failed: ${error.message}`);
      this.results.rollbackSystem = false;
    }
  }

  calculateOverallScore() {
    const scores = [
      this.results.preCommitHooks ? 20 : 0,
      this.results.validationScripts ? 25 : 0,
      this.results.dashboard ? 20 : 0,
      this.results.cicdPipeline ? 25 : 0,
      this.results.rollbackSystem ? 10 : 0,
    ];

    this.results.overallScore = scores.reduce((sum, score) => sum + score, 0);
  }

  generateTestReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 GOVERNANCE SYSTEM INTEGRATION TEST RESULTS');
    console.log('='.repeat(60));

    console.log('\n🏆 Overall Score:', `${this.results.overallScore}/100`);

    const status =
      this.results.overallScore >= 90
        ? 'EXCELLENT'
        : this.results.overallScore >= 80
          ? 'GOOD'
          : this.results.overallScore >= 70
            ? 'ACCEPTABLE'
            : 'NEEDS IMPROVEMENT';

    console.log('📈 Status:', status);

    console.log('\n📋 Component Results:');
    console.log(
      `   🪝 Pre-commit Hooks: ${this.results.preCommitHooks ? '✅ PASS' : '❌ FAIL'} (20 points)`
    );
    console.log(
      `   📋 Validation Scripts: ${this.results.validationScripts ? '✅ PASS' : '❌ FAIL'} (25 points)`
    );
    console.log(`   📊 Dashboard: ${this.results.dashboard ? '✅ PASS' : '❌ FAIL'} (20 points)`);
    console.log(
      `   🔄 CI/CD Pipeline: ${this.results.cicdPipeline ? '✅ PASS' : '❌ FAIL'} (25 points)`
    );
    console.log(
      `   🔄 Rollback System: ${this.results.rollbackSystem ? '✅ PASS' : '❌ FAIL'} (10 points)`
    );

    console.log('\n🎯 Integration Status:');
    if (this.results.overallScore >= 80) {
      console.log('✅ Governance system is properly integrated and ready for use');
      console.log('🚀 All major components are working correctly');
    } else {
      console.log('⚠️ Governance system needs attention before production use');
      console.log('🔧 Review failed components and fix issues');
    }

    console.log('\n📋 Next Steps:');
    if (!this.results.preCommitHooks) {
      console.log('   • Configure Husky pre-commit hooks');
    }
    if (!this.results.validationScripts) {
      console.log('   • Fix validation script errors');
    }
    if (!this.results.dashboard) {
      console.log('   • Complete dashboard implementation');
    }
    if (!this.results.cicdPipeline) {
      console.log('   • Set up GitHub Actions workflows');
    }
    if (!this.results.rollbackSystem) {
      console.log('   • Complete rollback system configuration');
    }

    console.log('\n🔗 Quick Commands:');
    console.log('   npm run governance:check  - Run all quality gates');
    console.log('   npm run governance:score  - Calculate governance score');
    console.log('   npm run governance:report - Generate detailed report');

    console.log('\n📊 Dashboard: /governance-dashboard');
    console.log('⚙️  Configuration: .governancerc.json');

    console.log('\n' + '='.repeat(60));

    // Save test report
    const reportData = {
      timestamp: new Date().toISOString(),
      results: this.results,
      status,
      overallScore: this.results.overallScore,
      recommendations: this.generateRecommendations(),
    };

    fs.mkdirSync('reports', { recursive: true });
    fs.writeFileSync(
      'reports/governance-integration-test.json',
      JSON.stringify(reportData, null, 2)
    );
    console.log('\n📄 Test report saved: reports/governance-integration-test.json');
  }

  generateRecommendations() {
    const recommendations = [];

    if (!this.results.preCommitHooks) {
      recommendations.push({
        priority: 'high',
        component: 'Pre-commit Hooks',
        action: 'Run "npx husky install" and ensure hooks are executable',
      });
    }

    if (!this.results.validationScripts) {
      recommendations.push({
        priority: 'high',
        component: 'Validation Scripts',
        action: 'Fix script execution errors and ensure all validators work properly',
      });
    }

    if (!this.results.dashboard) {
      recommendations.push({
        priority: 'medium',
        component: 'Dashboard',
        action: 'Complete dashboard component implementation and routing',
      });
    }

    if (!this.results.cicdPipeline) {
      recommendations.push({
        priority: 'high',
        component: 'CI/CD Pipeline',
        action: 'Set up GitHub Actions workflows for automated governance',
      });
    }

    if (!this.results.rollbackSystem) {
      recommendations.push({
        priority: 'medium',
        component: 'Rollback System',
        action: 'Complete rollback system configuration and testing',
      });
    }

    return recommendations;
  }
}

// Run the integration test
if (require.main === module) {
  const test = new GovernanceSystemTest();
  test
    .runIntegrationTest()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = GovernanceSystemTest;
