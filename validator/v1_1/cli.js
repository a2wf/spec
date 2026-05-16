#!/usr/bin/env node
// A2WF v1.1 CLI Validator
// Usage:
//   node validator/v1_1/cli.js <file.json> [<file2.json> ...]
//   node validator/v1_1/cli.js --json <file.json>      # JSON output
//   node validator/v1_1/cli.js --strict <file.json>    # WARN treated as FAIL

import path from 'node:path';
import { validateFileV11 } from './validator.js';

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const strict = args.includes('--strict');
const files = args.filter(a => !a.startsWith('--'));

if (files.length === 0) {
  console.error('Usage: node validator/v1_1/cli.js [--json] [--strict] <file.json> [...]');
  process.exit(2);
}

let exitCode = 0;
const allResults = [];

for (const file of files) {
  const result = validateFileV11(path.resolve(file));
  allResults.push({ file, ...result });

  const summary = result.summary;
  const hasFail = summary.fail > 0;
  const hasWarn = summary.warn > 0;

  if (!jsonOutput) {
    const status = hasFail ? '✗ FAIL'
                : (hasWarn && strict) ? '✗ FAIL (strict)'
                : hasWarn ? '⚠ WARN' : '✓ PASS';
    console.log(`\n${status}  ${file}`);
    console.log(`  pass=${summary.pass}  warn=${summary.warn}  fail=${summary.fail}`);
    for (const f of result.findings) {
      const tag = f.severity.toUpperCase().padEnd(5);
      const sec = f.specSection ? ` [§${f.specSection}]` : '';
      console.log(`  ${tag} ${f.path}${sec}: ${f.message}`);
    }
  }

  if (hasFail || (strict && hasWarn)) exitCode = 1;
}

if (jsonOutput) {
  process.stdout.write(JSON.stringify(allResults, null, 2) + '\n');
}

process.exit(exitCode);
