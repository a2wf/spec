import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateDocument, validateFile } from '../validator/index.js';

const repoRoot = path.resolve(import.meta.dirname, '..');

function loadJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

test('core minimal fixture is valid', () => {
  const result = validateFile(path.join(repoRoot, 'tests/fixtures/valid/core-minimal.json'));
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('rich extension fixture is valid', () => {
  const result = validateFile(path.join(repoRoot, 'tests/fixtures/valid/extensions-rich.json'));
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('missing identity.inLanguage is rejected', () => {
  const result = validateFile(path.join(repoRoot, 'tests/fixtures/invalid/core-missing-language.json'));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((entry) => entry.path === 'identity.inLanguage'));
});

test('extension URL must be absolute', () => {
  const result = validateFile(path.join(repoRoot, 'tests/fixtures/invalid/bad-extension-url.json'));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((entry) => entry.path === 'search.url'));
});

test('existing extension examples in repo are valid', () => {
  const files = [
    'examples/extensions/ecommerce-rich.json',
    'examples/extensions/saas-platform.json'
  ];

  for (const file of files) {
    const result = validateFile(path.join(repoRoot, file));
    assert.equal(result.valid, true, `${file} should be valid: ${JSON.stringify(result.errors)}`);
  }
});

test('existing core examples in repo are valid', () => {
  const files = [
    'examples/ecommerce.json',
    'examples/healthcare.json',
    'examples/restaurant.json',
    'examples/banking.json',
    'examples/news-media.json'
  ];

  for (const file of files) {
    const result = validateFile(path.join(repoRoot, file));
    assert.equal(result.valid, true, `${file} should be valid: ${JSON.stringify(result.errors)}`);
  }
});

test('core examples use metadata.$schema without top-level warning', () => {
  const doc = loadJson('examples/ecommerce.json');
  const result = validateDocument(doc);
  assert.ok(!result.warnings.some((entry) => entry.path === '$schema'));
  assert.equal(result.valid, true);
});
