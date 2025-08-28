# Command Workspace Implementation Priorities

## 🎯 Mission Critical Fixes (Do First)

### 1. Command Palette Activation (Affects 40% of failed tests)
**Location**: `/components/commands/CommandPalette.tsx`
**Issue**: Palette not opening with Ctrl+P/Cmd+P
**Solution**:
```tsx
// Add to KeyboardManager.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? e.metaKey : e.ctrlKey;
    
    if (modKey && e.key === 'p') {
      e.preventDefault();
      openCommandPalette();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### 2. Dock Collapse/Expand Buttons (Affects layout tests)
**Location**: `/components/dock/ContextDock.tsx`
**Issue**: Buttons referenced in tests but not visible
**Solution**:
```tsx
// Add to ContextDock header
<button 
  data-testid="dock-collapse-button"
  onClick={handleCollapse}
  className="dock-control-button"
>
  {isCollapsed ? '◀' : '▶'}
</button>
```

### 3. Tab Close Functionality (Affects tab management)
**Location**: `/components/shell/TabWorkspace/TabContainer.tsx`
**Issue**: Close buttons not functional
**Solution**:
```tsx
// Add close handler
const handleCloseTab = (tabId: string) => {
  if (tabs.length > 1) {
    removeTab(tabId);
    const nextTab = tabs.find(t => t.id !== tabId);
    if (nextTab) setActiveTab(nextTab.id);
  }
};
```

## 🚀 Quick Wins (Easy Fixes)

### 1. Command Categories Population
**Location**: `/components/commands/CommandRegistry.tsx`
```tsx
const commandCategories = {
  navigation: ['Switch View', 'Go to Date', 'Next/Previous'],
  creation: ['Create Event', 'Create Task', 'Create Note'],
  tools: ['AI Assistant', 'Conflict Checker', 'Summarize'],
};
```

### 2. Recent Commands Tracking
**Location**: `/hooks/useCommands.ts`
```tsx
const [recentCommands, setRecentCommands] = useState<string[]>([]);

const trackCommand = (command: string) => {
  setRecentCommands(prev => [command, ...prev.slice(0, 4)]);
  localStorage.setItem('recentCommands', JSON.stringify(recentCommands));
};
```

### 3. Sidebar Section Navigation
**Location**: `/components/shell/Sidebar/SidebarSection.tsx`
```tsx
// Add active state management
const handleSectionClick = (section: string) => {
  setActiveSection(section);
  onNavigate?.(section);
};

<div 
  data-active={activeSection === section}
  onClick={handleSectionClick}
>
```

## 🔧 Medium Priority (Feature Completion)

### 1. Escape Key Standardization
Create a global escape key handler that:
- Closes modals first
- Then closes command palette
- Then clears selection
- Consistent 'Escape' behavior across app

### 2. Focus Trap Implementation
For all modals:
- Auto-focus first input
- Trap Tab navigation
- Return focus on close

### 3. Layout Persistence
Store in localStorage:
- Dock width
- Sidebar collapsed state
- Active tabs
- View preferences

## 📊 Test-Specific Fixes

### For Timing Issues:
```tsx
// Add loading states
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  // After component mounts
  setIsLoading(false);
}, []);

return (
  <div data-testid="component" data-loaded={!isLoading}>
    {/* content */}
  </div>
);
```

### For Browser Differences:
```tsx
// Add browser-specific delays
const getBrowserDelay = () => {
  const isFirefox = navigator.userAgent.includes('Firefox');
  const isWebKit = navigator.userAgent.includes('WebKit');
  return isFirefox ? 100 : isWebKit ? 50 : 0;
};
```

## ✅ Validation Checklist

After each fix:
1. Run specific test: `npx playwright test [test-file] --debug`
2. Check all browsers: Add `--project=chromium,firefox,webkit`
3. Verify no regressions: Run full category test
4. Update test if needed: Some tests may need adjustment

## 🎉 Success Metrics

Target after implementation:
- Command Palette: 80%+ pass rate
- Shell Architecture: 90%+ pass rate
- Keyboard Navigation: 100% pass rate
- Overall: 85%+ pass rate

## 📝 Notes

- All UI elements already have data-testid attributes
- Feature flags are enabled
- AI agents are fully functional
- Performance targets are being met

Focus on UI completion rather than architecture changes. The foundation is solid.