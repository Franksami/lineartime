// Command Workspace Feature Enablement Script
// This script enables all necessary features for testing the Command Workspace MVP

const fs = require('fs');
const path = require('path');

// Feature flags to enable
const featuresToEnable = [
  // Shell features
  'shell.commandWorkspace',
  'shell.threePaneLayout',
  'shell.sidebarEnabled',

  // Phase 3 views
  'views.week',
  'views.planner',
  'views.notes',
  'views.mailbox',

  // Commands
  'commands.paletteEnabled',
  'commands.fuzzySearch',
  'commands.keyboardShortcuts',

  // AI features
  'omnibox.enabled',
  'dock.aiAssistant',

  // Foundation features (always enabled)
  'performance.monitoring',
  'performance.bundleAnalysis',
  'dev.storybookEnabled'
];

// Create a simple HTML file that will set these flags when opened
const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Enabling Command Workspace Features...</title>
</head>
<body>
    <h1>🚀 Command Workspace Features Enabled!</h1>
    <p>The following features have been enabled:</p>
    <ul>
        ${featuresToEnable.map(flag => `<li>${flag}: ✅ ENABLED</li>`).join('\n        ')}
    </ul>
    <p><a href="http://localhost:3000/app" target="_blank">Open Command Workspace</a></p>

    <script>
        // Set all feature flags
        ${featuresToEnable.map(flag => `localStorage.setItem('flag_${flag}', 'true');`).join('\n        ')}

        // Dispatch update events for real-time updates
        ${featuresToEnable.map(flag => `
        window.dispatchEvent(new CustomEvent('flag-update', {
            detail: { flag: '${flag}', enabled: true }
        }));`).join('\n        ')}

        console.log('✅ All Command Workspace features enabled successfully!');
    </script>
</body>
</html>`;

const outputPath = path.join(__dirname, 'features-enabled.html');
fs.writeFileSync(outputPath, htmlContent);

console.log('✅ Feature enablement page created!');
console.log(`📁 File: ${outputPath}`);
console.log('🌐 Open in browser: file://' + outputPath.replace(/\\/g, '/'));
console.log('');
console.log('🎯 Next steps:');
console.log('1. Open the HTML file in your browser');
console.log('2. Click the link to open the Command Workspace');
console.log('3. Test the three-pane layout and all features!');
