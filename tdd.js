#!/usr/bin/env node
const { spawn } = require('child_process');

// Support being called via `npm run tdd -- assignment3a` or `node tdd.js assignment3a`
const arg = process.argv[2];

let pattern;
if (arg) {
  // original shell: s1="^tdd/.*"; s2=".*\.test\.js"; pattern=$s1$1$s2
  const s1 = '^tdd/.*';
  const s2 = '.*\\.test\\.js';
  pattern = `${s1}${arg}${s2}`;
} else {
  pattern = '^tdd/.+\\.test\\.js';
}

// Build a single command string and spawn it via the shell. This is
// more robust across Windows (cmd.exe) and Unix shells and avoids
// platform-specific executable shims causing spawn EINVAL.
const cmd = `npx jest --testPathPatterns "${pattern}"`;

const child = spawn(cmd, { stdio: 'inherit', shell: true });

child.on('exit', (code) => process.exit(code));
child.on('error', (err) => {
  console.error('Failed to run jest via shell command:', err);
  process.exit(1);
});
