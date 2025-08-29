# Workflow Rules Module

---
extends: ../RULES_MASTER.md
module: workflow
version: 1.0.0
priority: high
---

## Development Workflow Standards

### WORK-M001: Trunk-Based Development

All development follows trunk-based workflow:

```bash
main (protected)
  ├── feature/task-123-add-calendar-sync (< 24 hours)
  ├── fix/task-456-resolve-conflict-bug (< 8 hours)
  └── chore/task-789-update-dependencies (< 4 hours)
```

**Branch Lifetime Limits**:
- Features: Maximum 24 hours
- Fixes: Maximum 8 hours
- Chores: Maximum 4 hours

### WORK-M002: Taskmaster Integration

Every development task starts with Taskmaster:

```bash
# Start new task
task-master list
task-master next
task-master show TASK-123

# During development
task-master update TASK-123 "Implementing calendar sync"
task-master add-note TASK-123 "Found issue with timezone handling"

# Complete task
task-master set-status TASK-123 completed
```

### WORK-M003: Commit Message Format

Strict conventional commits with scope:

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

Examples:
```bash
feat(calendar): add multi-provider sync support
fix(auth): resolve token refresh race condition
docs(api): update webhook integration guide
perf(shell): optimize tab switching performance
```

### WORK-M004: PR Workflow

Pull Request requirements:

1. **Title Format**: `[TASK-ID] Type: Description`
2. **Description Template**:
```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Performance Impact
- [ ] No impact
- [ ] Improved performance
- [ ] Potential regression (justified)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.logs left
- [ ] Passes all CI checks
```

### WORK-M005: Code Review Standards

Code review checklist:

**Security**:
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] SQL injection prevention
- [ ] XSS protection

**Performance**:
- [ ] No N+1 queries
- [ ] Proper memoization
- [ ] Bundle size impact checked
- [ ] No memory leaks

**Quality**:
- [ ] Tests included
- [ ] Documentation updated
- [ ] Error handling complete
- [ ] Accessibility maintained

### WORK-M006: Daily Workflow

Standard daily development flow:

```
Morning:
1. Pull latest main
2. Check Taskmaster tasks
3. Review PR comments
4. Start feature branch

Development:
5. Write tests first (TDD)
6. Implement feature
7. Run local tests
8. Self code review

Afternoon:
9. Create PR
10. Address feedback
11. Update task status
12. Plan next day
```

## CI/CD Workflow

### WORK-M007: CI Pipeline Stages

Every commit triggers:

```yaml
pipeline:
  - stage: validate
    - lint
    - typecheck
    - format-check
    
  - stage: test
    - unit-tests
    - integration-tests
    - e2e-tests
    
  - stage: build
    - build-app
    - build-storybook
    
  - stage: analyze
    - bundle-size
    - performance
    - security-scan
    
  - stage: deploy
    - preview (PRs)
    - staging (main)
    - production (tags)
```

### WORK-M008: Deployment Strategy

Progressive deployment:

1. **Preview**: Every PR gets preview URL
2. **Staging**: Auto-deploy from main
3. **Production**: Manual promotion from staging

```
PR → Preview (automatic)
    ↓
Main → Staging (automatic)
    ↓
Tag → Production (manual approval)
```

## Collaboration Workflow

### WORK-M009: Pair Programming

Pair programming sessions:

- **Driver**: Writes code
- **Navigator**: Reviews, suggests, thinks ahead
- **Rotation**: Every 30 minutes
- **Documentation**: Update task notes

### WORK-M010: Knowledge Sharing

Knowledge transfer requirements:

- **Weekly**: Tech talks (30 min)
- **Biweekly**: Code walkthroughs
- **Monthly**: Architecture reviews
- **Quarterly**: Tech debt reviews

### WORK-M011: Documentation Updates

Documentation workflow:

```bash
# When adding feature
1. Update README.md
2. Add to CHANGELOG.md
3. Update API docs
4. Add usage examples
5. Update tests

# Documentation locations
docs/
├── api/           # API documentation
├── architecture/  # System design
├── guides/        # User guides
└── development/   # Dev guides
```

## Emergency Workflow

### WORK-M012: Hotfix Process

Emergency fix workflow:

```bash
# 1. Create hotfix branch from production
git checkout -b hotfix/critical-bug production

# 2. Fix and test
# ... make changes ...
npm run test:all

# 3. Deploy to staging first
git push origin hotfix/critical-bug

# 4. After validation, merge to production
git checkout production
git merge hotfix/critical-bug

# 5. Backport to main
git checkout main
git merge hotfix/critical-bug
```

### WORK-M013: Rollback Procedure

Rollback steps:

```bash
# 1. Identify last good deployment
git log --oneline production

# 2. Create rollback branch
git checkout -b rollback/emergency <last-good-sha>

# 3. Force deploy
npm run deploy:emergency

# 4. Document incident
echo "Rollback performed: $(date)" >> INCIDENTS.md
```

## Quality Gates

### WORK-M014: Definition of Done

Task completion criteria:

- [ ] Code complete and working
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed and approved
- [ ] Deployed to preview
- [ ] Acceptance criteria met
- [ ] Performance targets met
- [ ] Security scan passed
- [ ] Taskmaster updated

### WORK-M015: Release Workflow

Release process:

```bash
# 1. Create release branch
git checkout -b release/v2.1.0 main

# 2. Update version
npm version minor

# 3. Generate changelog
npm run changelog

# 4. Create release PR
gh pr create --title "Release v2.1.0"

# 5. After approval, tag and release
git tag -a v2.1.0 -m "Release version 2.1.0"
git push origin v2.1.0
```

---

These workflow rules ensure smooth, efficient development processes across the team.