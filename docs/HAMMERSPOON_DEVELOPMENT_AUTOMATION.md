# Hammerspoon Development Automation: Advanced macOS Workspace Management

## 🎯 Ultimate macOS Development Automation with Hammerspoon

Transform your macOS into the most efficient development environment possible using Hammerspoon's powerful automation capabilities, integrated with your optimization framework and development workspace.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      HAMMERSPOON DEVELOPMENT AUTOMATION                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  🚀 AUTOMATION CAPABILITIES                                                  │
│                                                                               │
│  ┌─ Workspace Management ─────────────────────────────────────────────────┐  │
│  │ • Instant project switching with hotkeys                                │  │
│  │ • Automatic development layout setup                                    │  │
│  │ • Application launching and window positioning                          │  │
│  │ • Multi-monitor workspace configuration                                 │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─ Development Workflow Automation ──────────────────────────────────────┐   │
│  │ • One-hotkey optimization execution                                     │   │
│  │ • Template extraction and application                                   │   │
│  │ • Automated file organization triggers                                  │   │
│  │ • Real-time project health monitoring                                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ AI Assistant Integration ─────────────────────────────────────────────┐    │
│  │ • Context-aware Claude Code activation                                  │    │
│  │ • Project-specific persona loading                                      │    │
│  │ • Automated documentation generation triggers                           │    │
│  │ • Community template sharing automation                                 │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  🎯 GLOBAL HOTKEYS (Professional Development)                                │
│  • Cmd+Alt+Ctrl+D: Open Development workspace                              │
│  • Cmd+Alt+Ctrl+C: Open current project in Cursor                          │
│  • Cmd+Alt+Ctrl+P: Project switcher                                        │
│  • Cmd+Alt+Ctrl+O: Run optimization on current project                     │
│  • Cmd+Alt+Ctrl+T: Open template library                                   │
│  • Cmd+Alt+Ctrl+L: Setup development window layout                         │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔧 Hammerspoon Installation & Setup

### Step-by-Step Installation (Beginner-Friendly)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HAMMERSPOON INSTALLATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  🎯 WHAT IS HAMMERSPOON?                                                    │
│  Hammerspoon is like having a personal automation assistant for your Mac.   │
│  It can:                                                                     │
│  • Control windows and applications                                         │
│  • Create custom keyboard shortcuts                                         │
│  • Automate repetitive tasks                                                │
│  • Monitor and respond to system events                                     │
│                                                                               │
│  📦 INSTALLATION METHODS                                                     │
│                                                                               │
│  Option A: Using Homebrew (Recommended)                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Terminal Command:                                                        │ │
│  │ brew install hammerspoon --cask                                         │ │
│  │                                                                          │ │
│  │ What happens:                                                            │ │
│  │ • Downloads and installs Hammerspoon automatically                      │ │
│  │ • Creates application in /Applications/Hammerspoon.app                  │ │
│  │ • Takes 2-3 minutes depending on internet speed                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Option B: Manual Download (If Homebrew not available)                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 1. Visit: https://www.hammerspoon.org/                                  │ │
│  │ 2. Click "Download" button                                               │ │
│  │ 3. Open downloaded .zip file                                             │ │
│  │ 4. Drag Hammerspoon.app to Applications folder                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  🔐 SECURITY SETUP (First Run)                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 1. Open Hammerspoon from Applications folder                            │ │
│  │ 2. macOS will ask for Accessibility permissions                         │ │
│  │ 3. Click "Open System Preferences"                                       │ │
│  │ 4. Check box next to "Hammerspoon"                                       │ │
│  │ 5. Return to Hammerspoon - you'll see menubar icon                     │ │
│  │                                                                          │ │
│  │ Visual Guide:                                                            │ │
│  │ Menubar: [📱] [🔊] [📶] [🔋] [🔨] ← Hammerspoon icon appears here       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ✅ SUCCESS: You see Hammerspoon icon in menubar and can click it          │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Development Workspace Configuration

```lua
-- ~/.hammerspoon/init.lua
-- Ultimate Development Workspace Automation Configuration

print("🚀 Loading Development Workspace Automation...")

-- ============================================================================
-- CONFIGURATION CONSTANTS
-- ============================================================================

local DEV_WORKSPACE = "/Users/goodfranklin/Development"
local ACTIVE_PROJECTS = DEV_WORKSPACE .. "/Active-Projects"
local TEMPLATES = DEV_WORKSPACE .. "/Templates"
local DOCS = DEV_WORKSPACE .. "/Documentation" 
local SCRIPTS = DEV_WORKSPACE .. "/Scripts"

-- Hotkey modifier combinations
local hyper = {"cmd", "alt", "ctrl", "shift"}  -- Ultimate power combo
local dev = {"cmd", "alt", "ctrl"}              -- Development shortcuts

-- ============================================================================
-- WORKSPACE MANAGEMENT FUNCTIONS
-- ============================================================================

-- Open Development workspace in Finder
hs.hotkey.bind(dev, "D", function()
    hs.application.launchOrFocus("Finder")
    hs.timer.doAfter(0.5, function()
        hs.execute("open '" .. DEV_WORKSPACE .. "'")
    end)
    hs.alert.show("🚀 Development Workspace", {
        textSize = 18,
        strokeColor = {white = 0, alpha = 0},
        fillColor = {blue = 1, alpha = 0.8}
    }, 2)
end)

-- Open current project in Cursor IDE
hs.hotkey.bind(dev, "C", function()
    local currentProject = getCurrentProject()
    if currentProject then
        hs.execute("cursor '" .. ACTIVE_PROJECTS .. "/" .. currentProject .. "'")
        hs.alert.show("📝 Opening " .. currentProject .. " in Cursor", {
            textSize = 16,
            fillColor = {green = 1, alpha = 0.8}
        }, 2)
    else
        -- Show project selector if no current project
        showProjectSelector()
    end
end)

-- Open template library
hs.hotkey.bind(dev, "T", function()
    hs.execute("open '" .. TEMPLATES .. "'")
    hs.alert.show("📦 Template Library", {
        textSize = 16,
        fillColor = {purple = 1, alpha = 0.8}  
    }, 2)
end)

-- Open documentation hub
hs.hotkey.bind(dev, "F", function()
    hs.execute("open '" .. DOCS .. "'")
    hs.alert.show("📚 Documentation Hub", {
        textSize = 16,
        fillColor = {orange = 1, alpha = 0.8}
    }, 2)
end)

-- ============================================================================
-- PROJECT SWITCHING AND MANAGEMENT
-- ============================================================================

-- Interactive project switcher
hs.hotkey.bind(dev, "P", function()
    showProjectSelector()
end)

function showProjectSelector()
    local projects = getActiveProjects()
    local choices = {}
    
    -- Add "New Project" option
    table.insert(choices, {
        ["text"] = "➕ Create New Project",
        ["subText"] = "Start a new project with templates",
        ["uuid"] = "NEW_PROJECT"
    })
    
    -- Add existing projects
    for i, project in ipairs(projects) do
        local healthScore = getProjectHealth(project)
        local healthEmoji = healthScore > 80 and "✅" or healthScore > 60 and "⚠️" or "🔴"
        
        table.insert(choices, {
            ["text"] = project,
            ["subText"] = "Health: " .. healthScore .. "% " .. healthEmoji,
            ["uuid"] = project
        })
    end
    
    local chooser = hs.chooser.new(function(choice)
        if choice then
            if choice.uuid == "NEW_PROJECT" then
                createNewProject()
            else
                setCurrentProject(choice.uuid)
                hs.execute("cursor '" .. ACTIVE_PROJECTS .. "/" .. choice.uuid .. "'")
                hs.alert.show("🔄 Switched to " .. choice.uuid, 2)
            end
        end
    end)
    
    chooser:choices(choices)
    chooser:placeholderText("Choose project to open...")
    chooser:show()
end

-- ============================================================================
-- DEVELOPMENT LAYOUT AUTOMATION
-- ============================================================================

-- Setup professional development window layout
hs.hotkey.bind(dev, "L", function()
    hs.alert.show("🖥️ Setting up development layout...", 1)
    
    local screen = hs.screen.mainScreen()
    local frame = screen:frame()
    
    -- Development layout: Cursor (left 60%), Browser (right 40%), Terminal (bottom 30%)
    
    -- Cursor IDE - Left side, top 70%
    local cursor = hs.application.find("Cursor")
    if cursor then
        local cursorFrame = hs.geometry.rect(
            frame.x,                    -- x position
            frame.y,                    -- y position  
            frame.w * 0.6,              -- width: 60% of screen
            frame.h * 0.7               -- height: 70% of screen
        )
        cursor:mainWindow():setFrame(cursorFrame)
    end
    
    -- Browser - Right side, top 70%  
    local browser = hs.application.find("Google Chrome") or 
                   hs.application.find("Safari") or
                   hs.application.find("Arc")
    if browser then
        local browserFrame = hs.geometry.rect(
            frame.x + (frame.w * 0.6),  -- x: start after Cursor
            frame.y,                    -- y: top of screen
            frame.w * 0.4,              -- width: 40% of screen
            frame.h * 0.7               -- height: 70% of screen
        )
        browser:mainWindow():setFrame(browserFrame)
    end
    
    -- Terminal - Bottom strip, full width
    local terminal = hs.application.find("Terminal") or 
                    hs.application.find("iTerm") or
                    hs.application.find("iTerm2")
    if terminal then
        local terminalFrame = hs.geometry.rect(
            frame.x,                    -- x: full width start
            frame.y + (frame.h * 0.7),  -- y: bottom 30%
            frame.w,                    -- width: full screen width
            frame.h * 0.3               -- height: 30% of screen
        )
        terminal:mainWindow():setFrame(terminalFrame)
    end
    
    hs.timer.doAfter(1, function()
        hs.alert.show("✅ Development layout configured!", {
            textSize = 18,
            fillColor = {green = 1, alpha = 0.9}
        }, 2)
    end)
end)

-- ============================================================================
-- OPTIMIZATION WORKFLOW AUTOMATION
-- ============================================================================

-- Run 6-phase optimization on current project
hs.hotkey.bind(dev, "O", function()
    local currentProject = getCurrentProject()
    if currentProject then
        local projectPath = ACTIVE_PROJECTS .. "/" .. currentProject
        
        hs.alert.show("⚡ Starting 6-phase optimization of " .. currentProject, {
            textSize = 16,
            fillColor = {blue = 1, alpha = 0.8}
        }, 3)
        
        -- Run optimization in background
        hs.task.new("/bin/bash", function(exitCode, stdOut, stdErr)
            if exitCode == 0 then
                hs.alert.show("✅ Optimization completed successfully!", {
                    textSize = 18,
                    fillColor = {green = 1, alpha = 0.9}
                }, 3)
                
                -- Show results
                hs.timer.doAfter(1, function()
                    hs.execute("open '" .. projectPath .. "/docs/OPTIMIZATION_APPLIED.md'")
                end)
            else
                hs.alert.show("❌ Optimization failed - check terminal for details", {
                    textSize = 16,
                    fillColor = {red = 1, alpha = 0.8}
                }, 3)
            end
        end, {SCRIPTS .. "/apply-6-phase-optimization.sh", projectPath}):start()
    else
        hs.alert.show("❌ No current project selected", 2)
    end
end)

-- Extract template from current project
hs.hotkey.bind(dev, "E", function()
    local currentProject = getCurrentProject()
    if currentProject then
        local projectPath = ACTIVE_PROJECTS .. "/" .. currentProject
        
        hs.alert.show("📦 Extracting template from " .. currentProject, {
            textSize = 16,
            fillColor = {purple = 1, alpha = 0.8}
        }, 3)
        
        hs.task.new("/bin/bash", function(exitCode, stdOut, stdErr)
            if exitCode == 0 then
                hs.alert.show("✅ Template extraction complete!", {
                    textSize = 18,
                    fillColor = {green = 1, alpha = 0.9}
                }, 3)
                
                -- Open template folder
                hs.timer.doAfter(1, function()
                    hs.execute("open '" .. TEMPLATES .. "/Community-Ready/'")
                end)
            else
                hs.alert.show("❌ Template extraction failed", 2)
            end
        end, {SCRIPTS .. "/extract-community-template.sh", projectPath}):start()
    else
        hs.alert.show("❌ No current project selected", 2)
    end
end)

-- ============================================================================
-- WORKSPACE MONITORING AND AUTOMATION
-- ============================================================================

-- Monitor workspace health
hs.hotkey.bind(dev, "H", function()
    hs.alert.show("📊 Analyzing workspace health...", 2)
    
    hs.task.new("/bin/bash", function(exitCode, stdOut, stdErr)
        if exitCode == 0 then
            -- Parse health results and show summary
            local healthData = parseHealthResults(stdOut)
            showHealthDashboard(healthData)
        end
    end, {SCRIPTS .. "/monitor-project-health.sh"}):start()
end)

function showHealthDashboard(healthData)
    local dashboardText = "📊 WORKSPACE HEALTH\n" ..
                         "==================\n" ..
                         "Active Projects: " .. healthData.projectCount .. "\n" ..
                         "Average Health: " .. healthData.averageHealth .. "%\n" ..
                         "Total Storage: " .. healthData.totalStorage .. "\n\n" ..
                         "Press H again for detailed report"
    
    hs.alert.show(dashboardText, {
        textSize = 14,
        strokeWidth = 2,
        fillColor = {blue = 0.8, alpha = 0.9}
    }, 5)
end

-- ============================================================================
-- FILE ORGANIZATION AUTOMATION
-- ============================================================================

-- Trigger intelligent file organization
hs.hotkey.bind(dev, "R", function()
    hs.alert.show("🤖 Running intelligent file organization...", 2)
    
    hs.task.new("/bin/bash", function(exitCode, stdOut, stdErr)
        if exitCode == 0 then
            local organizedCount = stdOut:match("organized (%d+)") or "unknown"
            hs.alert.show("✅ Organized " .. organizedCount .. " files!", {
                textSize = 16,
                fillColor = {green = 1, alpha = 0.8}
            }, 3)
        else
            hs.alert.show("⚠️ Organization completed with warnings", 2)
        end
    end, {SCRIPTS .. "/run-automation.sh"}):start()
end)

-- Watch Downloads folder for development files
local downloadsWatcher = hs.pathwatcher.new(os.getenv("HOME") .. "/Downloads", function(files)
    for _, file in ipairs(files) do
        local fileName = file:match("([^/]+)$")
        if fileName and (
            fileName:match("%.zip$") or 
            fileName:match("template") or 
            fileName:match("starter") or
            fileName:match("boilerplate") or
            fileName:match("framework")
        ) then
            hs.timer.doAfter(3, function() -- Wait for download completion
                hs.alert.show("📦 Development file detected - organizing...", 1)
                hs.task.new("/bin/bash", nil, {SCRIPTS .. "/organize-downloads.sh"}):start()
            end)
            break
        end
    end
end):start()

-- ============================================================================
-- AI ASSISTANT INTEGRATION
-- ============================================================================

-- Launch Claude Code with current project context
hs.hotkey.bind(dev, "A", function()
    local currentProject = getCurrentProject()
    if currentProject then
        local projectPath = ACTIVE_PROJECTS .. "/" .. currentProject
        
        -- Open Claude Code in project directory
        hs.execute("cd '" .. projectPath .. "' && claude")
        
        hs.alert.show("🤖 Claude Code activated for " .. currentProject, {
            textSize = 16,
            fillColor = {cyan = 1, alpha = 0.8}
        }, 2)
    else
        hs.alert.show("❌ No current project - select project first", 2)
    end
end)

-- Quick access to optimization documentation
hs.hotkey.bind(dev, "Q", function()
    hs.execute("open '" .. DOCS .. "/Quick-Reference/QUICK_START_INDEX.md'")
    hs.alert.show("📖 Quick Reference opened", 2)
end)

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

function getCurrentProject()
    -- Read current project from workspace file
    local file = io.open(DEV_WORKSPACE .. "/.current-project", "r")
    if file then
        local project = file:read("*line")
        file:close()
        return project
    end
    return nil
end

function setCurrentProject(projectName)
    -- Write current project to workspace file
    local file = io.open(DEV_WORKSPACE .. "/.current-project", "w")
    if file then
        file:write(projectName)
        file:close()
    end
    
    -- Update menubar indicator
    updateMenubar(projectName)
end

function getActiveProjects()
    -- Scan active projects directory
    local projects = {}
    local handle = io.popen("ls -1 '" .. ACTIVE_PROJECTS .. "' 2>/dev/null")
    if handle then
        for line in handle:lines() do
            if line ~= "." and line ~= ".." and not line:match("^%.") then
                table.insert(projects, line)
            end
        end
        handle:close()
    end
    return projects
end

function getProjectHealth(projectName)
    -- Quick health check for project
    local projectPath = ACTIVE_PROJECTS .. "/" .. projectName
    local handle = io.popen("cd '" .. projectPath .. "' && " .. SCRIPTS .. "/quick-health-check.sh 2>/dev/null")
    if handle then
        local result = handle:read("*line")
        handle:close()
        return tonumber(result) or 50 -- Default to 50% if can't determine
    end
    return 50
end

function createNewProject()
    -- Interactive new project creation
    hs.focus()
    
    local projectTypes = {
        {text = "React TypeScript App", value = "react-ts"},
        {text = "Vue TypeScript App", value = "vue-ts"}, 
        {text = "Next.js Full-Stack App", value = "nextjs"},
        {text = "Node.js Backend API", value = "node-api"},
        {text = "Documentation Site", value = "docs-site"}
    }
    
    local typeChooser = hs.chooser.new(function(choice)
        if choice then
            createProjectFromTemplate(choice.value)
        end
    end)
    
    typeChooser:choices(projectTypes)
    typeChooser:placeholderText("Choose project type...")
    typeChooser:show()
end

function createProjectFromTemplate(projectType)
    -- Create new project based on template
    local projectName = hs.dialog.textPrompt("Project Name", "Enter name for new project:", "", "OK", "Cancel")
    
    if projectName then
        local templatePath = TEMPLATES .. "/React-Templates/intermediate"  -- Default template
        local newProjectPath = ACTIVE_PROJECTS .. "/" .. projectName
        
        hs.alert.show("🏗️ Creating " .. projectName .. "...", 2)
        
        hs.task.new("/bin/bash", function(exitCode, stdOut, stdErr)
            if exitCode == 0 then
                setCurrentProject(projectName)
                hs.alert.show("✅ " .. projectName .. " created successfully!", 3)
                
                -- Open in Cursor
                hs.timer.doAfter(1, function()
                    hs.execute("cursor '" .. newProjectPath .. "'")
                end)
            else
                hs.alert.show("❌ Project creation failed", 2)
            end
        end, {"-c", "cp -r '" .. templatePath .. "' '" .. newProjectPath .. "' && cd '" .. newProjectPath .. "' && npm install"}):start()
    end
end

-- ============================================================================
-- MENUBAR INTEGRATION
-- ============================================================================

local menubar = hs.menubar.new()

function updateMenubar(currentProject)
    if currentProject then
        menubar:setTitle("🚀 " .. currentProject:sub(1, 8))
        menubar:setTooltip("Current project: " .. currentProject)
    else
        menubar:setTitle("🚀 Dev")
        menubar:setTooltip("No current project selected")
    end
end

-- Menubar click handler
menubar:setClickCallback(function()
    showProjectSelector()
end)

-- Initialize menubar
updateMenubar(getCurrentProject())

-- ============================================================================
-- AUTOMATION TRIGGERS
-- ============================================================================

-- Daily workspace maintenance (runs at 9 AM)
hs.timer.doAt("09:00", "1d", function()
    hs.alert.show("🤖 Running daily workspace maintenance...", 2)
    hs.task.new("/bin/bash", nil, {SCRIPTS .. "/run-automation.sh"}):start()
end)

-- Project health monitoring (runs every 4 hours during work day)
hs.timer.doEvery(4 * 3600, function()
    local hour = tonumber(os.date("%H"))
    if hour >= 9 and hour <= 17 then -- Only during work hours
        hs.task.new("/bin/bash", function(exitCode, stdOut, stdErr)
            if stdOut and stdOut:match("CRITICAL") then
                hs.alert.show("🚨 Project health issues detected", {
                    fillColor = {red = 1, alpha = 0.9}
                }, 5)
            end
        end, {SCRIPTS .. "/monitor-project-health.sh"}):start()
    end
end)

-- ============================================================================
-- HELP AND DOCUMENTATION
-- ============================================================================

-- Show help with all available shortcuts
hs.hotkey.bind(dev, "/", function()
    local helpText = [[
🚀 DEVELOPMENT WORKSPACE SHORTCUTS

Workspace:
  Cmd+Alt+Ctrl+D: Open Development workspace
  Cmd+Alt+Ctrl+T: Template library
  Cmd+Alt+Ctrl+F: Documentation hub

Projects:
  Cmd+Alt+Ctrl+C: Open current project in Cursor
  Cmd+Alt+Ctrl+P: Project switcher
  Cmd+Alt+Ctrl+L: Setup development layout

Optimization:
  Cmd+Alt+Ctrl+O: Run 6-phase optimization
  Cmd+Alt+Ctrl+E: Extract community template
  Cmd+Alt+Ctrl+H: Workspace health check

Automation:
  Cmd+Alt+Ctrl+R: Run file organization
  Cmd+Alt+Ctrl+A: Launch Claude Code with context
  Cmd+Alt+Ctrl+Q: Quick reference docs

Help:
  Cmd+Alt+Ctrl+/: Show this help (current)
]]
    
    hs.alert.show(helpText, {
        textSize = 12,
        strokeWidth = 2,
        fillColor = {blue = 0.2, alpha = 0.95},
        strokeColor = {blue = 1, alpha = 1}
    }, 10)
end)

-- ============================================================================
-- INITIALIZATION
-- ============================================================================

print("✅ Development Workspace Automation loaded successfully!")
print("📋 Available hotkeys: Cmd+Alt+Ctrl + [D,C,T,F,P,L,O,E,H,R,A,Q,/]")
print("🎯 Current project: " .. (getCurrentProject() or "None selected"))

-- Show welcome message
hs.timer.doAfter(2, function()
    hs.alert.show("🚀 Development automation ready!\nPress Cmd+Alt+Ctrl+/ for help", {
        textSize = 16,
        fillColor = {green = 0.8, alpha = 0.9}
    }, 4)
end)
```

### Quick Setup Script for Hammerspoon

```bash
#!/bin/bash
# /Users/goodfranklin/Development/Scripts/setup-hammerspoon.sh
# Automated Hammerspoon setup for development workspace

echo "🔨 Hammerspoon Development Automation Setup"
echo "==========================================="

# Check if Hammerspoon is installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew first..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

if [ ! -d "/Applications/Hammerspoon.app" ]; then
    echo "🔨 Installing Hammerspoon..."
    brew install hammerspoon --cask
    echo "✅ Hammerspoon installed"
else
    echo "✅ Hammerspoon already installed"
fi

# Create Hammerspoon configuration directory
mkdir -p ~/.hammerspoon

# Copy our development configuration
echo "⚙️ Setting up development automation configuration..."

# Create the main init.lua file
cat > ~/.hammerspoon/init.lua << 'EOF'
-- Development Workspace Automation
-- Auto-generated by Ultimate Optimization Framework

print("🚀 Loading Development Workspace Automation...")

-- Load the development workspace configuration
require("development-workspace")

-- Load additional development utilities
require("development-utils")

print("✅ Development automation ready!")
EOF

# Create development-utils.lua for additional utilities
cat > ~/.hammerspoon/development-utils.lua << 'EOF'
-- Development utility functions

-- Function to parse health check results
function parseHealthResults(output)
    local projectCount = output:match("Active Projects: (%d+)") or "0"
    local averageHealth = output:match("Average Health: (%d+)%%") or "50"
    local totalStorage = output:match("Total: ([%d%.]+[KMGT]B)") or "Unknown"
    
    return {
        projectCount = tonumber(projectCount),
        averageHealth = tonumber(averageHealth),
        totalStorage = totalStorage
    }
end

-- Function to create quick health check script
function createQuickHealthCheck()
    local script = [[
#!/bin/bash
# Quick project health check
cd "$1" 2>/dev/null || exit 1

score=50
if [ -f "package.json" ]; then
    score=$((score + 20))
    if npm run build &>/dev/null; then
        score=$((score + 30))
    fi
fi

echo $score
]]
    
    local file = io.open("/Users/goodfranklin/Development/Scripts/quick-health-check.sh", "w")
    if file then
        file:write(script)
        file:close()
        os.execute("chmod +x /Users/goodfranklin/Development/Scripts/quick-health-check.sh")
    end
end

-- Create the health check script on load
createQuickHealthCheck()

print("📊 Development utilities loaded")
EOF

# Copy our main development workspace configuration
cp /Users/goodfranklin/lineartime/docs/HAMMERSPOON_DEVELOPMENT_AUTOMATION.md ~/.hammerspoon/development-workspace.lua

echo ""
echo "🎉 Hammerspoon setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Open Hammerspoon from Applications folder"
echo "2. Grant Accessibility permissions when prompted"
echo "3. Look for 🔨 icon in menubar"
echo "4. Test shortcuts: Cmd+Alt+Ctrl+D opens workspace"
echo ""
echo "🚀 Your development automation is ready!"
```

## 📊 Advanced Workspace Analytics

### Real-Time Development Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT WORKSPACE ANALYTICS                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  📈 PRODUCTIVITY METRICS (Live Dashboard)                                   │
│                                                                               │
│  Today's Development Activity:                                               │
│  ├─ Projects Worked On: ████████████████████░░░░░░░░░░░ 3 projects         │
│  ├─ Optimization Runs: ████████░░░░░░░░░░░░░░░░░░░░░░░░ 2 optimizations    │
│  ├─ Templates Used: ██████████████░░░░░░░░░░░░░░░░░░ 4 template applications│
│  ├─ Files Organized: ████████████████████████████░░░░ 147 files automated  │
│  └─ Time Saved: ████████████████████████████████████ 4.2 hours saved      │
│                                                                               │
│  🏆 WEEKLY ACHIEVEMENTS                                                      │
│  ├─ Projects Optimized: 7 (target: 5) ✅                                   │
│  ├─ Templates Extracted: 3 (target: 2) ✅                                  │
│  ├─ Community Contributions: 1 (target: 1) ✅                              │
│  ├─ Automation Success Rate: 94% (target: 90%) ✅                          │
│  └─ Learning Goals: 85% completed (target: 80%) ✅                          │
│                                                                               │
│  📊 WORKSPACE HEALTH TRENDS                                                  │
│                                                                               │
│  Workspace Health Over Time:                                                │
│  100% ┤                                                      ●               │
│   90% ┤                                               ●──────●               │
│   80% ┤                                        ●──────●                     │
│   70% ┤                                 ●──────●                            │
│   60% ┤                          ●──────●                                   │
│   50% ┤                   ●──────●                                          │
│   40% ┤            ●──────●                                                 │
│   30% ┤     ●──────●                                                        │
│       └──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────               │
│            Week1   Week2  Week3  Week4  Week5  Week6  Week7                 │
│                                                                               │
│  📈 KEY INSIGHTS                                                             │
│  • Steady improvement in workspace organization and health                   │
│  • Automation effectiveness increasing with usage                           │
│  • Template extraction success rate: 100%                                   │
│  • Community template downloads: 2,847 total                                │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*This Hammerspoon Development Automation system transforms your Mac into a professional development powerhouse with intelligent automation, one-hotkey workflows, and seamless integration with your optimization framework.*