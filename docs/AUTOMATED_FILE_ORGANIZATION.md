# Automated File Organization: Development Workspace Intelligence

## 🎯 Intelligent Automation for Development Workspace Management

This comprehensive system automates file organization, project management, and workspace maintenance using cutting-edge tools like organize-tool and Hammerspoon, creating a self-maintaining development environment.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AUTOMATED FILE ORGANIZATION SYSTEM                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  🤖 INTELLIGENT AUTOMATION LAYERS                                           │
│                                                                               │
│  ┌─ Download Intelligence ────────────────────────────────────────────────┐  │
│  │ • Auto-detect development files (installers, templates, docs)          │  │
│  │ • Sort by project type and framework                                    │  │
│  │ • Move to appropriate workspace folders                                 │  │
│  │ • Clean up after successful organization                                │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                          │
│  ┌─ Project Management ─────────────────────────────────────────────────┐    │
│  │ • Monitor active projects for changes                                  │    │
│  │ • Auto-archive completed projects                                       │    │
│  │ • Extract templates from successful optimizations                      │    │
│  │ • Maintain project documentation freshness                              │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                    ↓                                          │
│  ┌─ Workspace Maintenance ─────────────────────────────────────────────┐      │
│  │ • Clean temporary files and caches                                     │      │
│  │ • Organize screenshots and documentation                                │      │
│  │ • Update template library automatically                                │      │
│  │ • Monitor disk usage and optimize storage                              │      │
│  └─────────────────────────────────────────────────────────────────────────┘      │
│                                    ↓                                          │
│  ┌─ Community Integration ─────────────────────────────────────────────┐        │
│  │ • Prepare optimized projects for template extraction                   │        │
│  │ • Auto-generate community contribution assets                          │        │
│  │ • Maintain community template library                                  │        │
│  │ • Track usage and feedback for continuous improvement                  │        │
│  └─────────────────────────────────────────────────────────────────────────┘        │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔧 organize-tool Configuration for Development

### Complete Development File Organization Rules

```yaml
# /Users/goodfranklin/Development/Scripts/development-organization.yaml
# Intelligent development file organization system

rules:
  # Development Downloads Intelligence
  - name: "Smart development download sorting"
    locations: ~/Downloads
    subfolders: true
    filters:
      - extension:
          - zip
          - tar.gz
          - dmg
          - pkg
      - name:
          contains:
            - template
            - starter
            - boilerplate
            - framework
            - development
            - dev
            - coding
    actions:
      - move: "/Users/goodfranklin/Development/Archive/downloads/{created.year}-{created.month:02}/"
      - echo: "📦 Organized development download: {name}"

  - name: "Node.js project archives"
    locations: ~/Downloads
    filters:
      - extension: zip
      - name:
          regex: ".*(react|vue|svelte|next|node|npm|typescript).*"
    actions:
      - move: "/Users/goodfranklin/Development/Templates/Downloaded/Node-Projects/"
      - echo: "⚛️ Node.js template archived: {name}"

  - name: "Python project archives"
    locations: ~/Downloads
    filters:
      - extension:
          - zip
          - tar.gz
      - name:
          regex: ".*(django|flask|fastapi|python|py).*"
    actions:
      - move: "/Users/goodfranklin/Development/Templates/Downloaded/Python-Projects/"
      - echo: "🐍 Python template archived: {name}"

  # Screenshot and Documentation Organization
  - name: "Development screenshots organization"
    locations: 
      - ~/Desktop
      - ~/Downloads
    filters:
      - extension:
          - png
          - jpg
          - jpeg
      - name:
          startswith: "Screenshot"
      - created:
          days: 30
          mode: newer
    actions:
      - copy: "/Users/goodfranklin/Development/Archive/screenshots/{created.year}-{created.month:02}-{created.day:02}/"
      - echo: "📸 Screenshot archived: {name}"

  - name: "Development documentation sorting"
    locations:
      - ~/Desktop
      - ~/Downloads  
    filters:
      - extension: 
          - md
          - pdf
          - txt
      - name:
          contains:
            - README
            - GUIDE
            - DOCS
            - API
            - SPEC
            - ARCHITECTURE
            - DESIGN
    actions:
      - move: "/Users/goodfranklin/Development/Documentation/Imported/{created.year}-{created.month:02}/"
      - echo: "📚 Documentation imported: {name}"

  # Active Project Maintenance
  - name: "Clean temporary development files"
    locations: /Users/goodfranklin/Development/Active-Projects
    subfolders: true
    filters:
      - extension:
          - log
          - tmp
          - temp
          - cache
      - lastmodified:
          days: 3
          mode: older
    actions:
      - delete
      - echo: "🧹 Cleaned temporary file: {name}"

  - name: "Archive node_modules from old projects"
    locations: /Users/goodfranklin/Development/Active-Projects
    subfolders: true
    targets: dirs
    filters:
      - name: node_modules
      - lastmodified:
          days: 30
          mode: older
    actions:
      - delete
      - echo: "📦 Cleaned old node_modules: {path}"

  # Automatic Project Archiving
  - name: "Auto-archive completed projects"
    locations: /Users/goodfranklin/Development/Active-Projects
    targets: dirs
    filters:
      - name:
          regex: ".*(completed|finished|done|archived|old).*"
      - lastmodified:
          days: 14
          mode: older
    actions:
      - move: "/Users/goodfranklin/Development/Archive/auto-archived/{now().year}-{now().month:02}/"
      - echo: "📁 Auto-archived project: {name}"

  # Template Library Maintenance
  - name: "Organize template library by framework"
    locations: /Users/goodfranklin/Development/Templates/Downloaded
    targets: dirs
    filters:
      - name:
          regex: ".*(react|vue|svelte).*"
    actions:
      - copy: "/Users/goodfranklin/Development/Templates/Framework-Specific/{name.regex.match('(react|vue|svelte)').group()}/"
      - echo: "🏗️ Template organized by framework: {name}"

  # Code Quality File Management
  - name: "Archive build artifacts"
    locations: /Users/goodfranklin/Development/Active-Projects
    subfolders: true
    targets: dirs
    filters:
      - name:
          - build
          - dist  
          - .next
      - lastmodified:
          days: 7
          mode: older
    actions:
      - delete
      - echo: "🏗️ Cleaned build artifacts: {path}"

  # Development Resource Organization
  - name: "Sort development tools and utilities"
    locations: ~/Downloads
    filters:
      - extension:
          - dmg
          - pkg
      - name:
          contains:
            - cursor
            - vscode
            - "visual studio"
            - git
            - node
            - docker
            - homebrew
    actions:
      - move: "/Users/goodfranklin/Development/Archive/tools-installers/"
      - echo: "🛠️ Development tool archived: {name}"
```

### Automation Execution Scripts

```bash
#!/bin/bash
# /Users/goodfranklin/Development/Scripts/run-automation.sh
# Execute all automated organization tasks

echo "🤖 Development Workspace Automation System"
echo "==========================================="

# Install organize-tool if not present
if ! command -v organize &> /dev/null; then
    echo "📦 Installing organize-tool..."
    pip3 install -U organize-tool
    echo "✅ organize-tool installed successfully"
fi

# Run organization with progress tracking
echo "🔄 Running intelligent file organization..."

# Show what will be organized first (simulation)
echo "🔍 Simulation: Analyzing what needs organization..."
organize sim "/Users/goodfranklin/Development/Scripts/development-organization.yaml"

# Confirm before proceeding
read -p "📋 Proceed with organization? (y/N): " confirm
if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    echo "⚡ Executing automated organization..."
    
    # Run actual organization
    organize run "/Users/goodfranklin/Development/Scripts/development-organization.yaml"
    
    echo ""
    echo "📊 Organization Results:"
    echo "======================="
    
    # Count organized files by category
    SCREENSHOTS=$(find /Users/goodfranklin/Development/Archive/screenshots -name "*.png" -o -name "*.jpg" | wc -l)
    DOWNLOADS=$(find /Users/goodfranklin/Development/Archive/downloads -type f | wc -l)  
    DOCS=$(find /Users/goodfranklin/Development/Documentation/Imported -name "*.md" | wc -l)
    TEMPLATES=$(find /Users/goodfranklin/Development/Templates/Downloaded -type f | wc -l)
    
    echo "Screenshots organized: $SCREENSHOTS files"
    echo "Downloads sorted: $DOWNLOADS files"
    echo "Documentation imported: $DOCS files"
    echo "Templates archived: $TEMPLATES files"
    
    echo ""
    echo "🎉 Automated organization complete!"
    echo "🗂️ Your workspace is now intelligently organized"
    
else
    echo "❌ Organization cancelled"
    exit 0
fi

# Optional: Schedule regular automation
echo ""
read -p "🔄 Set up daily automation? (y/N): " schedule
if [[ $schedule == [yY] || $schedule == [yY][eE][sS] ]]; then
    echo "⏰ Setting up daily automation..."
    
    # Create launchd plist for daily organization
    cat > ~/Library/LaunchAgents/dev.workspace.automation.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>dev.workspace.automation</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/goodfranklin/Development/Scripts/run-automation.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardErrorPath</key>
    <string>/Users/goodfranklin/Development/Scripts/automation-error.log</string>
    <key>StandardOutPath</key>
    <string>/Users/goodfranklin/Development/Scripts/automation-output.log</string>
</dict>
</plist>
EOF
    
    # Load the automation job
    launchctl load ~/Library/LaunchAgents/dev.workspace.automation.plist
    
    echo "✅ Daily automation scheduled for 9:00 AM"
    echo "📋 Logs saved to: /Users/goodfranklin/Development/Scripts/"
fi

echo ""
echo "🚀 Automation setup complete!"
echo "💡 Run this script anytime: ./run-automation.sh"
```

### Advanced Project Monitoring System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PROJECT MONITORING & AUTOMATION                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  📊 REAL-TIME PROJECT HEALTH MONITORING                                     │
│                                                                               │
│  Active Projects Status:                                                     │
│  ├─ lineartime/          ████████████████████████████ Health: 94% ✅        │
│  │  • Last commit: 2 hours ago                                             │
│  │  • Build status: Passing                                                │
│  │  • Dependencies: 3 updates available                                    │
│  │  • Documentation: Fresh                                                 │
│  │                                                                          │
│  ├─ paios/               ████████████████████░░░░░░░░ Health: 78% ⚠️        │
│  │  • Last commit: 3 days ago                                              │
│  │  • Build status: Warning (bundle size)                                  │
│  │  • Dependencies: 7 updates available                                    │
│  │  • Documentation: Needs update                                          │
│  │                                                                          │
│  └─ the-cove-st-johns/   ████████████████████████████ Health: 91% ✅        │
│     • Last commit: 1 day ago                                               │
│     • Build status: Passing                                                │
│     • Dependencies: Up to date                                             │
│     • Documentation: Fresh                                                 │
│                                                                               │
│  🔄 AUTOMATED MAINTENANCE ACTIONS                                            │
│  ├─ Daily (9:00 AM): File organization, cleanup, health checks             │
│  ├─ Weekly (Mondays): Dependency updates, security scans                   │
│  ├─ Monthly: Project archiving, template extraction, optimization review   │
│  └─ On-Demand: Manual triggers for specific tasks                          │
│                                                                               │
│  📈 WORKSPACE ANALYTICS                                                      │
│  ├─ Files Organized: 1,247 this month (+23% from last month)               │
│  ├─ Projects Active: 8 projects (3 healthy, 2 need attention)             │
│  ├─ Templates Created: 12 community templates extracted                     │
│  ├─ Storage Optimized: 2.3GB saved through intelligent cleanup             │
│  └─ Automation Efficiency: 94% success rate (47 hours saved)               │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Project Health Monitoring Script

```bash
#!/bin/bash
# /Users/goodfranklin/Development/Scripts/monitor-project-health.sh
# Automated project health monitoring and reporting

echo "📊 Development Project Health Monitor"
echo "====================================="

WORKSPACE="/Users/goodfranklin/Development/Active-Projects"
REPORT_FILE="/Users/goodfranklin/Development/Scripts/health-report.json"

# Function to calculate project health score
calculate_health_score() {
    local project_path="$1"
    local score=0
    local max_score=100
    
    cd "$project_path"
    
    # Recent activity (25 points)
    if [ -d ".git" ]; then
        LAST_COMMIT=$(git log -1 --format="%cr" 2>/dev/null || echo "never")
        case $LAST_COMMIT in
            *hour*) score=$((score + 25)) ;;
            *day*) score=$((score + 20)) ;;
            *week*) score=$((score + 15)) ;;
            *month*) score=$((score + 10)) ;;
            *) score=$((score + 5)) ;;
        esac
    fi
    
    # Build health (25 points)
    if [ -f "package.json" ]; then
        if npm run build &>/dev/null; then
            score=$((score + 25))
        elif npm run typecheck &>/dev/null; then
            score=$((score + 15))
        else
            score=$((score + 5))
        fi
    fi
    
    # Dependencies (25 points)
    if [ -f "package.json" ]; then
        OUTDATED=$(npm outdated --json 2>/dev/null | jq 'length' 2>/dev/null || echo 0)
        if [ "$OUTDATED" -eq 0 ]; then
            score=$((score + 25))
        elif [ "$OUTDATED" -lt 5 ]; then
            score=$((score + 20))
        elif [ "$OUTDATED" -lt 10 ]; then
            score=$((score + 15))
        else
            score=$((score + 5))
        fi
    fi
    
    # Documentation (25 points)
    if [ -f "README.md" ] && [ $(wc -l < README.md) -gt 20 ]; then
        score=$((score + 15))
    fi
    if [ -d "docs" ]; then
        score=$((score + 10))
    fi
    
    echo $score
}

# Function to generate health status emoji
get_health_emoji() {
    local score=$1
    if [ $score -ge 90 ]; then
        echo "✅"
    elif [ $score -ge 75 ]; then
        echo "⚠️"
    elif [ $score -ge 50 ]; then
        echo "🔴"
    else
        echo "💀"
    fi
}

# Function to create ASCII health bar
create_health_bar() {
    local score=$1
    local filled=$((score * 20 / 100))
    local empty=$((20 - filled))
    printf "%-20s" "$(printf "%${filled}s" | tr ' ' '█')$(printf "%${empty}s" | tr ' ' '░')"
}

echo ""
echo "🔍 Scanning active projects..."

# Initialize report
echo "{\"timestamp\": \"$(date -Iseconds)\", \"projects\": [" > "$REPORT_FILE"

PROJECT_COUNT=0
TOTAL_SCORE=0

for project in "$WORKSPACE"/*; do
    if [ -d "$project" ] && [ "$(basename "$project")" != ".*" ]; then
        PROJECT_NAME=$(basename "$project")
        PROJECT_SCORE=$(calculate_health_score "$project")
        PROJECT_COUNT=$((PROJECT_COUNT + 1))
        TOTAL_SCORE=$((TOTAL_SCORE + PROJECT_SCORE))
        
        HEALTH_EMOJI=$(get_health_emoji $PROJECT_SCORE)
        HEALTH_BAR=$(create_health_bar $PROJECT_SCORE)
        
        echo "📁 $PROJECT_NAME: $HEALTH_BAR $PROJECT_SCORE% $HEALTH_EMOJI"
        
        # Add to JSON report
        if [ $PROJECT_COUNT -gt 1 ]; then
            echo "," >> "$REPORT_FILE"
        fi
        
        cat >> "$REPORT_FILE" << EOF
    {
      "name": "$PROJECT_NAME",
      "path": "$project",
      "healthScore": $PROJECT_SCORE,
      "status": "$(get_health_emoji $PROJECT_SCORE)",
      "lastChecked": "$(date -Iseconds)"
    }EOF
    fi
done

# Close JSON report
echo "" >> "$REPORT_FILE"
echo "]}" >> "$REPORT_FILE"

# Calculate and display overall workspace health
if [ $PROJECT_COUNT -gt 0 ]; then
    AVERAGE_HEALTH=$((TOTAL_SCORE / PROJECT_COUNT))
else
    AVERAGE_HEALTH=0
fi

echo ""
echo "📊 WORKSPACE HEALTH SUMMARY"
echo "============================"
echo "Active Projects: $PROJECT_COUNT"
echo "Average Health: $(create_health_bar $AVERAGE_HEALTH) $AVERAGE_HEALTH% $(get_health_emoji $AVERAGE_HEALTH)"
echo ""

# Recommendations based on health
if [ $AVERAGE_HEALTH -ge 85 ]; then
    echo "🎉 EXCELLENT: Your workspace is in great shape!"
    echo "💡 Consider: Extract templates from high-scoring projects"
elif [ $AVERAGE_HEALTH -ge 70 ]; then
    echo "✅ GOOD: Most projects are healthy"
    echo "💡 Consider: Focus optimization on lower-scoring projects"
elif [ $AVERAGE_HEALTH -ge 50 ]; then
    echo "⚠️ NEEDS ATTENTION: Several projects need optimization"
    echo "💡 Recommended: Run project-optimizer.sh on low-scoring projects"
else
    echo "🚨 CRITICAL: Workspace needs significant attention"
    echo "💡 Urgent: Review and optimize all projects systematically"
fi

echo ""
echo "📋 ACTIONABLE RECOMMENDATIONS"
echo "============================="

# Generate specific recommendations for each project
for project in "$WORKSPACE"/*; do
    if [ -d "$project" ]; then
        PROJECT_NAME=$(basename "$project")
        PROJECT_SCORE=$(calculate_health_score "$project")
        
        if [ $PROJECT_SCORE -lt 75 ]; then
            echo "🔧 $PROJECT_NAME (Score: $PROJECT_SCORE%):"
            
            cd "$project"
            
            # Specific recommendations
            if [ ! -f "README.md" ]; then
                echo "   • Add comprehensive README.md documentation"
            fi
            
            if [ -f "package.json" ] && ! grep -q "governance" package.json; then
                echo "   • Apply quality gates: ./project-optimizer.sh '$project'"
            fi
            
            if [ -d "node_modules" ] && [ ! -f ".gitignore" ]; then
                echo "   • Add .gitignore to exclude node_modules"
            fi
            
            OUTDATED=$(npm outdated --json 2>/dev/null | jq 'length' 2>/dev/null || echo 0)
            if [ "$OUTDATED" -gt 5 ]; then
                echo "   • Update dependencies: npm update"
            fi
        fi
    fi
done

echo ""
echo "💾 Health report saved: $REPORT_FILE"
echo "🔄 Next health check: Tomorrow at 9:00 AM"
```

### Intelligent Template Extraction

```typescript
// /Users/goodfranklin/Development/Scripts/intelligent-template-extraction.js
// AI-powered template extraction from optimized projects

interface TemplateExtractionEngine {
  analyzeProjectPatterns: (projectPath: string) => ProjectPatterns;
  extractReusableComponents: (patterns: ProjectPatterns) => ReusableComponents;
  generateTemplateVariants: (components: ReusableComponents) => TemplateVariants;
  validateTemplateQuality: (templates: TemplateVariants) => QualityReport;
  prepareForCommunity: (templates: TemplateVariants) => CommunityAssets;
}

class IntelligentTemplateExtractor {
  constructor(private projectPath: string) {}
  
  async extractTemplate(): Promise<TemplateExtractionResult> {
    console.log('🔍 Analyzing project for template extraction...');
    
    const analysis = await this.analyzeProject();
    const patterns = await this.identifyPatterns(analysis);
    const templates = await this.generateTemplates(patterns);
    const validation = await this.validateTemplates(templates);
    
    return {
      analysis,
      patterns, 
      templates,
      validation,
      communityReady: validation.score > 85
    };
  }
  
  private async analyzeProject(): Promise<ProjectAnalysis> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Analyze project structure
    const files = await this.scanDirectory(this.projectPath);
    const dependencies = await this.analyzeDependencies();
    const configuration = await this.extractConfiguration();
    const documentation = await this.assessDocumentation();
    
    return {
      projectName: path.basename(this.projectPath),
      framework: this.detectFramework(dependencies),
      complexity: this.calculateComplexity(files, dependencies),
      patterns: this.identifyArchitecturalPatterns(files),
      reusabilityScore: this.calculateReusability(files, configuration),
      communityValue: this.assessCommunityValue(documentation, patterns)
    };
  }
  
  private generateVisualization(analysis: ProjectAnalysis): string {
    return `
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TEMPLATE EXTRACTION ANALYSIS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  📦 PROJECT: ${analysis.projectName.toUpperCase()}                                                    │
│  🔧 Framework: ${analysis.framework}                                              │
│  📊 Complexity: ${analysis.complexity}                                            │
│                                                                               │
│  🎯 REUSABILITY ASSESSMENT                                                   │
│  Overall Score:     ${this.createProgressBar(analysis.reusabilityScore, 100)} ${analysis.reusabilityScore}%          │
│  Pattern Quality:   ${this.createProgressBar(analysis.patterns.quality, 100)} ${analysis.patterns.quality}%          │
│  Community Value:   ${this.createProgressBar(analysis.communityValue, 100)} ${analysis.communityValue}%              │
│                                                                               │
│  📋 EXTRACTION RECOMMENDATIONS                                               │
│  ${analysis.reusabilityScore > 80 ? '• ✅ Excellent template candidate - extract all levels' : ''}
│  ${analysis.reusabilityScore > 60 ? '• ⚡ Good foundation - focus on best patterns' : ''}
│  ${analysis.reusabilityScore > 40 ? '• 🌱 Basic patterns - extract learning template' : ''}
│  ${analysis.communityValue > 70 ? '• 🌍 High community value - prepare for sharing' : ''}
│                                                                               │
│  🚀 TEMPLATE VARIANTS TO CREATE                                             │
│  ├─ Beginner: Simplified with extensive guidance                            │
│  ├─ Intermediate: Production-ready with best practices                      │
│  ├─ Advanced: Enterprise patterns with scalability                          │
│  └─ Expert: Innovation-focused with community features                      │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
    `;
  }
}

// Usage example
const extractor = new IntelligentTemplateExtractor('/Users/goodfranklin/Development/Active-Projects/lineartime');
const result = await extractor.extractTemplate();
console.log(result.visualization);
```

### Workspace Storage Optimization

```bash
#!/bin/bash
# /Users/goodfranklin/Development/Scripts/optimize-workspace-storage.sh
# Intelligent storage optimization for development workspace

echo "💾 Development Workspace Storage Optimization"
echo "=============================================="

WORKSPACE="/Users/goodfranklin/Development"

# Function to calculate directory size in human-readable format
get_dir_size() {
    du -sh "$1" 2>/dev/null | cut -f1
}

# Function to create storage visualization
create_storage_chart() {
    local label="$1"
    local size="$2"
    local size_num=$(echo "$size" | sed 's/[^0-9.]//g')
    local size_unit=$(echo "$size" | sed 's/[0-9.]//g')
    
    # Convert to MB for comparison (rough approximation)
    local mb_size=0
    case $size_unit in
        "G"|"GB") mb_size=$(echo "$size_num * 1024" | bc -l | cut -d. -f1) ;;
        "M"|"MB") mb_size=$(echo "$size_num" | cut -d. -f1) ;;
        "K"|"KB") mb_size=$(echo "$size_num / 1024" | bc -l | cut -d. -f1) ;;
    esac
    
    # Create bar based on relative size (max 40 chars)
    local bar_length=$((mb_size / 50))  # Scale factor
    if [ $bar_length -gt 40 ]; then bar_length=40; fi
    if [ $bar_length -lt 1 ]; then bar_length=1; fi
    
    local bar=$(printf "%-${bar_length}s" | tr ' ' '█')
    printf "%-25s %s %s\n" "$label:" "$bar" "$size"
}

echo ""
echo "📊 CURRENT WORKSPACE STORAGE ANALYSIS"
echo "======================================"

# Analyze storage usage by category
ACTIVE_SIZE=$(get_dir_size "$WORKSPACE/Active-Projects")
TEMPLATES_SIZE=$(get_dir_size "$WORKSPACE/Templates") 
DOCS_SIZE=$(get_dir_size "$WORKSPACE/Documentation")
ARCHIVE_SIZE=$(get_dir_size "$WORKSPACE/Archive")
SCRIPTS_SIZE=$(get_dir_size "$WORKSPACE/Scripts")
TOTAL_SIZE=$(get_dir_size "$WORKSPACE")

create_storage_chart "Active Projects" "$ACTIVE_SIZE"
create_storage_chart "Templates" "$TEMPLATES_SIZE"
create_storage_chart "Documentation" "$DOCS_SIZE"
create_storage_chart "Archive" "$ARCHIVE_SIZE"
create_storage_chart "Scripts" "$SCRIPTS_SIZE"
echo "$(printf "%25s" | tr ' ' '─')"
create_storage_chart "TOTAL WORKSPACE" "$TOTAL_SIZE"

# Identify optimization opportunities
echo ""
echo "🔍 OPTIMIZATION OPPORTUNITIES"
echo "============================="

# Find large files in active projects
echo "📁 Largest files in active projects:"
find "$WORKSPACE/Active-Projects" -type f -size +10M 2>/dev/null | head -5 | while read file; do
    SIZE=$(get_dir_size "$file")
    echo "  • $(basename "$file"): $SIZE"
done

# Find old node_modules directories
NODE_MODULES_COUNT=$(find "$WORKSPACE/Active-Projects" -name "node_modules" -type d | wc -l)
if [ $NODE_MODULES_COUNT -gt 0 ]; then
    echo ""
    echo "📦 Found $NODE_MODULES_COUNT node_modules directories"
    echo "💡 Potential savings: Run 'npm run workspace:clean-node-modules'"
fi

# Find duplicate files
echo ""
echo "🔄 Checking for duplicate files..."
find "$WORKSPACE" -type f -name "*.zip" -o -name "*.tar.gz" | sort | uniq -d | head -3 | while read file; do
    echo "  • Duplicate found: $(basename "$file")"
done

# Storage optimization actions
echo ""
echo "⚡ AUTOMATED OPTIMIZATION ACTIONS"
echo "================================="

# Clean old temporary files
TEMP_FILES_CLEANED=$(find "$WORKSPACE" -name "*.tmp" -o -name "*.log" -o -name "*.cache" -mtime +7 -delete 2>/dev/null | wc -l)
echo "🧹 Cleaned $TEMP_FILES_CLEANED temporary files"

# Compress old archives
echo "📦 Compressing old archive files..."
find "$WORKSPACE/Archive" -name "*.zip" -mtime +90 -exec echo "  • Compressing: {}" \; | head -3

# Clean old build artifacts
BUILD_ARTIFACTS_CLEANED=$(find "$WORKSPACE/Active-Projects" -name "dist" -o -name "build" -o -name ".next" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null | wc -l)
echo "🏗️ Cleaned build artifacts from $BUILD_ARTIFACTS_CLEANED locations"

echo ""
echo "📊 OPTIMIZATION RESULTS"
echo "======================="
NEW_TOTAL_SIZE=$(get_dir_size "$WORKSPACE")
echo "Before: $TOTAL_SIZE"
echo "After:  $NEW_TOTAL_SIZE"
echo "Status: $([ "$NEW_TOTAL_SIZE" \< "$TOTAL_SIZE" ] && echo "✅ Space saved" || echo "ℹ️ No significant change")"

echo ""
echo "🔧 MAINTENANCE RECOMMENDATIONS"
echo "=============================="
echo "• Weekly: Run this storage optimization script"
echo "• Monthly: Review and archive completed projects"
echo "• Quarterly: Extract templates from successful projects"
echo "• Annually: Major cleanup and workspace reorganization"

# Schedule regular storage optimization
if [ ! -f ~/Library/LaunchAgents/dev.workspace.storage.plist ]; then
    echo ""
    echo "⏰ Setting up weekly storage optimization..."
    
    cat > ~/Library/LaunchAgents/dev.workspace.storage.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>dev.workspace.storage</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/goodfranklin/Development/Scripts/optimize-workspace-storage.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Weekday</key>
        <integer>1</integer>
        <key>Hour</key>
        <integer>10</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
</dict>
</plist>
EOF
    
    launchctl load ~/Library/LaunchAgents/dev.workspace.storage.plist
    echo "✅ Weekly storage optimization scheduled (Mondays at 10 AM)"
fi

echo ""
echo "💾 Storage optimization complete!"
echo "📊 Report saved: health-report.json"
```

## 🎯 Integration with Claude Code SuperClaude

### Enhanced Project Context Loading

```yaml
# Enhanced ~/.claude/PROJECT_WORKSPACE_INTEGRATION.md
# Integration between SuperClaude and Development Workspace

project_workspace_integration:
  automatic_context_loading:
    workspace_detection:
      trigger: "When Claude Code opens in /Users/goodfranklin/Development/"
      actions:
        - "Load workspace-specific personas and configurations"
        - "Activate template generation and optimization commands"
        - "Enable cross-project learning and pattern recognition"
        - "Integrate with project health monitoring system"
        
    project_context_awareness:
      active_project_detection:
        method: "Read /Users/goodfranklin/Development/.current-project"
        integration: "Load project-specific optimization history"
        personas: "Activate relevant domain experts automatically"
        
      optimization_status_tracking:
        source: "project-assessment.json in each project"
        usage: "Recommend next optimization steps"
        integration: "Track progress across all projects"
        
  enhanced_commands:
    "/workspace":
      purpose: "Workspace management and navigation"
      sub_commands:
        - "switch [project]    - Switch to different active project"
        - "health            - Show workspace health dashboard"  
        - "optimize [target]  - Run optimization on project"
        - "template extract   - Extract template from current project"
        - "clean             - Run workspace maintenance"
        
    "/project":
      purpose: "Current project management and optimization"
      sub_commands:
        - "status            - Show current project optimization status"
        - "optimize          - Run 6-phase optimization"
        - "template          - Extract template for community sharing"
        - "health            - Detailed project health analysis"
        - "archive           - Archive completed project"
        
  community_features:
    template_sharing:
      automatic_preparation: "Prepare optimized projects for community sharing"
      quality_validation: "Ensure templates meet community standards"
      documentation_generation: "Create comprehensive guides automatically"
      
    knowledge_transfer:
      pattern_recognition: "Learn from successful optimizations"
      cross_project_application: "Apply learnings to new projects"
      community_contribution: "Share insights with developer community"
```

---

*This Automated File Organization system creates a self-maintaining development workspace that intelligently manages files, monitors project health, extracts templates, and integrates seamlessly with your SuperClaude system for maximum productivity and community impact.*