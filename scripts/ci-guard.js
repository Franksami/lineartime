#!/usr/bin/env node
/**
 * Foundation Guard: fail if archived/deprecated components are imported
 * outside allowed paths.
 */
const { execSync } = require('node:child_process')

function run(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString()
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
    enhancedError.stdout = error.stdout?.toString() || null
    enhancedError.stderr = error.stderr?.toString() || null
    
    throw enhancedError
  }
}

const banned = [
  'components/calendar/LinearCalendarVertical',
  'components/mobile/MobileCalendarView',
]

const allowlist = [
  'components/calendar/_archive',
  'components/mobile/_archive',
  'docs/archive',
]

function isAllowed(path) {
  return allowlist.some(prefix => path.includes(prefix))
}

let violations = []

for (const bannedPath of banned) {
  try {
    const rg = run(`rg -n "${bannedPath}" --hidden --glob '!node_modules/**' || true`)
    if (!rg.trim()) continue
    const lines = rg.trim().split('\n')
    for (const line of lines) {
      const [file] = line.split(':')
      if (!isAllowed(file)) {
        violations.push(line)
      }
    }
  } catch (e) {}
}

if (violations.length) {
  console.error('\nFoundation Guard: banned imports detected:')
  for (const v of violations) console.error(' -', v)
  console.error('\nFix: remove imports or move references to allowed archive paths.')
  process.exit(1)
}

console.log('Foundation Guard: no banned imports found.')

