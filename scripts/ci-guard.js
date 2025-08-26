#!/usr/bin/env node
/**
 * Foundation Guard: fail if archived/deprecated components are imported
 * outside allowed paths.
 */
const { execSync } = require('node:child_process')

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (error) {
    // Extract details from execSync error
    const commandInfo = `Command: ${cmd}`
    const exitCodeInfo = error.status !== undefined ? `Exit code: ${error.status}` : 'Exit code: unknown'
    const stdoutInfo = error.stdout ? `Stdout: ${error.stdout.toString()}` : 'Stdout: none'
    const stderrInfo = error.stderr ? `Stderr: ${error.stderr.toString()}` : 'Stderr: none'
    
    // Create comprehensive error message
    const errorMessage = [
      'Command execution failed:',
      commandInfo,
      exitCodeInfo,
      stdoutInfo,
      stderrInfo
    ].join('\n')
    
    // Create new error with enhanced message while preserving original error
    const enhancedError = new Error(errorMessage)
    enhancedError.originalError = error
    enhancedError.command = cmd
    enhancedError.exitCode = error.status
    enhancedError.stdout = error.stdout?.toString() ?? null
    enhancedError.stderr = error.stderr?.toString() ?? null
    
    throw enhancedError
  }
}

const banned = [
  'components/calendar/LinearCalendarVertical',
  'components/mobile/MobileCalendarView',
  'backdrop-blur',
]

const allowlist = [
  'components/calendar/_archive',
  'components/mobile/_archive',
  'docs/',
  'tests/',
  'app/test-',
  'app/events-test/',
]

function isAllowed(path) {
  return allowlist.some(prefix => path.includes(prefix))
}

let violations = []

for (const bannedPath of banned) {
  try {
    // Use fixed-string mode (-F) to treat bannedPath literally, not as regex
    const rg = run(`rg -n -F "${bannedPath.replace(/"/g, '\\"')}" --hidden --glob '!node_modules/**'`)
    if (!rg.trim()) continue
    const lines = rg.trim().split('\n')
    for (const line of lines) {
      const [file] = line.split(':')
      if (!isAllowed(file)) {
        violations.push(line)
      }
    }
  } catch (e) {
    // ripgrep returns non-zero when no matches found, which is expected
    if (e.message.includes('exit code') && e.message.includes('1')) {
      // No matches found, which is good - continue
      continue
    }
    console.warn(`Warning: Failed to check banned path "${bannedPath}":`, e.message)
  }
}

// Also regex-scan for brand Tailwind color utilities (bg/text/border)
try {
  const colorPattern = String.raw`\b(?:bg|text|border)-(?:blue|green|orange|purple|red|yellow|pink|indigo|cyan|lime|emerald|violet|rose|amber|teal|sky|slate|gray|zinc|neutral|stone)-(?:100|200|300|400|500|600|700|800|900)\b`
  const rgColors = run(`rg -n "${colorPattern}" --hidden --glob '!node_modules/**'`)
  if (rgColors.trim()) {
    const lines = rgColors.trim().split('\n')
    for (const line of lines) {
      const [file] = line.split(':')
      if (!isAllowed(file)) {
        violations.push(line)
      }
    }
  }
} catch (e) {
  if (!(e.message.includes('exit code') && e.message.includes('1'))) {
    console.warn('Warning: Failed to scan brand color utilities:', e.message)
  }
}

if (violations.length) {
  console.error('\nFoundation Guard: banned imports detected:')
  for (const v of violations) console.error(' -', v)
  console.error('\nFix: remove imports, blur utilities, or brand color classes. Use tokens instead.')
  process.exit(1)
}

console.log('Foundation Guard: no banned imports found.')

