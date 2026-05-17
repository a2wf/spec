// A2WF v1.1 Validator: Node entry point.
// Loads the schema from disk, wires it into the shared core, and exposes
// validateV11/validateFileV11 the same way previous releases did.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { createValidator } from './core.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.resolve(HERE, '..', '..', 'schema', 'core-v1.1.json');

const ajv = new Ajv2020.default({
  allErrors: true,
  strict: false,
  verbose: true,
});
addFormats.default(ajv);

let cachedValidator = null;
function getValidator() {
  if (cachedValidator) return cachedValidator;
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
  cachedValidator = createValidator({ ajv, schema });
  return cachedValidator;
}

export function validateV11(doc, options = {}) {
  return getValidator().validate(doc, options);
}

export function validateFileV11(filePath, options = {}) {
  const raw = readFileSync(filePath, 'utf8');
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (e) {
    return {
      specVersion: '1.1',
      valid: false,
      summary: { pass: 0, warn: 0, fail: 1 },
      findings: [{
        severity: 'fail',
        path: '/',
        message: `Document is not valid JSON: ${e.message}`,
        specSection: '2.1',
      }],
    };
  }
  return validateV11(doc, options);
}

export { createValidator };
