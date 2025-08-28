# LinearTime Command Workspace Implementation PRD

**Version**: v3.0.0 (Comprehensive Implementation Guide)  
**Owner**: Full-Stack Platform Team  
**Status**: Research-validated, ready for implementation  
**Timeline**: 22-26 days (6 phases)  
**Updated**: August 28, 2025

---

## 🎯 **EXECUTIVE SUMMARY**

Transform LinearTime from calendar-centric to **Command Workspace architecture** using research-validated patterns from 7+ industry tools. Preserve all 133,222+ lines of enterprise infrastructure while implementing three-pane shell (Sidebar + Tabs + Context Dock) with command-first experience, AI constraint solving, and privacy-first computer vision.

**Success Metrics**: <500ms shell render, <120ms keyboard response, >60% command adoption, 100% feature preservation

---

## 📊 **PROJECT SCOPE & STRATEGIC POSITIONING**

### **🎯 Unique Selling Proposition (USP)**
> *"The only productivity platform combining research-validated command-first navigation with AI constraint solving and privacy-first computer vision for complex professional workflows"*

**Key Differentiators**:
1. **Research-Validated Architecture**: Command workspace patterns proven by Obsidian, Schedule X, Timefold AI, Rasa
2. **AI Constraint Optimization**: Real-time scheduling conflict resolution with apply/undo patterns (unique in productivity market)
3. **Privacy-First Computer Vision**: 100% local processing with consent management (major competitive advantage vs. cloud-based tools)
4. **Enterprise-Ready Foundation**: 133,222+ lines of proven calendar integration with AES-256-GCM encryption

### **🧑‍💼 Ideal Customer Profile & Agent Learning Strategy**

**PRIMARY ICP**: **Elite Knowledge Workers** ($100K+ income, complex coordination needs)

**Target Segments**:

**Executive Leaders** (Primary Focus)
- **Profile**: C-suite, VPs managing 10+ reports, complex stakeholder relationships  
- **Pain Points**: Meeting conflicts, strategic planning, resource allocation across teams
- **Agent Learning**: Executive decision patterns, high-stakes meeting optimization, strategic time blocking
- **Deep Learning Focus**: Constraint solving for executive calendars, stakeholder relationship optimization

**Professional Service Providers** (Secondary)
- **Profile**: Consultants, lawyers, accountants ($200+ hourly) with client coordination complexity
- **Pain Points**: Client scheduling, project milestones, billing optimization, compliance deadlines  
- **Agent Learning**: Client interaction patterns, project timeline optimization, billing efficiency
- **Deep Learning Focus**: Client preference modeling, project pattern recognition, deadline optimization

**Creative & Technical Leaders** (Tertiary)
- **Profile**: Agency owners, CTOs, lead designers managing creative/technical teams
- **Pain Points**: Project coordination, creative review cycles, technical planning, team capacity
- **Agent Learning**: Creative workflow patterns, technical planning optimization, team coordination
- **Deep Learning Focus**: Creative process optimization, technical constraint solving, team performance patterns

---

## 🛠️ **OPTIMAL TECHNOLOGY STACK (RESEARCH-VALIDATED)**

### **Core Architecture Libraries**
- **React Resizable Panels** (Trust: 10.0) - Three-pane layout with keyboard/touch support
- **Fuzzysort** (Trust: 9.2) - SublimeText-like fuzzy search for command palette  
- **Zustand** (Trust: 9.6) - Lightweight state management for workspace complexity
- **Geist Font Family** (Trust: 10.0) - Vercel's official typography system

### **AI Integration Stack**  
- **Vercel AI SDK** (Trust: 10.0) - Already integrated, streaming + tool calls
- **AI Elements** (Trust: 10.0) - shadcn/ui-based AI components for consistent design
- **Streamdown** (Trust: 10.0) - AI streaming markdown handling for conversations

### **Developer Experience**
- **Storybook** (Trust: 8.8) - Component development and documentation
- **Webpack Bundle Analyzer** (Trust: 9.4) - Bundle optimization and monitoring
- **Rsdoctor** (Trust: 9.0) - Build performance analysis and optimization

### **Testing & Quality**
- **Playwright** (Trust: 9.9) - Already integrated, comprehensive E2E testing
- **Testing Library** (Research validated) - Component testing with user-centric patterns

---

## 🏗️ **6-PHASE IMPLEMENTATION ROADMAP**

### **PHASE 0: Foundation Setup & Safety** ⏱️ 1-2 days

```ascii
┌─────────────────────────────────────────────────────────┐
│                    SAFETY FOUNDATION                    │
├─────────────────────────────────────────────────────────┤
│  Feature Flags    │  Governance     │  Rollback System  │
│  ┌─────────────┐  │  ┌──────────────┐ │  ┌─────────────┐ │
│  │shell.enabled│  │  │ESLint Rules  │ │  │Legacy Routes│ │
│  │views.week   │  │  │Dep-Cruiser   │ │  │Backup State │ │
│  │dock.ai      │  │  │CI Guards     │ │  │Quick Disable│ │
│  └─────────────┘  │  └──────────────┘ │  └─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Technical Implementation Steps**:

1. **Feature Flag System**:
```bash
npm install @vercel/flags
```
```typescript
// lib/features/flags.ts
export const FEATURE_FLAGS = {
  SHELL_COMMAND_WORKSPACE: 'shell.commandWorkspace',
  VIEWS_WEEK: 'views.week', 
  VIEWS_PLANNER: 'views.planner',
  DOCK_AI: 'dock.ai',
  DOCK_DETAILS: 'dock.details',
  OMNIBOX_ENABLED: 'omnibox.enabled',
  CV_ENABLED: 'cv.enabled'
} as const
```

2. **Governance Automation**:
```bash
npm install -D eslint-plugin-import dependency-cruiser
```
```json
// .eslintrc.json (governance rules)
{
  "rules": {
    "no-restricted-imports": [
      "error", {
        "paths": [{
          "name": "@/components/calendar/LinearCalendarHorizontal",
          "message": "Use only inside views/year-lens/* as optional lens"
        }]
      }
    ]
  }
}
```

3. **Rollback Infrastructure**:
```typescript
// lib/migration/rollback.ts
export const emergencyRollback = async () => {
  await disableAllFlags()
  await redirectToLegacy()
  await validateLegacyFunctionality()
}
```

**Exit Criteria**:
- [ ] Feature flags functional with instant disable capability
- [ ] ESLint/dependency-cruiser rules enforced in CI
- [ ] Emergency rollback procedures validated
- [ ] Performance baseline established

---

### **PHASE 1: Shell Architecture** ⏱️ 3-4 days

```ascii
┌────────────────────────────────────────────────────────────────────────────┐
│                           COMMAND WORKSPACE SHELL                         │
├─────────────────┬──────────────────────────────┬─────────────────────────┤
│   SIDEBAR       │        TAB WORKSPACE         │     CONTEXT DOCK        │
│  ┌─────────────┐│ ┌─────────┬─────────┬──────┐ │ ┌─────────────────────┐ │
│  │Calendar     ││ │  Week   │Planner  │Notes │ │ │ AI Assistant        │ │
│  │Tasks        ││ │ (active)│         │      │ │ │ Details/Props       │ │
│  │Notes        ││ │         │         │      │ │ │ Conflicts           │ │
│  │Mailbox      ││ │ ViewScaffold:          │ │ │ Capacity            │ │
│  │Automations  ││ │ Header + Content       │ │ │ Backlinks           │ │
│  └─────────────┘│ └────────────────────────┘ │ └─────────────────────┘ │
└─────────────────┴──────────────────────────────┴─────────────────────────┘
│                            COMMAND PLANE                                  │
│  ⌘/Ctrl-K Palette              │              NL→Actions Omnibox         │
└────────────────────────────────────────────────────────────────────────────┘
```

**Technical Implementation**:

1. **Install Core Dependencies**:
```bash
npm install react-resizable-panels zustand
npm install geist  # Vercel typography
```

2. **AppShell Implementation**:
```typescript
// components/shell/AppShell.tsx
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"
import { GeistSans } from "geist/font/sans"

export const AppShell = () => {
  return (
    <div className={`${GeistSans.className} h-screen w-screen`}>
      <PanelGroup direction="horizontal">
        <Panel defaultSize={20} minSize={15} maxSize={30}>
          <Sidebar />
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={60} minSize={40}>
          <TabWorkspace />
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={20} minSize={15} maxSize={35}>
          <ContextDock />
        </Panel>
      </PanelGroup>
    </div>
  )
}
```

3. **State Management with Zustand**:
```typescript
// contexts/AppShellProvider.tsx
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppShellState {
  activeView: string
  dockPanels: string[]
  layouts: Record<string, any>
  setActiveView: (view: string) => void
  toggleDockPanel: (panel: string) => void
  saveLayout: (name: string, layout: any) => void
}

export const useAppShell = create<AppShellState>()(
  persist(
    (set, get) => ({
      activeView: 'week',
      dockPanels: ['ai'],
      layouts: {},
      setActiveView: (view) => set({ activeView: view }),
      toggleDockPanel: (panel) => set((state) => ({
        dockPanels: state.dockPanels.includes(panel)
          ? state.dockPanels.filter(p => p !== panel)
          : [...state.dockPanels, panel]
      })),
      saveLayout: (name, layout) => set((state) => ({
        layouts: { ...state.layouts, [name]: layout }
      }))
    }),
    { name: 'workspace-storage' }
  )
)
```

**Exit Criteria**:
- [ ] Three-pane shell renders without errors
- [ ] Panel resizing works smoothly with persistence
- [ ] Tab navigation functional with state management
- [ ] Sidebar sections render with proper theming

---

### **PHASE 2: Command System** ⏱️ 2-3 days

```ascii
┌────────────────────────────────────────────────────────────────────────────┐
│                           COMMAND SYSTEM ARCHITECTURE                      │
├────────────────────────────────────────────────────────────────────────────┤
│  ⌘/Ctrl-K Command Palette        │        NL→Actions Omnibox              │
│  ┌──────────────────────────┐    │    ┌──────────────────────────────┐    │
│  │ > create event           │    │    │ "meet Dan Tue 3pm 45m"       │    │
│  │   Create Event          │    │    │  └─> Intent: create_event    │    │
│  │   Create Task           │    │    │  └─> Confidence: 0.92        │    │    │
│  │   Create Note           │    │    │  └─> Auto-execute ✓         │    │
│  │ > navigate week         │    │    └──────────────────────────────────┘    │
│  │   Navigate to Week      │    │                                           │
│  │   Navigate to Planner   │    │    ┌──────────────────────────────────┐    │
│  │   Toggle AI Panel       │    │    │ Intent Classification Pipeline   │    │
│  └──────────────────────────┘    │    │ Confidence Threshold: ≥0.8      │    │
│                                  │    │ Tool Safety: Auto-approval lists │    │
│  Keyboard Manager (Schedule X):  │    │ Streaming: Vercel AI SDK        │    │
│  • Ctrl+P/Cmd+P: Palette        │    └──────────────────────────────────┘    │
│  • Arrows: Navigate             │                                           │
│  • Enter: Select/Execute        │                                           │
│  • Escape: Close/Cancel         │                                           │
└────────────────────────────────────────────────────────────────────────────┘
```

**Implementation Steps**:

1. **Install Command Dependencies**:
```bash
npm install fuzzysort react-hotkeys-hook
```

2. **Command Palette with Fuzzy Search**:
```typescript
// components/commands/CommandPalette.tsx
import { useHotkeys } from 'react-hotkeys-hook'
import fuzzysort from 'fuzzysort'

export const CommandPalette = () => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  
  useHotkeys('meta+k,ctrl+k', () => setOpen(true))
  useHotkeys('escape', () => setOpen(false))
  
  const results = useMemo(() => 
    fuzzysort.go(search, commands, { 
      key: 'title',
      limit: 10,
      threshold: -10000 
    }), [search, commands])
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput 
          placeholder="Type a command or search..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {results.map((result) => (
            <CommandItem 
              key={result.obj.id}
              onSelect={() => executeCommand(result.obj)}
            >
              {result.obj.title}
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </Dialog>
  )
}
```

3. **Omnibox with Vercel AI SDK**:
```typescript
// components/commands/OmniboxProvider.tsx
import { useCompletion } from 'ai/react'

export const OmniboxProvider = () => {
  const { completion, input, handleSubmit, isLoading } = useCompletion({
    api: '/api/omnibox',
    onFinish: (result) => {
      const parsed = JSON.parse(result)
      if (parsed.confidence >= 0.8) {
        executeAction(parsed.action)
      } else {
        showConfirmation(parsed.suggestions)
      }
    }
  })
  
  return (
    <form onSubmit={handleSubmit}>
      <Input 
        value={input}
        onChange={handleInputChange}
        placeholder="Type natural language commands..."
        className="font-mono text-sm"
      />
    </form>
  )
}
```

**Exit Criteria**:
- [ ] Command palette opens with Ctrl+P/Cmd+P
- [ ] Fuzzy search working with <100ms response  
- [ ] Omnibox parsing natural language with streaming
- [ ] Keyboard navigation fully functional

---

## 🎨 **DESIGN SYSTEM INTEGRATION**

### **Vercel Typography System**
```typescript
// app/layout.tsx
import { GeistSans } from 'geist/font/sans' 
import { GeistMono } from 'geist/font/mono'

export default function RootLayout({ children }) {
  return (
    <html className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
```

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui'],
        mono: ['var(--font-geist-mono)', 'Fira Code', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            fontFamily: 'var(--font-geist-sans)',
            color: 'hsl(var(--foreground))',
          }
        }
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
```

### **Global CSS Integration**
```css
/* app/globals.css */
@import 'geist/font/sans';
@import 'geist/font/mono';

:root {
  --font-geist-sans: var(--geist-sans);
  --font-geist-mono: var(--geist-mono);
}

.command-workspace {
  font-family: var(--font-geist-sans);
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
}

.command-palette {
  font-family: var(--font-geist-mono);
  font-size: 0.875rem;
  line-height: 1.25rem;
}
```

---

## 📋 **DETAILED PHASE BREAKDOWN**

### **PHASE 3: Views Implementation** ⏱️ 4-5 days

**Primary Views to Implement**:

1. **WeekView** (Primary focus):
```typescript
// views/week/WeekView.tsx
import { useCalendarEvents } from '@/hooks/useCalendarEvents' // Preserve backend

export const WeekView = () => {
  const { events } = useCalendarEvents() // Backend integration preserved
  const { keyboard } = useKeyboardNavigation() // Schedule X patterns
  
  return (
    <ViewScaffold
      header={<WeekViewHeader />}
      content={<WeekGrid events={events} onDoubleClick={handleCreateEvent} />}
      contextPanels={['conflicts', 'capacity']}
    />
  )
}
```

2. **PlannerView** (Kanban + time-blocking):
```typescript
// views/planner/PlannerView.tsx  
import { DragDropContext } from '@hello-pangea/dnd'

export const PlannerView = () => {
  return (
    <ViewScaffold
      header={<PlannerViewHeader />}
      content={
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-3 gap-4">
            <TaskColumn title="TODO" />
            <TaskColumn title="IN PROGRESS" />  
            <TaskColumn title="DONE" />
          </div>
        </DragDropContext>
      }
      contextPanels={['ai', 'details']}
    />
  )
}
```

**Exit Criteria**:
- [ ] WeekView displays calendar events with keyboard navigation
- [ ] PlannerView supports drag & drop task management
- [ ] View scaffold contract implemented consistently
- [ ] Context panels integrate with each view

---

### **PHASE 4: AI Integration** ⏱️ 5-6 days

```ascii
┌────────────────────────────────────────────────────────────────────────────┐
│                              AI AGENT SYSTEM                               │
├────────────────────────────────────────────────────────────────────────────┤
│  CONTEXT DOCK AI AGENTS              │           MCP TOOL SYSTEM           │
│  ┌─────────────────────────────┐     │     ┌─────────────────────────────┐ │
│  │ 🤖 Planner Agent           │     │     │ calendar.resolveConflicts   │ │
│  │ • Constraint optimization  │     │     │ tasks.autoSchedule          │ │
│  │ • Timefold AI patterns     │ ────┼──── │ mail.convertToTask          │ │
│  │ • Apply/undo with preview  │     │     │ notes.summarize             │ │
│  └─────────────────────────────┘     │     │ automations.run             │ │
│                                      │     └─────────────────────────────┘ │
│  ┌─────────────────────────────┐     │                                     │
│  │ ⚠️ Conflict Agent           │     │     ┌─────────────────────────────┐ │
│  │ • Real-time detection      │     │     │ Tool Safety & Permissions   │ │
│  │ • forEachUniquePair analysis│ ────┼──── │ • Auto-approval lists       │ │
│  │ • Justification system     │     │     │ • Scoped permissions        │ │
│  └─────────────────────────────┘     │     │ • Audit logging             │ │
│                                      │     └─────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

**AI Agent Implementation**:

1. **Planner Agent** (Constraint-based scheduling):
```typescript
// lib/ai/agents/PlannerAgent.tsx
export class PlannerAgent {
  async optimizeSchedule(events: Event[], constraints: Constraint[]) {
    // Timefold AI patterns implementation
    const conflicts = this.detectConflicts(events)
    const solutions = await this.generateSolutions(conflicts, constraints)
    
    return {
      conflicts,
      solutions: solutions.map(s => ({
        ...s,
        preview: this.generatePreview(s),
        justification: this.explainSolution(s)
      }))
    }
  }
  
  private detectConflicts(events: Event[]) {
    // forEachUniquePair pattern from Timefold research
    return events.flatMap((e1, i) => 
      events.slice(i + 1).filter(e2 => 
        this.overlaps(e1, e2) && this.sameResource(e1, e2)
      ).map(e2 => ({ event1: e1, event2: e2, type: 'overlap' }))
    )
  }
}
```

2. **Conversation Context** (Rasa patterns):
```typescript
// lib/ai/context/ConversationContext.tsx
export const useConversationContext = create<ConversationState>()(
  persist(
    (set, get) => ({
      history: [],
      slots: {},
      intent: null,
      confidence: 0,
      
      addMessage: (message) => set((state) => ({
        history: [...state.history.slice(-10), message] // max_history pattern
      })),
      
      setIntent: (intent, confidence) => set({
        intent,
        confidence,
        autoExecute: confidence >= 0.8 // Rasa confidence threshold
      })
    }),
    { name: 'conversation-storage' }
  )
)
```

**Exit Criteria**:
- [ ] AI agents provide contextual suggestions <2s
- [ ] Conflict detection working with real-time analysis
- [ ] Tool safety system with auto-approval lists
- [ ] Conversation context maintains multi-turn state

---

## 🔒 **SAFETY & MIGRATION STRATEGY**

### **Zero-Downtime Migration Approach**
```ascii
┌────────────────────────────────────────────────────────────────────────────┐
│                           MIGRATION SAFETY STRATEGY                        │
├────────────────────────────────────────────────────────────────────────────┤
│  EXISTING SYSTEM (Preserved)     │         NEW SYSTEM (Parallel)           │
│  ┌─────────────────────────┐     │     ┌─────────────────────────────┐     │
│  │ Calendar Foundation     │     │     │ Command Workspace Shell     │     │
│  │ • LinearCalendarHoriz   │ ────┼──── │ • Three-pane layout        │     │
│  │ • All existing routes   │     │     │ • Feature flag controlled   │     │
│  │ • Backend preserved     │     │     │ • Gradual rollout          │     │
│  └─────────────────────────┘     │     └─────────────────────────────┘     │
│                                  │                                        │
│  Backend Infrastructure          │         Feature Flag Control           │
│  ┌─────────────────────────┐     │     ┌─────────────────────────────┐     │
│  │ • Convex + Clerk        │     │     │ • Instant disable          │     │
│  │ • 4 Calendar providers │ ────┼──── │ • Component-level flags     │     │
│  │ • Stripe billing       │     │     │ • Emergency rollback       │     │
│  │ • Security & encryption │     │     │ • Performance monitoring   │     │
│  └─────────────────────────┘     │     └─────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────────────┘
```

### **Rollback Procedures**
```bash
# Emergency Commands (add to package.json scripts)
npm run emergency:disable-shell     # Instant rollback to calendar
npm run emergency:revert-all       # Complete system restore
npm run validate:legacy            # Verify legacy functionality
npm run monitor:performance        # Real-time performance tracking
```

---

## 🧪 **COMPREHENSIVE TESTING STRATEGY**

### **Test Architecture by Phase**:
```typescript
tests/
├── command-workspace/          # Phase 1-2 shell integration
│   ├── shell-rendering.spec.ts      # <500ms render validation
│   ├── panel-resizing.spec.ts       # react-resizable-panels testing
│   ├── state-persistence.spec.ts    # Zustand state management
│   └── command-navigation.spec.ts   # Keyboard shortcuts validation
├── keyboard-navigation/        # Schedule X pattern validation  
│   ├── command-palette.spec.ts      # Ctrl+P/Cmd+P <100ms response
│   ├── double-click-events.spec.ts  # <120ms event creation
│   ├── escape-handling.spec.ts      # Consistent escape behavior
│   └── focus-management.spec.ts     # Automatic modal focus
├── ai-agents/                 # Rasa + Timefold pattern validation
│   ├── conversation-context.spec.ts # Multi-turn conversation state
│   ├── constraint-solving.spec.ts   # Real-time conflict detection
│   ├── intent-classification.spec.ts# Confidence threshold routing
│   └── tool-safety.spec.ts          # Permission and audit systems
└── performance/               # Research-validated benchmarks
    ├── bundle-size.spec.ts          # <150KB shell, <100KB views
    ├── render-performance.spec.ts   # 60fps animations, <500ms loads
    └── accessibility.spec.ts        # WCAG 2.1 AA compliance
```

---

## 📈 **SUCCESS METRICS & VALIDATION**

### **Technical KPIs** (Research-Validated)
- **Shell Performance**: <500ms initial render (industry standard)
- **Keyboard Response**: <120ms double-click creation (Schedule X pattern)
- **Conflict Detection**: ≤500ms real-time analysis (Timefold AI pattern)
- **Command Adoption**: >60% users using palette within first week
- **Bundle Compliance**: Shell <150KB, Views <100KB, Panels <50KB

### **User Experience KPIs**
- **Feature Adoption**: >75% users engaging with new Command Workspace
- **User Satisfaction**: >4.5/5.0 with command-first interface
- **Productivity Gain**: >25% improvement in task completion time
- **Support Reduction**: >30% fewer support tickets due to improved UX

### **Agent Learning KPIs** (ICP-Focused)
- **Executive Optimization**: >40% meeting conflict reduction for C-level users
- **Professional Service**: >30% client scheduling efficiency improvement  
- **Technical Leadership**: >35% team coordination optimization

---

## 🚀 **CI/CD PIPELINE DESIGN**

### **GitHub Actions Workflow**:
```yaml
# .github/workflows/command-workspace.yml
name: Command Workspace CI/CD
on: [push, pull_request]

jobs:
  governance-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: ESLint Governance Check
        run: npm run lint:governance
      - name: Dependency Cruiser Validation  
        run: npm run validate:dependencies
      - name: Bundle Size Analysis
        run: npm run analyze:bundle
        
  testing-suite:
    runs-on: ubuntu-latest
    steps:
      - name: Command Workspace Tests
        run: npm run test:shell
      - name: Keyboard Navigation Tests  
        run: npm run test:keyboard
      - name: Performance Validation
        run: npm run test:performance
      - name: Accessibility Validation
        run: npm run test:a11y
        
  vercel-deployment:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 📚 **DEVELOPER EXPERIENCE OPTIMIZATION**

### **Cursor IDE Configuration**:
```json
// .cursor-rules (to be created)
{
  "rules": {
    "architecture": "Command Workspace three-pane shell only",
    "imports": "BANNED: LinearCalendarHorizontal outside views/year-lens/",
    "state": "Use Zustand for workspace state, React context for component state",
    "styling": "Geist fonts + shadcn/ui tokens, no hardcoded colors",
    "testing": "Playwright E2E + Testing Library components",
    "ai": "Vercel AI SDK for streaming, Context7 for research",
    "performance": "Bundle budgets enforced, 60fps required"
  },
  "patterns": {
    "command_creation": "Use CommandRegistry for new commands",
    "view_creation": "Implement ViewScaffold contract",
    "panel_creation": "Register with ContextDock system", 
    "ai_integration": "Use established agent patterns"
  }
}
```

### **Storybook Integration**:
```bash
npm install -D @storybook/nextjs @storybook/addon-essentials
```
```typescript
// .storybook/main.ts
export default {
  stories: [
    '../components/shell/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../components/commands/**/*.stories.@(js|jsx|ts|tsx|mdx)', 
    '../components/dock/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../views/**/*.stories.@(js|jsx|ts|tsx|mdx)'
  ],
  addons: ['@storybook/addon-essentials'],
  framework: '@storybook/nextjs'
}
```

---

## ⚠️ **RISK MITIGATION MATRIX**

| Risk Category | Probability | Impact | Mitigation Strategy |
|---------------|-------------|---------|-------------------|
| **Feature Regression** | Medium | High | Feature flags + comprehensive testing |
| **Performance Degradation** | Low | Medium | Bundle analysis + performance monitoring |
| **User Experience Confusion** | Medium | Medium | Progressive rollout + in-app guidance |
| **Development Complexity** | Medium | Low | Research-validated patterns + documentation |
| **Security Vulnerabilities** | Low | High | Preserved enterprise security + audit logs |

---

## 🎯 **IMPLEMENTATION TIMELINE**

**Total Duration**: 22-26 days
- **Phase 0**: Foundation & Safety (1-2 days)
- **Phase 1**: Shell Architecture (3-4 days)  
- **Phase 2**: Command System (2-3 days)
- **Phase 3**: Views Implementation (4-5 days)
- **Phase 4**: AI Integration (5-6 days)
- **Phase 5**: Advanced Features (4-5 days)
- **Phase 6**: Performance & Polish (3-4 days)

**Milestone Gates**:
- Phase 0: Safety systems validated, rollback confirmed
- Phase 1: Shell renders, panels resize, basic navigation works
- Phase 2: Command palette functional, keyboard shortcuts working  
- Phase 3: Primary views operational with view scaffold
- Phase 4: AI agents providing suggestions, tool safety functional
- Phase 5: Advanced features integrated, computer vision working
- Phase 6: Performance targets met, mobile optimized, deployed

---

## 🔧 **DEVELOPMENT WORKFLOW**

### **Daily Development Cycle**:
1. **Morning**: Run governance validation (`npm run validate:all`)
2. **Development**: Feature implementation with Storybook documentation
3. **Testing**: Component tests + E2E validation for each change
4. **Integration**: Feature flag testing + performance monitoring
5. **Evening**: Bundle analysis + performance regression check

### **Quality Gates**:
- **Code**: ESLint governance + TypeScript strict mode
- **Testing**: >90% test coverage for new components
- **Performance**: Bundle budgets + rendering benchmarks
- **Documentation**: Storybook stories for all components
- **Security**: No hardcoded secrets, audit log compliance

This comprehensive plan provides **research-validated, safety-first transformation** with optimal library selection, comprehensive testing, and clear success metrics for the Command Workspace architecture implementation.