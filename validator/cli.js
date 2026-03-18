#!/usr/bin/env node
import path from 'node:path';
import { validateFile } from './index.js';

const args = process.argv.slice(2);
const profileArg = args.find((arg) => arg.startsWith('--profile='));
const profile = profileArg ? profileArg.split('=')[1] : 'core+extensions';
const files = args.filter((arg) => !arg.startsWith('--'));

if (files.length === 0) {
  console.error('Usage: node validator/cli.js [--profile=core|core+extensions] <file...>');
  process.exit(1);
}

let exitCode = 0;
for (const file of files) {
  try {
    const result = validateFile(path.resolve(file), { profile });
    console.log(`\n${result.valid ? '✅' : '❌'} ${file}`);
    for (const entry of result.errors) {
      console.log(`  ERROR   ${entry.path}: ${entry.message}`);
    }
    for (const entry of result.warnings) {
      console.log(`  WARNING ${entry.path}: ${entry.message}`);
    }
    if (!result.valid) exitCode = 1;
  } catch (error) {
    exitCode = 1;
    console.log(`\n❌ ${file}`);
    console.log(`  ERROR   $: ${error.message}`);
  }
}

process.exit(exitCode);
