# Linear Calendar

A year-at-a-glance visual calendar tool that provides a linear representation of time for better planning, reflection, and collaboration.

## Overview

Linear Calendar transforms how you view and plan your year by presenting all 12 months in a single, continuous view. Unlike traditional calendars that fragment time into separate monthly views, Linear Calendar illuminates overlaps, timelines, and workload patterns at a glance.

## Key Features

### MVP (Current Focus)
- **Linear Year Grid**: Full-year visualization with all 12 months visible
- **Event Management**: Add, edit, and delete events with different types (Personal, Work, Efforts)
- **Smart Filtering**: Toggle between Personal-only, Work-only, Efforts-only, or combined views
- **Reflection Prompts**: Built-in questions to help you plan better
- **Data Persistence**: Local storage for your calendar data

### Coming Soon
- **Drag & Drop**: Easily reschedule events by dragging them
- **Overlap Detection**: Visual alerts for scheduling conflicts
- **Print Mode**: Generate printable calendars (8.5×11 or 11×17)
- **Integrations**: Obsidian plugin, Google Calendar sync, Notion integration
- **Team Collaboration**: Shared calendars with commenting

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with glass morphism design
- **Backend**: Convex for real-time data sync
- **Authentication**: Clerk for user management
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
├── app/                # Next.js app directory
├── components/         # React components
│   ├── calendar/      # Year grid and date components
│   ├── ui/           # UI components (glass morphism)
│   └── filters/      # Filtering controls
├── convex/           # Backend functions and schema
├── services/         # Data services and integrations
├── types/            # TypeScript type definitions
└── .taskmaster/      # Project management tasks
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