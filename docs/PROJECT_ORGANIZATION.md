# Project Organization Guide

This document explains the organization structure of the Linear Calendar project and how to navigate it effectively.

## 🏗️ Directory Structure Overview

### Root Level Organization

```
lineartime/
├── .ai-rules/          # AI assistant configurations
├── .config/            # Tool configurations
├── .github/            # GitHub workflows
├── .taskmaster/        # Project management
├── app/                # Next.js application
├── components/         # React components
├── convex/             # Backend functions
├── docs/               # Documentation
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── public/             # Static assets
├── types/              # TypeScript definitions
└── [config files]      # Essential configurations
```

## 📁 Directory Details

### `.ai-rules/` - AI Assistant Rules
**Purpose**: Centralized location for all AI coding assistant configurations
**Contains**:
- `.claude/` - Claude AI rules and commands
- `.roo/` - Roo AI assistant rules
- `.trae/` - Trae AI assistant rules
- `.windsurf/` - Windsurf AI assistant rules
- `.gemini/` - Google Gemini AI rules
- `.clinerules/` - Cline AI assistant rules

**When to use**: When configuring or updating AI assistant behavior

### `.config/` - Configuration Files
**Purpose**: Tool-specific configuration files
**Contains**:
- `.prettierrc` - Code formatting rules
- `README.md` - Configuration documentation

**Note**: Some config files remain in root for tool compatibility

### `.github/` - GitHub Configuration
**Purpose**: GitHub workflows, templates, and project configuration
**Contains**:
- Workflow definitions
- Issue templates
- Pull request templates
- Project instructions

### `.taskmaster/` - Project Management
**Purpose**: Task management and project planning
**Contains**:
- `tasks.json` - Task definitions
- Individual task files
- Project configuration
- Reports and analysis

### `app/` - Next.js Application
**Purpose**: Main application code (Next.js 15 App Router)
**Contains**:
- `page.tsx` - Main calendar page
- `layout.tsx` - Root layout with providers
- `globals.css` - Global styles and theme
- `sign-in/` - Authentication pages
- `sign-up/` - Authentication pages

### `components/` - React Components
**Purpose**: Reusable UI components
**Contains**:
- `calendar/` - Calendar-specific components
- `ui/` - shadcn/ui components
- `glass/` - Glass morphism components

### `convex/` - Backend Functions
**Purpose**: Backend configuration and functions
**Contains**:
- Database schema
- API functions
- Generated types

### `docs/` - Documentation
**Purpose**: All project documentation
**Contains**:
- `README.md` - Documentation index
- `ARCHITECTURE.md` - System architecture
- `COMPONENTS.md` - Component library
- `CHANGELOG.md` - Version history
- `CLAUDE.md` - Claude AI configuration
- Implementation guides

### `hooks/` - Custom React Hooks
**Purpose**: Reusable React logic
**Contains**:
- `useCommandCenterCalendar.ts` - Calendar state management
- `use-mobile.ts` - Responsive utilities

### `lib/` - Utility Functions
**Purpose**: Shared utility functions
**Contains**:
- `utils.ts` - Common utility functions

### `public/` - Static Assets
**Purpose**: Publicly accessible files
**Contains**:
- Images
- Icons
- Static files

### `types/` - TypeScript Definitions
**Purpose**: Type definitions and interfaces
**Contains**:
- `calendar.ts` - Calendar-related types

## 🔧 Configuration Files (Root Level)

Some configuration files must remain in the root directory for tool compatibility:

- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration
- `package.json` - Dependencies and scripts
- `postcss.config.mjs` - PostCSS configuration

## 📖 Navigation Tips

### For Developers
1. **Start with**: `README.md` for project overview
2. **Architecture**: `docs/ARCHITECTURE.md` for system design
3. **Components**: `docs/COMPONENTS.md` for UI reference
4. **Implementation**: Check specific guides in `docs/`

### For AI Assistants
1. **Rules**: Check `.ai-rules/` for your specific configuration
2. **Context**: Use `docs/` for comprehensive project understanding
3. **Tasks**: Check `.taskmaster/` for current work items

### For Contributors
1. **Setup**: Follow `README.md` installation steps
2. **Architecture**: Read `docs/ARCHITECTURE.md` first
3. **Components**: Reference `docs/COMPONENTS.md`
4. **Tasks**: Use Task Master for project management

## 🔄 Maintenance Guidelines

### Adding New Files
- **Components**: Place in appropriate `components/` subdirectory
- **Hooks**: Add to `hooks/` directory
- **Types**: Add to `types/` directory
- **Documentation**: Add to `docs/` directory
- **Configuration**: Add to `.config/` if tool-specific

### Updating Organization
- Keep related files together
- Use consistent naming conventions
- Update this guide when structure changes
- Maintain clear separation of concerns

### Best Practices
- Follow the established directory structure
- Use descriptive file and directory names
- Keep related functionality grouped together
- Maintain clear documentation for each directory
- Update navigation when adding new features

## 🚀 Quick Reference

| What you need | Where to look |
|---------------|---------------|
| Project overview | `README.md` |
| System architecture | `docs/ARCHITECTURE.md` |
| Component library | `docs/COMPONENTS.md` |
| API functions | `convex/` |
| UI components | `components/` |
| Custom hooks | `hooks/` |
| Type definitions | `types/` |
| Project tasks | `.taskmaster/` |
| AI assistant rules | `.ai-rules/` |
| Tool configuration | `.config/` |
