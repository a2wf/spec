// A2WF v1.1 Validator
// Produces PASS / WARN / FAIL findings per Section 2.4 of the v1.1 specification.
// Designed to run alongside the v1.0 validator (validator/index.js) without conflict.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const SCHEMA_PATH = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
  '..',
  'schema',
  'core-v1.1.json'
);

const ajv = new Ajv2020.default({
  allErrors: true,
  strict: false,
  // verbose: gives schemaPath in errors which we need to localise findings
  verbose: true,
});
addFormats.default(ajv);

let cachedValidator = null;
function getSchemaValidator() {
  if (cachedValidator) return cachedValidator;
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
  cachedValidator = ajv.compile(schema);
  return cachedValidator;
}

/**
 * Finding object:
 *   { severity: 'pass' | 'warn' | 'fail',
 *     path: '/conformance/level',
 *     message: 'string',
 *     specSection: '5.2' }
 */

export function validateV11(doc, options = {}) {
  const findings = [];

  // v1.0 documents are accepted with a different rule set per Spec §12.
  // We do NOT validate them against the v1.1 JSON Schema.
  if (doc?.specVersion === '1.0') {
    semanticChecks(doc, findings, options);
    const summary = {
      pass: findings.filter(f => f.severity === 'pass').length,
      warn: findings.filter(f => f.severity === 'warn').length,
      fail: findings.filter(f => f.severity === 'fail').length,
    };
    return { specVersion: '1.0', valid: summary.fail === 0, summary, findings };
  }

  // Step 1: structural validation against JSON Schema (v1.1 only)
  const schemaValid = getSchemaValidator();
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

  // Step 2: semantic checks beyond schema
  semanticChecks(doc, findings, options);

  // Step 3: aggregate
  const summary = {
    pass: findings.filter(f => f.severity === 'pass').length,
    warn: findings.filter(f => f.severity === 'warn').length,
    fail: findings.filter(f => f.severity === 'fail').length,
  };

  return {
    specVersion: '1.1',
    valid: summary.fail === 0,
    summary,
    findings,
  };
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

function schemaErrorMessage(err) {
  const property = err.params?.missingProperty;
  if (err.keyword === 'required' && property) {
    return `Missing required property "${property}"`;
  }
  if (err.keyword === 'enum') {
    return `Value not in allowed set: ${JSON.stringify(err.params?.allowedValues)}`;
  }
  if (err.keyword === 'pattern') {
    return `Value does not match pattern: ${err.params?.pattern}`;
  }
  return err.message || 'Schema violation';
}

function semanticChecks(doc, findings, options) {
  // Conformance level checks
  const level = doc?.conformance?.level;
  if (level === 'standard') {
    checkStandardConformance(doc, findings);
  }
  if (level === 'basic') {
    checkBasicConformance(doc, findings);
  }

  // v1.0 backward-compat: documents with specVersion "1.0" use v1.0 semantics
  if (doc?.specVersion === '1.0') {
    checkLegacyV10(doc, findings);
  }

  // Oversight directive structural checks (Spec §7.7)
  checkOversightDirectives(doc, findings);

  // Unknown members
  if (doc?.conformance?.strictUnknown === true) {
    checkUnknownMembers(doc, findings, 'fail');
  } else {
    checkUnknownMembers(doc, findings, 'warn');
  }

  // Module presence vs claims
  checkModuleClaimConsistency(doc, findings);

  // Permission rate-limit dangling references
  checkRateLimitReferences(doc, findings);

  // Forbidden patterns (legal claims, score etc.)
  checkForbiddenPatterns(doc, findings);

  // SHOULD-recommendations as WARN
  checkSHOULDs(doc, findings);

  // Profile-specific checks (EU Governance Starter Profile)
  checkProfileClaims(doc, findings);
}

function checkLegacyV10(doc, findings) {
  // v1.0 documents are accepted by v1.1 Consumers per Spec §12.
  // They do not require a `conformance` member (implicit Basic).
  // They MAY have `humanVerification` instead of `oversight`.
  // We do not require `permissions` at the same depth; v1.0 used a different shape.
  // The validator emits informational findings rather than failures.
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
  // Validates Spec §7.7 channel/method requirements on every oversight directive.
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
  // Inspect root oversightDefaults
  const defaults = doc?.oversight?.oversightDefaults || {};
  for (const [cat, dir] of Object.entries(defaults)) {
    inspect(dir, `/oversight/oversightDefaults/${cat}`);
  }
  // Inspect fallback
  if (doc?.oversight?.fallback) {
    inspect(doc.oversight.fallback, '/oversight/fallback');
  }
  // Inspect per-permission oversight
  const perms = Array.isArray(doc.permissions) ? doc.permissions : [];
  perms.forEach((p, i) => {
    if (p.oversight) inspect(p.oversight, `/permissions/${i}/oversight`);
  });
}

function checkProfileClaims(doc, findings) {
  const claims = doc?.conformance?.profileClaims || [];
  const euGov = 'https://a2wf.org/profiles/eu-governance-starter/v1';
  if (!claims.includes(euGov)) return;

  // EU Governance Starter requires level: standard
  if (doc?.conformance?.level !== 'standard') {
    findings.push({
      severity: 'fail',
      path: '/conformance/level',
      message: 'EU Governance Starter Profile requires conformance.level "standard" (Profile §3).',
      specSection: 'profile-3',
    });
  }
  // Required modules
  const required = ['jurisdictions', 'dataHandling', 'agentIdentification', 'auditTrail', 'incidentReporting', 'discoverabilityHints'];
  for (const m of required) {
    if (!doc[m]) {
      findings.push({
        severity: 'fail',
        path: `/${m}`,
        message: `EU Governance Starter Profile requires module "${m}" (Profile §4).`,
        specSection: 'profile-4',
      });
    }
  }
  // auditTrail.enabled MUST be true
  if (doc.auditTrail && doc.auditTrail.enabled !== true) {
    findings.push({
      severity: 'fail',
      path: '/auditTrail/enabled',
      message: 'EU Governance Starter Profile requires auditTrail.enabled === true (Profile §4.4).',
      specSection: 'profile-4.4',
    });
  }
  // Required audit events
  const requiredEvents = ['policy-discovered', 'permission-decision', 'oversight-requested', 'oversight-completed'];
  const declaredEvents = new Set(doc?.auditTrail?.events || []);
  for (const ev of requiredEvents) {
    if (!declaredEvents.has(ev)) {
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
  const oversight = doc?.oversight;
  if (!oversight?.oversightDefaults) {
    findings.push({
      severity: 'fail',
      path: '/oversight/oversightDefaults',
      message: 'A2WF-Standard requires oversight.oversightDefaults (Section 5.3 / 7.3).',
      specSection: '5.3',
    });
  } else {
    const required = ['state-changing', 'commercial'];
    for (const cat of required) {
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

  // Every state-changing/commercial/regulated permission must declare oversight or inherit by name
  const perms = Array.isArray(doc.permissions) ? doc.permissions : [];
  perms.forEach((p, i) => {
    if (['state-changing', 'commercial', 'regulated'].includes(p.effect)) {
      const hasOwn = !!p.oversight;
      const defaultsHaveCategory = !!oversight?.oversightDefaults?.[p.effect];
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

  // Standard requires discovery.cache
  if (!doc?.discovery?.cache) {
    findings.push({
      severity: 'fail',
      path: '/discovery/cache',
      message: 'A2WF-Standard requires discovery.cache (Section 9.6).',
      specSection: '9.6',
    });
  } else if (!doc.discovery.cache.maxAge) {
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
  const known = new Set([
    'specVersion', 'identity', 'conformance', 'permissions', 'oversight',
    'rateLimits', 'discovery', 'security', 'privacy', 'legacyCompat',
    'jurisdictions', 'dataHandling', 'agentIdentification',
    'auditTrail', 'incidentReporting', 'discoverabilityHints',
    'codeOfPracticeAlignment', 'relatedSignals', 'metadata',
  ]);
  for (const key of Object.keys(doc)) {
    if (!known.has(key)) {
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
  const moduleMembers = {
    jurisdictions: 'jurisdictions',
    dataHandling: 'dataHandling',
    agentIdentification: 'agentIdentification',
    auditTrail: 'auditTrail',
    incidentReporting: 'incidentReporting',
    discoverabilityHints: 'discoverabilityHints',
    codeOfPracticeAlignment: 'codeOfPracticeAlignment',
  };
  const claimed = new Set(doc?.conformance?.moduleClaims || []);

  // Member present without claim → warn
  for (const [member] of Object.entries(moduleMembers)) {
    if (doc[member] && !claimed.has(member)) {
      findings.push({
        severity: 'warn',
        path: `/conformance/moduleClaims`,
        message: `Module "${member}" is used in the document but not listed in conformance.moduleClaims (Section 5.1).`,
        specSection: '5.1',
      });
    }
    if (claimed.has(member) && !doc[member]) {
      findings.push({
        severity: 'fail',
        path: `/conformance/moduleClaims`,
        message: `conformance.moduleClaims lists "${member}" but the corresponding member is not present.`,
        specSection: '5.1',
      });
    }
  }

  // DPV profile URI missing when dataHandling present
  if (doc.dataHandling && !doc.dataHandling.dpvProfileURI) {
    findings.push({
      severity: 'warn',
      path: '/dataHandling/dpvProfileURI',
      message: 'dataHandling SHOULD declare dpvProfileURI when DPV terms are used (Section 14.2).',
      specSection: '14.2',
    });
  }

  // auditTrail.enabled=true should have events
  if (doc.auditTrail?.enabled === true && !Array.isArray(doc.auditTrail.events)) {
    findings.push({
      severity: 'warn',
      path: '/auditTrail/events',
      message: 'auditTrail.enabled is true but no events declared (Section 16.5).',
      specSection: '16.5',
    });
  }

  // auditTrail.integrity = aivs-compatible requires profiles
  if (doc.auditTrail?.integrity === 'aivs-compatible') {
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

  // agentIdentification experimental status requires version
  const protos = doc.agentIdentification?.acceptedProtocols || [];
  protos.forEach((p, i) => {
    if (p.status === 'experimental' && !p.version) {
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
    if (p.rateLimit && !declared.has(p.rateLimit)) {
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
  // Scanner score forbidden
  const serialised = JSON.stringify(doc);
  const forbiddenScorePatterns = [
    /"conformance(Score|Index|Rating)"\s*:\s*\d+/i,
    /"a2wfScore"\s*:/i,
  ];
  for (const re of forbiddenScorePatterns) {
    if (re.test(serialised)) {
      findings.push({
        severity: 'fail',
        path: '/',
        message: 'Document contains a numeric conformance score member. A2WF v1.1 forbids numeric conformance scores (Section 5.4).',
        specSection: '5.4',
      });
    }
  }

  // Legal compliance claims in metadata or notes
  const dangerousPhrases = [
    'gdpr-compliant',
    'gdpr compliant',
    'eu ai act compliant',
    'ai-act-compliant',
    'fully compliant',
    'certified compliant',
  ];
  const lower = serialised.toLowerCase();
  for (const phrase of dangerousPhrases) {
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
  if (!doc?.metadata?.lastUpdated) {
    findings.push({
      severity: 'warn',
      path: '/metadata/lastUpdated',
      message: 'Document SHOULD include metadata.lastUpdated (Section 3.1).',
      specSection: '3.1',
    });
  }
  if (!doc?.identity?.siteURL) {
    findings.push({
      severity: 'warn',
      path: '/identity/siteURL',
      message: 'identity SHOULD include siteURL (Section 4.2).',
      specSection: '4.2',
    });
  }
  if (!doc?.identity?.jurisdictionPrimary) {
    findings.push({
      severity: 'warn',
      path: '/identity/jurisdictionPrimary',
      message: 'identity SHOULD include jurisdictionPrimary (Section 4.2).',
      specSection: '4.2',
    });
  }
}
