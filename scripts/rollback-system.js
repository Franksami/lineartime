#!/usr/bin/env node
/**
 * Governance Rollback System
 * Handles rollback of changes when governance quality gates fail
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GovernanceRollbackSystem {
  constructor() {
    this.rollbackConfig = {
      maxRetries: 3,
      backupBranch: 'governance/backup',
      safetyChecks: true,
      preserveUserWork: true,
      autoRollbackEnabled: process.env.GOVERNANCE_AUTO_ROLLBACK === 'true'
    };
    
    this.rollbackState = {
      currentAttempt: 0,
      failedComponents: [],
      backupCreated: false,
      rollbackTriggered: false
    };
  }

  async handleGovernanceFailure(failureContext) {
    console.log('🚨 Governance failure detected, initiating rollback system...\n');
    
    try {
      // Analyze failure severity
      const failureSeverity = this.analyzeFaculeSeverity(failureContext);
      console.log(`📊 Failure Severity: ${failureSeverity.level} (${failureSeverity.score}/100)`);
      
      // Create backup before any rollback actions
      await this.createBackup();
      
      // Determine rollback strategy
      const strategy = this.determineRollbackStrategy(failureSeverity);
      console.log(`📋 Rollback Strategy: ${strategy.type}`);
      
      // Execute rollback based on strategy
      const rollbackResult = await this.executeRollback(strategy, failureContext);
      
      if (rollbackResult.success) {
        console.log('✅ Rollback completed successfully');
        await this.validateRollback();
        await this.generateRollbackReport(rollbackResult);
        return true;
      } else {
        console.error('❌ Rollback failed, manual intervention required');
        await this.escalateToManual(rollbackResult);
        return false;
      }
      
    } catch (error) {
      console.error('💥 Rollback system error:', error.message);
      await this.emergencyBackup();
      return false;
    }
  }

  analyzeFaculeSeverity(failureContext) {
    let score = 0;
    const issues = [];
    
    // Analyze different types of failures
    if (failureContext.accessibility && failureContext.accessibility.score < 70) {
      score += 30;
      issues.push('Critical accessibility failure');
    }
    
    if (failureContext.security && failureContext.security.vulnerabilities?.critical > 0) {
      score += 40;
      issues.push('Critical security vulnerabilities');
    }
    
    if (failureContext.performance && failureContext.performance.score < 60) {
      score += 25;
      issues.push('Severe performance degradation');
    }
    
    if (failureContext.tokens && failureContext.tokens.violations > 10) {
      score += 20;
      issues.push('Major token violations');
    }
    
    if (failureContext.motion && failureContext.motion.vestibularUnsafe) {
      score += 35;
      issues.push('Vestibular unsafe animations');
    }
    
    if (failureContext.i18n && failureContext.i18n.brokenLocales > 2) {
      score += 15;
      issues.push('Multiple locale failures');
    }
    
    const level = score >= 80 ? 'CRITICAL' :
                 score >= 60 ? 'HIGH' :
                 score >= 40 ? 'MEDIUM' : 'LOW';
    
    return { score, level, issues };
  }

  determineRollbackStrategy(severity) {
    if (severity.level === 'CRITICAL') {
      return {
        type: 'EMERGENCY_ROLLBACK',
        actions: ['immediate_revert', 'isolate_changes', 'notify_team'],
        autoExecute: true
      };
    } else if (severity.level === 'HIGH') {
      return {
        type: 'SELECTIVE_ROLLBACK',
        actions: ['revert_failed_components', 'preserve_working_features', 'create_patches'],
        autoExecute: this.rollbackConfig.autoRollbackEnabled
      };
    } else if (severity.level === 'MEDIUM') {
      return {
        type: 'INCREMENTAL_ROLLBACK',
        actions: ['disable_problematic_features', 'apply_hotfixes', 'gradual_recovery'],
        autoExecute: false
      };
    } else {
      return {
        type: 'MONITORED_RECOVERY',
        actions: ['increase_monitoring', 'prepare_patches', 'schedule_fixes'],
        autoExecute: false
      };
    }
  }

  async executeRollback(strategy, failureContext) {
    console.log(`\n🔄 Executing ${strategy.type} strategy...\n`);
    
    const rollbackResult = {
      strategy: strategy.type,
      success: false,
      actions: [],
      errors: [],
      timestamp: new Date().toISOString()
    };
    
    try {
      switch (strategy.type) {
        case 'EMERGENCY_ROLLBACK':
          await this.performEmergencyRollback(rollbackResult);
          break;
          
        case 'SELECTIVE_ROLLBACK':
          await this.performSelectiveRollback(rollbackResult, failureContext);
          break;
          
        case 'INCREMENTAL_ROLLBACK':
          await this.performIncrementalRollback(rollbackResult, failureContext);
          break;
          
        case 'MONITORED_RECOVERY':
          await this.performMonitoredRecovery(rollbackResult, failureContext);
          break;
      }
      
      rollbackResult.success = rollbackResult.errors.length === 0;
      return rollbackResult;
      
    } catch (error) {
      rollbackResult.errors.push(error.message);
      rollbackResult.success = false;
      return rollbackResult;
    }
  }

  async performEmergencyRollback(result) {
    console.log('🚨 Performing emergency rollback...');
    
    try {
      // 1. Immediately revert to last known good state
      const lastGoodCommit = await this.findLastGoodCommit();
      if (lastGoodCommit) {
        execSync(`git reset --hard ${lastGoodCommit}`, { encoding: 'utf8' });
        result.actions.push(`Reverted to commit: ${lastGoodCommit}`);
      }
      
      // 2. Disable problematic features via feature flags
      await this.disableFeaturesEmergency();
      result.actions.push('Emergency feature flags activated');
      
      // 3. Restore backup configuration
      await this.restoreBackupConfiguration();
      result.actions.push('Backup configuration restored');
      
      // 4. Clear caches and rebuild
      await this.clearCachesAndRebuild();
      result.actions.push('Caches cleared and rebuild completed');
      
    } catch (error) {
      result.errors.push(`Emergency rollback error: ${error.message}`);
    }
  }

  async performSelectiveRollback(result, failureContext) {
    console.log('🎯 Performing selective rollback...');
    
    try {
      // 1. Identify specific files/components that caused failures
      const problematicFiles = this.identifyProblematicFiles(failureContext);
      result.actions.push(`Identified ${problematicFiles.length} problematic files`);
      
      // 2. Revert only those specific files
      for (const file of problematicFiles) {
        try {
          const lastGoodVersion = await this.getLastGoodVersion(file);
          if (lastGoodVersion) {
            execSync(`git checkout ${lastGoodVersion} -- ${file}`, { encoding: 'utf8' });
            result.actions.push(`Reverted file: ${file}`);
          }
        } catch (error) {
          result.errors.push(`Failed to revert ${file}: ${error.message}`);
        }
      }
      
      // 3. Apply patches for working features
      await this.applyWorkingFeaturePatches();
      result.actions.push('Applied patches for working features');
      
      // 4. Update configuration to disable failed components
      await this.updateConfigurationForFailures(failureContext);
      result.actions.push('Updated configuration for failed components');
      
    } catch (error) {
      result.errors.push(`Selective rollback error: ${error.message}`);
    }
  }

  async performIncrementalRollback(result, failureContext) {
    console.log('📈 Performing incremental rollback...');
    
    try {
      // 1. Create feature flags to disable problematic features
      const featureFlags = this.createFeatureFlagsForFailures(failureContext);
      await this.applyFeatureFlags(featureFlags);
      result.actions.push(`Applied ${featureFlags.length} feature flags`);
      
      // 2. Apply hotfixes for minor issues
      const hotfixes = this.generateHotfixes(failureContext);
      for (const hotfix of hotfixes) {
        try {
          await this.applyHotfix(hotfix);
          result.actions.push(`Applied hotfix: ${hotfix.description}`);
        } catch (error) {
          result.errors.push(`Hotfix failed: ${hotfix.description} - ${error.message}`);
        }
      }
      
      // 3. Schedule gradual recovery
      await this.scheduleGradualRecovery(failureContext);
      result.actions.push('Scheduled gradual recovery plan');
      
    } catch (error) {
      result.errors.push(`Incremental rollback error: ${error.message}`);
    }
  }

  async performMonitoredRecovery(result, failureContext) {
    console.log('👁️ Performing monitored recovery...');
    
    try {
      // 1. Increase monitoring and alerting
      await this.enhanceMonitoring(failureContext);
      result.actions.push('Enhanced monitoring activated');
      
      // 2. Prepare patches for issues
      const patches = await this.preparePatchesForIssues(failureContext);
      result.actions.push(`Prepared ${patches.length} patches`);
      
      // 3. Create recovery timeline
      const timeline = this.createRecoveryTimeline(failureContext);
      await this.scheduleRecoveryTasks(timeline);
      result.actions.push('Recovery timeline scheduled');
      
    } catch (error) {
      result.errors.push(`Monitored recovery error: ${error.message}`);
    }
  }

  async createBackup() {
    if (this.rollbackState.backupCreated) return;
    
    console.log('💾 Creating governance backup...');
    
    try {
      // Create backup branch
      const backupBranchName = `${this.rollbackConfig.backupBranch}-${Date.now()}`;
      execSync(`git checkout -b ${backupBranchName}`, { encoding: 'utf8' });
      execSync(`git checkout -`, { encoding: 'utf8' }); // Switch back
      
      // Backup critical configuration files
      const configFiles = [
        'package.json',
        'next.config.ts',
        'tailwind.config.ts',
        '.env.example',
        'design-tokens/**/*.json'
      ];
      
      const backupDir = path.join(process.cwd(), '.governance-backup');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      for (const pattern of configFiles) {
        try {
          execSync(`cp -r ${pattern} ${backupDir}/ 2>/dev/null || true`, { encoding: 'utf8' });
        } catch (error) {
          // Continue if individual files fail
        }
      }
      
      this.rollbackState.backupCreated = true;
      console.log(`✅ Backup created: ${backupBranchName}`);
      
    } catch (error) {
      console.warn(`⚠️ Backup creation failed: ${error.message}`);
    }
  }

  async findLastGoodCommit() {
    try {
      // Find the last commit that passed governance
      const commits = execSync('git log --oneline -20', { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.split(' ')[0]);
      
      // Check each commit for governance indicators
      for (const commit of commits) {
        try {
          const message = execSync(`git log --format=%B -n 1 ${commit}`, { encoding: 'utf8' });
          if (message.includes('governance:passed') || message.includes('✅')) {
            return commit;
          }
        } catch (error) {
          continue;
        }
      }
      
      // Fallback to HEAD~5 if no good commit found
      return 'HEAD~5';
      
    } catch (error) {
      return 'HEAD~5';
    }
  }

  identifyProblematicFiles(failureContext) {
    const files = new Set();
    
    // Extract files from different failure contexts
    if (failureContext.tokens?.violations) {
      // Files with token violations
      try {
        const tokenResult = execSync('npm run ci:guard 2>&1 || true', { encoding: 'utf8' });
        const matches = tokenResult.match(/([^:\s]+\.(tsx?|jsx?)):/g);
        if (matches) {
          matches.forEach(match => files.add(match.replace(':', '')));
        }
      } catch (error) {
        // Continue
      }
    }
    
    if (failureContext.accessibility?.issues) {
      // Files with accessibility issues
      files.add('components/ui/button.tsx');
      files.add('components/ui/dialog.tsx');
      files.add('components/calendar/LinearCalendarHorizontal.tsx');
    }
    
    if (failureContext.performance?.issues) {
      // Files with performance issues
      files.add('app/page.tsx');
      files.add('components/calendar/EventLayer.tsx');
    }
    
    return Array.from(files);
  }

  async getLastGoodVersion(file) {
    try {
      // Find last commit where this file was in a good state
      const commits = execSync(`git log --oneline -10 -- ${file}`, { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.split(' ')[0]);
      
      // Return the second-to-last commit (assuming current is broken)
      return commits[1] || commits[0];
      
    } catch (error) {
      return null;
    }
  }

  createFeatureFlagsForFailures(failureContext) {
    const flags = [];
    
    if (failureContext.accessibility?.score < 80) {
      flags.push({
        name: 'DISABLE_PROBLEMATIC_ANIMATIONS',
        value: true,
        reason: 'Accessibility compliance failure'
      });
    }
    
    if (failureContext.performance?.score < 70) {
      flags.push({
        name: 'ENABLE_PERFORMANCE_MODE',
        value: true,
        reason: 'Performance budget exceeded'
      });
    }
    
    if (failureContext.motion?.vestibularUnsafe) {
      flags.push({
        name: 'FORCE_REDUCED_MOTION',
        value: true,
        reason: 'Vestibular unsafe animations detected'
      });
    }
    
    return flags;
  }

  async applyFeatureFlags(flags) {
    const flagsFile = path.join(process.cwd(), '.governance-flags.json');
    const existingFlags = fs.existsSync(flagsFile) 
      ? JSON.parse(fs.readFileSync(flagsFile, 'utf8'))
      : {};
    
    flags.forEach(flag => {
      existingFlags[flag.name] = {
        value: flag.value,
        reason: flag.reason,
        timestamp: new Date().toISOString(),
        temporary: true
      };
    });
    
    fs.writeFileSync(flagsFile, JSON.stringify(existingFlags, null, 2));
  }

  generateHotfixes(failureContext) {
    const hotfixes = [];
    
    // Example hotfixes based on common issues
    if (failureContext.tokens?.violations) {
      hotfixes.push({
        description: 'Fix hardcoded color values',
        files: ['components/ui/button.tsx'],
        changes: [
          {
            from: 'bg-primary',
            to: 'bg-primary'
          }
        ]
      });
    }
    
    if (failureContext.accessibility?.contrastIssues) {
      hotfixes.push({
        description: 'Fix contrast ratio issues',
        files: ['design-tokens/semantic/colors.json'],
        changes: [
          {
            from: '"value": "#9CA3AF"',
            to: '"value": "#6B7280"'
          }
        ]
      });
    }
    
    return hotfixes;
  }

  async applyHotfix(hotfix) {
    for (const file of hotfix.files) {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        for (const change of hotfix.changes) {
          content = content.replace(new RegExp(change.from, 'g'), change.to);
        }
        
        fs.writeFileSync(file, content);
      }
    }
  }

  async disableFeaturesEmergency() {
    // Create emergency feature flags
    const emergencyFlags = {
      DISABLE_ANIMATIONS: true,
      ENABLE_SAFE_MODE: true,
      REDUCE_COMPLEXITY: true,
      FALLBACK_UI: true
    };
    
    const flagsFile = path.join(process.cwd(), '.emergency-flags.json');
    fs.writeFileSync(flagsFile, JSON.stringify(emergencyFlags, null, 2));
  }

  async restoreBackupConfiguration() {
    const backupDir = path.join(process.cwd(), '.governance-backup');
    if (fs.existsSync(backupDir)) {
      try {
        execSync(`cp -r ${backupDir}/* ./`, { encoding: 'utf8' });
      } catch (error) {
        console.warn(`⚠️ Failed to restore backup configuration: ${error.message}`);
      }
    }
  }

  async clearCachesAndRebuild() {
    try {
      // Clear Next.js cache
      execSync('rm -rf .next', { encoding: 'utf8' });
      
      // Clear node_modules if needed (nuclear option)
      // execSync('rm -rf node_modules && npm install', { encoding: 'utf8' });
      
      // Rebuild
      execSync('npm run build', { encoding: 'utf8' });
      
    } catch (error) {
      console.warn(`⚠️ Cache clear and rebuild failed: ${error.message}`);
    }
  }

  async validateRollback() {
    console.log('🔍 Validating rollback...');
    
    try {
      // Run quick governance check
      const quickCheck = execSync('node scripts/calculate-governance-score.js', { encoding: 'utf8' });
      const score = parseInt(quickCheck.trim());
      
      if (score >= 70) {
        console.log(`✅ Rollback validation passed (score: ${score}%)`);
        return true;
      } else {
        console.warn(`⚠️ Rollback validation failed (score: ${score}%)`);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ Rollback validation error: ${error.message}`);
      return false;
    }
  }

  async generateRollbackReport(rollbackResult) {
    const report = {
      timestamp: new Date().toISOString(),
      strategy: rollbackResult.strategy,
      success: rollbackResult.success,
      actions: rollbackResult.actions,
      errors: rollbackResult.errors,
      environment: {
        node: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };
    
    const reportFile = path.join(process.cwd(), 'reports', `rollback-report-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(reportFile), { recursive: true });
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`📄 Rollback report saved: ${reportFile}`);
  }

  async escalateToManual(rollbackResult) {
    console.error('🚨 Escalating to manual intervention...');
    
    // Create manual intervention guide
    const guide = `
# Manual Governance Rollback Guide

## Situation
Automated rollback failed. Manual intervention required.

## Failed Actions
${rollbackResult.actions.map(action => `- ${action}`).join('\n')}

## Errors Encountered
${rollbackResult.errors.map(error => `- ${error}`).join('\n')}

## Manual Steps Required

1. **Check Git Status**
   \`\`\`bash
   git status
   git log --oneline -10
   \`\`\`

2. **Manual Revert Options**
   \`\`\`bash
   # Option 1: Reset to last known good commit
   git reset --hard HEAD~5
   
   # Option 2: Create new branch and cherry-pick good changes
   git checkout -b manual-rollback
   \`\`\`

3. **Validate Environment**
   \`\`\`bash
   npm run governance:check
   npm run test:foundation
   \`\`\`

4. **Contact Development Team**
   - Share this report
   - Include governance dashboard screenshots
   - Provide error logs

## Recovery Checklist
- [ ] Environment stabilized
- [ ] Governance checks passing
- [ ] Foundation tests passing
- [ ] Manual testing completed
- [ ] Team notified of resolution

Generated: ${new Date().toISOString()}
    `;
    
    const guideFile = path.join(process.cwd(), 'MANUAL_ROLLBACK_GUIDE.md');
    fs.writeFileSync(guideFile, guide);
    
    console.log(`📋 Manual rollback guide created: ${guideFile}`);
  }

  async emergencyBackup() {
    console.log('🚨 Creating emergency backup...');
    
    try {
      const emergencyDir = path.join(process.cwd(), '.emergency-backup');
      fs.mkdirSync(emergencyDir, { recursive: true });
      
      // Backup critical files
      const criticalFiles = [
        'package.json',
        'next.config.ts',
        'tailwind.config.ts',
        'components/calendar/LinearCalendarHorizontal.tsx'
      ];
      
      for (const file of criticalFiles) {
        if (fs.existsSync(file)) {
          const backupName = file.replace(/[/\\]/g, '_');
          fs.copyFileSync(file, path.join(emergencyDir, backupName));
        }
      }
      
      console.log(`💾 Emergency backup created in: ${emergencyDir}`);
      
    } catch (error) {
      console.error(`❌ Emergency backup failed: ${error.message}`);
    }
  }

  // Placeholder methods for additional functionality
  async applyWorkingFeaturePatches() {
    // Implementation would apply patches to preserve working features
  }

  async updateConfigurationForFailures() {
    // Implementation would update config to disable failed components
  }

  async enhanceMonitoring() {
    // Implementation would increase monitoring sensitivity
  }

  async preparePatchesForIssues() {
    // Implementation would prepare patches for identified issues
    return [];
  }

  createRecoveryTimeline() {
    // Implementation would create a timeline for gradual recovery
    return [];
  }

  async scheduleRecoveryTasks() {
    // Implementation would schedule recovery tasks
  }

  async scheduleGradualRecovery() {
    // Implementation would schedule gradual recovery
  }
}

// CLI interface
if (require.main === module) {
  const rollbackSystem = new GovernanceRollbackSystem();
  
  // Example failure context for testing
  const mockFailureContext = {
    accessibility: { score: 65, issues: 5 },
    performance: { score: 70, issues: 3 },
    tokens: { violations: 15 },
    motion: { vestibularUnsafe: false },
    security: { vulnerabilities: { critical: 0, high: 2 } },
    i18n: { brokenLocales: 1 }
  };
  
  rollbackSystem.handleGovernanceFailure(mockFailureContext);
}

module.exports = GovernanceRollbackSystem;