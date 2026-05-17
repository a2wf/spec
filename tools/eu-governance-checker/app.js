// A2WF EU Governance Readiness Checker - Alpine.js component.
// Fetches a live A2WF policy, validates it, and produces a technical readiness report.
// Runs entirely in the browser. No backend, no telemetry.
//
// IMPORTANT: this tool produces orientation, NOT a compliance audit.
// - Anchor matches are heuristic and explicitly typed as support / gap / risk.
// - The "A2WF Declaration Coverage Score" is a vendor metric capped at 59 on validation failure.
// - Recommendations include copy-paste-valid JSON snippets.

import { createValidator, validateSemanticOnly } from '../../validator/v1_1/core.js';

const SCHEMA_URL = '../../schema/core-v1.1.json';
const ANCHORS_URL = './eu-anchors.json';
const EU_GOVERNANCE_PROFILE_URI = 'https://a2wf.org/profiles/eu-governance-starter/v1';

let validator = null;
let anchors = null;

async function loadValidator() {
  if (validator) return validator;
  const Ajv2020 = window.A2WF_Ajv2020;
  const addFormats = window.A2WF_addFormats;
  if (!Ajv2020 || !addFormats) {
    console.error('A2WF: Ajv bundle not loaded. Checker will be DEGRADED.');
    validator = { validate: validateSemanticOnly, degraded: true };
    return validator;
  }
  const ajv = new Ajv2020({ allErrors: true, strict: false, verbose: true });
  addFormats(ajv);
  const schema = await fetch(SCHEMA_URL).then(r => r.json());
  validator = createValidator({ ajv, schema });
  validator.degraded = false;
  return validator;
}

async function loadAnchors() {
  if (anchors) return anchors;
  anchors = await fetch(ANCHORS_URL).then(r => r.json());
  return anchors;
}

function readBrandingFromURL() {
  const params = new URLSearchParams(window.location.search);
  return {
    brand: params.get('brand') || '',
    logo: params.get('logo') || '',
  };
}

function applyBranding() {
  const { brand, logo } = readBrandingFromURL();
  if (!brand) return;
  const bar = document.getElementById('brand-bar');
  if (!bar) return;
  bar.classList.add('visible');
  while (bar.firstChild) bar.removeChild(bar.firstChild);

  if (logo) {
    // Logo URL safety: HTTPS only, no referrer leak, lazy load, drop on error.
    try {
      const u = new URL(logo);
      if (u.protocol !== 'https:') throw new Error('logo must use https');
      const img = document.createElement('img');
      img.src = u.href;
      img.alt = brand;
      img.referrerPolicy = 'no-referrer';
      img.loading = 'lazy';
      img.style.maxHeight = '32px';
      img.style.verticalAlign = 'middle';
      img.style.marginRight = '0.5rem';
      img.onerror = () => { try { img.remove(); } catch (_e) {} };
      bar.appendChild(img);
    } catch (_e) { /* ignore invalid or non-HTTPS logo */ }
  }
  const span = document.createElement('span');
  span.textContent = 'Wrapped by: ' + brand;
  bar.appendChild(span);
}

// -- Applicability gates ------------------------------------------------------
// These functions answer "is this regulatory anchor applicable to this document?"
// based on declared content. They return one of: 'applicable', 'possible', 'not_assessed'.

function isHighRiskApplicable(doc) {
  // High-risk applicability under AI Act Article 6 / Annex III is sector- and
  // use-case-specific. We can only signal "possible" based on declared signals.
  const perms = Array.isArray(doc.permissions) ? doc.permissions : [];
  const hasRegulated = perms.some(p => p.effect === 'regulated' && p.allowed === true);
  if (hasRegulated) return 'possible';
  return 'not_assessed';
}

function hasProhibitedLikeActions(doc) {
  const perms = Array.isArray(doc.permissions) ? doc.permissions : [];
  return perms.some(p =>
    p.allowed === true &&
    /biometric|social[\s-]?scoring|emotion[\s-]?recognition|subliminal|exploit[\s-]?vulnerable|predictive[\s-]?policing/i.test(p.action || '')
  );
}

function isPersonalDataProcessingDeclared(doc) {
  // Personal-data processing is declared if dataHandling exists OR if any
  // permission action looks like a typical PII operation. Otherwise we cannot
  // assume the site processes personal data and we should NOT trigger GDPR
  // anchors as a gap.
  if (doc.dataHandling) return 'applicable';
  const perms = Array.isArray(doc.permissions) ? doc.permissions : [];
  if (perms.some(p => /register|purchase|book|pay|profile|account/i.test(p.action || ''))) {
    return 'possible';
  }
  return 'not_assessed';
}

function isHumanFacingAIDeclared(doc) {
  // Article 50 applies to AI systems interacting with natural persons. A2WF
  // documents typically expose this via permissions; we cannot prove it but we
  // can signal possibility.
  const perms = Array.isArray(doc.permissions) ? doc.permissions : [];
  if (perms.some(p => p.allowed === true && p.effect !== 'read-only')) return 'possible';
  return 'not_assessed';
}

// -- Effective oversight resolution -------------------------------------------

function resolveEffectiveOversight(doc, permission) {
  if (permission.oversight && permission.oversight.level) return permission.oversight;
  const defaults = doc.oversight && doc.oversight.oversightDefaults;
  if (defaults && permission.effect && defaults[permission.effect]) return defaults[permission.effect];
  if (doc.oversight && doc.oversight.fallback) return doc.oversight.fallback;
  return null;
}

window.checkerApp = function checkerApp() {
  return {
    targetUrl: '',
    running: false,
    error: '',
    result: null,
    branding: readBrandingFromURL(),

    async init() {
      applyBranding();
      await Promise.all([loadValidator(), loadAnchors()]);
    },

    async runCheck() {
      this.error = '';
      this.result = null;
      const url = (this.targetUrl || '').trim();
      if (!url) {
        this.error = 'Enter a URL to check.';
        return;
      }
      let origin;
      try {
        origin = new URL(url).origin;
      } catch (e) {
        this.error = 'That is not a valid URL. Use https://example.com format.';
        return;
      }
      this.running = true;
      try {
        const fetched = await this.fetchA2WFDocument(origin);
        if (!fetched.doc) {
          this.error = fetched.error || 'Could not fetch A2WF document.';
          this.running = false;
          return;
        }
        this.result = await this.analyse(origin, fetched.discoveryPath, fetched.doc);
      } catch (e) {
        this.error = 'Unexpected error during check: ' + e.message;
      } finally {
        this.running = false;
      }
    },

    async fetchA2WFDocument(origin) {
      const candidates = [
        { path: '/.well-known/a2wf/siteai.json', tag: 'primary' },
        { path: '/siteai.json',                  tag: 'legacy' },
      ];
      let firstError = '';
      for (const c of candidates) {
        const url = origin + c.path;
        try {
          const r = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            mode: 'cors',
            credentials: 'omit',
          });
          if (r.ok) {
            const text = await r.text();
            if (text.length > 2 * 1024 * 1024) {
              return { doc: null, error: 'Fetched document is larger than 2 MB; refusing to parse.' };
            }
            let doc;
            try {
              doc = JSON.parse(text);
            } catch (e) {
              return { doc: null, error: `Document at ${url} is not valid JSON: ${e.message}` };
            }
            return { doc, discoveryPath: c.path };
          }
          if (!firstError) firstError = `${url} returned HTTP ${r.status}`;
        } catch (e) {
          if (!firstError) {
            firstError = `${url} fetch failed: ${e.message}. `
              + `This is most often a browser CORS block, NOT a missing document. `
              + `Ask the site operator to add Access-Control-Allow-Origin: * to the A2WF endpoint, `
              + `or run this checker from the same origin as the target site.`;
          }
        }
      }
      return { doc: null, error: firstError || 'No A2WF document found at the standard paths.' };
    },

    async analyse(origin, discoveryPath, doc) {
      const v = await loadValidator();
      const validation = v.validate(doc);
      const a = await loadAnchors();

      const specVersion = doc.specVersion || '?';
      const conformanceLevel = doc.conformance && doc.conformance.level;
      const profileClaimed = (doc.conformance && Array.isArray(doc.conformance.profileClaims)
        && doc.conformance.profileClaims.includes(EU_GOVERNANCE_PROFILE_URI));
      const modulesDeclared = (doc.conformance && doc.conformance.moduleClaims) || [];
      const lastUpdated = doc.metadata && doc.metadata.lastUpdated;

      const aiActFindings = this.matchAnchors(doc, a.eu_ai_act_anchors);
      const gdprFindings = this.matchAnchors(doc, a.gdpr_anchors);

      const recommendations = this.buildRecommendations(doc, validation, profileClaimed);

      const { score, band } = this.computeScore(doc, validation, v.degraded, profileClaimed, a.readiness_score);

      return {
        targetUrl: origin,
        discoveryPath,
        specVersion,
        conformanceLevel,
        profileClaimed,
        modulesDeclared,
        lastUpdated,
        validation,
        validatorDegraded: !!v.degraded,
        aiActFindings,
        gdprFindings,
        recommendations,
        score,
        band,
        generatedAt: new Date().toISOString(),
      };
    },

    matchAnchors(doc, anchorList) {
      const findings = [];
      for (const anchor of anchorList) {
        const obs = this.evaluateAnchor(doc, anchor.id);
        if (obs) {
          findings.push({
            id: anchor.id,
            title: anchor.title,
            scope: anchor.scope,
            severity: obs.status === 'risk' ? 'high' : (obs.status === 'gap' ? 'medium' : 'low'),
            status: obs.status,
            applicability: obs.applicability,
            observation: obs.observation,
            guidance: anchor.guidance,
          });
        }
      }
      return findings;
    },

    /**
     * Returns null (anchor not relevant) or
     * { status: 'support'|'gap'|'risk', applicability: 'applicable'|'possible'|'not_assessed', observation: string }.
     */
    evaluateAnchor(doc, id) {
      const perms = Array.isArray(doc.permissions) ? doc.permissions : [];

      switch (id) {

        case 'ai-act-art-5': {
          // Article 5 prohibits specific practices. We can only trigger on declared
          // action names that look prohibited-like. We deliberately do NOT trigger
          // on "regulated + autonomous" because that is not the Article 5 test.
          if (hasProhibitedLikeActions(doc)) {
            return {
              status: 'risk',
              applicability: 'possible',
              observation: 'At least one permission has an action name that resembles a category referenced by Article 5 (biometric, social scoring, emotion recognition, subliminal techniques, exploitation of vulnerable groups, or predictive policing). Review whether the practice is actually performed and whether Article 5 applies.',
            };
          }
          return null;
        }

        case 'ai-act-art-6-high-risk': {
          // Without Annex III sector gating we can only flag possible applicability.
          const app = isHighRiskApplicable(doc);
          if (app === 'not_assessed') return null;
          const perms_regulated = perms.filter(p => p.effect === 'regulated' && p.allowed === true);
          if (perms_regulated.length === 0) return null;
          return {
            status: 'support',
            applicability: 'possible',
            observation: `${perms_regulated.length} permission(s) declare effect "regulated". If the site falls under Annex III sectors or other high-risk classification, Article 6 obligations may apply.`,
          };
        }

        case 'ai-act-art-13-transparency': {
          if (doc.agentIdentification || doc.discoverabilityHints) {
            return {
              status: 'support',
              applicability: 'possible',
              observation: 'The document declares agentIdentification and/or discoverabilityHints, providing machine-readable transparency surfaces. These are supporting signals; Article 13 documentation requirements (Annex IV) are not satisfied by A2WF alone.',
            };
          }
          return null;
        }

        case 'ai-act-art-14-human-oversight': {
          // Only relevant if high-risk is at least possible.
          const app = isHighRiskApplicable(doc);
          if (app === 'not_assessed') return null;
          const o = doc.oversight;
          if (!o || !o.oversightDefaults) {
            return {
              status: 'gap',
              applicability: 'possible',
              observation: 'High-risk applicability is possible (regulated-effect permissions declared) but no oversight.oversightDefaults are declared. Article 14 expects an effective human-oversight mechanism for high-risk systems.',
            };
          }
          // Walk regulated permissions and resolve effective oversight.
          const regulatedAutonomous = perms.filter(p => p.effect === 'regulated' && p.allowed === true).filter(p => {
            const eff = resolveEffectiveOversight(doc, p);
            return eff && eff.level === 'autonomous';
          });
          if (regulatedAutonomous.length > 0) {
            return {
              status: 'risk',
              applicability: 'possible',
              observation: `${regulatedAutonomous.length} regulated permission(s) resolve to autonomous oversight. Article 14 requires effective human oversight for high-risk systems.`,
            };
          }
          return {
            status: 'support',
            applicability: 'possible',
            observation: 'oversight.oversightDefaults declared and regulated permissions do not resolve to autonomous oversight. This is a supporting signal; effective oversight in practice is the operator\'s responsibility.',
          };
        }

        case 'ai-act-art-26-deployer-obligations': {
          // Only relevant if the site is a deployer of a high-risk system, which
          // we cannot determine - only signal possibility.
          const app = isHighRiskApplicable(doc);
          if (app === 'not_assessed') return null;
          const hasAudit = doc.auditTrail && doc.auditTrail.enabled === true;
          const hasIncident = !!doc.incidentReporting;
          if (hasAudit || hasIncident) {
            return {
              status: 'support',
              applicability: 'possible',
              observation: `${hasAudit ? 'auditTrail.enabled=true' : ''}${hasAudit && hasIncident ? ' and ' : ''}${hasIncident ? 'incidentReporting' : ''} declared. Supporting signals for Article 26 record-keeping and incident-handling; actual record-keeping happens in operator infrastructure.`,
            };
          }
          return {
            status: 'gap',
            applicability: 'possible',
            observation: 'Regulated-effect permissions declared but neither auditTrail.enabled=true nor incidentReporting are present. If the site is a deployer of a high-risk system, Article 26 record-keeping is expected.',
          };
        }

        case 'ai-act-art-50-transparency-to-natural-persons': {
          const app = isHumanFacingAIDeclared(doc);
          if (app === 'not_assessed') return null;
          if (doc.agentIdentification && Array.isArray(doc.agentIdentification.acceptedProtocols) && doc.agentIdentification.acceptedProtocols.length) {
            return {
              status: 'support',
              applicability: 'possible',
              observation: 'agentIdentification.acceptedProtocols declared. Machine-readable signal supporting transparency in agent-mediated interactions. Article 50 also addresses chatbot disclosure, synthetic-content disclosure, and biometric categorisation - those are not assessed here.',
            };
          }
          return null;
        }

        case 'gdpr-art-5-principles': {
          const app = isPersonalDataProcessingDeclared(doc);
          if (app === 'not_assessed') return null;
          if (doc.dataHandling) {
            const dh = doc.dataHandling;
            const purposesOk = Array.isArray(dh.processing) && dh.processing.some(p => Array.isArray(p.purposes) && p.purposes.length);
            const retentionOk = Array.isArray(dh.processing) && dh.processing.some(p => p.retention);
            if (!purposesOk || !retentionOk) {
              return {
                status: 'gap',
                applicability: 'applicable',
                observation: `dataHandling is declared but ${!purposesOk ? 'purposes' : ''}${!purposesOk && !retentionOk ? ' and ' : ''}${!retentionOk ? 'retention' : ''} are missing. Article 5 expects explicit purposes and retention.`,
              };
            }
            return {
              status: 'support',
              applicability: 'applicable',
              observation: 'dataHandling declares purposes and retention, consistent with Article 5 transparency.',
            };
          }
          return {
            status: 'gap',
            applicability: 'possible',
            observation: 'Personal-data processing appears possible (registration/purchase/booking-style actions declared) but no dataHandling module is present.',
          };
        }

        case 'gdpr-art-13-14-information': {
          if (!doc.dataHandling) return null;
          const dh = doc.dataHandling;
          const hasController = dh.controller && dh.controller.name && dh.controller.contactEmail;
          const hasLawful = Array.isArray(dh.processing) && dh.processing.some(p => Array.isArray(p.lawfulBasis) && p.lawfulBasis.length);
          if (hasController && hasLawful) {
            return {
              status: 'support',
              applicability: 'applicable',
              observation: 'dataHandling.controller and at least one lawfulBasis declared. Complements the human-readable privacy notice required by Articles 13/14.',
            };
          }
          return {
            status: 'gap',
            applicability: 'applicable',
            observation: `dataHandling present but ${!hasController ? 'controller.name/contactEmail' : ''}${!hasController && !hasLawful ? ' and ' : ''}${!hasLawful ? 'lawfulBasis' : ''} missing. Articles 13/14 expect this information in the privacy notice.`,
          };
        }

        case 'gdpr-art-25-data-protection-by-design': {
          if (!doc.dataHandling) return null;
          if (doc.dataHandling.privacy && doc.dataHandling.privacy.minimise === true) {
            return {
              status: 'support',
              applicability: 'applicable',
              observation: 'dataHandling.privacy.minimise=true declared. Consistent with Article 25 by-design posture.',
            };
          }
          return null;
        }

        case 'gdpr-art-33-breach-notification': {
          const ir = doc.incidentReporting;
          if (!ir) return null;
          if (ir.contactEmail && ir.responseTime) {
            return {
              status: 'support',
              applicability: 'possible',
              observation: 'incidentReporting.contactEmail and responseTime declared. NOTE: A2WF responseTime is a publisher-defined acknowledgement timeframe, NOT the statutory 72-hour breach-notification deadline of Article 33.',
            };
          }
          return {
            status: 'gap',
            applicability: 'possible',
            observation: 'incidentReporting declared but contactEmail or responseTime missing.',
          };
        }

        default:
          return null;
      }
    },

    buildRecommendations(doc, validation, profileClaimed) {
      const recs = [];
      const failCount = (validation && validation.summary && validation.summary.fail) || 0;
      const warnCount = (validation && validation.summary && validation.summary.warn) || 0;

      if (failCount > 0) {
        recs.push({
          id: 'fix-validation-failures',
          title: 'Fix validation failures first',
          text: `The document has ${failCount} validation failure(s). Until these are resolved, the document is not usable by A2WF Consumers and the Coverage Score is capped at 59. See the Validation findings table.`,
        });
      }

      if (warnCount > 0 && failCount === 0) {
        recs.push({
          id: 'address-warnings',
          title: 'Review SHOULD warnings',
          text: `The document has ${warnCount} warning(s). These are SHOULD-level recommendations; addressing them improves transparency without being strictly required.`,
        });
      }

      const conformanceLevel = doc.conformance && doc.conformance.level;
      if (conformanceLevel === 'basic') {
        recs.push({
          id: 'consider-standard-level',
          title: 'Consider upgrading to Standard level',
          text: 'The document declares conformance.level "basic". For EU governance scenarios, Standard level (with oversightDefaults) is usually expected.',
          example: '"conformance": { "level": "standard" }',
        });
      }

      if (!profileClaimed) {
        recs.push({
          id: 'claim-eu-governance-profile',
          title: 'Claim the EU Governance Starter Profile',
          text: 'For EU-facing sites, claiming the EU Governance Starter Profile signals a baseline of Modules typically expected by EU governance consumers. Only claim the profile if you actually fulfil its requirements - claiming without fulfilling is misleading.',
          example: '"conformance": {\n  "level": "standard",\n  "profileClaims": ["https://a2wf.org/profiles/eu-governance-starter/v1"],\n  "moduleClaims": ["jurisdictions","dataHandling","agentIdentification","auditTrail","incidentReporting","discoverabilityHints"]\n}',
        });
      }

      if (!doc.dataHandling) {
        recs.push({
          id: 'add-data-handling',
          title: 'Add the dataHandling module',
          text: 'If the site processes EU residents\' personal data, expose purposes, retention, lawful basis, and controller identity in machine-readable form.',
          example: '"dataHandling": {\n  "dpvProfileURI": "https://w3id.org/dpv/2.0",\n  "processing": [{\n    "categories": ["dpv:PersonalData"],\n    "purposes": ["dpv:ServiceProvision"],\n    "lawfulBasis": ["dpv:Contract"],\n    "retention": "P12M"\n  }],\n  "controller": {\n    "name": "Example GmbH",\n    "contactEmail": "privacy@example.com"\n  },\n  "privacy": { "minimise": true }\n}',
        });
      } else {
        // dataHandling exists - check completeness
        const dh = doc.dataHandling;
        const issues = [];
        if (!Array.isArray(dh.processing) || dh.processing.length === 0) issues.push('processing array');
        else {
          if (!dh.processing.some(p => Array.isArray(p.purposes) && p.purposes.length)) issues.push('purposes');
          if (!dh.processing.some(p => p.retention)) issues.push('retention');
          if (!dh.processing.some(p => Array.isArray(p.lawfulBasis) && p.lawfulBasis.length)) issues.push('lawfulBasis');
        }
        if (!dh.controller || !dh.controller.name || !dh.controller.contactEmail) issues.push('controller.name/contactEmail');
        if (issues.length) {
          recs.push({
            id: 'complete-data-handling',
            title: 'Complete the dataHandling module',
            text: `dataHandling is present but missing: ${issues.join(', ')}. Articles 5, 13/14 expect explicit declarations.`,
          });
        }
      }

      if (!doc.incidentReporting) {
        recs.push({
          id: 'add-incident-reporting',
          title: 'Add the incidentReporting module',
          text: 'Publish an incident-reporting contact so consumers know where to send A2WF-related reports. NOTE: responseTime is your acknowledgement timeframe, not the GDPR Article 33 72-hour deadline.',
          example: '"incidentReporting": {\n  "contactEmail": "incidents@example.com",\n  "responseTime": "P3D"\n}',
        });
      }

      if (!doc.agentIdentification) {
        recs.push({
          id: 'add-agent-identification',
          title: 'Add the agentIdentification module',
          text: 'Declare which agent-identity protocols you accept (DID, VC, OAuth, HTTP Message Signatures). Supports AI Act Article 13 transparency for deployers.',
          example: '"agentIdentification": {\n  "acceptedProtocols": [\n    { "id": "did-core", "name": "DID Core", "specification": "https://www.w3.org/TR/did-core/", "status": "stable" }\n  ]\n}',
        });
      }

      if (!doc.discoverabilityHints) {
        recs.push({
          id: 'add-discoverability-hints',
          title: 'Add the discoverabilityHints module',
          text: 'Expose machine-readable hints about your site structure and action endpoints. Helps AI agents find the right paths without aggressive crawling.',
          example: '"discoverabilityHints": {\n  "sitemapURI": "https://example.com/sitemap.xml",\n  "schemaOrgActions": ["https://example.com/#book-action"]\n}',
        });
      }

      if (!doc.jurisdictions) {
        recs.push({
          id: 'add-jurisdictions',
          title: 'Add the jurisdictions module',
          text: 'Declare which legal jurisdiction(s) and applicable laws the site operates under. Necessary for the EU Governance Starter Profile claim to be meaningful.',
          example: '"jurisdictions": {\n  "region": "EU",\n  "primary": "AT",\n  "applicableLaws": [\n    "https://w3id.org/a2wf/laws/eu/gdpr",\n    "https://w3id.org/a2wf/laws/eu/ai-act"\n  ]\n}',
        });
      }

      // Oversight defaults check
      const defReg = doc.oversight && doc.oversight.oversightDefaults && doc.oversight.oversightDefaults.regulated;
      if (!defReg) {
        recs.push({
          id: 'add-regulated-oversight-default',
          title: 'Declare an oversight default for regulated actions',
          text: 'Even if no current permission has effect "regulated", a default protects against later additions that forget oversight.',
          example: '"oversight": {\n  "oversightDefaults": {\n    "regulated": { "level": "handover", "channel": "out-of-band", "method": "email" }\n  }\n}',
        });
      } else if (defReg.level !== 'handover') {
        recs.push({
          id: 'regulated-handover',
          title: 'Use handover oversight for regulated actions',
          text: 'Regulated-effect actions typically benefit from a handover default to ensure a human is in the loop for sensitive operations.',
          example: '"oversight": {\n  "oversightDefaults": {\n    "regulated": { "level": "handover", "channel": "out-of-band", "method": "email" }\n  }\n}',
        });
      }

      // Metadata freshness
      const lastUpdated = doc.metadata && doc.metadata.lastUpdated;
      if (lastUpdated) {
        const d = new Date(lastUpdated);
        if (!isNaN(d.getTime())) {
          const now = Date.now();
          if (d.getTime() > now + 24 * 60 * 60 * 1000) {
            recs.push({
              id: 'fix-future-lastupdated',
              title: 'metadata.lastUpdated is in the future',
              text: 'The document declares a lastUpdated timestamp in the future. This is almost certainly a bug; fix the value to the actual last update date.',
            });
          } else {
            const ageDays = (now - d.getTime()) / (1000 * 60 * 60 * 24);
            if (ageDays > 365) {
              recs.push({
                id: 'refresh-metadata',
                title: 'Refresh document metadata',
                text: `metadata.lastUpdated is over a year old (${Math.round(ageDays)} days). Consider reviewing the document and updating the timestamp.`,
              });
            }
          }
        }
      }

      return recs;
    },

    computeScore(doc, validation, validatorDegraded, profileClaimed, scoreCfg) {
      const w = scoreCfg.weights;
      let score = 0;

      // Core validity
      if (validation.valid) {
        score += w.core_validity;
      } else {
        score += Math.max(0, w.core_validity - 5 * (validation.summary.fail || 0));
      }

      // Standard level (only if no FAIL on it; we count it as a structural signal)
      if (doc.conformance && doc.conformance.level === 'standard') score += w.standard_level;

      // EU Governance Profile claim
      if (profileClaimed) score += w.eu_governance_profile_claim;

      // Modules (counted only if minimally plausible, not just empty shells)
      if (doc.dataHandling && Array.isArray(doc.dataHandling.processing) && doc.dataHandling.processing.length > 0) {
        score += w.data_handling_module;
      }
      if (doc.auditTrail && doc.auditTrail.enabled === true) score += w.audit_trail_module;
      if (doc.incidentReporting && doc.incidentReporting.contactEmail) score += w.incident_reporting_module;
      if (doc.agentIdentification && Array.isArray(doc.agentIdentification.acceptedProtocols) && doc.agentIdentification.acceptedProtocols.length > 0) {
        score += w.agent_identification_module;
      }
      if (doc.discoverabilityHints && Object.keys(doc.discoverabilityHints).length > 0) {
        score += w.discoverability_hints_module;
      }
      if (doc.jurisdictions && doc.jurisdictions.region) score += w.jurisdictions_module;

      // Oversight handover for regulated
      const defReg = doc.oversight && doc.oversight.oversightDefaults && doc.oversight.oversightDefaults.regulated;
      if (defReg && defReg.level === 'handover') score += w.oversight_handover_for_regulated;

      // Metadata freshness
      const lu = doc.metadata && doc.metadata.lastUpdated;
      if (lu) {
        const d = new Date(lu);
        if (!isNaN(d.getTime())) {
          const now = Date.now();
          // Future timestamps get zero freshness points.
          if (d.getTime() <= now) {
            const ageDays = (now - d.getTime()) / (1000 * 60 * 60 * 24);
            if (ageDays <= 180) score += w.metadata_freshness;
            else if (ageDays <= 365) score += Math.round(w.metadata_freshness / 2);
          }
        }
      }

      // Score-gating: hard caps to prevent misleading "high coverage" on invalid docs.
      if (!validation.valid) score = Math.min(score, 59);
      if ((validation.summary?.fail || 0) > 0) score = Math.min(score, 59);
      if (validatorDegraded) score = Math.min(score, 29);

      score = Math.max(0, Math.min(100, Math.round(score)));
      const band = scoreCfg.bands.find(b => score >= b.min && score <= b.max) || scoreCfg.bands[0];
      return { score, band };
    },

    downloadReport() {
      if (!this.result) return;
      const branding = readBrandingFromURL();
      const payload = {
        toolVersion: 'a2wf-eu-governance-readiness-checker/0.2',
        generatedAt: this.result.generatedAt,
        branding: branding.brand ? { brand: branding.brand, logo: branding.logo } : undefined,
        targetUrl: this.result.targetUrl,
        discoveryPath: this.result.discoveryPath,
        specVersion: this.result.specVersion,
        conformanceLevel: this.result.conformanceLevel,
        profileClaimed: this.result.profileClaimed,
        modulesDeclared: this.result.modulesDeclared,
        lastUpdated: this.result.lastUpdated,
        declarationCoverageScore: {
          value: this.result.score,
          band: this.result.band.label,
          gating: {
            cappedAt59OnValidationFailure: !this.result.validation.valid || (this.result.validation.summary?.fail || 0) > 0,
            cappedAt29OnDegradedValidator: !!this.result.validatorDegraded,
          },
        },
        validation: this.result.validation,
        aiActAnchors: this.result.aiActFindings,
        gdprAnchors: this.result.gdprFindings,
        recommendations: this.result.recommendations,
        disclaimer: 'Report from a reference tool. Checks machine-readable A2WF declarations only. NOT legal advice, NOT a compliance audit, NOT certification. The Score is a vendor metric (not an A2WF conformance metric). EU AI Act and GDPR anchor mappings are heuristic orientation. EU AI Act Annex III sector gating and many articles (4/12/15/16/17/25/27/72/73) and GDPR articles (6/9/22/28/30/32/35/44ff) are NOT covered. Operators are responsible for their own legal review.',
        vendorWrapperNotice: branding.brand
          ? `This report is rendered under vendor brand "${branding.brand}" via URL parameters. The underlying tool is the neutral A2WF reference checker. The vendor is NOT endorsed by, certified by, or operated by the A2WF project; the vendor is responsible for any additional claims around this report.`
          : undefined,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const host = (new URL(this.result.targetUrl)).hostname || 'unknown';
      a.download = `a2wf-eu-readiness-${host}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  };
};

if (typeof window.__a2wfTryStart === 'function') window.__a2wfTryStart();
