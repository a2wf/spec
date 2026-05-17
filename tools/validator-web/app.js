// A2WF Validator-Web  -  Alpine.js component.
// Uses the shared validator core from ../../validator/v1_1/core.js.
// Runs entirely in the browser, no telemetry.

import { createValidator, validateSemanticOnly } from '../../validator/v1_1/core.js';

const SCHEMA_URL = '../../schema/core-v1.1.json';
const EXAMPLES_BASE = '../../examples/v1.1/';

let validator = null;

async function loadValidator() {
  if (validator) return validator;
  const Ajv2020 = window.A2WF_Ajv2020;
  const addFormats = window.A2WF_addFormats;
  if (!Ajv2020 || !addFormats) {
    console.error('A2WF: Ajv bundle not loaded. Validation will be DEGRADED. Make sure tools/vendor/ajv-browser-bundle.js is reachable.');
    validator = {
      validate: validateSemanticOnly,
      degraded: true,
    };
    return validator;
  }
  const ajv = new Ajv2020({ allErrors: true, strict: false, verbose: true });
  addFormats(ajv);
  const schema = await fetch(SCHEMA_URL).then(r => r.json());
  validator = createValidator({ ajv, schema });
  return validator;
}

window.validatorApp = function validatorApp() {
  const MAX_DOC_BYTES = 2 * 1024 * 1024; // 2 MB
  return {
    dragover: false,
    pasteMode: false,
    pasteText: '',
    error: '',
    result: null,
    filter: 'all',

    async init() {
      await loadValidator();
    },

    get filteredFindings() {
      if (!this.result) return [];
      const findings = this.result.findings || [];
      if (this.filter === 'all') return findings;
      return findings.filter(f => f.severity === this.filter);
    },

    async onDrop(ev) {
      this.dragover = false;
      const file = ev.dataTransfer.files && ev.dataTransfer.files[0];
      if (file) await this.readFile(file);
    },

    async onFile(ev) {
      const file = ev.target.files && ev.target.files[0];
      if (file) await this.readFile(file);
    },

    async readFile(file) {
      this.error = '';
      if (file.size > MAX_DOC_BYTES) {
        this.error = `File is ${(file.size / 1024 / 1024).toFixed(2)} MB. The browser validator only accepts files up to ${MAX_DOC_BYTES / 1024 / 1024} MB. Use the CLI validator (validator/v1_1/cli.js) for larger documents.`;
        this.result = null;
        return;
      }
      const text = await file.text();
      this.validateText(text, file.name);
    },

    async validatePaste() {
      if (this.pasteText.length > MAX_DOC_BYTES) {
        this.error = `Pasted content is too large. The browser validator only accepts up to ${MAX_DOC_BYTES / 1024 / 1024} MB.`;
        this.result = null;
        return;
      }
      this.validateText(this.pasteText, 'pasted document');
    },

    async validateText(text, label) {
      this.error = '';
      let doc;
      try {
        doc = JSON.parse(text);
      } catch (e) {
        this.error = `${label}: not valid JSON  -  ${e.message}`;
        this.result = null;
        return;
      }
      const v = await loadValidator();
      this.result = v.validate(doc);
      this.result.label = label;
    },

    async loadExample(name) {
      this.error = '';
      try {
        const text = await fetch(`${EXAMPLES_BASE}${name}.json`).then(r => r.text());
        this.validateText(text, `${name}.json (example)`);
      } catch (e) {
        this.error = `Could not load example ${name}: ${e.message}`;
      }
    },

    exportJSON() {
      if (!this.result) return;
      const blob = new Blob([JSON.stringify(this.result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'a2wf-validation-report.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    printReport() {
      window.print();
    },
  };
};

if (typeof window.__a2wfTryStart === 'function') window.__a2wfTryStart();
