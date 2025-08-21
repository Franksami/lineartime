# Linear Calendar

A minimalist year-at-a-glance calendar application with a unique vertical layout, designed for comprehensive time visualization and event management.

## Overview

Linear Calendar presents an entire year in a single vertical view, with each month displayed as a row of 42 days (6 weeks × 7 days). This unique perspective allows for better long-term planning and pattern recognition across months and seasons.

## ✨ Current Features (v0.2.0)

### Core Functionality
- **Vertical Year View**: All 12 months visible simultaneously in a vertical layout
- **Event Management**: Create, edit, and delete events with intuitive modals
- **Event Categories**: 
  - 🟢 Personal (green)
  - 🔵 Work (blue)
  - 🟠 Effort (orange)
  - 🟣 Note (purple)
- **Smart Filtering**: Toggle visibility of different event categories
- **Dark Theme**: Elegant dark mode with glass morphism effects
- **Local Storage**: Events persist locally in your browser
- **Zoom Controls**: Adjust calendar density (compact/standard/expanded)
- **Year Navigation**: Easy switching between years (1900-2100)
- **Reflection Modal**: End-of-year reflection prompts

### UI/UX
- **Responsive Design**: Adapts to different screen sizes
- **Keyboard Support**: Tab navigation and escape key handling
- **Visual Feedback**: Hover states and selection indicators
- **Today Highlight**: Current date prominently marked
- **Weekend Distinction**: Weekends visually differentiated

## 🚀 Planned Features

- Multi-day event spans
- Recurring events
- Event import/export (iCal format)
- Cloud sync with Convex backend
- Drag & drop event rescheduling
- Event search and filtering by text
- Custom event categories
- Time-based events (not just all-day)
- Print view optimization
- Mobile app version

## Tech Stack

- **Framework**: [Next.js 15.5.0](https://nextjs.org/) with Turbopack
- **Language**: [TypeScript 5.0](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with OKLCH color space
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
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
lineartime/
├── app/                          # Next.js app directory
│   ├── page.tsx                 # Main calendar page
│   ├── layout.tsx              # Root layout with providers
│   ├── globals.css             # Global styles and theme
│   ├── sign-in/               # Authentication pages
│   └── sign-up/              # Authentication pages
├── components/
│   ├── calendar/              # Calendar components
│   │   ├── LinearCalendarVertical.tsx  # Main calendar component
│   │   ├── EventModal.tsx              # Event creation/editing
│   │   ├── FilterPanel.tsx             # Category filters
│   │   ├── ReflectionModal.tsx         # Year reflection
│   │   ├── ZoomControls.tsx            # View controls
│   │   └── index.ts                    # Exports
│   ├── ui/                    # shadcn/ui components
│   └── glass/                # Glass morphism components
├── hooks/
│   ├── useLinearCalendar.ts  # Calendar state management
│   └── use-mobile.ts         # Responsive utilities
├── types/
│   └── calendar.ts           # TypeScript definitions
├── lib/
│   └── utils.ts             # Utility functions
├── convex/                  # Backend configuration
└── .taskmaster/            # Project management
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