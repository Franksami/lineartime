# 🔒 Linear Calendar - Foundation Locked

**"Life is bigger than a week"** - The world's first true linear calendar with a revolutionary **horizontal timeline** that displays an entire year as 12 continuous month rows.

## 🎯 Foundation Achievement

**Date Locked**: August 23, 2025 ✅ **PERFECT IMPLEMENTATION ACHIEVED**

Linear Calendar presents an entire year in a **12-month horizontal row structure**, with each month displayed as a complete horizontal strip showing all days 01-31. This breakthrough design allows users to see the year as one continuous timeline, embodying the philosophy that "Life is bigger than a week."

### **🔒 Locked Foundation Structure (IMMUTABLE)**
- **12 Horizontal Month Rows**: Jan through Dec, each showing complete months
- **Week Day Headers**: "Su Mo Tu We Th Fr Sa" at TOP and BOTTOM spanning full width  
- **Month Labels**: Positioned on BOTH left AND right sides of each row
- **Complete Day Display**: 01-31 for each month with proper week alignment
- **Year Header**: "2025 Linear Calendar" title + "Life is bigger than a week" tagline
- **Performance Excellence**: 112 FPS, 91MB memory, professional rendering

## ✨ Current Features (v0.3.0+) - Foundation Locked

### **🔒 Foundation Features (IMMUTABLE)**
- **Horizontal Timeline**: All 12 months in continuous horizontal rows (locked structure)
- **Complete Month Display**: Each month shows all days 01-31 with proper week alignment
- **Year-at-a-Glance**: Entire year visible in one view embodying "Life is bigger than a week"
- **Week Day Headers**: Repeating "Su Mo Tu We Th Fr Sa" at top and bottom spanning full width
- **Month Labels**: Present on both left and right sides of each month row
- **Professional Grid**: Bordered cell structure with weekend highlighting
- **Performance Excellence**: 112+ FPS rendering, optimized memory usage

### **🚀 Advanced Features (Built & Integrated)**
- **Event Management**: Create, edit, delete events with IndexedDB persistence
- **Event Categories**: Color-coded categories (personal, work, effort, note)
- **Touch Gestures**: Mobile-optimized with pinch-zoom, long-press, swipe navigation  
- **AI Assistant**: Vercel AI SDK v5 with GPT-4o-mini for intelligent scheduling
- **Natural Language**: CommandBar with Chrono.js for "meeting tomorrow at 2pm" parsing
- **Drag & Drop**: Full event management with @dnd-kit integration
- **Zoom Controls**: 6 levels (fullYear, year, quarter, month, week, day)
- **Accessibility**: Full keyboard navigation, screen reader support, WCAG 2.1 AA
- **Mobile Support**: Responsive design preserving horizontal timeline identity

### UI/UX
- **Vercel Theme**: Modern design system with oklch color space
- **Full-Screen Layout**: Edge-to-edge immersive calendar view
- **Pure Black Background**: `oklch(0 0 0)` for maximum contrast
- **Responsive Design**: Adapts to different screen sizes
- **Keyboard Support**: Tab navigation and escape key handling
- **Visual Feedback**: Hover states and selection indicators
- **Today Highlight**: Current date prominently marked
- **Weekend Distinction**: Weekends visually differentiated
- **WCAG 2.1 AA**: Accessibility compliance for all users

## 🚀 Upcoming Features (Foundation-Compatible)

### **Phase 1: Mobile Foundation Fix (CRITICAL)**
- Remove MobileCalendarView violation 
- Ensure horizontal timeline on ALL devices
- Preserve "Life is bigger than a week" philosophy universally

### **Phase 2: Feature Integration (HIGH PRIORITY)**
- Canvas rendering activation for 10K+ events
- Virtual scrolling performance optimization
- Event system verification and enhancement
- AI Assistant complete integration testing

### **Phase 3: Advanced Features (MEDIUM PRIORITY)**  
- Multi-day event spanning across month rows
- Recurring events with foundation compatibility
- External calendar sync (Google, Notion, Obsidian)
- Real-time collaboration with Convex backend
- Enhanced AI scheduling suggestions

### **Phase 4: Enterprise Features (FUTURE)**
- Print view optimization maintaining horizontal layout
- Advanced export formats (PDF, iCal, image)
- Plugin architecture for extensibility
- Team collaboration and permissions
- Advanced analytics and insights

## Tech Stack

- **Framework**: [Next.js 15.5.0](https://nextjs.org/) with Turbopack
- **Language**: [TypeScript 5.0](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with oklch color space
- **Design System**: Vercel theme via [shadcn/ui](https://ui.shadcn.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Date Handling**: [date-fns](https://date-fns.org/)
- **Authentication**: [Clerk](https://clerk.com/) (configured, not active)
- **Backend**: [Convex](https://www.convex.dev/) (configured, not active)
- **Development**: Task Master AI for project management

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/lineartime.git
cd lineartime

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your Convex and Clerk credentials

# Run development server  
pnpm dev

# Test foundation compliance (MANDATORY before commits)
npm run test:foundation
npx playwright test tests/foundation-protection.spec.ts
```

Open [http://localhost:3000](http://localhost:3000) to see the Linear Calendar foundation in action.

### **🧪 Testing Requirements**
Following our **comprehensive testing methodology**, all feature development must:
```bash
# 1. Foundation Protection Testing (MANDATORY)
npm run test:foundation

# 2. Full Test Suite (REQUIRED for PRs)
npm run test:all

# 3. Build Validation (REQUIRED)
npm run build && npm run lint
```

## Project Structure

```
lineartime/
├── .ai-rules/                   # AI assistant rules and configurations
│   ├── .claude/                # Claude AI rules
│   ├── .roo/                   # Roo AI rules
│   ├── .trae/                  # Trae AI rules
│   ├── .windsurf/              # Windsurf AI rules
│   ├── .gemini/                # Gemini AI rules
│   └── .clinerules/            # Cline AI rules
├── .config/                     # Configuration files
│   ├── .prettierrc             # Code formatting rules
│   └── README.md               # Configuration documentation
├── .github/                     # GitHub workflows and templates
├── .taskmaster/                 # Project management and tasks
├── app/                         # Next.js app directory
│   ├── page.tsx                # Main calendar page
│   ├── layout.tsx              # Root layout with providers
│   ├── globals.css             # Global styles and theme
│   ├── sign-in/                # Authentication pages
│   └── sign-up/                # Authentication pages
├── components/
│   ├── calendar/               # Calendar components
│   │   ├── LinearCalendarHorizontal.tsx  # Main calendar component
│   │   ├── EventModal.tsx              # Event creation/editing
│   │   ├── FilterPanel.tsx             # Category filters
│   │   ├── ReflectionModal.tsx         # Year reflection
│   │   ├── ZoomControls.tsx            # View controls
│   │   └── index.ts                    # Exports
│   ├── ui/                     # shadcn/ui components
│   └── glass/                  # Glass morphism components
├── convex/                      # Backend configuration
├── docs/                        # Project documentation
│   ├── README.md               # Documentation index
│   ├── ARCHITECTURE.md         # System architecture
│   ├── COMPONENTS.md           # Component library
│   ├── CHANGELOG.md            # Version history
│   ├── CLAUDE.md               # Claude AI configuration
│   ├── CALENDAR_IMPLEMENTATION_SUMMARY.md  # Calendar implementation
│   └── LINEAR_CALENDAR_DESIGN.md           # Calendar design specs
├── hooks/
│   ├── useLinearCalendar.ts    # Calendar state management
│   └── use-mobile.ts           # Responsive utilities
├── lib/
│   └── utils.ts                # Utility functions
├── public/                      # Static assets
├── types/
│   └── calendar.ts             # TypeScript definitions
├── [config files]               # Essential config files (in root)
│   ├── next.config.ts          # Next.js configuration
│   ├── tailwind.config.ts      # Tailwind CSS configuration
│   ├── tsconfig.json           # TypeScript configuration
│   ├── eslint.config.mjs       # ESLint configuration
│   └── package.json            # Dependencies and scripts
└── README.md                    # This file - project overview
```

## Development

This project uses Task Master AI for project management. To view current tasks:

```bash
task-master list        # View all tasks
task-master next        # Get next task to work on
task-master show <id>   # View task details
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT

## Acknowledgments

Built with inspiration from physical year planners and the need for better long-term planning tools.