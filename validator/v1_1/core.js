// A2WF v1.1 Validator: shared core.
// Browser-compatible. No fs, no path, no Node-only imports.
//
// Usage:
//   import { createValidator } from './core.js';
//   const v = createValidator({ ajv, schema });   // pass Ajv2020 instance + schema JSON
//   const result = v.validate(doc);
//
// The Node entry point (./node.js) wires up file loading and the default schema.
// The browser entry point (in /tools/validator-web and /tools/wizard) wires up
// the locally-vendored Ajv build and fetches the schema once at startup.

const KNOWN_TOP_LEVEL_MEMBERS = new Set([
  'specVersion', 'identity', 'conformance', 'permissions', 'oversight',
  'rateLimits', 'discovery', 'security', 'privacy', 'legacyCompat',
  'jurisdictions', 'dataHandling', 'agentIdentification',
  'auditTrail', 'incidentReporting', 'discoverabilityHints',
  'codeOfPracticeAlignment', 'relatedSignals', 'metadata',
]);

const MODULE_MEMBERS = [
  'jurisdictions', 'dataHandling', 'agentIdentification',
  'auditTrail', 'incidentReporting', 'discoverabilityHints',
  'codeOfPracticeAlignment',
];

const EU_GOVERNANCE_STARTER_URI = 'https://a2wf.org/profiles/eu-governance-starter/v1';

const EU_GOV_REQUIRED_MODULES = [
  'jurisdictions', 'dataHandling', 'agentIdentification',
  'auditTrail', 'incidentReporting', 'discoverabilityHints',
];

const EU_GOV_REQUIRED_AUDIT_EVENTS = [
  'policy-discovered', 'permission-decision',
  'oversight-requested', 'oversight-completed',
];

const FORBIDDEN_SCORE_PATTERNS = [
  /"conformance(Score|Index|Rating)"\s*:\s*\d+/i,
  /"a2wfScore"\s*:/i,
];

const FORBIDDEN_COMPLIANCE_PHRASES = [
  'gdpr-compliant',
  'gdpr compliant',
  'eu ai act compliant',
  'ai-act-compliant',
  'fully compliant',
  'certified compliant',
];

/**
 * Create a validator bound to a specific Ajv instance and schema object.
 *
 * @param {object} opts
 * @param {object} opts.ajv     Ajv2020 instance with formats registered.
 * @param {object} opts.schema  Parsed v1.1 core JSON Schema.
 * @returns {{ validate: (doc:any, options?:any) => ValidationResult }}
 */
export function createValidator({ ajv, schema }) {
  if (!ajv || typeof ajv.compile !== 'function') {
    throw new Error('createValidator: ajv with compile() is required');
  }
  if (!schema || typeof schema !== 'object') {
    throw new Error('createValidator: schema object is required');
  }
  const schemaValid = ajv.compile(schema);

  return {
    validate(doc, options = {}) {
      const findings = [];

      // v1.0 documents are accepted with a different rule set per Spec §12.
      // They are NOT validated against the v1.1 JSON Schema.
      if (doc && doc.specVersion === '1.0') {
        runSemanticChecks(doc, findings, options);
        return summarise(findings, '1.0');
      }

      // v1.1: structural validation against JSON Schema first.
      const structurallyValid = schemaValid(doc);
      if (!structurallyValid) {
        for (const err of schemaValid.errors || []) {
          findings.push({
            severity: 'fail',
            path: err.instancePath || '/',
            message: schemaErrorMessage(err),
            specSection: 'schema',
          });
        }
      }
      runSemanticChecks(doc, findings, options);
      return summarise(findings, '1.1');
    },
  };
}

/**
 * Standalone JSON-only validation that does not depend on Ajv.
 *
 * This function runs ONLY the semantic checks and is used as a defensive fallback
 * when the JSON Schema validator is unavailable (e.g. the Ajv bundle failed to load
 * in a browser environment). To avoid producing misleading "valid" results, the
 * function injects an explicit FAIL finding warning that schema validation was
 * skipped. Callers that need authoritative validation MUST provide a schema-aware
 * validator via createValidator().
 */
export function validateSemanticOnly(doc, options = {}) {
  const findings = [];
  findings.push({
    severity: 'fail',
    path: '/',
    message: 'Schema validation unavailable: the JSON Schema validator was not loaded. Semantic checks were run, but structural and format checks were skipped. This result must not be treated as a full validation.',
    specSection: 'tools',
  });
  if (doc && doc.specVersion === '1.0') {
    runSemanticChecks(doc, findings, options);
    return summarise(findings, '1.0');
  }
  runSemanticChecks(doc, findings, options);
  return summarise(findings, '1.1');
}

function summarise(findings, specVersion) {
  const summary = {
    pass: findings.filter(f => f.severity === 'pass').length,
    warn: findings.filter(f => f.severity === 'warn').length,
    fail: findings.filter(f => f.severity === 'fail').length,
  };
  return { specVersion, valid: summary.fail === 0, summary, findings };
}

function schemaErrorMessage(err) {
  const property = err.params && err.params.missingProperty;
  if (err.keyword === 'required' && property) {
    return `Missing required property "${property}"`;
  }
  if (err.keyword === 'enum') {
    return `Value not in allowed set: ${JSON.stringify(err.params && err.params.allowedValues)}`;
  }
  if (err.keyword === 'pattern') {
    return `Value does not match pattern: ${err.params && err.params.pattern}`;
  }
  return err.message || 'Schema violation';
}

function runSemanticChecks(doc, findings, options) {
  if (!doc || typeof doc !== 'object') return;
  const level = doc.conformance && doc.conformance.level;
  if (level === 'standard') checkStandardConformance(doc, findings);
  if (level === 'basic') checkBasicConformance(doc, findings);

  if (doc.specVersion === '1.0') checkLegacyV10(doc, findings);
  checkOversightDirectives(doc, findings);

  const strictUnknown = doc.conformance && doc.conformance.strictUnknown === true;
  checkUnknownMembers(doc, findings, strictUnknown ? 'fail' : 'warn');

  checkModuleClaimConsistency(doc, findings);
  checkRateLimitReferences(doc, findings);
  checkForbiddenPatterns(doc, findings);
  checkSHOULDs(doc, findings);
  checkProfileClaims(doc, findings);
}

function checkLegacyV10(doc, findings) {
  if (!doc.conformance) {
    findings.push({
      severity: 'warn',
      path: '/conformance',
      message: 'v1.0 document accepted: conformance member absent, treated as implicit Basic per Section 12.',
      specSection: '12',
    });
  }
  if (doc.humanVerification !== undefined) {
    findings.push({
      severity: 'warn',
      path: '/humanVerification',
      message: 'v1.0 humanVerification mapped to oversight.fallback per Section 12.2. Consider migrating to v1.1 oversight block.',
      specSection: '12.2',
    });
  }
}

function checkOversightDirectives(doc, findings) {
  const inspect = (directive, pathPrefix) => {
    if (!directive || typeof directive !== 'object') return;
    const { level, channel, method, methodURI } = directive;
    if (level === 'notification' || level === 'confirmation' || level === 'handover') {
      if (!channel) {
        findings.push({
          severity: 'fail',
          path: `${pathPrefix}/channel`,
          message: `Oversight level "${level}" requires a channel (Section 7.7).`,
          specSection: '7.7',
        });
      }
    }
    if (level === 'confirmation' || level === 'handover') {
      if (!method) {
        findings.push({
          severity: 'fail',
          path: `${pathPrefix}/method`,
          message: `Oversight level "${level}" requires a method (Section 7.7).`,
          specSection: '7.7',
        });
      }
    }
    if (method === 'publisher-defined' && !methodURI) {
      findings.push({
        severity: 'fail',
        path: `${pathPrefix}/methodURI`,
        message: 'method "publisher-defined" requires methodURI (Section 7.2).',
        specSection: '7.2',
      });
    }
  };
  const defaults = (doc.oversight && doc.oversight.oversightDefaults) || {};
  for (const [cat, dir] of Object.entries(defaults)) {
    inspect(dir, `/oversight/oversightDefaults/${cat}`);
  }
  if (doc.oversight && doc.oversight.fallback) {
    inspect(doc.oversight.fallback, '/oversight/fallback');
  }
  const perms = Array.isArray(doc.permissions) ? doc.permissions : [];
  perms.forEach((p, i) => {
    if (p && p.oversight) inspect(p.oversight, `/permissions/${i}/oversight`);
  });
}

function checkProfileClaims(doc, findings) {
  const claims = (doc.conformance && doc.conformance.profileClaims) || [];
  if (!claims.includes(EU_GOVERNANCE_STARTER_URI)) return;

  if (doc.conformance.level !== 'standard') {
    findings.push({
      severity: 'fail',
      path: '/conformance/level',
      message: 'EU Governance Starter Profile requires conformance.level "standard" (Profile §3).',
      specSection: 'profile-3',
    });
  }
  for (const m of EU_GOV_REQUIRED_MODULES) {
    if (!doc[m]) {
      findings.push({
        severity: 'fail',
        path: `/${m}`,
        message: `EU Governance Starter Profile requires module "${m}" (Profile §4).`,
        specSection: 'profile-4',
      });
    }
  }
  if (doc.auditTrail && doc.auditTrail.enabled !== true) {
    findings.push({
      severity: 'fail',
      path: '/auditTrail/enabled',
      message: 'EU Governance Starter Profile requires auditTrail.enabled === true (Profile §4.4).',
      specSection: 'profile-4.4',
    });
  }
  const declared = new Set((doc.auditTrail && doc.auditTrail.events) || []);
  for (const ev of EU_GOV_REQUIRED_AUDIT_EVENTS) {
    if (!declared.has(ev)) {
      findings.push({
        severity: 'fail',
        path: '/auditTrail/events',
        message: `EU Governance Starter Profile requires auditTrail.events to include "${ev}" (Profile §4.4).`,
        specSection: 'profile-4.4',
      });
    }
  }
}

function checkStandardConformance(doc, findings) {
  const oversight = doc.oversight;
  if (!oversight || !oversight.oversightDefaults) {
    findings.push({
      severity: 'fail',
      path: '/oversight/oversightDefaults',
      message: 'A2WF-Standard requires oversight.oversightDefaults (Section 5.3 / 7.3).',
      specSection: '5.3',
    });
  } else {
    for (const cat of ['state-changing', 'commercial']) {
      if (!oversight.oversightDefaults[cat]) {
        findings.push({
          severity: 'fail',
          path: `/oversight/oversightDefaults/${cat}`,
          message: `A2WF-Standard requires oversightDefaults.${cat} (Section 7.5).`,
          specSection: '7.5',
        });
      }
    }
  }
  const perms = Array.isArray(doc.permissions) ? doc.permissions : [];
  perms.forEach((p, i) => {
    if (!p) return;
    if (['state-changing', 'commercial', 'regulated'].includes(p.effect)) {
      const hasOwn = !!p.oversight;
      const defaultsHaveCategory = !!(oversight && oversight.oversightDefaults && oversight.oversightDefaults[p.effect]);
      if (!hasOwn && !defaultsHaveCategory) {
        findings.push({
          severity: 'fail',
          path: `/permissions/${i}`,
          message: `Permission "${p.action}" with effect "${p.effect}" must declare its own oversight or inherit from oversightDefaults.${p.effect} (Section 5.3).`,
          specSection: '5.3',
        });
      }
    }
    if (!p.effect) {
      findings.push({
        severity: 'fail',
        path: `/permissions/${i}/effect`,
        message: 'A2WF-Standard requires "effect" on every permission entry (Section 6.7).',
        specSection: '6.7',
      });
    }
  });
  const cache = doc.discovery && doc.discovery.cache;
  if (!cache) {
    findings.push({
      severity: 'fail',
      path: '/discovery/cache',
      message: 'A2WF-Standard requires discovery.cache (Section 9.6).',
      specSection: '9.6',
    });
  } else if (!cache.maxAge) {
    findings.push({
      severity: 'fail',
      path: '/discovery/cache/maxAge',
      message: 'A2WF-Standard requires discovery.cache.maxAge (Section 9.6).',
      specSection: '9.6',
    });
  }
}

function checkBasicConformance(doc, findings) {
  if (!Array.isArray(doc.permissions) || doc.permissions.length === 0) {
    findings.push({
      severity: 'fail',
      path: '/permissions',
      message: 'A2WF-Basic requires at least one permission entry (Section 6.7).',
      specSection: '6.7',
    });
  }
}

function checkUnknownMembers(doc, findings, severity) {
  for (const key of Object.keys(doc)) {
    if (!KNOWN_TOP_LEVEL_MEMBERS.has(key)) {
      findings.push({
        severity,
        path: `/${key}`,
        message: `Unknown top-level member "${key}". Permitted for forward compatibility (Section 3.2).`,
        specSection: '3.2',
      });
    }
  }
}

function checkModuleClaimConsistency(doc, findings) {
  const claimed = new Set((doc.conformance && doc.conformance.moduleClaims) || []);
  for (const member of MODULE_MEMBERS) {
    if (doc[member] && !claimed.has(member)) {
      findings.push({
        severity: 'warn',
        path: '/conformance/moduleClaims',
        message: `Module "${member}" is used in the document but not listed in conformance.moduleClaims (Section 5.1).`,
        specSection: '5.1',
      });
    }
    if (claimed.has(member) && !doc[member]) {
      findings.push({
        severity: 'fail',
        path: '/conformance/moduleClaims',
        message: `conformance.moduleClaims lists "${member}" but the corresponding member is not present.`,
        specSection: '5.1',
      });
    }
  }
  if (doc.dataHandling && !doc.dataHandling.dpvProfileURI) {
    findings.push({
      severity: 'warn',
      path: '/dataHandling/dpvProfileURI',
      message: 'dataHandling SHOULD declare dpvProfileURI when DPV terms are used (Section 14.2).',
      specSection: '14.2',
    });
  }
  if (doc.auditTrail && doc.auditTrail.enabled === true && !Array.isArray(doc.auditTrail.events)) {
    findings.push({
      severity: 'warn',
      path: '/auditTrail/events',
      message: 'auditTrail.enabled is true but no events declared (Section 16.5).',
      specSection: '16.5',
    });
  }
  if (doc.auditTrail && doc.auditTrail.integrity === 'aivs-compatible') {
    const profiles = doc.auditTrail.profiles || [];
    if (profiles.length === 0) {
      findings.push({
        severity: 'fail',
        path: '/auditTrail/profiles',
        message: 'auditTrail.integrity "aivs-compatible" requires at least one profile URI (Section 16.5).',
        specSection: '16.5',
      });
    }
  }
  const protos = (doc.agentIdentification && doc.agentIdentification.acceptedProtocols) || [];
  protos.forEach((p, i) => {
    if (p && p.status === 'experimental' && !p.version) {
      findings.push({
        severity: 'warn',
        path: `/agentIdentification/acceptedProtocols/${i}/version`,
        message: `Experimental protocol "${p.id}" SHOULD include a version pin (Section 15.3).`,
        specSection: '15.3',
      });
    }
  });
}

function checkRateLimitReferences(doc, findings) {
  const declared = new Set(Object.keys(doc.rateLimits || {}));
  const perms = Array.isArray(doc.permissions) ? doc.permissions : [];
  perms.forEach((p, i) => {
    if (p && p.rateLimit && !declared.has(p.rateLimit)) {
      findings.push({
        severity: 'fail',
        path: `/permissions/${i}/rateLimit`,
        message: `Permission references rateLimit "${p.rateLimit}" which is not declared in rateLimits (Section 8.3).`,
        specSection: '8.3',
      });
    }
  });
}

function checkForbiddenPatterns(doc, findings) {
  const serialised = JSON.stringify(doc);
  for (const re of FORBIDDEN_SCORE_PATTERNS) {
    if (re.test(serialised)) {
      findings.push({
        severity: 'fail',
        path: '/',
        message: 'Document contains a numeric conformance score member. A2WF v1.1 forbids numeric conformance scores (Section 5.4).',
        specSection: '5.4',
      });
    }
  }
  const lower = serialised.toLowerCase();
  for (const phrase of FORBIDDEN_COMPLIANCE_PHRASES) {
    if (lower.includes(phrase)) {
      findings.push({
        severity: 'warn',
        path: '/',
        message: `Document contains a legal-compliance claim phrase ("${phrase}"). A2WF declarations do not certify legal compliance (Section 1.3).`,
        specSection: '1.3',
      });
    }
  }
}

function checkSHOULDs(doc, findings) {
  if (!(doc.metadata && doc.metadata.lastUpdated)) {
    findings.push({
      severity: 'warn',
      path: '/metadata/lastUpdated',
      message: 'Document SHOULD include metadata.lastUpdated (Section 3.1).',
      specSection: '3.1',
    });
  }
  if (!(doc.identity && doc.identity.siteURL)) {
    findings.push({
      severity: 'warn',
      path: '/identity/siteURL',
      message: 'identity SHOULD include siteURL (Section 4.2).',
      specSection: '4.2',
    });
  }
  if (!(doc.identity && doc.identity.jurisdictionPrimary)) {
    findings.push({
      severity: 'warn',
      path: '/identity/jurisdictionPrimary',
      message: 'identity SHOULD include jurisdictionPrimary (Section 4.2).',
      specSection: '4.2',
    });
  }
}
