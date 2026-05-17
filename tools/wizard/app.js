// A2WF Wizard  -  Alpine.js component.
// Uses the shared validator core from ../../validator/v1_1/core.js.
// Runs entirely in the browser, no telemetry.

import { createValidator, validateSemanticOnly } from '../../validator/v1_1/core.js';

const SCHEMA_URL = '../../schema/core-v1.1.json';
const PRESETS_URL = './presets.json';

// Curated subset of A2WF actions. Wizard offers these; the validator accepts any value.
const ACTION_VOCABULARY = [
  { id: 'view',           schemaOrgType: 'ViewAction',         effect: 'read-only' },
  { id: 'search',         schemaOrgType: 'SearchAction',       effect: 'read-only' },
  { id: 'download',       schemaOrgType: 'DownloadAction',     effect: 'read-only' },
  { id: 'register',       schemaOrgType: 'RegisterAction',     effect: 'state-changing' },
  { id: 'subscribe',      schemaOrgType: 'SubscribeAction',    effect: 'commercial' },
  { id: 'purchase',       schemaOrgType: 'BuyAction',          effect: 'commercial' },
  { id: 'pay',            schemaOrgType: 'PayAction',          effect: 'commercial' },
  { id: 'book',           schemaOrgType: 'ReserveAction',      effect: 'commercial' },
  { id: 'cancel',         schemaOrgType: 'CancelAction',       effect: 'state-changing' },
  { id: 'comment',        schemaOrgType: 'CommentAction',      effect: 'state-changing' },
  { id: 'review',         schemaOrgType: 'ReviewAction',       effect: 'state-changing' },
  { id: 'share',          schemaOrgType: 'ShareAction',        effect: 'state-changing' },
  { id: 'chat',           schemaOrgType: 'CommunicateAction',  effect: 'read-only' },
  { id: 'consent',        schemaOrgType: 'AgreeAction',        effect: 'regulated' },
  { id: 'data-export',    schemaOrgType: 'DownloadAction',     effect: 'regulated' },
  { id: 'account-delete', schemaOrgType: 'DeleteAction',       effect: 'state-changing' },
  { id: 'report-incident',schemaOrgType: 'ReportAction',       effect: 'state-changing' },
];

const LS_KEY = 'a2wf-wizard-draft';

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

window.wizardApp = function wizardApp() {
  return {
    // wizard navigation
    step: 'preset',
    expert: false,
    importMode: false,
    importText: '',
    importError: '',

    // presets
    presets: [],
    selectedPresetId: '',

    // document state
    doc: defaultDoc(),

    // permission editor
    editingIdx: null,
    editing: emptyEditing(),

    // module toggles (Expert)
    modules: {
      jurisdictions: false,
      dataHandling: false,
      agentIdentification: false,
      auditTrail: false,
      incidentReporting: false,
      discoverabilityHints: false,
      codeOfPracticeAlignment: false,
    },

    // validation findings (refreshed reactively)
    findings: [],
    summary: { pass: 0, warn: 0, fail: 0 },

    actionVocabulary: ACTION_VOCABULARY,

    async init() {
      // restore from localStorage if any
      try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.doc) this.doc = parsed.doc;
          if (parsed && parsed.expert !== undefined) this.expert = parsed.expert;
          if (parsed && parsed.modules) this.modules = parsed.modules;
        }
      } catch (e) {
        console.warn('Could not restore draft', e);
      }
      this.presets = await fetch(PRESETS_URL).then(r => r.json()).then(p => p.presets);
      await loadValidator();
      this.scheduleValidate();
      // Persist on every change
      const save = () => localStorage.setItem(LS_KEY, JSON.stringify({
        doc: this.doc, expert: this.expert, modules: this.modules,
      }));
      this.$watch('doc', () => { save(); this.scheduleValidate(); }, { deep: true });
      this.$watch('expert', save);
      this.$watch('modules', () => { save(); this.applyModuleToggles(); }, { deep: true });
    },

    get currentPresetWarnings() {
      const p = this.presets.find(p => p.id === this.selectedPresetId);
      return (p && p.warnings) || [];
    },

    selectPreset(id) {
      this.selectedPresetId = id;
      const p = this.presets.find(p => p.id === id);
      if (!p) return;
      // Deep-clone the template
      this.doc = JSON.parse(JSON.stringify(p.template));
      if (!this.doc.metadata) this.doc.metadata = {};
      this.doc.metadata.lastUpdated = today();
      // Reset module toggles to reflect what's actually in the preset
      this.modules = {
        jurisdictions: !!this.doc.jurisdictions,
        dataHandling: !!this.doc.dataHandling,
        agentIdentification: !!this.doc.agentIdentification,
        auditTrail: !!this.doc.auditTrail,
        incidentReporting: !!this.doc.incidentReporting,
        discoverabilityHints: !!this.doc.discoverabilityHints,
        codeOfPracticeAlignment: !!this.doc.codeOfPracticeAlignment,
      };
    },

    goTo(s) { this.step = s; window.scrollTo({ top: 0, behavior: 'smooth' }); },

    addPermission() {
      this.editingIdx = this.doc.permissions.length;
      this.editing = emptyEditing();
      this.doc.permissions.push({ action: 'view', schemaOrgType: 'ViewAction', effect: 'read-only', allowed: true });
    },

    editPermission(idx) {
      this.editingIdx = idx;
      const p = this.doc.permissions[idx];
      this.editing = {
        action: ACTION_VOCABULARY.some(a => a.id === p.action) ? p.action : 'custom',
        customAction: p.action,
        schemaOrgType: p.schemaOrgType || '',
        effect: p.effect || 'read-only',
        allowed: p.allowed !== false,
        notes: p.notes || '',
        oversightLevel: p.oversight ? p.oversight.level : '',
        oversightChannel: p.oversight ? (p.oversight.channel || '') : '',
        oversightMethod: p.oversight ? (p.oversight.method || '') : '',
        oversightTimeout: p.oversight ? (p.oversight.timeout || '') : '',
      };
    },

    onActionChange() {
      const id = this.editing.action;
      const a = ACTION_VOCABULARY.find(a => a.id === id);
      if (a) {
        this.editing.schemaOrgType = a.schemaOrgType;
        this.editing.effect = a.effect;
      }
    },

    saveEdit() {
      const idx = this.editingIdx;
      if (idx === null) return;
      const e = this.editing;
      const actionId = e.action === 'custom' ? (e.customAction || 'custom-action') : e.action;
      const p = {
        action: actionId,
        allowed: !!e.allowed,
      };
      if (e.schemaOrgType) p.schemaOrgType = e.schemaOrgType;
      if (e.effect) p.effect = e.effect;
      if (e.notes) p.notes = e.notes;
      if (e.oversightLevel) {
        const o = { level: e.oversightLevel };
        if (e.oversightChannel) o.channel = e.oversightChannel;
        if (e.oversightMethod) o.method = e.oversightMethod;
        if (e.oversightTimeout) o.timeout = e.oversightTimeout;
        p.oversight = o;
      }
      this.doc.permissions[idx] = p;
      this.editingIdx = null;
    },

    cancelEdit() {
      // If we were creating a new entry that hasn't been touched, drop it
      const idx = this.editingIdx;
      if (idx !== null && idx === this.doc.permissions.length - 1) {
        const p = this.doc.permissions[idx];
        if (!p.action || p.action === 'view') {
          // Heuristic: if entry looks empty, remove it
          // The default-add already sets action: 'view', so we leave it alone
          // Only remove if it was literally never edited and is still default.
        }
      }
      this.editingIdx = null;
    },

    removePermission(idx) {
      this.doc.permissions.splice(idx, 1);
    },

    applyModuleToggles() {
      const m = this.modules;
      if (m.jurisdictions && !this.doc.jurisdictions) {
        this.doc.jurisdictions = [{ region: this.doc.identity.jurisdictionPrimary || 'EU' }];
      } else if (!m.jurisdictions) {
        delete this.doc.jurisdictions;
      }
      if (m.dataHandling && !this.doc.dataHandling) {
        this.doc.dataHandling = {
          dpvProfileURI: 'https://w3id.org/dpv/2.0',
          processing: [{
            categories: [],
            purposes: [],
          }],
          controller: { name: this.doc.identity.legalName || '', contactEmail: this.doc.identity.contactEmail || '' },
        };
      } else if (!m.dataHandling) {
        delete this.doc.dataHandling;
      }
      if (m.agentIdentification && !this.doc.agentIdentification) {
        this.doc.agentIdentification = {
          acceptedProtocols: [
            { id: 'did-core-1.0', status: 'stable', specification: 'https://www.w3.org/TR/did-core/' },
          ],
        };
      } else if (!m.agentIdentification) {
        delete this.doc.agentIdentification;
      }
      if (m.auditTrail && !this.doc.auditTrail) {
        this.doc.auditTrail = {
          enabled: true,
          events: ['policy-discovered', 'permission-decision', 'oversight-requested', 'oversight-completed'],
          privacy: { minimise: true },
          integrity: 'none',
        };
      } else if (!m.auditTrail) {
        delete this.doc.auditTrail;
      }
      if (m.incidentReporting && !this.doc.incidentReporting) {
        this.doc.incidentReporting = {
          contactEmail: this.doc.identity.contactEmail || '',
        };
      } else if (!m.incidentReporting) {
        delete this.doc.incidentReporting;
      }
      if (m.discoverabilityHints && !this.doc.discoverabilityHints) {
        this.doc.discoverabilityHints = {
          sitemapURI: this.doc.identity.siteURL ? this.doc.identity.siteURL.replace(/\/$/, '') + '/sitemap.xml' : '',
        };
      } else if (!m.discoverabilityHints) {
        delete this.doc.discoverabilityHints;
      }
      if (m.codeOfPracticeAlignment && !this.doc.codeOfPracticeAlignment) {
        this.doc.codeOfPracticeAlignment = [];
      } else if (!m.codeOfPracticeAlignment) {
        delete this.doc.codeOfPracticeAlignment;
      }
      // Sync moduleClaims
      const claims = [];
      for (const k of Object.keys(m)) if (m[k]) claims.push(k);
      if (!this.doc.conformance) this.doc.conformance = { level: 'basic' };
      if (claims.length) this.doc.conformance.moduleClaims = claims;
      else delete this.doc.conformance.moduleClaims;
    },

    get docJSON() {
      return JSON.stringify(this.doc, null, 2);
    },

    scheduleValidate() {
      clearTimeout(this._timer);
      this._timer = setTimeout(() => this.runValidate(), 200);
    },

    async runValidate() {
      const v = await loadValidator();
      const result = v.validate(this.doc);
      this.findings = result.findings;
      this.summary = result.summary;
    },

    async copyJSON() {
      try {
        await navigator.clipboard.writeText(this.docJSON);
        alert('JSON copied to clipboard.');
      } catch (e) {
        alert('Could not copy. Select the JSON below manually.');
      }
    },

    downloadJSON() {
      const blob = new Blob([this.docJSON], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'siteai.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    importExisting() {
      this.importMode = !this.importMode;
      this.importError = '';
    },

    applyImport() {
      this.importError = '';
      let parsed;
      try {
        parsed = JSON.parse(this.importText);
      } catch (e) {
        this.importError = 'Invalid JSON: ' + e.message;
        return;
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        this.importError = 'Document must be a JSON object.';
        return;
      }
      if (!parsed.specVersion || !['1.0', '1.1'].includes(parsed.specVersion)) {
        this.importError = 'Document specVersion must be "1.0" or "1.1".';
        return;
      }
      // Note v1.0 imports: A2WF v1.0 used a NESTED permissions shape
      //   ({ read: { foo: {...} }, action: { bar: {...} } })
      // that is fundamentally different from v1.1's flat array. Rather than
      // guess at the mapping, we keep specVersion at "1.0" and let the
      // validator emit migration warnings per Section 12. The operator can
      // then rebuild permissions manually in the wizard.
      if (parsed.specVersion === '1.0') {
        if (!parsed.identity) parsed.identity = { legalName: '', contactEmail: '' };
        if (!parsed.permissions || !Array.isArray(parsed.permissions)) parsed.permissions = [];
        if (!parsed.metadata) parsed.metadata = {};
        this.importError = 'Document loaded as v1.0. Migration to v1.1 is manual: review permissions and oversight, then change specVersion to "1.1" using the wizard or edit the JSON.';
      } else {
        // Normalise v1.1 shape minimally.
        if (!parsed.identity) parsed.identity = { legalName: '', contactEmail: '' };
        if (!Array.isArray(parsed.permissions)) parsed.permissions = [];
        if (!parsed.metadata) parsed.metadata = {};
        if (!parsed.conformance) parsed.conformance = { level: 'basic' };
      }
      this.doc = parsed;
      this.selectedPresetId = 'blank';
      // Re-sync module toggles to whatever the imported doc actually contains.
      this.modules = {
        jurisdictions: !!this.doc.jurisdictions,
        dataHandling: !!this.doc.dataHandling,
        agentIdentification: !!this.doc.agentIdentification,
        auditTrail: !!this.doc.auditTrail,
        incidentReporting: !!this.doc.incidentReporting,
        discoverabilityHints: !!this.doc.discoverabilityHints,
        codeOfPracticeAlignment: !!this.doc.codeOfPracticeAlignment,
      };
      this.importMode = false;
    },
  };
};

function emptyEditing() {
  return {
    action: 'view',
    customAction: '',
    schemaOrgType: 'ViewAction',
    effect: 'read-only',
    allowed: true,
    notes: '',
    oversightLevel: '',
    oversightChannel: '',
    oversightMethod: '',
    oversightTimeout: '',
  };
}

function defaultDoc() {
  return {
    specVersion: '1.1',
    identity: { legalName: '', contactEmail: '' },
    conformance: { level: 'basic' },
    permissions: [
      { action: 'view', schemaOrgType: 'ViewAction', effect: 'read-only', allowed: true },
    ],
    metadata: { lastUpdated: today(), language: 'en' },
  };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// wizardApp is now registered. If Alpine has already requested deferred start, kick it.
if (typeof window.__a2wfTryStart === 'function') window.__a2wfTryStart();
