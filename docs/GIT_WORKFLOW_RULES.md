# 🔒 GIT WORKFLOW RULES - MANDATORY CodeRabbit Review

**Status**: 🚨 **MANDATORY ENFORCEMENT**  
**Foundation Protection**: Critical for maintaining locked structure  
**Code Quality**: CodeRabbit review REQUIRED before main branch

---

## 🚨 **CRITICAL WORKFLOW RULES**

### **RULE #1: NEVER PUSH DIRECTLY TO MAIN**
```bash
# ❌ PROHIBITED - Direct push to main
git push origin main

# ✅ REQUIRED - Feature branch → CodeRabbit → Main
git checkout -b feature/[feature-name]
git push origin feature/[feature-name]
# → CodeRabbit review → Merge to main
```

### **RULE #2: CODERABBIT REVIEW MANDATORY**
- **ALL code changes** must be reviewed by CodeRabbit before main branch
- **NO exceptions** - even for documentation or small fixes
- **Foundation changes** require extra scrutiny for structure protection
- **Performance changes** need benchmark validation

### **RULE #3: FEATURE BRANCH WORKFLOW**
```bash
# 1. Create feature branch for each task
git checkout -b feature/task-[ID]-[description]

# 2. Implement feature with testing
npm run test:foundation        # Foundation protection
npx playwright test           # Feature functionality  
npm run build                # Production validation

# 3. Commit to feature branch (if tests pass)
git add .
git commit -m "[detailed commit message with testing validation]"

# 4. Push feature branch
git push origin feature/task-[ID]-[description]

# 5. CREATE PULL REQUEST (NOT direct push)
gh pr create --title "Task #[ID]: [Feature Name]" --body "[detailed description]"

# 6. WAIT FOR CODERABBIT REVIEW
# → CodeRabbit analyzes code quality, security, performance
# → Address any CodeRabbit feedback
# → Get approval before merge

# 7. Merge to main ONLY after CodeRabbit approval
gh pr merge --merge  # Or use GitHub UI after review
```

---

## 📋 **ENFORCED COMMIT WORKFLOW**

### **Phase 1: Pre-Commit Validation (MANDATORY)**
```bash
# 1. Foundation Protection Testing
npm run test:foundation || {
  echo "❌ FOUNDATION VIOLATION DETECTED - COMMIT BLOCKED"
  exit 1
}

# 2. Feature Testing
npx playwright test tests/[feature].spec.ts || {
  echo "❌ FEATURE TESTS FAILED - COMMIT BLOCKED"  
  exit 1
}

# 3. Build Validation
npm run build || {
  echo "❌ BUILD FAILED - COMMIT BLOCKED"
  exit 1
}

# 4. Performance Testing
npm run test:performance || {
  echo "❌ PERFORMANCE REGRESSION - COMMIT BLOCKED"
  exit 1
}

# 5. ONLY IF ALL TESTS PASS: Commit allowed
git add .
git commit -m "[comprehensive commit message]"
```

### **Phase 2: Feature Branch Push (SAFE)**
```bash
# Push to feature branch (safe, not main)
git push origin feature/[branch-name]

# Create PR for CodeRabbit review
gh pr create --title "[Task #ID]: [Feature]" --body "$(cat <<'EOF'
## Feature Implementation

**TaskMaster Task**: #[ID] - [Task Name]
**Foundation Compliance**: ✅ Verified with automated tests
**Testing Status**: ✅ All tests pass

### Changes Made:
- [Detailed change 1]
- [Detailed change 2]
- [Detailed change 3]

### Testing Validation:
✅ Foundation protection tests passed
✅ Feature functionality tests passed  
✅ Performance benchmarks maintained
✅ Accessibility compliance verified
✅ Cross-platform compatibility confirmed

### Foundation Compliance:
✅ 12-month horizontal structure preserved
✅ Week day headers intact (top & bottom)
✅ Month labels maintained (left & right)
✅ "Life is bigger than a week" philosophy preserved

### Performance Metrics:
- FPS: [XXX] (target: >112)
- Memory: [XXX]MB (target: <100MB)  
- Load Time: [XXX]ms (target: <500ms)

**CodeRabbit Review Required**: Please review for code quality, security, and foundation compliance before merge.
EOF
)"
```

### **Phase 3: CodeRabbit Review Process**
```bash
# WAIT for CodeRabbit analysis
# → Code quality review
# → Security vulnerability scan
# → Performance impact assessment  
# → Foundation structure validation
# → Best practices compliance

# Address CodeRabbit feedback if any
git commit -m "fix: Address CodeRabbit feedback - [specific changes]"
git push origin feature/[branch-name]

# ONLY after CodeRabbit approval: Merge to main
gh pr merge --merge
```

---

## 🛡️ **AUTOMATIC ENFORCEMENT MECHANISMS**

### **Git Hooks Setup**
```bash
# Create pre-push hook to prevent direct main pushes
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
protected_branch='main'
current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')

if [ "$current_branch" = "$protected_branch" ]; then
    echo "🚨 BLOCKED: Direct push to main branch prohibited!"
    echo "✅ REQUIRED: Use feature branch → CodeRabbit review → merge workflow"
    echo ""
    echo "Correct workflow:"
    echo "git checkout -b feature/[task-name]"
    echo "git push origin feature/[task-name]" 
    echo "gh pr create [options]"
    echo "# Wait for CodeRabbit review → Merge"
    exit 1
fi
EOF

chmod +x .git/hooks/pre-push
```

### **Package.json Scripts**
```json
{
  "scripts": {
    "pre-commit": "npm run test:foundation && npm run test:performance && npm run build",
    "create-pr": "gh pr create --title \"$(git log -1 --pretty=%s)\" --body \"$(git log -1 --pretty=%B)\"",
    "safe-push": "git push origin $(git branch --show-current)",
    "merge-ready": "npm run pre-commit && npm run safe-push && npm run create-pr"
  }
}
```

### **GitHub Actions Workflow (Future)**
```yaml
# .github/workflows/coderabbit-protection.yml
name: CodeRabbit Protection
on:
  push:
    branches: [main]
    
jobs:
  block-direct-main-push:
    runs-on: ubuntu-latest
    steps:
      - name: Block Direct Main Push
        run: |
          echo "🚨 Direct push to main detected!"
          echo "❌ This violates CodeRabbit review requirement"
          exit 1
```

---

## 📋 **STANDARD WORKFLOW CHECKLIST**

### **Every Feature Implementation:**
```markdown
# Pre-Implementation
□ Create feature branch: `git checkout -b feature/task-[ID]-[name]`
□ Review TaskMaster task requirements
□ Plan implementation preserving foundation

# Implementation  
□ Implement feature maintaining foundation structure
□ Add/update tests for new functionality
□ Test during development with Playwright --ui
□ Use UI/UX engineer for frontend validation

# Pre-Commit Testing (MANDATORY)
□ Foundation protection: `npm run test:foundation`
□ Feature testing: `npx playwright test tests/[feature].spec.ts`
□ Performance testing: `npm run test:performance`
□ Build validation: `npm run build`
□ Accessibility testing: `npm run test:accessibility`

# Commit to Feature Branch
□ Comprehensive commit message with testing details
□ Push to feature branch: `git push origin feature/[branch]`
□ Create PR: `gh pr create` with detailed description

# CodeRabbit Review Process
□ Wait for CodeRabbit automated review
□ Address any CodeRabbit feedback/suggestions
□ Re-test if changes made
□ Wait for CodeRabbit approval

# Merge to Main (ONLY after CodeRabbit approval)
□ CodeRabbit approval received ✅
□ Merge PR to main branch
□ Update TaskMaster task status: done
□ Plan next task implementation
```

---

## 🔧 **QUICK SETUP COMMANDS**

### **Initialize Git Workflow Protection**
```bash
# 1. Setup pre-push hook
./scripts/setup-git-protection.sh

# 2. Configure GitHub CLI for PR creation
gh auth login
gh repo set-default

# 3. Add npm scripts for workflow
npm run setup-workflow-scripts

# 4. Test protection mechanism
git checkout main
git push origin main  # Should be BLOCKED ✅
```

### **Daily Development Commands**
```bash
# Start new feature
npm run start-feature --task=[ID]
# Creates branch: feature/task-[ID]-[description]

# Complete feature implementation
npm run merge-ready
# Runs all tests → pushes → creates PR

# Check workflow status
npm run workflow-status
# Shows current branch, test status, PR status
```

---

## 🎯 **CODERABBIT INTEGRATION BENEFITS**

### **Automated Quality Assurance**
- **Code Quality**: Style, complexity, maintainability analysis
- **Security Scanning**: Vulnerability detection and prevention
- **Performance Impact**: Memory, CPU, bundle size analysis
- **Foundation Protection**: Automated detection of structure violations

### **Learning & Improvement**
- **Best Practices**: Suggestions for code improvement
- **Pattern Recognition**: Consistent coding patterns across codebase
- **Knowledge Transfer**: Learn from CodeRabbit suggestions
- **Documentation**: Better code comments and documentation

### **Foundation Protection**
- **Structure Validation**: Automated check for 12-month row preservation
- **Component Compliance**: Verify LinearCalendarHorizontal usage
- **Philosophy Enforcement**: Ensure "Life is bigger than a week" maintained
- **Performance Standards**: Validate 112+ FPS and memory benchmarks

---

## 🚨 **VIOLATION CONSEQUENCES**

### **If Direct Main Push Attempted:**
1. **Git Hook Blocks**: Pre-push hook prevents push
2. **GitHub Action Fails**: CI pipeline rejects push
3. **Automatic Revert**: Unauthorized changes automatically reverted
4. **Notification**: Alert about workflow violation

### **If CodeRabbit Review Skipped:**
1. **PR Blocked**: Cannot merge without review
2. **Quality Gate Failed**: Automated quality checks fail
3. **Foundation Risk**: Potential structure violations undetected

---

## ✅ **SUCCESS METRICS**

### **Workflow Compliance:**
- **100% PR Review Rate**: All changes reviewed by CodeRabbit
- **Zero Direct Main Pushes**: All changes through feature branches
- **Quality Score**: Maintain high CodeRabbit quality ratings
- **Foundation Protection**: Zero unauthorized structure changes

### **Code Quality Metrics:**
- **Security Issues**: Zero high/critical vulnerabilities
- **Performance**: Maintain or improve benchmarks
- **Test Coverage**: All new features tested
- **Documentation**: CodeRabbit-suggested improvements implemented

---

**🔒 WORKFLOW STATUS: ENFORCED & PROTECTED 🔒**

*This workflow ensures the locked foundation remains protected while maintaining high code quality through mandatory CodeRabbit review before any main branch changes.*