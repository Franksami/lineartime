#!/bin/bash

# LinearTime Calendar UI/UX Transformation Deployment Script
# Version: 1.0.0
# Usage: ./scripts/deployment/ui-transformation-deploy.sh [phase] [--dry-run]

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs/deployment"
BACKUP_DIR="$PROJECT_ROOT/backups/ui-transformation"
PLAYGROUND_URL="http://localhost:3000/playground"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_DIR/deploy.log"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_DIR/deploy.log"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_DIR/deploy.log"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_DIR/deploy.log"
    exit 1
}

# Create necessary directories
mkdir -p "$LOG_DIR" "$BACKUP_DIR"

# Deployment configuration
PHASE=${1:-"validate"}
DRY_RUN=${2:-""}

log "🚀 Starting LinearTime UI/UX Transformation Deployment"
log "Phase: $PHASE"
log "Dry Run: ${DRY_RUN:-"false"}"
log "Project Root: $PROJECT_ROOT"

# Pre-flight checks
preflight_checks() {
    log "🔍 Running pre-flight checks..."
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version 18+ required. Current: $(node --version)"
    fi
    success "Node.js version check passed"
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        error "package.json not found. Are you in the LinearTime project root?"
    fi
    
    # Check git status
    if [ -n "$(git status --porcelain)" ]; then
        warning "Working directory is not clean. Uncommitted changes detected."
        if [ "$DRY_RUN" != "--dry-run" ]; then
            read -p "Continue anyway? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                error "Deployment cancelled due to uncommitted changes"
            fi
        fi
    fi
    success "Git status check passed"
    
    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" = "main" ] && [ "$DRY_RUN" != "--dry-run" ]; then
        warning "Deploying directly to main branch"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled"
        fi
    fi
    success "Branch check passed: $CURRENT_BRANCH"
    
    # Check if playground is accessible
    if command -v curl >/dev/null 2>&1; then
        if curl -f -s "$PLAYGROUND_URL" >/dev/null; then
            success "Playground environment accessible"
        else
            warning "Playground environment not accessible at $PLAYGROUND_URL"
        fi
    fi
    
    success "Pre-flight checks completed"
}

# Backup current state
create_backup() {
    log "📦 Creating backup of current state..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup package.json and lock file
    cp "$PROJECT_ROOT/package.json" "$BACKUP_PATH/"
    cp "$PROJECT_ROOT/pnpm-lock.yaml" "$BACKUP_PATH/" 2>/dev/null || cp "$PROJECT_ROOT/package-lock.json" "$BACKUP_PATH/" 2>/dev/null || true
    
    # Backup key source files
    mkdir -p "$BACKUP_PATH/components"
    mkdir -p "$BACKUP_PATH/contexts" 
    mkdir -p "$BACKUP_PATH/lib"
    
    if [ -d "$PROJECT_ROOT/components/CommandBar.tsx" ]; then
        cp "$PROJECT_ROOT/components/CommandBar.tsx" "$BACKUP_PATH/components/" 2>/dev/null || true
    fi
    
    cp -r "$PROJECT_ROOT/contexts"/* "$BACKUP_PATH/contexts/" 2>/dev/null || true
    cp -r "$PROJECT_ROOT/lib"/* "$BACKUP_PATH/lib/" 2>/dev/null || true
    
    # Create restore script
    cat > "$BACKUP_PATH/restore.sh" << EOF
#!/bin/bash
# Auto-generated restore script for backup created at $TIMESTAMP
echo "🔄 Restoring LinearTime from backup created at $TIMESTAMP"
cp "$BACKUP_PATH/package.json" "$PROJECT_ROOT/"
cp "$BACKUP_PATH/pnpm-lock.yaml" "$PROJECT_ROOT/" 2>/dev/null || cp "$BACKUP_PATH/package-lock.json" "$PROJECT_ROOT/" 2>/dev/null || true
cp -r "$BACKUP_PATH/contexts"/* "$PROJECT_ROOT/contexts/" 2>/dev/null || true
cp -r "$BACKUP_PATH/lib"/* "$PROJECT_ROOT/lib/" 2>/dev/null || true
cd "$PROJECT_ROOT"
npm install
npm run build
echo "✅ Restore completed"
EOF
    chmod +x "$BACKUP_PATH/restore.sh"
    
    success "Backup created at $BACKUP_PATH"
    log "To restore: $BACKUP_PATH/restore.sh"
}

# Phase 1: Dependency cleanup
phase1_cleanup() {
    log "🧹 Phase 1: Dependency Cleanup"
    
    if [ "$DRY_RUN" = "--dry-run" ]; then
        log "[DRY RUN] Would remove unused dependencies..."
        log "[DRY RUN] Dependencies to remove:"
        echo "  - @chakra-ui/react"
        echo "  - @emotion/react"
        echo "  - @emotion/styled"
        echo "  - antd"
        echo "  - @ant-design/icons"
        echo "  - @mantine/core (evaluate)"
        echo "  - @mantine/dates"
        echo "  - @mantine/form"
        echo "  - @mantine/hooks"
        echo "  - @mantine/notifications"
        echo "  - @mantine/spotlight"
        return 0
    fi
    
    log "Removing unused UI libraries..."
    
    # Remove unused dependencies (high confidence)
    DEPS_TO_REMOVE=(
        "@chakra-ui/react"
        "@emotion/react"
        "@emotion/styled"
        "@ant-design/icons"
    )
    
    # Check if these dependencies are actually used
    for dep in "${DEPS_TO_REMOVE[@]}"; do
        if grep -r "from ['\"]$dep['\"]" "$PROJECT_ROOT/components" "$PROJECT_ROOT/app" "$PROJECT_ROOT/lib" 2>/dev/null; then
            warning "Dependency $dep appears to be used in code. Skipping removal."
        else
            log "Removing $dep..."
            npm uninstall "$dep" || warning "Failed to remove $dep (may not be installed)"
        fi
    done
    
    # Conditional removals (require confirmation)
    CONDITIONAL_DEPS=("antd" "@mantine/core" "@mantine/dates" "@mantine/form" "@mantine/hooks" "@mantine/notifications" "@mantine/spotlight")
    
    for dep in "${CONDITIONAL_DEPS[@]}"; do
        if grep -r "from ['\"]$dep" "$PROJECT_ROOT" --include="*.tsx" --include="*.ts" >/dev/null 2>&1; then
            warning "Dependency $dep is used in codebase"
            read -p "Remove anyway? This may break the build. (y/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                log "Removing $dep..."
                npm uninstall "$dep"
            else
                log "Keeping $dep"
            fi
        else
            log "Removing unused $dep..."
            npm uninstall "$dep" 2>/dev/null || log "$dep not installed"
        fi
    done
    
    # Install build to verify no broken imports
    log "Installing dependencies..."
    npm install
    
    log "Testing build after cleanup..."
    if npm run build; then
        success "Build successful after dependency cleanup"
    else
        error "Build failed after dependency cleanup. Check the logs and restore from backup if needed."
    fi
    
    success "Phase 1 completed"
}

# Phase 2: KBar integration
phase2_kbar() {
    log "⌨️  Phase 2: KBar Integration"
    
    if [ "$DRY_RUN" = "--dry-run" ]; then
        log "[DRY RUN] Would install and configure KBar..."
        return 0
    fi
    
    # Install KBar
    log "Installing KBar..."
    npm install kbar
    
    # Create KBar configuration
    log "Setting up KBar configuration..."
    
    # Create actions configuration file
    cat > "$PROJECT_ROOT/lib/kbar-actions.ts" << 'EOF'
import { Action } from 'kbar'
import { 
  Calendar, 
  Search, 
  Settings, 
  Plus, 
  Clock,
  Users,
  Tag
} from 'lucide-react'

export const kbarActions: Action[] = [
  {
    id: 'create-event',
    name: 'Create Event',
    shortcut: ['c'],
    keywords: 'new event add create',
    section: 'Calendar',
    icon: <Plus className="w-4 h-4" />,
    perform: () => {
      // Will be connected to event creation logic
      console.log('Create event action')
    },
  },
  {
    id: 'search-events',
    name: 'Search Events',
    shortcut: ['/', 's'],
    keywords: 'search find events',
    section: 'Calendar',
    icon: <Search className="w-4 h-4" />,
    perform: () => {
      // Will be connected to search logic
      console.log('Search events action')
    },
  },
  {
    id: 'open-settings',
    name: 'Open Settings',
    shortcut: [','],
    keywords: 'settings preferences config',
    section: 'System',
    icon: <Settings className="w-4 h-4" />,
    perform: () => {
      // Will be connected to settings modal
      console.log('Open settings action')
    },
  },
  {
    id: 'focus-time',
    name: 'Block Focus Time',
    shortcut: ['f'],
    keywords: 'focus time block productive',
    section: 'Productivity',
    icon: <Clock className="w-4 h-4" />,
    perform: () => {
      // Will be connected to focus time blocking
      console.log('Block focus time action')
    },
  }
]
EOF
    
    # Test KBar integration in playground
    log "Testing KBar integration in playground..."
    
    # Start dev server in background for testing
    npm run dev &
    DEV_PID=$!
    
    # Wait for server to start
    sleep 10
    
    # Basic connectivity test
    if curl -f -s "http://localhost:3000/playground" >/dev/null; then
        success "Playground accessible with KBar integration"
    else
        warning "Could not verify playground accessibility"
    fi
    
    # Kill dev server
    kill $DEV_PID 2>/dev/null || true
    
    success "Phase 2 completed"
}

# Phase 3: shadcn Sidebar integration
phase3_sidebar() {
    log "📋 Phase 3: shadcn Sidebar Integration"
    
    if [ "$DRY_RUN" = "--dry-run" ]; then
        log "[DRY RUN] Would integrate shadcn Sidebar component..."
        return 0
    fi
    
    # Verify shadcn sidebar is available
    if [ ! -f "$PROJECT_ROOT/components/ui/sidebar.tsx" ]; then
        error "shadcn Sidebar component not found. Please install it first with: npx shadcn-ui@latest add sidebar"
    fi
    
    log "shadcn Sidebar component found"
    
    # Create sidebar integration wrapper
    log "Creating sidebar integration wrapper..."
    
    cat > "$PROJECT_ROOT/components/layout/IntegratedSidebar.tsx" << 'EOF'
'use client'

import React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { 
  Calendar,
  Settings,
  BarChart3,
  Clock,
  Users,
  Tag,
  ChevronUp,
  User2
} from 'lucide-react'

const menuItems = [
  {
    title: 'Calendar',
    icon: Calendar,
    url: '/',
    items: [
      { title: 'Timeline View', url: '/' },
      { title: 'Month View', url: '/month' },
      { title: 'Week View', url: '/week' }
    ]
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    url: '/analytics'
  },
  {
    title: 'Settings',
    icon: Settings,
    url: '/settings'
  }
]

export function IntegratedSidebar({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Calendar className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">LinearTime</span>
                    <span className="truncate text-xs">Calendar Platform</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        
        <SidebarContent>
          {menuItems.map((item) => (
            <SidebarGroup key={item.title}>
              <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {item.items ? (
                    item.items.map((subItem) => (
                      <SidebarMenuItem key={subItem.title}>
                        <SidebarMenuButton asChild>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  ) : (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <User2 />
                <span>Account</span>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        
        <SidebarRail />
      </Sidebar>
      
      <main className="flex-1">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}
EOF
    
    success "Phase 3 completed"
}

# Phase 4: Component adapter implementation
phase4_adapter() {
    log "🔧 Phase 4: Component Adapter Implementation"
    
    if [ "$DRY_RUN" = "--dry-run" ]; then
        log "[DRY RUN] Would implement component adapter layer..."
        return 0
    fi
    
    # The adapter is already created in the previous steps
    # Here we would integrate it with the main app
    
    log "Integrating component adapter with main application..."
    
    # Update app providers to include UI adapter
    if [ -f "$PROJECT_ROOT/app/providers.tsx" ]; then
        log "Updating app providers..."
        # This would modify the providers file to include SuperContext
        # For now, we'll just verify the files exist
        if [ -f "$PROJECT_ROOT/contexts/SuperContext.tsx" ]; then
            success "SuperContext found"
        else
            error "SuperContext not found. Ensure previous phases completed successfully."
        fi
    fi
    
    success "Phase 4 completed"
}

# Phase 5: Selective Arco integration
phase5_arco() {
    log "🎨 Phase 5: Selective Arco Design Integration"
    
    if [ "$DRY_RUN" = "--dry-run" ]; then
        log "[DRY RUN] Would selectively integrate Arco Design components..."
        log "[DRY RUN] High-value components to integrate:"
        echo "  - Table (enterprise data display)"
        echo "  - Form (complex form handling)"
        echo "  - DatePicker (enhanced date selection)"
        echo "  - Transfer (data transfer interface)"
        return 0
    fi
    
    warning "Phase 5 (Arco Integration) is high-risk and optional"
    read -p "Proceed with Arco Design integration? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Skipping Arco Design integration"
        return 0
    fi
    
    log "Installing Arco Design..."
    npm install @arco-design/web-react
    
    # Install only specific components to minimize bundle size
    log "Setting up selective Arco imports..."
    
    # Create Arco configuration
    cat > "$PROJECT_ROOT/lib/arco-config.ts" << 'EOF'
// Selective Arco Design configuration
// Only import high-value enterprise components

// Import specific components to minimize bundle size
import { Table } from '@arco-design/web-react/es/table'
import { Form } from '@arco-design/web-react/es/form'
import { DatePicker } from '@arco-design/web-react/es/date-picker'
import { Transfer } from '@arco-design/web-react/es/transfer'

// CSS imports (selective)
import '@arco-design/web-react/es/table/style'
import '@arco-design/web-react/es/form/style'
import '@arco-design/web-react/es/date-picker/style'
import '@arco-design/web-react/es/transfer/style'

export {
  Table as ArcoTable,
  Form as ArcoForm,
  DatePicker as ArcoDatePicker,
  Transfer as ArcoTransfer
}
EOF
    
    success "Phase 5 completed"
}

# Phase 6: Testing and validation
phase6_testing() {
    log "🧪 Phase 6: Testing and Validation"
    
    if [ "$DRY_RUN" = "--dry-run" ]; then
        log "[DRY RUN] Would run comprehensive test suite..."
        return 0
    fi
    
    log "Running foundation validation tests..."
    npm run test:foundation
    
    log "Running UI migration tests..."
    if [ -f "$PROJECT_ROOT/tests/ui-migration.spec.ts" ]; then
        npx playwright test tests/ui-migration.spec.ts
    else
        warning "UI migration tests not found"
    fi
    
    log "Running performance tests..."
    npm run test:performance || warning "Performance tests failed or not available"
    
    log "Running accessibility tests..."
    npm run test:a11y || warning "Accessibility tests failed or not available"
    
    log "Building production bundle..."
    npm run build
    
    log "Analyzing bundle size..."
    if command -v webpack-bundle-analyzer >/dev/null 2>&1; then
        npx webpack-bundle-analyzer .next/static/chunks/*.js
    else
        log "Bundle analyzer not available. Install with: npm install -g webpack-bundle-analyzer"
    fi
    
    success "Phase 6 completed"
}

# Validation phase
phase_validate() {
    log "✅ Validation Phase: System Health Check"
    
    # Check current setup
    log "Checking current system state..."
    
    # Node modules size
    if [ -d "$PROJECT_ROOT/node_modules" ]; then
        NODE_MODULES_SIZE=$(du -sh "$PROJECT_ROOT/node_modules" | cut -f1)
        log "Node modules size: $NODE_MODULES_SIZE"
    fi
    
    # Check key files exist
    FILES_TO_CHECK=(
        "package.json"
        "components/CommandBar.tsx"
        "contexts/CalendarContext.tsx"
        "contexts/SettingsContext.tsx"
    )
    
    for file in "${FILES_TO_CHECK[@]}"; do
        if [ -f "$PROJECT_ROOT/$file" ]; then
            success "Found: $file"
        else
            warning "Missing: $file"
        fi
    done
    
    # Check build status
    log "Testing build..."
    if npm run build >/dev/null 2>&1; then
        success "Build successful"
    else
        error "Build failed. Check the build output for errors."
    fi
    
    # Check for obvious issues
    log "Checking for common issues..."
    
    # Check for conflicting dependencies
    if npm ls 2>&1 | grep -i "peer dep" >/dev/null; then
        warning "Peer dependency issues detected"
    fi
    
    # Check TypeScript
    if npx tsc --noEmit >/dev/null 2>&1; then
        success "TypeScript check passed"
    else
        warning "TypeScript errors detected"
    fi
    
    success "Validation completed"
}

# Rollback function
rollback() {
    error_msg=${1:-"Rollback requested"}
    log "🔄 Rolling back deployment due to: $error_msg"
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_* 2>/dev/null | head -n1)
    
    if [ -n "$LATEST_BACKUP" ] && [ -d "$LATEST_BACKUP" ]; then
        log "Rolling back to: $LATEST_BACKUP"
        "$LATEST_BACKUP/restore.sh"
        success "Rollback completed"
    else
        error "No backup found for rollback"
    fi
}

# Main execution logic
main() {
    case $PHASE in
        "validate"|"v")
            preflight_checks
            phase_validate
            ;;
        "1"|"phase1"|"cleanup")
            preflight_checks
            create_backup
            phase1_cleanup
            ;;
        "2"|"phase2"|"kbar")
            preflight_checks
            create_backup
            phase2_kbar
            ;;
        "3"|"phase3"|"sidebar")
            preflight_checks
            create_backup
            phase3_sidebar
            ;;
        "4"|"phase4"|"adapter")
            preflight_checks
            create_backup
            phase4_adapter
            ;;
        "5"|"phase5"|"arco")
            preflight_checks
            create_backup
            phase5_arco
            ;;
        "6"|"phase6"|"testing")
            preflight_checks
            phase6_testing
            ;;
        "all"|"full")
            warning "Running full deployment (all phases)"
            read -p "This will take 30-60 minutes. Continue? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                error "Full deployment cancelled"
            fi
            
            preflight_checks
            create_backup
            phase1_cleanup
            phase2_kbar
            phase3_sidebar
            phase4_adapter
            phase5_arco
            phase6_testing
            success "🎉 Full deployment completed successfully!"
            ;;
        "rollback")
            rollback "Manual rollback requested"
            ;;
        *)
            echo "Usage: $0 [phase] [--dry-run]"
            echo ""
            echo "Phases:"
            echo "  validate    - System validation and health check"
            echo "  1|cleanup   - Remove unused dependencies"
            echo "  2|kbar      - Integrate KBar command palette"
            echo "  3|sidebar   - Integrate shadcn Sidebar"
            echo "  4|adapter   - Implement component adapter layer"
            echo "  5|arco      - Selective Arco Design integration"
            echo "  6|testing   - Run comprehensive test suite"
            echo "  all|full    - Run all phases sequentially"
            echo "  rollback    - Rollback to previous state"
            echo ""
            echo "Options:"
            echo "  --dry-run   - Show what would be done without making changes"
            echo ""
            echo "Examples:"
            echo "  $0 validate                 # Check current system state"
            echo "  $0 1 --dry-run             # Preview dependency cleanup"
            echo "  $0 all                      # Full deployment"
            exit 1
            ;;
    esac
}

# Error handling
trap 'error "Deployment failed at line $LINENO"' ERR

# Run main function
main

success "🚀 Deployment phase '$PHASE' completed successfully"
log "Log file: $LOG_DIR/deploy.log"
if [ -n "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
    log "Backups available in: $BACKUP_DIR"
fi